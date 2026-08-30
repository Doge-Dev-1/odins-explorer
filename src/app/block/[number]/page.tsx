import { publicClient } from "@/lib/rpc";
import { formatEther } from "viem";
import Link from "next/link";
import CopyButton from "@/components/CopyButton";

export const dynamic = "force-dynamic";

function timeAgo(seconds: number) {
  const diff = Math.max(0, Math.floor(Date.now() / 1000) - seconds);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default async function BlockPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;

  if (!/^\d+$/.test(number)) {
    return (
      <main className="min-h-screen bg-gray-950 text-white p-10">
        <p className="text-red-300">Invalid block number</p>
        <Link href="/" className="text-blue-400 text-sm mt-4 inline-block">
          ← Home
        </Link>
      </main>
    );
  }

  const blockNumber = BigInt(number);
  let error = "";
  let block: Awaited<ReturnType<typeof publicClient.getBlock>> | null = null;

  try {
    block = await publicClient.getBlock({
      blockNumber,
      includeTransactions: true,
    });
  } catch (err) {
    error = err instanceof Error ? err.message : "Block not found";
  }

  if (!block) {
    return (
      <main className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <Link href="/" className="text-blue-400 text-sm hover:underline">
            ← Home
          </Link>
          <h1 className="text-2xl font-bold mt-4 mb-3">Block #{number}</h1>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-gray-400 text-sm">
            {error || "Block not found on the current RPC nodes."}
          </div>
        </div>
      </main>
    );
  }

  const timestamp = Number(block.timestamp);
  const txs = block.transactions.filter((tx) => typeof tx !== "string");
  const prev = blockNumber > BigInt(0) ? blockNumber - BigInt(1) : null;
  const next = blockNumber + BigInt(1);

  const row = (label: string, value: React.ReactNode) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 border-b border-gray-800">
      <div className="text-gray-500 text-sm">{label}</div>
      <div className="sm:col-span-2 text-sm break-all">{value}</div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Link href="/" className="text-blue-400 text-sm hover:underline">
          ← Home
        </Link>

        <div className="mt-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500">Block</p>
            <h1 className="text-3xl font-bold">#{block.number?.toString()}</h1>
          </div>
          <div className="flex gap-2">
            {prev !== null && (
              <Link
                href={`/block/${prev.toString()}`}
                className="px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-sm hover:border-gray-500"
              >
                ← Previous
              </Link>
            )}
            <Link
              href={`/block/${next.toString()}`}
              className="px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-sm hover:border-gray-500"
            >
              Next →
            </Link>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-2 mb-10">
          {row(
            "Hash",
            <span className="inline-flex items-center gap-2 flex-wrap font-mono">
              {block.hash}
              <CopyButton text={block.hash || ""} />
            </span>,
          )}
          {row(
            "Parent hash",
            <span className="inline-flex items-center gap-2 flex-wrap font-mono">
              <Link
                href={`/block/${prev?.toString() || "0"}`}
                className="text-blue-400 hover:underline"
              >
                {block.parentHash}
              </Link>
              <CopyButton text={block.parentHash} />
            </span>,
          )}
          {row(
            "Timestamp",
            <>
              {new Date(timestamp * 1000).toLocaleString()}{" "}
              <span className="text-gray-500">({timeAgo(timestamp)})</span>
            </>,
          )}
          {row(
            "Miner / fee recipient",
            <span className="inline-flex items-center gap-2 flex-wrap font-mono">
              <Link
                href={`/address/${block.miner}`}
                className="text-blue-400 hover:underline"
              >
                {block.miner}
              </Link>
              <CopyButton text={block.miner} />
            </span>,
          )}
          {row("Transactions", `${txs.length}`)}
          {row(
            "Gas used",
            `${block.gasUsed.toString()} / ${block.gasLimit.toString()}`,
          )}
          {row(
            "Gas usage",
            block.gasLimit > BigInt(0)
              ? `${((Number(block.gasUsed) / Number(block.gasLimit)) * 100).toFixed(2)}%`
              : "—",
          )}
        </div>

        <h2 className="text-xl font-semibold mb-4">
          Transactions ({txs.length})
        </h2>

        {txs.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-gray-400 text-sm">
            No transactions in this block.
          </div>
        ) : (
          <div className="space-y-3">
            {txs.map((tx) => (
              <div
                key={tx.hash}
                className="bg-gray-900 border border-gray-800 rounded-xl px-4 sm:px-5 py-4 hover:border-gray-700 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/tx/${tx.hash}`}
                      className="text-blue-400 hover:underline font-mono text-sm"
                    >
                      {tx.hash.slice(0, 16)}...{tx.hash.slice(-12)}
                    </Link>
                    <CopyButton text={tx.hash} />
                  </div>
                  <span className="text-sm text-gray-400">
                    {formatEther(tx.value)} BDAG
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                  <span>
                    From:{" "}
                    <Link
                      href={`/address/${tx.from}`}
                      className="hover:underline text-gray-300"
                    >
                      {tx.from.slice(0, 8)}...{tx.from.slice(-6)}
                    </Link>
                  </span>
                  {tx.to ? (
                    <span>
                      To:{" "}
                      <Link
                        href={`/address/${tx.to}`}
                        className="hover:underline text-gray-300"
                      >
                        {tx.to.slice(0, 8)}...{tx.to.slice(-6)}
                      </Link>
                    </span>
                  ) : (
                    <span className="text-yellow-400">Contract creation</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
