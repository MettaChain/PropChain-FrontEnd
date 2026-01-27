/**
 * Blockchain Network Configuration
 * Supported chains for PropChain platform
 */


import { mainnet, polygon, bsc } from 'wagmi/chains';

export const SUPPORTED_CHAINS = [mainnet, polygon, bsc];

export const CHAIN_CONFIG = {
  1: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://mainnet.infura.io/v3/',
    blockExplorer: 'https://etherscan.io',
    color: '#627EEA',
  },
  137: {
    name: 'Polygon',
    symbol: 'MATIC',
    decimals: 18,
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    color: '#8247E5',
  },
  56: {
    name: 'Binance Smart Chain',
    symbol: 'BNB',
    decimals: 18,
    rpcUrl: 'https://bsc-dataseed1.binance.org',
    blockExplorer: 'https://bscscan.com',
    color: '#F3BA2F',
  },
} as const;

export type ChainId = keyof typeof CHAIN_CONFIG;

export const DEFAULT_CHAIN_ID: ChainId = 1;
