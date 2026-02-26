import {http, createConfig} from "wagmi";
import {mainnet, polygon, bsc} from "wagmi/chains";
import {injected} from "wagmi/connectors";
import {getRpcUrl} from "./env";

/**
 * Get RPC URL for a chain, returning undefined to use default
 */
const getWagmiRpcUrl = (chainId: number): string | undefined => {
  switch (chainId) {
    case mainnet.id:
      return getRpcUrl("ethereum");
    case polygon.id:
      return getRpcUrl("polygon");
    case bsc.id:
      return getRpcUrl("bsc");
    default:
      return undefined;
  }
};

export const config = createConfig({
  chains: [mainnet, polygon, bsc],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(getWagmiRpcUrl(mainnet.id)),
    [polygon.id]: http(getWagmiRpcUrl(polygon.id)),
    [bsc.id]: http(getWagmiRpcUrl(bsc.id)),
  },
});
