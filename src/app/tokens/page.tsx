import Link from "next/link";

export default function TokensPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-2">Tokens</h1>
        <p className="text-gray-400 mb-8">ERC-20 token tracking on BlockDAG</p>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4 text-sm text-gray-300">
          <p>
            Odin&apos;s Explorer indexes standard ERC-20{" "}
            <span className="font-mono text-xs">Transfer</span> events into its
            own database.
          </p>
          <p>
            When tokens are deployed and used on-chain, transfers will show on
            address pages automatically.
          </p>
          <ul className="list-disc list-inside text-gray-400 space-y-1">
            <li>Token transfer history on addresses — ready</li>
            <li>Token list / holders — coming later</li>
            <li>Contract verification + Read/Write — planned next</li>
          </ul>
        </div>

        <div className="mt-8">
          <Link href="/" className="text-blue-400 text-sm hover:underline">
            ← Home
          </Link>
        </div>
      </div>
    </main>
  );
}
