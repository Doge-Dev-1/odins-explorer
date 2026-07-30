import { publicClient } from "@/lib/rpc";
import Link from "next/link";
import { type Block } from "viem";

export const dynamic = "force-dynamic";

export default async function Home() {
  let latestBlocks: Block[] = [];
  let errorMessage = "";

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
    latestBlocks = await Promise.all(blockPromises);
  } catch (err) {
    errorMessage =
      "Could not connect to any BlockDAG RPC. Please try again later.";
    console.error(err);
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight">
            Odin&apos;s Explorer
          </h1>
          <p className="text-gray-400 mt-1">
            Independent BlockDAG Blockchain Explorer
          </p>
        </div>

        <form action="/search" className="mb-12">
          <input
            name="q"
            placeholder="Search by Transaction Hash / Address / Block Number"
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-5 py-4 text-lg focus:outline-none focus:border-blue-500 transition"
          />
        </form>

        {errorMessage && (
          <div className="mb-8 p-4 bg-red-900/40 border border-red-700 rounded-xl text-red-300">
            {errorMessage}
          </div>
        )}

        <div>
          <h2 className="text-2xl font-semibold mb-5">Latest Blocks</h2>

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
