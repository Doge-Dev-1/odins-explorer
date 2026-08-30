"use client";

import { useState } from "react";
import Link from "next/link";
import { isAddress } from "viem";

const API_BASE = "https://api.odinsexplorer.app";

export default function VerifyPage() {
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [compiler, setCompiler] = useState("");
  const [optimization, setOptimization] = useState(false);
  const [abi, setAbi] = useState("");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("");
    if (!isAddress(address)) {
      setError("Enter a valid contract address");
      return;
    }
    try {
      JSON.parse(abi);
    } catch {
      setError("ABI must be valid JSON");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/contract/${address.toLowerCase()}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name,
            compiler,
            optimization,
            abi,
            source,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setStatus("Saved. This contract is now marked verified.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link
          href="/contracts"
          className="text-blue-400 text-sm hover:underline"
        >
          ← Contracts
        </Link>
        <h1 className="text-3xl font-bold mt-3 mb-2">Verify contract</h1>
        <p className="text-gray-400 text-sm mb-8">
          Phase 1: submit the contract ABI so Odin can show a Verified badge and
          Read functions. Compiler bytecode matching comes next.
        </p>
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Contract address
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 font-mono text-sm"
              placeholder="0x..."
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Contract name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3"
              placeholder="MyToken"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Compiler version
            </label>
            <input
              value={compiler}
              onChange={(e) => setCompiler(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3"
              placeholder="v0.8.24+commit.e11b9ed9"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={optimization}
              onChange={(e) => setOptimization(e.target.checked)}
            />
            Optimization enabled
          </label>
          <div>
            <label className="block text-sm text-gray-400 mb-1">ABI JSON</label>
            <textarea
              value={abi}
              onChange={(e) => setAbi(e.target.value)}
              className="w-full h-48 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 font-mono text-xs"
              placeholder='[{ "type": "function", ... }]'
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Source code (optional)
            </label>
            <textarea
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full h-40 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 font-mono text-xs"
            />
          </div>
          {error && (
            <div className="p-4 bg-red-900/40 border border-red-700 rounded-xl text-red-300 text-sm">
              {error}
            </div>
          )}
          {status && (
            <div className="p-4 bg-green-900/40 border border-green-700 rounded-xl text-green-300 text-sm">
              {status}{" "}
              {isAddress(address) && (
                <Link href={`/contract/${address}`} className="underline ml-1">
                  Open Read Contract
                </Link>
              )}
            </div>
          )}
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-6 py-2.5 rounded-lg font-medium"
          >
            {saving ? "Saving..." : "Save verification"}
          </button>
        </form>
      </div>
    </main>
  );
}
