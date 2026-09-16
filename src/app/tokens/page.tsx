"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdBanner from "@/components/AdBanner";

type TokenRow = {
  token_address: string;
  transfer_count: number;
  last_block: string | null;
  last_seen: string | null;
  name: string | null;
  symbol: string | null;
};

function shortAddr(addr: string) {
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

export default function TokensPage() {
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("https://api.odinsexplorer.app/api/tokens", {
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        setTokens(data.tokens || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tokens");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-2">Tokens</h1>
        <p className="text-gray-400 mb-8">
          ERC-20 tokens seen by Odin&apos;s indexer
        </p>

        <AdBanner unitId="2454794" width={300} height={250} />

        {error && (
          <div className="mb-6 p-4 bg-red-900/40 border border-red-700 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}

        {loading && <p className="text-gray-500">Loading tokens...</p>}

        {!loading && tokens.length === 0 && !error && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-gray-400 text-sm">
            No token transfers indexed yet.
          </div>
        )}

        <div className="space-y-3">
          {tokens.map((row) => (
            <Link
              key={row.token_address}
              href={`/address/${row.token_address}`}
              className="block bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 hover:border-gray-600 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {row.name || shortAddr(row.token_address)}
                    {row.symbol ? (
                      <span className="text-gray-400 font-normal">
                        {" "}
                        ({row.symbol})
                      </span>
                    ) : null}
                  </p>
                  <p className="font-mono text-xs text-gray-500 mt-1">
                    {row.token_address}
                  </p>
                </div>
                <div className="text-sm text-gray-400 sm:text-right">
                  <p>
                    {row.transfer_count} transfer
                    {row.transfer_count === 1 ? "" : "s"}
                  </p>
                  {row.last_block && <p>Last block #{row.last_block}</p>}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <AdBanner unitId="2454794" width={300} height={250} />

        <div className="mt-8">
          <Link href="/" className="text-blue-400 text-sm hover:underline">
            ← Home
          </Link>
        </div>
      </div>
    </main>
  );
}
