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

export default function ContractReadPage({
  params,
}: {
  params: Promise<{ addr: string }>;
}) {
  const [addr, setAddr] = useState("");
  const [verified, setVerified] = useState(false);
  const [name, setName] = useState("");
  const [compiler, setCompiler] = useState("");
  const [results, setResults] = useState<Record<string, string>>({});
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
        setVerified(true);
        setName(data.contract.name || "");
        setCompiler(data.contract.compiler || "");
        setLoading(false);

        const viewFns = (data.contract.abi || []).filter(
          (item: AbiItem) =>
            item.type === "function" &&
            (item.stateMutability === "view" ||
              item.stateMutability === "pure") &&
            (!item.inputs || item.inputs.length === 0),
        );

        const next: Record<string, string> = {};
        for (const fn of viewFns) {
          try {
            const value = await publicClient.readContract({
              address: a as Address,
              abi: data.contract.abi as Abi,
              functionName: fn.name as string,
            });
            next[fn.name || "unknown"] = String(value);
          } catch (err) {
            next[fn.name || "unknown"] =
              err instanceof Error ? err.message : "call failed";
          }
        }
        setResults(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
        setLoading(false);
      }
    }
    load();
  }, [params]);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Link href="/" className="text-blue-400 text-sm hover:underline">
          ← Home
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
          <div className="mt-6 space-y-6">
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
              <Link
                href={`/address/${addr}`}
                className="text-blue-400 text-sm hover:underline mt-3 inline-block"
              >
                View address page
              </Link>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-3">
                Read functions (no inputs)
              </h2>
              {Object.keys(results).length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No parameter-less view/pure functions found in the ABI.
                </p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(results).map(([fn, value]) => (
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
          </div>
        )}
      </div>
    </main>
  );
}
