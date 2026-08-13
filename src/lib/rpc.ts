import { createPublicClient, http, fallback, defineChain } from "viem";

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
      http: [
        "https://rpc.east.bdag-us.org",
        "https://rpc.west.bdag-us.org",
        "https://rpc.welshdag.trade",
        "https://rpc.dvdmining.com",
        "https://rpc.blockdag.engineering",
        "https://rpc.capedag.com",
      ],
    },
  },
});

export const publicClient = createPublicClient({
  chain: blockdag,
  transport: fallback([
    http("https://rpc.east.bdag-us.org"),
    http("https://rpc.west.bdag-us.org"),
    http("https://rpc.welshdag.trade"),
    http("https://rpc.dvdmining.com"),
    http("https://rpc.blockdag.engineering"),
    http("https://rpc.capedag.com"),
  ]),
});
