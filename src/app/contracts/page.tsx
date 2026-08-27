import Link from "next/link";
import AdBanner from "@/components/AdBanner";

export default function ContractsPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Contracts</h1>
          <p className="text-gray-400">
            Explore smart contracts on the BlockDAG network
          </p>
        </div>

        <AdBanner unitId="2453520" />

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">How to view a contract</h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-300">
            <li>
              Go to the{" "}
              <Link href="/" className="text-blue-400 hover:underline">
                homepage
              </Link>{" "}
              and search for any contract address.
            </li>
            <li>
              Odin&apos;s Explorer will automatically detect if the address is a
              contract.
            </li>
            <li>
              You will see the contract balance, nonce, and a preview of the
              bytecode.
            </li>
          </ol>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3 text-green-400">
              Available now
            </h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                Automatic contract detection
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                View contract bytecode
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                Live balance & transaction count
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                Clear Contract / Wallet badge
              </li>
            </ul>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3 text-yellow-400">
              Coming later
            </h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5">○</span>
                Contract source code verification
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5">○</span>
                Read Contract (view functions)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5">○</span>
                Write Contract (with wallet)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5">○</span>
                Decoded events & input data
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-linear-to-r from-blue-900/30 to-purple-900/30 border border-blue-800/50 rounded-xl p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Ready to explore?</h3>
          <p className="text-gray-400 text-sm mb-5">
            Search for any address on the homepage. If it&apos;s a contract,
            you&apos;ll see it marked automatically.
          </p>
          <Link
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg transition font-medium"
          >
            Go to Search
          </Link>
        </div>

        <AdBanner unitId="2453520" />

        <div className="mt-8 p-4 bg-gray-900/50 border border-gray-800 rounded-xl text-gray-400 text-sm">
          <p>
            <span className="text-gray-300 font-medium">Note:</span> Full
            contract verification, ABI interaction, and event decoding require
            additional infrastructure (indexer + verification service). These
            features will be added in a future update.
          </p>
        </div>
      </div>
    </main>
  );
}
