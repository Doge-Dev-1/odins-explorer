"use client";

import { useEffect, useState, useCallback } from "react";
import { publicClient } from "@/lib/rpc";
import Link from "next/link";
import { type Block, type Transaction, formatEther, formatGwei } from "viem";
import CopyButton from "@/components/CopyButton";

export default function Home() {
  const [latestBlocks, setLatestBlocks] = useState<Block[]>([]);
  const [latestTxs, setLatestTxs] = useState<Transaction[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [currentBlock, setCurrentBlock] = useState<string>("-");
  const [txInLatest, setTxInLatest] = useState<number>(0);
  const [gasPrice, setGasPrice] = useState<string>("-");

  const fetchData = useCallback(async () => {
    try {
      const [currentBlockNumber, currentGasPrice] = await Promise.all([
        publicClient.getBlockNumber(),
        publicClient.getGasPrice(),
      ]);

      setCurrentBlock(currentBlockNumber.toString());
      setGasPrice(formatGwei(currentGasPrice));

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

      const txs: Transaction[] = [];
      let totalTxs = 0;

      for (const block of blocks) {
        totalTxs += block.transactions.length;
        for (const tx of block.transactions) {
          if (typeof tx !== "string") {
            txs.push(tx);
          }
          if (txs.length >= 10) break;
        }
        if (txs.length >= 10) break;
      }

      setLatestTxs(txs);
      setTxInLatest(totalTxs);
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
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10">
        {/* Search Bar */}
        <form action="/search" className="mb-8">
          <input
            name="q"
            placeholder="Search by Transaction Hash / Address / Block Number"
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 sm:px-5 py-3.5 sm:py-4 text-base sm:text-lg focus:outline-none focus:border-blue-500 transition"
          />
        </form>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs sm:text-sm">Current Block</p>
            <p className="text-lg sm:text-xl font-semibold mt-1">
              {currentBlock}
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs sm:text-sm">Gas Price</p>
            <p className="text-lg sm:text-xl font-semibold mt-1">
              {gasPrice} <span className="text-sm text-gray-400">Gwei</span>
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs sm:text-sm">
              Txs in Last 8 Blocks
            </p>
            <p className="text-lg sm:text-xl font-semibold mt-1">
              {txInLatest}
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs sm:text-sm">Last Update</p>
            <p className="text-lg sm:text-xl font-semibold mt-1">
              {lastUpdate || "..."}
            </p>
          </div>
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
                  className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-4 sm:px-5 py-3.5 sm:py-4 hover:border-gray-600 transition"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <Link
                      href={`/block/${block.number}`}
                      className="text-blue-400 hover:text-blue-300 font-medium"
                    >
                      #{block.number?.toString()}
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
                  className="bg-gray-900 border border-gray-800 rounded-xl px-4 sm:px-5 py-3.5 sm:py-4 hover:border-gray-600 transition"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center">
                      <Link
                        href={`/tx/${tx.hash}`}
                        className="text-blue-400 hover:text-blue-300 font-mono text-sm"
                      >
                        {tx.hash.slice(0, 12)}...{tx.hash.slice(-10)}
                      </Link>
                      <CopyButton text={tx.hash} />
                    </div>
                    <span className="text-sm text-gray-400 whitespace-nowrap">
                      {formatEther(tx.value)} BDAG
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                    <span className="flex items-center">
                      From:{" "}
                      <Link
                        href={`/address/${tx.from}`}
                        className="hover:underline ml-1"
                      >
                        {tx.from.slice(0, 6)}...{tx.from.slice(-4)}
                      </Link>
                      <CopyButton text={tx.from} />
                    </span>
                    {tx.to && (
                      <span className="flex items-center">
                        To:{" "}
                        <Link
                          href={`/address/${tx.to}`}
                          className="hover:underline ml-1"
                        >
                          {tx.to.slice(0, 6)}...{tx.to.slice(-4)}
                        </Link>
                        <CopyButton text={tx.to} />
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
            <Link href="/contracts" className="hover:text-white transition">
              Contracts
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
