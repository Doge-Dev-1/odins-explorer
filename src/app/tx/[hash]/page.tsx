import { publicClient } from "@/lib/rpc";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatEther, type Hash } from "viem";

export const dynamic = "force-dynamic";

export default async function TransactionPage({
  params,
}: {
  params: Promise<{ hash: string }>;
}) {
  const { hash } = await params;

  let tx;
  let receipt;

  try {
    tx = await publicClient.getTransaction({ hash: hash as Hash });
    receipt = await publicClient.getTransactionReceipt({ hash: hash as Hash });
  } catch {
    notFound();
  }

  if (!tx) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <Link href="/" className="text-blue-400 hover:underline text-sm">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold mt-3">Transaction Details</h1>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
          <div>
            <p className="text-gray-500 text-sm">Transaction Hash</p>
            <p className="font-mono text-sm break-all">{tx.hash}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <p className="text-gray-500 text-sm">Status</p>
              <p
                className={
                  receipt?.status === "success"
                    ? "text-green-400"
                    : "text-red-400"
                }
              >
                {receipt?.status === "success" ? "Success" : "Failed"}
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">Block</p>
              <Link
                href={`/block/${tx.blockNumber}`}
                className="text-blue-400 hover:underline"
              >
                #{tx.blockNumber?.toString()}
              </Link>
            </div>

            <div>
              <p className="text-gray-500 text-sm">From</p>
              <Link
                href={`/address/${tx.from}`}
                className="font-mono text-sm text-blue-400 hover:underline break-all"
              >
                {tx.from}
              </Link>
            </div>

            <div>
              <p className="text-gray-500 text-sm">To</p>
              {tx.to ? (
                <Link
                  href={`/address/${tx.to}`}
                  className="font-mono text-sm text-blue-400 hover:underline break-all"
                >
                  {tx.to}
                </Link>
              ) : (
                <span className="text-gray-400">Contract Creation</span>
              )}
            </div>

            <div>
              <p className="text-gray-500 text-sm">Value</p>
              <p>{formatEther(tx.value)} BDAG</p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">Gas Used</p>
              <p>{receipt?.gasUsed?.toString() || "-"}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
