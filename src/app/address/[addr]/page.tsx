import { publicClient } from "@/lib/rpc";
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { formatEther, isAddress, type Address } from "viem";
import Link from "next/link";
import CopyButton from "@/components/CopyButton";

export const dynamic = "force-dynamic";

type TxRecord = {
  hash: string;
  block_number: number;
  from_address: string;
  to_address: string | null;
  value: string;
};

export default async function AddressPage({
  params,
}: {
  params: Promise<{ addr: string }>;
}) {
  const { addr } = await params;

  if (!isAddress(addr)) {
    notFound();
  }

  let balance = BigInt(0);
  let transactionCount = BigInt(0);
  let code: `0x${string}` | undefined = undefined;
  let isContract = false;
  let transactions: TxRecord[] = [];

  try {
    const address = addr as Address;

    const [bal, count, contractCode, txResult] = await Promise.all([
      publicClient.getBalance({ address }),
      publicClient.getTransactionCount({ address }),
      publicClient.getCode({ address }),
      supabase
        .from("transactions")
        .select("*")
        .or(`from_address.eq.${addr},to_address.eq.${addr}`)
        .order("block_number", { ascending: false })
        .limit(25),
    ]);

    balance = bal;
    transactionCount = BigInt(count);
    code = contractCode;
    isContract = !!contractCode && contractCode !== "0x";
    transactions = txResult.data || [];
  } catch {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Address</h1>
          <div className="flex items-center mt-2">
            <p className="font-mono text-sm text-gray-400 break-all">{addr}</p>
            <CopyButton text={addr} />
          </div>
        </div>

        <div className="mb-6">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              isContract
                ? "bg-purple-900/50 text-purple-300"
                : "bg-blue-900/50 text-blue-300"
            }`}
          >
            {isContract ? "Contract" : "Wallet / EOA"}
          </span>
        </div>

        {/* Stats */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-500 text-sm">Balance</p>
              <p className="text-2xl font-semibold mt-1">
                {formatEther(balance)}{" "}
                <span className="text-lg text-gray-400">BDAG</span>
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">Transaction Count (Nonce)</p>
              <p className="text-2xl font-semibold mt-1">
                {transactionCount.toString()}
              </p>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Recent Transactions ({transactions.length})
          </h2>

          {transactions.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-gray-400 text-sm">
              No transactions found in the indexed range yet. The indexer is
              still catching up with recent blocks.
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.hash}
                  className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 hover:border-gray-700 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/tx/${tx.hash}`}
                        className="text-blue-400 hover:underline font-mono text-sm"
                      >
                        {tx.hash.slice(0, 14)}...{tx.hash.slice(-12)}
                      </Link>
                      <CopyButton text={tx.hash} />
                    </div>

                    <div className="text-sm text-gray-400">
                      Block #{tx.block_number}
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                    <span>
                      From:{" "}
                      <Link
                        href={`/address/${tx.from_address}`}
                        className="hover:underline"
                      >
                        {tx.from_address.slice(0, 8)}...
                        {tx.from_address.slice(-6)}
                      </Link>
                    </span>
                    {tx.to_address && (
                      <span>
                        To:{" "}
                        <Link
                          href={`/address/${tx.to_address}`}
                          className="hover:underline"
                        >
                          {tx.to_address.slice(0, 8)}...
                          {tx.to_address.slice(-6)}
                        </Link>
                      </span>
                    )}
                    <span className="text-gray-400">
                      {formatEther(BigInt(tx.value || "0"))} BDAG
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contract bytecode */}
        {isContract && code && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Contract Bytecode</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <pre className="text-xs font-mono text-gray-300 overflow-x-auto max-h-48">
                {code.slice(0, 500)}
                {code.length > 500 ? "..." : ""}
              </pre>
            </div>
          </div>
        )}

        <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl text-gray-400 text-sm">
          <p>
            Showing the most recent transactions found by the indexer.
            Historical data will grow as the indexer continues running.
          </p>
        </div>
      </div>
    </main>
  );
}
