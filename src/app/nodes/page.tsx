"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type NodeStatus = {
  url: string;
  status: "online" | "offline";
  chainId?: number;
  blockNumber?: string;
  latency?: number;
  error?: string;
  blockHash?: string | null;
  sameFork?: boolean | null;
  matchedHeights?: number;
  checkedHeights?: number;
};

export default function NodesPage() {
  const [nodes, setNodes] = useState<NodeStatus[]>([]);
  const [highestBlock, setHighestBlock] = useState<string>("0");
  const [compareHeights, setCompareHeights] = useState<string[]>([]);
  const [lastChecked, setLastChecked] = useState("");
  const [loading, setLoading] = useState(true);

  const checkNodes = useCallback(async () => {
    try {
      const res = await fetch("/api/check-nodes");
      const data = await res.json();

      setNodes(data.nodes);
      setHighestBlock(data.highestBlock);
      setCompareHeights(data.compareHeights || []);
      setLastChecked(new Date(data.checkedAt).toLocaleTimeString());
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkNodes();
    const interval = setInterval(checkNodes, 20000);
    return () => clearInterval(interval);
  }, [checkNodes]);

  const hasFork = nodes.some((n) => n.sameFork === false);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <Link href="/" className="text-blue-400 hover:underline text-sm">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold mt-3">RPC Nodes Status</h1>
          <p className="text-gray-400 mt-1">
            Live status and fork detection across public BlockDAG RPC endpoints
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last checked: {lastChecked || "Loading..."}
            {compareHeights.length > 0 && (
              <> • Comparing heights {compareHeights.join(", ")}</>
            )}
          </p>
        </div>

        {hasFork && (
          <div className="mb-6 p-4 bg-red-950/60 border border-red-700 rounded-xl text-red-300">
            <p className="font-semibold">Fork detected</p>
            <p className="text-sm mt-1">
              One or more nodes disagree on recent block hashes. Nodes marked
              DIFFERENT FORK are not on the same chain history as the majority.
            </p>
          </div>
        )}

        {loading && nodes.length === 0 && (
          <p className="text-gray-500">Checking nodes...</p>
        )}

        <div className="space-y-4">
          {nodes.map((node) => {
            const behind =
              node.blockNumber && highestBlock !== "0"
                ? BigInt(highestBlock) - BigInt(node.blockNumber)
                : null;

            const farBehind = behind !== null && behind > BigInt(1000);

            return (
              <div
                key={node.url}
                className={`bg-gray-900 border rounded-xl p-5 ${
                  node.sameFork === false || farBehind
                    ? "border-red-700"
                    : "border-gray-800"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-sm break-all">{node.url}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          node.status === "online"
                            ? "bg-green-900/50 text-green-400"
                            : "bg-red-900/50 text-red-400"
                        }`}
                      >
                        {node.status.toUpperCase()}
                      </span>

                      {node.sameFork === true && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-green-400">
                          SAME FORK
                        </span>
                      )}

                      {node.sameFork === false && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white">
                          DIFFERENT FORK
                        </span>
                      )}

                      {node.status === "online" &&
                        node.sameFork === null &&
                        farBehind && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-700 text-white">
                            TOO FAR BEHIND
                          </span>
                        )}

                      {node.status === "online" &&
                        node.sameFork === null &&
                        !farBehind && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900/50 text-yellow-400">
                            FORK UNKNOWN
                          </span>
                        )}

                      {node.latency && (
                        <span className="text-xs text-gray-500">
                          {node.latency} ms
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-sm space-y-1 md:text-right">
                    {node.status === "online" ? (
                      <>
                        <p>
                          Chain ID:{" "}
                          <span
                            className={
                              node.chainId === 1404
                                ? "text-green-400"
                                : "text-red-400"
                            }
                          >
                            {node.chainId}{" "}
                            {node.chainId === 1404
                              ? "(Correct)"
                              : "(Wrong chain!)"}
                          </span>
                        </p>
                        <p>
                          Block Height:{" "}
                          <span className="font-medium">
                            {node.blockNumber}
                          </span>
                        </p>
                        {behind !== null && (
                          <p
                            className={
                              behind === BigInt(0)
                                ? "text-green-400"
                                : farBehind
                                  ? "text-red-400 font-medium"
                                  : "text-yellow-400"
                            }
                          >
                            {behind === BigInt(0)
                              ? "Fully synced"
                              : `${behind.toString()} block${
                                  behind === BigInt(1) ? "" : "s"
                                } behind`}
                          </p>
                        )}
                        {typeof node.matchedHeights === "number" &&
                          typeof node.checkedHeights === "number" &&
                          node.checkedHeights > 0 && (
                            <p className="text-xs text-gray-500">
                              Hash match: {node.matchedHeights}/
                              {node.checkedHeights} checked heights
                            </p>
                          )}
                      </>
                    ) : (
                      <p className="text-red-400 text-sm">{node.error}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
