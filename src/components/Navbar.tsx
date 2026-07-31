import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="border-b border-gray-800 bg-gray-950/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg sm:text-xl font-bold tracking-tight text-white">
              Odin&apos;s Explorer
            </span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-4 sm:gap-6 text-sm">
            <Link
              href="/"
              className="text-gray-300 hover:text-white transition"
            >
              Home
            </Link>
            <Link
              href="/contracts"
              className="text-gray-300 hover:text-white transition"
            >
              Contracts
            </Link>
            <Link
              href="/nodes"
              className="text-gray-300 hover:text-white transition"
            >
              RPC Nodes
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
