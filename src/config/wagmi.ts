import { http, createConfig } from "wagmi";
import { mainnet, polygon, bsc } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { getRpcUrl } from "./env";
import { mockConnector } from "./mockConnector";

const connectors =
  process.env.NEXT_PUBLIC_MOCK_WALLET === "true"
    ? [mockConnector]
    : [injected()];
import {http, createConfig} from "wagmi";
import {mainnet, polygon, bsc} from "wagmi/chains";
import { defineChain } from "viem";
import {injected} from "wagmi/connectors";
import {getRpcUrl, getLocalRpcUrl} from "./env";

/**
 * Define the Foundry/Anvil local development chain
 */
const foundry = defineChain({
  id: 31337,
  name: "Foundry (Local)",
  network: "foundry",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["http://localhost:8545"],
    },
    public: {
      http: ["http://localhost:8545"],
    },
  },
  testnet: true,
});

/**
 * Get RPC URL for a chain, returning undefined to use default
 */
const getWagmiRpcUrl = (chainId: number): string | undefined => {
  // Check for local RPC URL first
  const localRpcUrl = getLocalRpcUrl();
  if (chainId === 31337 && localRpcUrl) {
    return localRpcUrl;
  }

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

/**
 * Build the list of supported chains
 * Includes foundry if LOCAL_RPC_URL is configured
 */
const buildSupportedChains = () => {
  const chains = [mainnet, polygon, bsc];
  const localRpcUrl = getLocalRpcUrl();
  
  if (localRpcUrl) {
    chains.push(foundry);
  }
  
  return chains;
};

/**
 * Build the transports configuration for all chains
 */
const buildTransports = () => {
  const chains = buildSupportedChains();
  const transports: Record<number, ReturnType<typeof http>> = {};
  
  chains.forEach(chain => {
    transports[chain.id] = http(getWagmiRpcUrl(chain.id));
  });
  
  return transports;
};

const supportedChains = buildSupportedChains();
const transports = buildTransports();

export const config = createConfig({
  chains: [mainnet, polygon, bsc],
  connectors,
  transports: {
    [mainnet.id]: http(getWagmiRpcUrl(mainnet.id)),
    [polygon.id]: http(getWagmiRpcUrl(polygon.id)),
    [bsc.id]: http(getWagmiRpcUrl(bsc.id)),
  },
  chains: supportedChains,
  connectors: [injected()],
  transports,
});
