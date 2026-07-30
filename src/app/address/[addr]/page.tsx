import { publicClient } from "@/lib/rpc";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatEther, isAddress, type Address } from "viem";

export const dynamic = "force-dynamic";

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

  try {
    balance = await publicClient.getBalance({ address: addr as Address });
    const count = await publicClient.getTransactionCount({
      address: addr as Address,
    });
    transactionCount = BigInt(count);
  } catch {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <Link href="/" className="text-blue-400 hover:underline text-sm">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold mt-3">Address</h1>
          <p className="font-mono text-sm text-gray-400 mt-2 break-all">
            {addr}
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
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

        <div className="mt-8 p-4 bg-gray-900/50 border border-gray-800 rounded-xl text-gray-400 text-sm">
          Note: Full transaction history for this address will be added in a
          future update (requires indexing).
        </div>
      </div>
    </main>
  );
}
