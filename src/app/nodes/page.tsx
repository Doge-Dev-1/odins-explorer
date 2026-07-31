"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createPublicClient, http, defineChain } from "viem";

const RPC_URLS = [
  "https://rpc.bdag-us.org",
  "https://rpc.welshdag.trade",
  "https://rpc.dvdmining.com",
  "https://rpc.blockdag.engineering",
  "https://rpc.capedag.com",
];

const blockdag = defineChain({
  id: 1404,
  name: "BlockDAG",
  nativeCurrency: { name: "BDAG", symbol: "BDAG", decimals: 18 },
  rpcUrls: { default: { http: RPC_URLS } },
});

type NodeStatus = {
  url: string;
  status: "online" | "offline" | "checking";
  chainId?: number;
  blockNumber?: bigint;
  latency?: number;
  error?: string;
};

export default function NodesPage() {
  const [nodes, setNodes] = useState<NodeStatus[]>(
    RPC_URLS.map((url) => ({ url, status: "checking" })),
  );
  const [highestBlock, setHighestBlock] = useState<bigint>(BigInt(0));
  const [lastChecked, setLastChecked] = useState("");

  const checkNodes = useCallback(async () => {
    const results: NodeStatus[] = [];

    for (const url of RPC_URLS) {
      const start = Date.now();
      try {
        const client = createPublicClient({
          chain: blockdag,
          transport: http(url, { timeout: 6000 }),
        });

        const [chainId, blockNumber] = await Promise.all([
          client.getChainId(),
          client.getBlockNumber(),
        ]);

        const latency = Date.now() - start;

        results.push({
          url,
          status: "online",
          chainId,
          blockNumber,
          latency,
        });
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to connect";

        results.push({
          url,
          status: "offline",
          error: errorMessage,
        });
      }
    }

    // Find highest block
    let maxBlock = BigInt(0);
    for (const node of results) {
      if (node.blockNumber && node.blockNumber > maxBlock) {
        maxBlock = node.blockNumber;
      }
    }

    setHighestBlock(maxBlock);
    setNodes(results);
    setLastChecked(new Date().toLocaleTimeString());
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkNodes();

    const interval = setInterval(() => {
      checkNodes();
    }, 15000);

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
            Live status of the RPC endpoints used by Odin&apos;s Explorer
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last checked: {lastChecked || "Loading..."} • Auto-refreshes every
            15 seconds
          </p>
        </div>

        <div className="space-y-4">
          {nodes.map((node) => {
            const behind =
              node.blockNumber && highestBlock > BigInt(0)
                ? highestBlock - node.blockNumber
                : null;

            return (
              <div
                key={node.url}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-sm break-all">{node.url}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          node.status === "online"
                            ? "bg-green-900/50 text-green-400"
                            : node.status === "offline"
                              ? "bg-red-900/50 text-red-400"
                              : "bg-yellow-900/50 text-yellow-400"
                        }`}
                      >
                        {node.status.toUpperCase()}
                      </span>

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
                            {node.blockNumber?.toString()}
                          </span>
                        </p>
                        {behind !== null && (
                          <p
                            className={
                              behind === BigInt(0)
                                ? "text-green-400"
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
