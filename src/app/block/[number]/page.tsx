import { publicClient } from "@/lib/rpc";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type Hash, formatGwei } from "viem";
import CopyButton from "@/components/CopyButton";

export const dynamic = "force-dynamic";

export default async function BlockPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const blockNumber = BigInt(number);

  let block;
  try {
    block = await publicClient.getBlock({
      blockNumber,
      includeTransactions: true,
    });
  } catch {
    notFound();
  }

  if (!block) notFound();

  const gasUsedPercent =
    block.gasLimit > BigInt(0)
      ? Number((block.gasUsed * BigInt(10000)) / block.gasLimit) / 100
      : 0;

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Block #{block.number?.toString()}
          </h1>
          <div className="flex items-center mt-2">
            <p className="text-gray-400 text-sm font-mono break-all">
              {block.hash}
            </p>
            <CopyButton text={block.hash || ""} />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-gray-500 text-sm">Timestamp</p>
              <p className="mt-1">
                {new Date(Number(block.timestamp) * 1000).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">Transactions</p>
              <p className="mt-1 text-lg font-medium">
                {block.transactions.length}
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">Miner / Validator</p>
              <div className="flex items-center mt-1">
                <Link
                  href={`/address/${block.miner}`}
                  className="text-blue-400 hover:underline font-mono text-sm break-all"
                >
                  {block.miner}
                </Link>
                <CopyButton text={block.miner} />
              </div>
            </div>

            <div>
              <p className="text-gray-500 text-sm">Gas Used</p>
              <p className="mt-1">
                {block.gasUsed.toString()}{" "}
                <span className="text-gray-400 text-sm">
                  ({gasUsedPercent.toFixed(2)}%)
                </span>
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">Gas Limit</p>
              <p className="mt-1">{block.gasLimit.toString()}</p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">Base Fee per Gas</p>
              <p className="mt-1">
                {block.baseFeePerGas
                  ? `${formatGwei(block.baseFeePerGas)} Gwei`
                  : "N/A"}
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">Size</p>
              <p className="mt-1">
                {block.size ? `${block.size.toString()} bytes` : "N/A"}
              </p>
            </div>

            <div className="md:col-span-2">
              <p className="text-gray-500 text-sm">Parent Hash</p>
              <div className="flex items-center mt-1">
                <p className="font-mono text-sm break-all text-gray-300">
                  {block.parentHash}
                </p>
                <CopyButton text={block.parentHash} />
              </div>
            </div>
          </div>
        </div>

        {block.transactions.length > 0 ? (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Transactions ({block.transactions.length})
            </h2>
            <div className="space-y-2">
              {block.transactions.map((tx, index) => {
                const hash =
                  typeof tx === "string" ? tx : (tx as { hash: Hash }).hash;
                return (
                  <div
                    key={hash}
                    className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 flex justify-between items-center hover:border-gray-700 transition"
                  >
                    <div className="flex items-center">
                      <Link
                        href={`/tx/${hash}`}
                        className="text-blue-400 hover:underline font-mono text-sm"
                      >
                        {hash.slice(0, 20)}...{hash.slice(-16)}
                      </Link>
                      <CopyButton text={hash} />
                    </div>
                    <span className="text-gray-500 text-sm">#{index}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-gray-500">This block has no transactions.</p>
        )}
      </div>
    </main>
  );
}
