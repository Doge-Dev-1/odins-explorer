"use client";

import { useEffect, useState, useCallback } from "react";
import { publicClient } from "@/lib/rpc";
import Link from "next/link";
import { type Block } from "viem";

export default function Home() {
  const [latestBlocks, setLatestBlocks] = useState<Block[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const fetchBlocks = useCallback(async () => {
    try {
      const currentBlockNumber = await publicClient.getBlockNumber();

      const blockPromises = [];
      for (let i = 0; i < 10; i++) {
        blockPromises.push(
          publicClient.getBlock({
            blockNumber: currentBlockNumber - BigInt(i),
            includeTransactions: true,
          }),
        );
      }

      const blocks = await Promise.all(blockPromises);
      setLatestBlocks(blocks);
      setErrorMessage("");
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      setErrorMessage("Could not connect to any BlockDAG RPC.");
      console.error(err);
    }
  }, []);

  useEffect(() => {
    // Load immediately
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBlocks();

    // Auto-update every 6 seconds
    const interval = setInterval(() => {
      fetchBlocks();
    }, 6000);

    return () => clearInterval(interval);
  }, [fetchBlocks]);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-10 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Odin&apos;s Explorer
            </h1>
            <p className="text-gray-400 mt-1">
              Independent BlockDAG Blockchain Explorer
            </p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>Auto-updating</p>
            <p>Last update: {lastUpdate || "..."}</p>
          </div>
        </div>

        {/* Search Bar */}
        <form action="/search" className="mb-12">
          <input
            name="q"
            placeholder="Search by Transaction Hash / Address / Block Number"
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-5 py-4 text-lg focus:outline-none focus:border-blue-500 transition"
          />
        </form>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-8 p-4 bg-red-900/40 border border-red-700 rounded-xl text-red-300">
            {errorMessage}
          </div>
        )}

        {/* Latest Blocks */}
        <div>
          <h2 className="text-2xl font-semibold mb-5">Latest Blocks</h2>

          {latestBlocks.length === 0 && !errorMessage && (
            <p className="text-gray-500">Loading blocks...</p>
          )}

          <div className="space-y-3">
            {latestBlocks.map((block) => (
              <div
                key={block.hash}
                className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 hover:border-gray-600 transition"
              >
                <div className="flex items-center gap-4">
                  <Link
                    href={`/block/${block.number}`}
                    className="text-blue-400 hover:text-blue-300 font-medium"
                  >
                    Block #{block.number?.toString()}
                  </Link>
                  <span className="text-gray-500 text-sm">
                    {block.transactions.length} tx
                    {block.transactions.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="text-sm text-gray-400">
                  {new Date(Number(block.timestamp) * 1000).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
