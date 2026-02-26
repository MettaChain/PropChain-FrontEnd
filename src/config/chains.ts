import {mainnet, polygon, bsc} from "wagmi/chains";
import {getRpcUrl} from "./env";

export const SUPPORTED_CHAINS = [mainnet, polygon, bsc];

/**
 * Get RPC URL for a chain, falling back to defaults if env var is not set
 */
const getChainRpcUrl = (chainId: number): string => {
  switch (chainId) {
    case 1:
      return getRpcUrl("ethereum") ?? "https://mainnet.infura.io/v3/";
    case 137:
      return getRpcUrl("polygon") ?? "https://polygon-rpc.com";
    case 56:
      return getRpcUrl("bsc") ?? "https://bsc-dataseed1.binance.org";
    default:
      return "";
  }
};

export const CHAIN_CONFIG = {
  1: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
    rpcUrl: getChainRpcUrl(1),
    blockExplorer: "https://etherscan.io",
    color: "#627EEA",
  },
  137: {
    name: "Polygon",
    symbol: "MATIC",
    decimals: 18,
    rpcUrl: getChainRpcUrl(137),
    blockExplorer: "https://polygonscan.com",
    color: "#8247E5",
  },
  56: {
    name: "Binance Smart Chain",
    symbol: "BNB",
    decimals: 18,
    rpcUrl: getChainRpcUrl(56),
    blockExplorer: "https://bscscan.com",
    color: "#F3BA2F",
  },
} as const;

export type ChainId = keyof typeof CHAIN_CONFIG;

export const DEFAULT_CHAIN_ID: ChainId = 1;

export const isChainId = (value: number): value is ChainId =>
  value in CHAIN_CONFIG;

export const toChainId = (value: number): ChainId | null =>
  isChainId(value) ? value : null;
