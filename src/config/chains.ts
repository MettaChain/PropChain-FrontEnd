import { mainnet, polygon, bsc } from "wagmi/chains";
import { defineChain } from "viem";
import { getRpcUrl } from "./env";

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
 * Supported EVM chain IDs.
 */
export const CHAIN_IDS = {
  ETHEREUM: 1,
  POLYGON: 137,
  BSC: 56,
  FOUNDRY: 31337,
} as const;

export type ChainId = (typeof CHAIN_IDS)[keyof typeof CHAIN_IDS];

export const SUPPORTED_CHAINS = [mainnet, polygon, bsc];

/**
 * Get supported chains including local foundry if configured
 */
export function getSupportedChains() {
  const localRpcUrl = getRpcUrl("local");
  const chains = [...SUPPORTED_CHAINS];
  
  if (localRpcUrl) {
    chains.push(foundry);
  }
  
  return chains;
}

/**
 * Get RPC URL for a chain, falling back to defaults if env var is not set.
 */
const getChainRpcUrl = (chainId: ChainId): string => {
  switch (chainId) {
    case CHAIN_IDS.ETHEREUM:
      return getRpcUrl("ethereum") ?? "https://mainnet.infura.io/v3/";

    case CHAIN_IDS.POLYGON:
      return getRpcUrl("polygon") ?? "https://polygon-rpc.com";

    case CHAIN_IDS.BSC:
      return getRpcUrl("bsc") ?? "https://bsc-dataseed1.binance.org";

    case CHAIN_IDS.FOUNDRY:
      return getRpcUrl("local") ?? "http://localhost:8545";

    default:
      return "";
  }
};

export const CHAIN_CONFIG = {
  [CHAIN_IDS.ETHEREUM]: {
    id: CHAIN_IDS.ETHEREUM,
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
    rpcUrl: getChainRpcUrl(CHAIN_IDS.ETHEREUM),
    blockExplorer: "https://etherscan.io",
    color: "#627EEA",
  },

  [CHAIN_IDS.POLYGON]: {
    id: CHAIN_IDS.POLYGON,
    name: "Polygon",
    symbol: "MATIC",
    decimals: 18,
    rpcUrl: getChainRpcUrl(CHAIN_IDS.POLYGON),
    blockExplorer: "https://polygonscan.com",
    color: "#8247E5",
  },

  [CHAIN_IDS.BSC]: {
    id: CHAIN_IDS.BSC,
    name: "Binance Smart Chain",
    symbol: "BNB",
    decimals: 18,
    rpcUrl: getChainRpcUrl(CHAIN_IDS.BSC),
    blockExplorer: "https://bscscan.com",
    color: "#F3BA2F",
  },

  [CHAIN_IDS.FOUNDRY]: {
    id: CHAIN_IDS.FOUNDRY,
    name: "Foundry (Local)",
    symbol: "ETH",
    decimals: 18,
    rpcUrl: getChainRpcUrl(CHAIN_IDS.FOUNDRY),
    blockExplorer: "http://localhost:8545",
    color: "#000000",
  },
} as const;

export const DEFAULT_CHAIN_ID: ChainId = CHAIN_IDS.ETHEREUM;

export const isChainId = (value: number): value is ChainId =>
  value in CHAIN_CONFIG;

export const toChainId = (value: number): ChainId | null =>
  isChainId(value) ? value : null;