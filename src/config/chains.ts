/**
 * Blockchain Network Configuration
 * Supported chains for PropChain platform
 */

export interface ChainConfig {
  id: number;
  name: string;
  network: string;
  nativeCurrency: {
    decimals: number;
    name: string;
    symbol: string;
  };
  rpcUrls: {
    public: { http: string[] };
    default: { http: string[] };
  };
  blockExplorers: {
    default: { name: string; url: string };
  };
  testnet: boolean;
}

export const SUPPORTED_CHAINS: ChainConfig[] = [
  {
    id: 1,
    name: 'Ethereum',
    network: 'homestead',
    nativeCurrency: {
      decimals: 18,
      name: 'Ether',
      symbol: 'ETH',
    },
    rpcUrls: {
      public: { http: ['https://mainnet.infura.io/v3/'] },
      default: { http: ['https://mainnet.infura.io/v3/'] },
    },
    blockExplorers: {
      default: { name: 'Etherscan', url: 'https://etherscan.io' },
    },
    testnet: false,
  },
  {
    id: 137,
    name: 'Polygon',
    network: 'matic',
    nativeCurrency: {
      decimals: 18,
      name: 'MATIC',
      symbol: 'MATIC',
    },
    rpcUrls: {
      public: { http: ['https://polygon-rpc.com'] },
      default: { http: ['https://polygon-rpc.com'] },
    },
    blockExplorers: {
      default: { name: 'PolygonScan', url: 'https://polygonscan.com' },
    },
    testnet: false,
  },
  {
    id: 56,
    name: 'Binance Smart Chain',
    network: 'bsc',
    nativeCurrency: {
      decimals: 18,
      name: 'BNB',
      symbol: 'BNB',
    },
    rpcUrls: {
      public: { http: ['https://bsc-dataseed1.binance.org'] },
      default: { http: ['https://bsc-dataseed1.binance.org'] },
    },
    blockExplorers: {
      default: { name: 'BscScan', url: 'https://bscscan.com' },
    },
    testnet: false,
  },
];

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
