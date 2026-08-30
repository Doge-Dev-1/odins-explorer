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

type TokenTransfer = {
  tx_hash: string;
  block_number: number;
  token_address: string;
  from_address: string;
  to_address: string;
  value: string;
  timestamp?: string | null;
};

function timeAgo(iso?: string | null) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toLocaleString()} (${timeAgo(iso)})`;
}

export default async function AddressPage({
  params,
  searchParams,
}: {
  params: Promise<{ addr: string }>;
  searchParams: Promise<{ page?: string; tokenPage?: string }>;
}) {
  const { addr } = await params;
  const sp = await searchParams;
  const normalized = addr.toLowerCase();
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const tokenPage = Math.max(1, parseInt(sp.tokenPage || "1", 10) || 1);

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
  let verified = false;
  let contractName = "";
  let transactions: TxRecord[] = [];
  let total = 0;
  let totalPages = 1;
  let tokenTransfers: TokenTransfer[] = [];
  let tokenTotal = 0;
  let tokenTotalPages = 1;
  let historyError = "";
  let tokenError = "";
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
    const res = await fetch(`${API_BASE}/api/contract/${normalized}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      verified = !!data.verified;
      contractName = data.contract?.name || "";
    }
  } catch {
    // optional
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

  try {
    const res = await fetch(
      `${API_BASE}/api/address/${normalized}/token-transfers?page=${tokenPage}&limit=${PAGE_SIZE}`,
      { cache: "no-store" },
    );
    if (!res.ok) throw new Error(`API status ${res.status}`);
    const data = await res.json();
    tokenTransfers = data.transfers || [];
    tokenTotal = data.total || 0;
    tokenTotalPages = data.totalPages || 1;
  } catch (err) {
    tokenError = err instanceof Error ? err.message : String(err);
  }

  const nonceNum = Number(transactionCount);
  const historyGap = nonceNum > 0 && total < nonceNum;

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

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              isContract
                ? "bg-purple-900/50 text-purple-300"
                : "bg-blue-900/50 text-blue-300"
            }`}
          >
            {isContract ? "Contract" : "Wallet / EOA"}
          </span>
          {verified && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-300">
              Verified{contractName ? ` · ${contractName}` : ""}
            </span>
          )}
        </div>

        {isContract && (
          <div className="mb-6 flex flex-wrap gap-3">
            {verified ? (
              <Link
                href={`/contract/${addr}`}
                className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Read Contract
              </Link>
            ) : (
              <Link
                href="/verify"
                className="inline-block bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Verify this contract
              </Link>
            )}
            <Link
              href="/verify"
              className="inline-block text-blue-400 hover:underline text-sm px-2 py-2"
            >
              Submit / update ABI
            </Link>
          </div>
        )}

        {rpcError && (
          <div className="mb-4 p-4 bg-red-900/40 border border-red-700 rounded-xl text-red-300 text-sm">
            RPC error: {rpcError}
          </div>
        )}

        {historyGap && (
          <div className="mb-4 p-4 bg-gray-900 border border-gray-800 rounded-xl text-gray-400 text-sm">
            This address has nonce {nonceNum.toLocaleString()} but only{" "}
            {total.toLocaleString()} indexed transactions so far. Older history
            appears as backfill continues.
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
              <p className="text-gray-500 text-sm">Indexed native txs</p>
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

        {historyError && (
          <div className="mb-4 p-4 bg-red-900/40 border border-red-700 rounded-xl text-red-300 text-sm">
            History error: {historyError}
          </div>
        )}

        {transactions.length === 0 && !historyError ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-gray-400 text-sm mb-10">
            No indexed native transactions for this address yet.
          </div>
        ) : (
          <div className="space-y-3 mb-6">
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
                        className="text-blue-400 hover:underline font-mono text-sm"
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
                  <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
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
                    <span>{formatTime(tx.timestamp)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mb-12 flex items-center justify-center gap-3">
            {page > 1 ? (
              <Link
                href={`/address/${addr}?page=${page - 1}&tokenPage=${tokenPage}`}
                className="px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-sm"
              >
                ← Previous
              </Link>
            ) : (
              <span className="px-4 py-2 text-gray-600 text-sm">
                ← Previous
              </span>
            )}
            <span className="text-sm text-gray-400">
              {page} / {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={`/address/${addr}?page=${page + 1}&tokenPage=${tokenPage}`}
                className="px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-sm"
              >
                Next →
              </Link>
            ) : (
              <span className="px-4 py-2 text-gray-600 text-sm">Next →</span>
            )}
          </div>
        )}

        <div className="border-t border-gray-800 pt-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-xl font-semibold">Token Transfers (ERC-20)</h2>
            <p className="text-sm text-gray-500">
              {tokenTotal > 0
                ? `Page ${tokenPage} of ${tokenTotalPages} · ${tokenTotal} total`
                : "Ready for token activity"}
            </p>
          </div>

          {tokenError && (
            <div className="mb-4 p-4 bg-red-900/40 border border-red-700 rounded-xl text-red-300 text-sm">
              Token history error: {tokenError}
            </div>
          )}

          {tokenTransfers.length === 0 && !tokenError ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-gray-400 text-sm space-y-2">
              <p className="text-gray-300 font-medium">
                No token transfers indexed yet
              </p>
              <p>
                Odin&apos;s Explorer is set up to index standard ERC-20 Transfer
                events. When tokens are deployed and transferred on BlockDAG,
                they will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tokenTransfers.map((t) => {
                const isOut = t.from_address?.toLowerCase() === normalized;
                return (
                  <div
                    key={`${t.tx_hash}-${t.block_number}-${t.token_address}`}
                    className="bg-gray-900 border border-gray-800 rounded-xl px-4 sm:px-5 py-4"
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
                        href={`/tx/${t.tx_hash}`}
                        className="text-blue-400 font-mono text-sm"
                      >
                        {t.tx_hash.slice(0, 14)}...{t.tx_hash.slice(-10)}
                      </Link>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                      <span>
                        Token:{" "}
                        <Link
                          href={`/address/${t.token_address}`}
                          className="text-purple-300 hover:underline font-mono"
                        >
                          {t.token_address.slice(0, 8)}...
                          {t.token_address.slice(-6)}
                        </Link>
                      </span>
                      <span>Block #{t.block_number}</span>
                      <span>{formatTime(t.timestamp)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-8">
          <Link href="/" className="text-blue-400 text-sm hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
