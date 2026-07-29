import { http, createConfig } from "wagmi";
import { mainnet, polygon, bsc } from "wagmi/chains";
import { defineChain } from "viem";
import { injected } from "wagmi/connectors";
import { getRpcUrl, getLocalRpcUrl } from "./env";
import { mockConnector } from "./mockConnector";

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
 * Define the Hardhat preview fork chain for PR preview environments
 */
const hardhatPreview = defineChain({
  id: 31338,
  name: "Hardhat Preview Fork",
  network: "hardhat-preview",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["http://preview-fork:8545"],
    },
    public: {
      http: ["http://preview-fork:8545"],
    },
  },
  testnet: true,
});

/**
 * Get RPC URL for a chain, returning undefined to use default
 */
const getWagmiRpcUrl = (chainId: number): string | undefined => {
  // Check for preview fork RPC URL
  const previewForkUrl = getLocalRpcUrl();
  if (chainId === 31338 && process.env.NEXT_PUBLIC_PREVIEW_FORK_URL) {
    return process.env.NEXT_PUBLIC_PREVIEW_FORK_URL;
  }

  // Check for local RPC URL first
  if (chainId === 31337 && previewForkUrl) {
    return previewForkUrl;
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
 * Includes hardhat preview if NEXT_PUBLIC_PREVIEW_FORK_URL is configured
 */
const buildSupportedChains = () => {
  const chains = [mainnet, polygon, bsc];
  const localRpcUrl = getLocalRpcUrl();

  if (localRpcUrl) {
    chains.push(foundry);
  }

  if (process.env.NEXT_PUBLIC_PREVIEW_FORK_URL) {
    chains.push(hardhatPreview);
  }

  return chains;
};

/**
 * Build the transports configuration for all chains
 */
const buildTransports = () => {
  const chains = buildSupportedChains();
  const transports: Record<number, ReturnType<typeof http>> = {};

  chains.forEach((chain) => {
    transports[chain.id] = http(getWagmiRpcUrl(chain.id));
  });

  return transports;
};

const supportedChains = buildSupportedChains();
const transports = buildTransports();

const connectors =
  process.env.NEXT_PUBLIC_MOCK_WALLET === "true"
    ? [mockConnector]
    : [injected()];

export const config = createConfig({
  chains: supportedChains,
  connectors,
  transports,
});
