"use client";

import Link from "next/link";
import { useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/tokens", label: "Tokens" },
  { href: "/contracts", label: "Contracts" },
  { href: "/verify", label: "Verify" },
  { href: "/nodes", label: "RPC Nodes" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-gray-800 bg-gray-950/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold text-white tracking-tight">
          Odin&apos;s Explorer
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-gray-400 hover:text-white transition"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          className="sm:hidden text-gray-300 text-sm px-2 py-1 border border-gray-700 rounded"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          Menu
        </button>
      </div>
      {open && (
        <nav className="sm:hidden border-t border-gray-800 px-4 py-3 flex flex-col gap-3 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-gray-300 hover:text-white"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
