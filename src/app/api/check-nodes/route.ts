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

export async function GET() {
  const results = [];

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

      results.push({
        url,
        status: "online",
        chainId,
        blockNumber: blockNumber.toString(),
        latency: Date.now() - start,
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
  let highestBlock = BigInt(0);
  for (const node of results) {
    if (node.blockNumber) {
      const bn = BigInt(node.blockNumber);
      if (bn > highestBlock) highestBlock = bn;
    }
  }

  return NextResponse.json({
    nodes: results,
    highestBlock: highestBlock.toString(),
    checkedAt: new Date().toISOString(),
  });
}
