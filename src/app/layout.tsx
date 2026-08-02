import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Odin's Explorer | BlockDAG Blockchain Explorer",
  description:
    "Independent BlockDAG explorer. View blocks, transactions, addresses, contracts and RPC node status in real time.",
  metadataBase: new URL("https://odinsexplorer.app"),
  openGraph: {
    title: "Odin's Explorer",
    description:
      "Independent BlockDAG blockchain explorer – blocks, transactions, addresses and live RPC status.",
    url: "https://odinsexplorer.app",
    siteName: "Odin's Explorer",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Odin's Explorer",
    description:
      "Independent BlockDAG blockchain explorer – blocks, transactions, addresses and live RPC status.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-950 text-white`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
