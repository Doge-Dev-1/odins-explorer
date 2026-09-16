"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isAddress, type Abi, type Address } from "viem";
import { publicClient } from "@/lib/rpc";
import CopyButton from "@/components/CopyButton";

const API_BASE = "https://api.odinsexplorer.app";

type AbiItem = {
  type?: string;
  name?: string;
  stateMutability?: string;
  inputs?: { name?: string; type: string }[];
};

function parseArg(type: string, raw: string) {
  const value = raw.trim();
  if (type === "address") {
    if (!isAddress(value)) throw new Error("Invalid address");
    return value;
  }
  if (type.startsWith("uint") || type.startsWith("int")) {
    if (!value) throw new Error("Enter a number");
    return BigInt(value);
  }
  if (type === "bool") return value === "true" || value === "1";
  return value;
}

export default function ContractReadPage({
  params,
}: {
  params: Promise<{ addr: string }>;
}) {
  const [addr, setAddr] = useState("");
  const [verified, setVerified] = useState(false);
  const [name, setName] = useState("");
  const [compiler, setCompiler] = useState("");
  const [abi, setAbi] = useState<AbiItem[]>([]);
  const [autoResults, setAutoResults] = useState<Record<string, string>>({});
  const [inputValues, setInputValues] = useState<Record<string, string[]>>({});
  const [queryResults, setQueryResults] = useState<Record<string, string>>({});
  const [querying, setQuerying] = useState<string>("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const p = await params;
      const a = p.addr;
      setAddr(a);
      if (!isAddress(a)) {
        setError("Invalid address");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/contract/${a.toLowerCase()}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (!data.verified) {
          setVerified(false);
          setLoading(false);
          return;
        }
        const contractAbi: AbiItem[] = data.contract.abi || [];
        setVerified(true);
        setName(data.contract.name || "");
        setCompiler(data.contract.compiler || "");
        setAbi(contractAbi);
        setLoading(false);

        const noArg = contractAbi.filter(
          (item) =>
            item.type === "function" &&
            (item.stateMutability === "view" ||
              item.stateMutability === "pure") &&
            (!item.inputs || item.inputs.length === 0),
        );

        const next: Record<string, string> = {};
        for (const fn of noArg) {
          try {
            const value = await publicClient.readContract({
              address: a as Address,
              abi: contractAbi as Abi,
              functionName: fn.name as string,
            });
            next[fn.name || "unknown"] = String(value);
          } catch (err) {
            next[fn.name || "unknown"] =
              err instanceof Error ? err.message : "call failed";
          }
        }
        setAutoResults(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
        setLoading(false);
      }
    }
    load();
  }, [params]);

  const withInputs = abi.filter(
    (item) =>
      item.type === "function" &&
      (item.stateMutability === "view" || item.stateMutability === "pure") &&
      item.inputs &&
      item.inputs.length > 0,
  );

  async function runQuery(fn: AbiItem) {
    if (!fn.name) return;
    setQuerying(fn.name);
    try {
      const inputs = fn.inputs || [];
      const raw = inputValues[fn.name] || [];
      const args = inputs.map((input, i) => parseArg(input.type, raw[i] || ""));
      const value = await publicClient.readContract({
        address: addr as Address,
        abi: abi as Abi,
        functionName: fn.name,
        args,
      });
      setQueryResults((prev) => ({
        ...prev,
        [fn.name as string]: String(value),
      }));
    } catch (err) {
      setQueryResults((prev) => ({
        ...prev,
        [fn.name as string]: err instanceof Error ? err.message : "call failed",
      }));
    } finally {
      setQuerying("");
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Link
          href={`/address/${addr || ""}`}
          className="text-blue-400 text-sm hover:underline"
        >
          ← Address
        </Link>
        <h1 className="text-2xl font-bold mt-3">Read Contract</h1>
        <p className="font-mono text-sm text-gray-400 break-all mt-2">{addr}</p>
        {addr && <CopyButton text={addr} />}

        {loading && <p className="text-gray-500 mt-6">Loading...</p>}
        {error && (
          <div className="mt-6 p-4 bg-red-900/40 border border-red-700 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}

        {!loading && !verified && !error && (
          <div className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-6 text-gray-400 text-sm">
            This contract is not verified yet.{" "}
            <Link href="/verify" className="text-blue-400 hover:underline">
              Submit ABI
            </Link>
          </div>
        )}

        {verified && (
          <div className="mt-6 space-y-8">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <span className="inline-flex px-3 py-1 rounded-full text-xs bg-green-900/50 text-green-300 mb-3">
                Verified
              </span>
              <p className="text-lg font-semibold">
                {name || "Unnamed contract"}
              </p>
              {compiler && (
                <p className="text-sm text-gray-500 mt-1">
                  Compiler {compiler}
                </p>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Read (no inputs)</h2>
              {Object.keys(autoResults).length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No parameter-less view functions.
                </p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(autoResults).map(([fn, value]) => (
                    <div
                      key={fn}
                      className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4"
                    >
                      <p className="font-mono text-sm text-blue-300">{fn}()</p>
                      <p className="text-sm text-gray-300 break-all mt-2">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Read (with inputs)</h2>
              {withInputs.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No view functions that take inputs.
                </p>
              ) : (
                <div className="space-y-4">
                  {withInputs.map((fn) => (
                    <div
                      key={fn.name}
                      className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4"
                    >
                      <p className="font-mono text-sm text-blue-300 mb-3">
                        {fn.name}(
                        {(fn.inputs || []).map((i) => i.type).join(", ")})
                      </p>
                      <div className="space-y-2">
                        {(fn.inputs || []).map((input, i) => (
                          <input
                            key={`${fn.name}-${i}`}
                            placeholder={`${input.name || `arg${i}`} (${input.type})`}
                            className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono"
                            value={inputValues[fn.name || ""]?.[i] || ""}
                            onChange={(e) => {
                              const key = fn.name || "";
                              const next = [...(inputValues[key] || [])];
                              next[i] = e.target.value;
                              setInputValues((prev) => ({
                                ...prev,
                                [key]: next,
                              }));
                            }}
                          />
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => runQuery(fn)}
                        disabled={querying === fn.name}
                        className="mt-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm"
                      >
                        {querying === fn.name ? "Querying..." : "Query"}
                      </button>
                      {fn.name && queryResults[fn.name] && (
                        <p className="text-sm text-gray-300 break-all mt-3">
                          {queryResults[fn.name]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
