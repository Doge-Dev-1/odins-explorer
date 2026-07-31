import Link from "next/link";

export default function ContractsPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-2">Contracts</h1>
        <p className="text-gray-400 mb-8">
          Smart contract exploration on Odin&apos;s Explorer
        </p>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Current Features</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li>Detect if an address is a contract</li>
              <li>View contract bytecode</li>
              <li>See balance and transaction count of contracts</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li>Contract verification (upload source code)</li>
              <li>Read Contract (call view functions)</li>
              <li>Write Contract (connect wallet & interact)</li>
              <li>Event logs and decoded input data</li>
            </ul>
          </div>

          <div className="pt-4 border-t border-gray-800">
            <p className="text-gray-400 text-sm mb-4">
              To view a contract, search for its address using the search bar on
              the homepage, or open any address that is marked as a Contract.
            </p>

            <Link
              href="/"
              className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg transition"
            >
              Go to Search
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
