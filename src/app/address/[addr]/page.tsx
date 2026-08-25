import { publicClient } from "@/lib/rpc";
import { formatEther, isAddress, type Address } from "viem";
import Link from "next/link";
import CopyButton from "@/components/CopyButton";

export const dynamic = "force-dynamic";
const API_BASE = "https://api.odinsexplorer.app";
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
  const normalized = addr.toLowerCase();

  if (!isAddress(addr)) {
    return (
      <main className="min-h-screen bg-gray-950 text-white p-10">
        <p>Invalid address</p>
        <Link href="/" className="text-blue-400">
          Home
        </Link>
      </main>
    );
  }

  let balance = BigInt(0);
  let transactionCount = BigInt(0);
  let isContract = false;
  let transactions: TxRecord[] = [];
  let dbError = "";
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
    const res = await fetch(`${API_BASE}/api/address/${normalized}/txs`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`API status ${res.status}`);
    }
    const data = await res.json();
    transactions = data.transactions || [];
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-2">Address</h1>
        <div className="flex items-center gap-2 mb-6">
          <p className="font-mono text-sm text-gray-400 break-all">{addr}</p>
          <CopyButton text={addr} />
        </div>

        {rpcError && (
          <div className="mb-4 p-4 bg-red-900/40 border border-red-700 rounded-xl text-red-300 text-sm">
            RPC error: {rpcError}
          </div>
        )}

        {dbError && (
          <div className="mb-4 p-4 bg-red-900/40 border border-red-700 rounded-xl text-red-300 text-sm">
            History API error: {dbError}
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <p className="text-gray-500 text-sm">Balance</p>
          <p className="text-2xl font-semibold">{formatEther(balance)} BDAG</p>
          <p className="text-gray-500 text-sm mt-4">Nonce</p>
          <p className="text-xl">{transactionCount.toString()}</p>
          <p className="mt-2 text-sm text-gray-400">
            {isContract ? "Contract" : "Wallet"}
          </p>
        </div>

        <h2 className="text-xl font-semibold mb-4">
          Recent Transactions ({transactions.length})
        </h2>

        {transactions.length === 0 && !dbError && (
          <p className="text-gray-500 text-sm mb-4">
            No indexed transactions for this address yet.
          </p>
        )}

        <div className="space-y-3">
          {transactions.map((tx) => {
            const isOut = tx.from_address?.toLowerCase() === normalized;
            return (
              <div
                key={tx.hash}
                className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      isOut
                        ? "bg-red-900/40 text-red-300"
                        : "bg-green-900/40 text-green-300"
                    }`}
                  >
                    {isOut ? "OUT" : "IN"}
                  </span>
                  <Link
                    href={`/tx/${tx.hash}`}
                    className="text-blue-400 font-mono text-sm break-all"
                  >
                    {tx.hash.slice(0, 18)}...{tx.hash.slice(-12)}
                  </Link>
                  <CopyButton text={tx.hash} />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Block #{tx.block_number} ·{" "}
                  {formatEther(BigInt(tx.value || "0"))} BDAG
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-8">
          <Link href="/" className="text-blue-400 text-sm">
            ← Home
          </Link>
        </div>
      </div>
    </main>
  );
}
