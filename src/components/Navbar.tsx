import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Title */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-white">
              Odin&apos;s Explorer
            </span>
            <span className="hidden sm:inline-block text-xs text-gray-500 font-normal">
              BlockDAG
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6 text-sm">
            <Link
              href="/"
              className="text-gray-300 hover:text-white transition"
            >
              Home
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
