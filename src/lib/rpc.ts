import { createPublicClient, http, fallback, defineChain } from "viem";

const RPC_URLS = [
  "https://rpc.east.bdag-us.org",
  "https://rpc.west.bdag-us.org",
  "https://rpc.brazil.bdag-us.org",
  "https://rpc.england.bdag-us.org",
  "https://rpc.cms-mining-pool.net",
  "https://rpc.welshdag.trade",
  "https://rpc.dvdmining.com",
  "https://rpc.blockdag.engineering",
  "https://rpc.capedag.com",
];

export const blockdag = defineChain({
  id: 1404,
  name: "BlockDAG",
  nativeCurrency: {
    decimals: 18,
    name: "BDAG",
    symbol: "BDAG",
  },
  rpcUrls: {
    default: {
      http: RPC_URLS,
    },
  },
});

export const publicClient = createPublicClient({
  chain: blockdag,
  transport: fallback(RPC_URLS.map((url) => http(url))),
});
