import { publicClient } from "@/lib/rpc";
import pool from "@/lib/db";
import { formatEther, isAddress, type Address } from "viem";
import Link from "next/link";

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
  const normalized = addr.toLowerCase();

  if (!isAddress(addr)) {
    return (
      <main className="min-h-screen bg-gray-950 text-white p-10">
        <p>Invalid address: {addr}</p>
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
    const txResult = await pool.query(
      `SELECT hash, block_number, from_address, to_address, value
       FROM transactions
       WHERE from_address = $1 OR to_address = $1
       ORDER BY block_number DESC
       LIMIT 50`,
      [normalized],
    );
    transactions = txResult.rows || [];
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-2">Address</h1>
        <p className="font-mono text-sm text-gray-400 break-all mb-6">{addr}</p>

        {rpcError && (
          <div className="mb-4 p-4 bg-red-900/40 border border-red-700 rounded-xl text-red-300 text-sm">
            RPC error: {rpcError}
          </div>
        )}

        {dbError && (
          <div className="mb-4 p-4 bg-red-900/40 border border-red-700 rounded-xl text-red-300 text-sm">
            DB error: {dbError}
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <p>Balance: {formatEther(balance)} BDAG</p>
          <p className="mt-2">Nonce: {transactionCount.toString()}</p>
          <p className="mt-2">{isContract ? "Contract" : "Wallet"}</p>
        </div>

        <h2 className="text-xl font-semibold mb-4">
          Transactions ({transactions.length})
        </h2>

        {transactions.length === 0 && !dbError && (
          <p className="text-gray-500 text-sm">
            No indexed txs for this address yet.
          </p>
        )}

        <div className="space-y-2">
          {transactions.map((tx) => (
            <div
              key={tx.hash}
              className="bg-gray-900 border border-gray-800 rounded-lg p-4"
            >
              <Link
                href={`/tx/${tx.hash}`}
                className="text-blue-400 font-mono text-sm break-all"
              >
                {tx.hash}
              </Link>
              <p className="text-xs text-gray-500 mt-1">
                Block #{tx.block_number}
              </p>
            </div>
          ))}
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
