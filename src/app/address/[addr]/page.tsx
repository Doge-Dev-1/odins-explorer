import { publicClient } from "@/lib/rpc";
import { formatEther, isAddress, type Address } from "viem";
import Link from "next/link";
import CopyButton from "@/components/CopyButton";

export const dynamic = "force-dynamic";

const API_BASE = "https://api.odinsexplorer.app";
const PAGE_SIZE = 25;

type TxRecord = {
  hash: string;
  block_number: number;
  from_address: string;
  to_address: string | null;
  value: string;
  timestamp?: string | null;
};

export default async function AddressPage({
  params,
  searchParams,
}: {
  params: Promise<{ addr: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { addr } = await params;
  const sp = await searchParams;
  const normalized = addr.toLowerCase();
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);

  if (!isAddress(addr)) {
    return (
      <main className="min-h-screen bg-gray-950 text-white p-10">
        <p className="text-red-300">Invalid address</p>
        <Link href="/" className="text-blue-400 text-sm mt-4 inline-block">
          ← Home
        </Link>
      </main>
    );
  }

  let balance = BigInt(0);
  let transactionCount = BigInt(0);
  let isContract = false;
  let transactions: TxRecord[] = [];
  let total = 0;
  let totalPages = 1;
  let historyError = "";
  let rpcError = "";

  try {
    const address = addr as Address;
    const [bal, count, contractCode] = await Promise.all([
      publicClient.getBalance({ address }),
      publicClient.getTransactionCount({ address }),
      publicClient.getCode({ address }),
    ]);
    balance = bal;
    transactionCount = BigInt(count);
    isContract = !!contractCode && contractCode !== "0x";
  } catch (err) {
    rpcError = err instanceof Error ? err.message : String(err);
  }

  try {
    const res = await fetch(
      `${API_BASE}/api/address/${normalized}/txs?page=${page}&limit=${PAGE_SIZE}`,
      { cache: "no-store" },
    );
    if (!res.ok) throw new Error(`API status ${res.status}`);
    const data = await res.json();
    transactions = data.transactions || [];
    total = data.total || 0;
    totalPages = data.totalPages || 1;
  } catch (err) {
    historyError = err instanceof Error ? err.message : String(err);
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <p className="text-sm text-gray-500 mb-1">Address</p>
          <h1 className="text-2xl sm:text-3xl font-bold break-all">{addr}</h1>
          <div className="mt-2">
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

        {rpcError && (
          <div className="mb-4 p-4 bg-red-900/40 border border-red-700 rounded-xl text-red-300 text-sm">
            RPC error: {rpcError}
          </div>
        )}
        {historyError && (
          <div className="mb-4 p-4 bg-red-900/40 border border-red-700 rounded-xl text-red-300 text-sm">
            History error: {historyError}
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-gray-500 text-sm">Balance</p>
              <p className="text-xl font-semibold mt-1">
                {formatEther(balance)}{" "}
                <span className="text-base text-gray-400">BDAG</span>
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Nonce</p>
              <p className="text-xl font-semibold mt-1">
                {transactionCount.toString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Indexed txs</p>
              <p className="text-xl font-semibold mt-1">{total}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-xl font-semibold">Transactions</h2>
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
            {total > 0 && ` · ${total} total`}
          </p>
        </div>

        {transactions.length === 0 && !historyError ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-gray-400 text-sm">
            No indexed transactions for this address yet. History grows as the
            indexer runs.
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => {
              const isOut = tx.from_address?.toLowerCase() === normalized;
              const counterparty = isOut ? tx.to_address : tx.from_address;

              return (
                <div
                  key={tx.hash}
                  className="bg-gray-900 border border-gray-800 rounded-xl px-4 sm:px-5 py-4 hover:border-gray-700 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          isOut
                            ? "bg-red-900/40 text-red-300"
                            : "bg-green-900/40 text-green-300"
                        }`}
                      >
                        {isOut ? "OUT" : "IN"}
                      </span>
                      <Link
                        href={`/tx/${tx.hash}`}
                        className="text-blue-400 hover:underline font-mono text-sm break-all"
                      >
                        {tx.hash.slice(0, 14)}...{tx.hash.slice(-12)}
                      </Link>
                      <CopyButton text={tx.hash} />
                    </div>
                    <span className="text-sm text-gray-400">
                      Block{" "}
                      <Link
                        href={`/block/${tx.block_number}`}
                        className="text-blue-400 hover:underline"
                      >
                        #{tx.block_number}
                      </Link>
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1 items-center">
                    {counterparty ? (
                      <span>
                        {isOut ? "To" : "From"}:{" "}
                        <Link
                          href={`/address/${counterparty}`}
                          className="hover:underline text-gray-300"
                        >
                          {counterparty.slice(0, 8)}...
                          {counterparty.slice(-6)}
                        </Link>
                      </span>
                    ) : (
                      <span className="text-yellow-400">Contract creation</span>
                    )}
                    <span className={isOut ? "text-red-300" : "text-green-300"}>
                      {isOut ? "-" : "+"}
                      {formatEther(BigInt(tx.value || "0"))} BDAG
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            {page > 1 ? (
              <Link
                href={`/address/${addr}?page=${page - 1}`}
                className="px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 hover:border-gray-500 text-sm"
              >
                ← Previous
              </Link>
            ) : (
              <span className="px-4 py-2 rounded-lg bg-gray-900/50 border border-gray-800 text-gray-600 text-sm">
                ← Previous
              </span>
            )}

            <span className="text-sm text-gray-400">
              {page} / {totalPages}
            </span>

            {page < totalPages ? (
              <Link
                href={`/address/${addr}?page=${page + 1}`}
                className="px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 hover:border-gray-500 text-sm"
              >
                Next →
              </Link>
            ) : (
              <span className="px-4 py-2 rounded-lg bg-gray-900/50 border border-gray-800 text-gray-600 text-sm">
                Next →
              </span>
            )}
          </div>
        )}

        <div className="mt-10 pt-6 border-t border-gray-800">
          <Link href="/" className="text-blue-400 text-sm hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
