import { redirect } from "next/navigation";
import { isAddress, isHash } from "viem";
import Link from "next/link";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  if (!q || q.trim() === "") {
    redirect("/");
  }

  const query = q.trim();

  // Block number (only digits)
  if (/^\d+$/.test(query)) {
    redirect(`/block/${query}`);
  }

  // Transaction hash (0x + 64 hex characters)
  if (isHash(query)) {
    redirect(`/tx/${query}`);
  }

  // Address (0x + 40 hex characters)
  if (isAddress(query)) {
    redirect(`/address/${query}`);
  }

  // If nothing matched
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-4">Odin&apos;s Explorer</h1>
        <div className="p-6 bg-red-900/30 border border-red-700 rounded-xl">
          <p className="text-red-300 text-lg">
            No results found for: <span className="font-mono">{query}</span>
          </p>
          <p className="text-gray-400 mt-2">
            Please enter a valid Block Number, Transaction Hash, or Address.
          </p>
          <Link
            href="/"
            className="inline-block mt-4 text-blue-400 hover:underline"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
