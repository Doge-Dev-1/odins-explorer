"use client";

import { useEffect, useState, useCallback } from "react";
import { publicClient } from "@/lib/rpc";
import Link from "next/link";
import { type Block, type Transaction, formatEther } from "viem";

export default function Home() {
  const [latestBlocks, setLatestBlocks] = useState<Block[]>([]);
  const [latestTxs, setLatestTxs] = useState<Transaction[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const fetchData = useCallback(async () => {
    try {
      const currentBlockNumber = await publicClient.getBlockNumber();

      const blockPromises = [];
      for (let i = 0; i < 8; i++) {
        blockPromises.push(
          publicClient.getBlock({
            blockNumber: currentBlockNumber - BigInt(i),
            includeTransactions: true,
          }),
        );
      }

      const blocks = await Promise.all(blockPromises);
      setLatestBlocks(blocks);

      // Collect recent transactions from the latest blocks
      const txs: Transaction[] = [];
      for (const block of blocks) {
        for (const tx of block.transactions) {
          if (typeof tx !== "string") {
            txs.push(tx);
          }
          if (txs.length >= 10) break;
        }
        if (txs.length >= 10) break;
      }

      setLatestTxs(txs);
      setErrorMessage("");
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      setErrorMessage("Could not connect to any BlockDAG RPC.");
      console.error(err);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();

    const interval = setInterval(() => {
      fetchData();
    }, 6000);

    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Search Bar */}
        <form action="/search" className="mb-10">
          <input
            name="q"
            placeholder="Search by Transaction Hash / Address / Block Number"
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-5 py-4 text-lg focus:outline-none focus:border-blue-500 transition"
          />
        </form>

        {/* Status */}
        <div className="flex justify-between items-center mb-6 text-sm text-gray-500">
          <p>Showing latest blocks & transactions</p>
          <p>Last update: {lastUpdate || "..."}</p>
        </div>

        {errorMessage && (
          <div className="mb-8 p-4 bg-red-900/40 border border-red-700 rounded-xl text-red-300">
            {errorMessage}
          </div>
        )}

        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Latest Blocks */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Latest Blocks</h2>
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
                    {new Date(
                      Number(block.timestamp) * 1000,
                    ).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Latest Transactions */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Latest Transactions</h2>
            <div className="space-y-3">
              {latestTxs.length === 0 && !errorMessage && (
                <p className="text-gray-500 text-sm">
                  No transactions in the most recent blocks
                </p>
              )}

              {latestTxs.map((tx) => (
                <div
                  key={tx.hash}
                  className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 hover:border-gray-600 transition"
                >
                  <div className="flex justify-between items-start gap-3">
                    <Link
                      href={`/tx/${tx.hash}`}
                      className="text-blue-400 hover:text-blue-300 font-mono text-sm"
                    >
                      {tx.hash.slice(0, 14)}...{tx.hash.slice(-12)}
                    </Link>
                    <span className="text-sm text-gray-400 whitespace-nowrap">
                      {formatEther(tx.value)} BDAG
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 flex gap-4">
                    <span>
                      From:{" "}
                      <Link
                        href={`/address/${tx.from}`}
                        className="hover:underline"
                      >
                        {tx.from.slice(0, 8)}...{tx.from.slice(-6)}
                      </Link>
                    </span>
                    {tx.to && (
                      <span>
                        To:{" "}
                        <Link
                          href={`/address/${tx.to}`}
                          className="hover:underline"
                        >
                          {tx.to.slice(0, 8)}...{tx.to.slice(-6)}
                        </Link>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          <div className="flex justify-center gap-6 mb-3">
            <Link href="/" className="hover:text-white transition">
              Home
            </Link>
            <Link href="/nodes" className="hover:text-white transition">
              RPC Nodes
            </Link>
          </div>
          <p>Odin&apos;s Explorer — Independent BlockDAG Explorer</p>
        </footer>
      </div>
    </main>
  );
}
