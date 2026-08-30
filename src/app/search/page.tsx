import { redirect } from "next/navigation";
import { isAddress, isHex } from "viem";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const raw = (sp.q || "").trim();
  const q = raw;

  if (!q) {
    return (
      <main className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-3">Search</h1>
          <p className="text-gray-400 mb-6">
            Enter a transaction hash, address, or block number.
          </p>
          <Link href="/" className="text-blue-400 hover:underline text-sm">
            ← Home
          </Link>
        </div>
      </main>
    );
  }

  if (isAddress(q)) {
    redirect(`/address/${q}`);
  }

  if (/^\d+$/.test(q)) {
    redirect(`/block/${q}`);
  }

  const hash = q.startsWith("0x") ? q : `0x${q}`;
  if (isHex(hash) && hash.length === 66) {
    redirect(`/tx/${hash}`);
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold mb-3">Nothing found</h1>
        <p className="text-gray-400 mb-2 break-all">
          Could not recognise:{" "}
          <span className="font-mono text-gray-300">{raw}</span>
        </p>
        <p className="text-gray-500 text-sm mb-8">
          Use a 42-character address, a 66-character transaction hash, or a
          block number.
        </p>
        <Link href="/" className="text-blue-400 hover:underline text-sm">
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}
