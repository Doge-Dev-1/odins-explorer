import { publicClient } from "@/lib/rpc";
import { notFound } from "next/navigation";
import { formatEther, isAddress, type Address } from "viem";
import CopyButton from "@/components/CopyButton";

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
  let code: `0x${string}` | undefined = undefined;
  let isContract = false;

  try {
    const address = addr as Address;

    const [bal, count, contractCode] = await Promise.all([
      publicClient.getBalance({ address }),
      publicClient.getTransactionCount({ address }),
      publicClient.getCode({ address }),
    ]);

    balance = bal;
    transactionCount = BigInt(count);
    code = contractCode;
    isContract = !!contractCode && contractCode !== "0x";
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

        {isContract && code && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Contract Bytecode</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <pre className="text-xs font-mono text-gray-300 overflow-x-auto max-h-48">
                {code.slice(0, 500)}
                {code.length > 500 ? "..." : ""}
              </pre>
              <p className="text-gray-500 text-xs mt-2">
                Showing first 500 characters of bytecode
              </p>
            </div>
          </div>
        )}

        <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl text-gray-400 text-sm">
          <p className="font-medium text-gray-300 mb-1">Note</p>
          <p>
            Full transaction history and token holdings require an indexer. This
            page currently shows live balance, nonce, and contract status
            directly from the RPC.
          </p>
        </div>
      </div>
    </main>
  );
}
