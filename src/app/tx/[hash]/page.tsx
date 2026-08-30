import { publicClient } from "@/lib/rpc";
import { formatEther, formatGwei, isHex } from "viem";
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

export default async function TxPage({
  params,
}: {
  params: Promise<{ hash: string }>;
}) {
  const { hash } = await params;
  const txHash = hash.startsWith("0x") ? hash : `0x${hash}`;

  if (!isHex(txHash) || txHash.length !== 66) {
    return (
      <main className="min-h-screen bg-gray-950 text-white p-10">
        <p className="text-red-300">Invalid transaction hash</p>
        <Link href="/" className="text-blue-400 text-sm mt-4 inline-block">
          ← Home
        </Link>
      </main>
    );
  }

  let error = "";
  let tx: Awaited<ReturnType<typeof publicClient.getTransaction>> | null = null;
  let receipt: Awaited<
    ReturnType<typeof publicClient.getTransactionReceipt>
  > | null = null;
  let blockTime: number | null = null;

  try {
    tx = await publicClient.getTransaction({ hash: txHash as `0x${string}` });
    try {
      receipt = await publicClient.getTransactionReceipt({
        hash: txHash as `0x${string}`,
      });
    } catch {
      receipt = null;
    }
    if (tx.blockNumber) {
      const block = await publicClient.getBlock({
        blockNumber: tx.blockNumber,
      });
      blockTime = Number(block.timestamp);
    }
  } catch (err) {
    error = err instanceof Error ? err.message : "Transaction not found";
  }

  if (!tx) {
    return (
      <main className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <Link href="/" className="text-blue-400 text-sm hover:underline">
            ← Home
          </Link>
          <h1 className="text-2xl font-bold mt-4 mb-3">Transaction</h1>
          <p className="font-mono text-sm text-gray-500 break-all mb-4">
            {txHash}
          </p>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-gray-400 text-sm">
            {error || "Transaction not found on the current RPC nodes."}
          </div>
        </div>
      </main>
    );
  }

  const gasPrice = tx.gasPrice || tx.maxFeePerGas || BigInt(0);
  const gasUsed = receipt?.gasUsed;
  const fee = gasUsed !== undefined ? gasUsed * gasPrice : tx.gas * gasPrice;
  const success = receipt ? receipt.status === "success" : null;
  const input = tx.input || "0x";
  const isContractCall = input !== "0x";

  const row = (label: string, value: React.ReactNode) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 border-b border-gray-800">
      <div className="text-gray-500 text-sm">{label}</div>
      <div className="sm:col-span-2 text-sm break-all">{value}</div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Link href="/" className="text-blue-400 text-sm hover:underline">
          ← Home
        </Link>

        <div className="mt-4 mb-8">
          <p className="text-sm text-gray-500">Transaction</p>
          <h1 className="text-xl sm:text-2xl font-bold font-mono break-all mt-1">
            {tx.hash}
          </h1>
          <div className="mt-2">
            <CopyButton text={tx.hash} />
          </div>
        </div>

        <div className="mb-6">
          {success === true && (
            <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-300">
              Success
            </span>
          )}
          {success === false && (
            <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-red-900/50 text-red-300">
              Failed
            </span>
          )}
          {success === null && (
            <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-yellow-900/50 text-yellow-300">
              Pending / no receipt
            </span>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-2 mb-8">
          {row(
            "Block",
            tx.blockNumber ? (
              <Link
                href={`/block/${tx.blockNumber.toString()}`}
                className="text-blue-400 hover:underline"
              >
                #{tx.blockNumber.toString()}
              </Link>
            ) : (
              "Pending"
            ),
          )}
          {row(
            "Timestamp",
            blockTime ? (
              <>
                {new Date(blockTime * 1000).toLocaleString()}{" "}
                <span className="text-gray-500">({timeAgo(blockTime)})</span>
              </>
            ) : (
              "—"
            ),
          )}
          {row(
            "From",
            <span className="inline-flex items-center gap-2 flex-wrap">
              <Link
                href={`/address/${tx.from}`}
                className="text-blue-400 hover:underline font-mono"
              >
                {tx.from}
              </Link>
              <CopyButton text={tx.from} />
            </span>,
          )}
          {row(
            "To",
            tx.to ? (
              <span className="inline-flex items-center gap-2 flex-wrap">
                <Link
                  href={`/address/${tx.to}`}
                  className="text-blue-400 hover:underline font-mono"
                >
                  {tx.to}
                </Link>
                <CopyButton text={tx.to} />
              </span>
            ) : (
              <span className="text-yellow-400">Contract creation</span>
            ),
          )}
          {row(
            "Value",
            <span className="font-semibold">{formatEther(tx.value)} BDAG</span>,
          )}
          {row("Nonce", tx.nonce.toString())}
          {row("Gas limit", tx.gas.toString())}
          {row("Gas used", gasUsed !== undefined ? gasUsed.toString() : "—")}
          {row("Gas price", `${formatGwei(gasPrice)} Gwei`)}
          {row("Transaction fee", `${formatEther(fee)} BDAG`)}
          {row(
            "Type",
            isContractCall ? "Contract call / token interaction" : "Transfer",
          )}
        </div>

        {isContractCall && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Input data</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <pre className="text-xs font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap break-all max-h-48">
                {input.length > 500 ? `${input.slice(0, 500)}...` : input}
              </pre>
              <div className="mt-2">
                <CopyButton text={input} />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
