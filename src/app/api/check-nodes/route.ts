import { NextResponse } from "next/server";
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

type NodeResult = {
  url: string;
  status: "online" | "offline";
  chainId?: number;
  blockNumber?: string;
  latency?: number;
  error?: string;
  blockHash: string | null;
  sameFork: boolean | null;
};

export async function GET() {
  const results: NodeResult[] = [];

  // First pass: get basic info from every node
  for (const url of RPC_URLS) {
    const start = Date.now();
    try {
      const client = createPublicClient({
        chain: blockdag,
        transport: http(url, { timeout: 7000 }),
      });

      const [chainId, blockNumber] = await Promise.all([
        client.getChainId(),
        client.getBlockNumber(),
      ]);

      results.push({
        url,
        status: "online",
        chainId,
        blockNumber: blockNumber.toString(),
        latency: Date.now() - start,
        blockHash: null,
        sameFork: null,
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to connect";
      results.push({
        url,
        status: "offline",
        error: errorMessage,
        blockHash: null,
        sameFork: null,
      });
    }
  }

  // Find the highest block among online nodes
  let highestBlock = BigInt(0);
  for (const node of results) {
    if (node.blockNumber) {
      const bn = BigInt(node.blockNumber);
      if (bn > highestBlock) highestBlock = bn;
    }
  }

  // Choose a safe block height to compare (a few blocks behind the tip)
  const compareHeight =
    highestBlock > BigInt(5) ? highestBlock - BigInt(3) : highestBlock;

  // Second pass: get the block hash at the comparison height
  const hashCounts: Record<string, number> = {};

  for (const node of results) {
    if (node.status !== "online") continue;

    try {
      const client = createPublicClient({
        chain: blockdag,
        transport: http(node.url, { timeout: 7000 }),
      });

      const block = await client.getBlock({
        blockNumber: compareHeight,
      });

      node.blockHash = block.hash;
      hashCounts[block.hash] = (hashCounts[block.hash] || 0) + 1;
    } catch {
      node.blockHash = null;
    }
  }

  // Determine the majority hash (most common = canonical fork)
  let majorityHash: string | null = null;
  let maxCount = 0;
  for (const [hash, count] of Object.entries(hashCounts)) {
    if (count > maxCount) {
      maxCount = count;
      majorityHash = hash;
    }
  }

  // Mark each node as same fork or different
  for (const node of results) {
    if (node.status === "online" && node.blockHash && majorityHash) {
      node.sameFork = node.blockHash === majorityHash;
    } else {
      node.sameFork = null;
    }
  }

  return NextResponse.json({
    nodes: results,
    highestBlock: highestBlock.toString(),
    compareHeight: compareHeight.toString(),
    majorityHash,
    checkedAt: new Date().toISOString(),
  });
}
