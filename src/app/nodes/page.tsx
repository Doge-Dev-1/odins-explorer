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
  sameFork?: boolean | null;
  matchedHeights?: number;
  checkedHeights?: number;
};

export default function NodesPage() {
  const [nodes, setNodes] = useState<NodeStatus[]>([]);
  const [highestBlock, setHighestBlock] = useState("0");
  const [lastChecked, setLastChecked] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const checkNodes = useCallback(async () => {
    try {
      const res = await fetch("https://api.odinsexplorer.app/api/nodes", {
        cache: "no-store",
      });
      const text = await res.text();

      let data: {
        nodes?: NodeStatus[];
        highestBlock?: string;
        checkedAt?: string;
        error?: string;
      };

      try {
        data = JSON.parse(text);
      } catch {
        setError(
          `API returned non-JSON (status ${res.status}). ${text.slice(0, 80)}`,
        );
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(data.error || `HTTP ${res.status}`);
        setLoading(false);
        return;
      }

      setNodes(data.nodes || []);
      setHighestBlock(data.highestBlock || "0");
      setLastChecked(
        data.checkedAt
          ? new Date(data.checkedAt).toLocaleTimeString()
          : new Date().toLocaleTimeString(),
      );
      setError(data.error || "");
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load nodes");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkNodes();
    const interval = setInterval(checkNodes, 20000);
    return () => clearInterval(interval);
  }, [checkNodes]);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <Link href="/" className="text-blue-400 hover:underline text-sm">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold mt-3">RPC Nodes Status</h1>
          <p className="text-gray-400 mt-1">
            Live status of public BlockDAG RPC endpoints. bdagscan is listed for
            reference only and is not used for indexing.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last checked: {lastChecked || "Loading..."}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/40 border border-red-700 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}

        {loading && nodes.length === 0 && (
          <p className="text-gray-500">Checking nodes...</p>
        )}

        {!loading && nodes.length === 0 && !error && (
          <p className="text-gray-500">No node results returned.</p>
        )}

        <div className="space-y-4">
          {nodes.map((node) => {
            const isBdagscan = node.url.includes("bdagscan");
            const behind =
              node.blockNumber && highestBlock !== "0"
                ? BigInt(highestBlock) - BigInt(node.blockNumber)
                : null;
            const farBehind = behind !== null && behind > BigInt(1000);

            return (
              <div
                key={node.url}
                className={`bg-gray-900 border rounded-xl p-5 ${
                  farBehind ? "border-red-700" : "border-gray-800"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-sm break-all">{node.url}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          node.status === "online"
                            ? "bg-green-900/50 text-green-400"
                            : "bg-red-900/50 text-red-400"
                        }`}
                      >
                        {node.status.toUpperCase()}
                      </span>

                      {isBdagscan && (
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                          REFERENCE ONLY
                        </span>
                      )}

                      {farBehind && (
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-700 text-white">
                          TOO FAR BEHIND
                        </span>
                      )}

                      {node.latency != null && (
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
