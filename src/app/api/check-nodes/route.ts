import { NextResponse } from "next/server";
import { createPublicClient, http, defineChain } from "viem";

const RPC_URLS = [
  "https://rpc.west.bdag-us.org",
  "https://rpc.east.bdag-us.org",
  "https://rpc.welshdag.trade",
  "https://rpc.dvdmining.com",
  "https://rpc.blockdag.engineering",
  "https://rpc.capedag.com",
  "https://rpc.bdagscan.com",
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
  matchedHeights: number;
  checkedHeights: number;
  _hashes?: Record<string, string>;
};

export async function GET() {
  const results: NodeResult[] = [];

  // First pass: basic info
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
        matchedHeights: 0,
        checkedHeights: 0,
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
        matchedHeights: 0,
        checkedHeights: 0,
      });
    }
  }

  // Highest tip among online nodes
  let highestBlock = BigInt(0);
  for (const node of results) {
    if (node.blockNumber) {
      const bn = BigInt(node.blockNumber);
      if (bn > highestBlock) highestBlock = bn;
    }
  }

  // Compare 3 recent heights
  const heightsToCheck: bigint[] = [];
  if (highestBlock > BigInt(10)) {
    heightsToCheck.push(highestBlock - BigInt(2));
    heightsToCheck.push(highestBlock - BigInt(5));
    heightsToCheck.push(highestBlock - BigInt(8));
  } else if (highestBlock > BigInt(0)) {
    heightsToCheck.push(highestBlock);
  }

  const hashesByHeight: Record<string, Record<string, number>> = {};

  for (const node of results) {
    if (node.status !== "online") continue;

    const client = createPublicClient({
      chain: blockdag,
      transport: http(node.url, { timeout: 7000 }),
    });

    let firstHash: string | null = null;
    node._hashes = {};

    for (const height of heightsToCheck) {
      try {
        const block = await client.getBlock({ blockNumber: height });

        if (!firstHash) firstHash = block.hash;

        const key = height.toString();
        if (!hashesByHeight[key]) hashesByHeight[key] = {};
        hashesByHeight[key][block.hash] =
          (hashesByHeight[key][block.hash] || 0) + 1;

        node._hashes[key] = block.hash;
      } catch {
        // skip this height for this node
      }
    }

    node.blockHash = firstHash;
  }

  // Majority hash at each height
  const majorityByHeight: Record<string, string> = {};
  for (const [height, counts] of Object.entries(hashesByHeight)) {
    let bestHash = "";
    let bestCount = 0;
    for (const [hash, count] of Object.entries(counts)) {
      if (count > bestCount) {
        bestCount = count;
        bestHash = hash;
      }
    }
    majorityByHeight[height] = bestHash;
  }

  // Score each node
  for (const node of results) {
    if (node.status !== "online") {
      node.sameFork = null;
      continue;
    }

    const nodeHashes = node._hashes || {};
    let matched = 0;
    let checked = 0;

    for (const [height, majorityHash] of Object.entries(majorityByHeight)) {
      if (nodeHashes[height]) {
        checked++;
        if (nodeHashes[height] === majorityHash) matched++;
      }
    }

    node.matchedHeights = matched;
    node.checkedHeights = checked;

    if (checked === 0) {
      node.sameFork = null;
    } else if (checked >= 2) {
      node.sameFork = matched >= 2;
    } else {
      node.sameFork = matched === checked;
    }
  }

  return NextResponse.json({
    nodes: results.map((n) => {
      const clean = { ...n };
      delete clean._hashes;
      return clean;
    }),
    highestBlock: highestBlock.toString(),
    compareHeights: heightsToCheck.map((h) => h.toString()),
    checkedAt: new Date().toISOString(),
  });
}
