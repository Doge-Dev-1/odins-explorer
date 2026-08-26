import { NextResponse } from "next/server";
import { createPublicClient, http, defineChain } from "viem";

export const runtime = "nodejs";
export const maxDuration = 60;

const RPC_URLS = [
  "https://rpc.east.bdag-us.org",
  "https://rpc.west.bdag-us.org",
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

async function checkOne(url: string): Promise<NodeResult> {
  const start = Date.now();
  try {
    const client = createPublicClient({
      chain: blockdag,
      transport: http(url, { timeout: 5000 }),
    });

    const [chainId, blockNumber] = await Promise.all([
      client.getChainId(),
      client.getBlockNumber(),
    ]);

    return {
      url,
      status: "online",
      chainId,
      blockNumber: blockNumber.toString(),
      latency: Date.now() - start,
      blockHash: null,
      sameFork: null,
      matchedHeights: 0,
      checkedHeights: 0,
    };
  } catch (err: unknown) {
    return {
      url,
      status: "offline",
      error: err instanceof Error ? err.message : "Failed to connect",
      blockHash: null,
      sameFork: null,
      matchedHeights: 0,
      checkedHeights: 0,
    };
  }
}

export async function GET() {
  try {
    const results = await Promise.all(RPC_URLS.map((url) => checkOne(url)));

    let highestBlock = BigInt(0);
    for (const node of results) {
      if (node.blockNumber) {
        const bn = BigInt(node.blockNumber);
        if (bn > highestBlock) highestBlock = bn;
      }
    }

    const heightsToCheck: bigint[] = [];
    if (highestBlock > BigInt(10)) {
      heightsToCheck.push(highestBlock - BigInt(2));
      heightsToCheck.push(highestBlock - BigInt(5));
    } else if (highestBlock > BigInt(0)) {
      heightsToCheck.push(highestBlock);
    }

    const hashesByHeight: Record<string, Record<string, number>> = {};

    await Promise.all(
      results.map(async (node) => {
        if (node.status !== "online") return;

        const client = createPublicClient({
          chain: blockdag,
          transport: http(node.url, { timeout: 5000 }),
        });

        node._hashes = {};
        let firstHash: string | null = null;

        await Promise.all(
          heightsToCheck.map(async (height) => {
            try {
              const block = await client.getBlock({ blockNumber: height });
              if (!firstHash) firstHash = block.hash;
              const key = height.toString();
              if (!hashesByHeight[key]) hashesByHeight[key] = {};
              hashesByHeight[key][block.hash] =
                (hashesByHeight[key][block.hash] || 0) + 1;
              node._hashes![key] = block.hash;
            } catch {
              // skip
            }
          }),
        );

        node.blockHash = firstHash;
      }),
    );

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

      if (checked === 0) node.sameFork = null;
      else if (checked >= 2) node.sameFork = matched >= 2;
      else node.sameFork = matched === checked;
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
  } catch (err: unknown) {
    return NextResponse.json(
      {
        nodes: [],
        error: err instanceof Error ? err.message : "check-nodes failed",
        checkedAt: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
