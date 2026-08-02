import { publicClient } from "@/lib/rpc";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatEther, formatGwei, type Hash } from "viem";
import CopyButton from "@/components/CopyButton";

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

  if (!tx) notFound();

  const gasPrice = tx.gasPrice ?? tx.maxFeePerGas ?? BigInt(0);
  const fee = receipt ? gasPrice * receipt.gasUsed : BigInt(0);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Transaction Details</h1>
          <div className="flex items-center mt-2">
            <p className="text-gray-400 text-sm font-mono break-all">
              {tx.hash}
            </p>
            <CopyButton text={tx.hash} />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-500 text-sm">Status</p>
              <p
                className={`mt-1 text-lg font-medium ${
                  receipt?.status === "success"
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {receipt?.status === "success" ? "Success" : "Failed / Pending"}
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">Block</p>
              <Link
                href={`/block/${tx.blockNumber}`}
                className="mt-1 text-blue-400 hover:underline text-lg"
              >
                #{tx.blockNumber?.toString()}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-500 text-sm">From</p>
              <div className="flex items-center mt-1">
                <Link
                  href={`/address/${tx.from}`}
                  className="text-blue-400 hover:underline font-mono text-sm break-all"
                >
                  {tx.from}
                </Link>
                <CopyButton text={tx.from} />
              </div>
            </div>

            <div>
              <p className="text-gray-500 text-sm">To</p>
              {tx.to ? (
                <div className="flex items-center mt-1">
                  <Link
                    href={`/address/${tx.to}`}
                    className="text-blue-400 hover:underline font-mono text-sm break-all"
                  >
                    {tx.to}
                  </Link>
                  <CopyButton text={tx.to} />
                </div>
              ) : (
                <p className="mt-1 text-yellow-400">Contract Creation</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-500 text-sm">Value</p>
              <p className="mt-1 text-xl font-medium">
                {formatEther(tx.value)}{" "}
                <span className="text-gray-400 text-base">BDAG</span>
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">Transaction Fee</p>
              <p className="mt-1">{formatEther(fee)} BDAG</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-gray-500 text-sm">Gas Limit</p>
              <p className="mt-1">{tx.gas.toString()}</p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">Gas Used</p>
              <p className="mt-1">{receipt?.gasUsed?.toString() || "-"}</p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">Gas Price</p>
              <p className="mt-1">
                {gasPrice > BigInt(0) ? `${formatGwei(gasPrice)} Gwei` : "-"}
              </p>
            </div>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Nonce</p>
            <p className="mt-1">{tx.nonce}</p>
          </div>

          {tx.input && tx.input !== "0x" && (
            <div>
              <p className="text-gray-500 text-sm mb-2">Input Data</p>
              <pre className="bg-gray-950 border border-gray-800 rounded-lg p-4 text-xs font-mono overflow-x-auto text-gray-300">
                {tx.input}
              </pre>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
