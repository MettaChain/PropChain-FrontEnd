import { createPublicClient, http, fallback } from 'viem';
import { mainnet, sepolia, polygon, polygonMumbai, bsc, bscTestnet } from 'viem/chains';

// Create a public client for blockchain interactions
export const publicClient = createPublicClient({
  chain: mainnet, // Default to mainnet, can be made configurable
  transport: fallback([
    http(),
    // Add additional RPC endpoints for redundancy
    http('https://eth-mainnet.g.alchemy.com/v2/demo'),
  ]),
});

// Chain-specific clients
export const clients = {
  mainnet: createPublicClient({
    chain: mainnet,
    transport: fallback([http(), http('https://eth-mainnet.g.alchemy.com/v2/demo')]),
  }),
  sepolia: createPublicClient({
    chain: sepolia,
    transport: fallback([http(), http('https://eth-sepolia.g.alchemy.com/v2/demo')]),
  }),
  polygon: createPublicClient({
    chain: polygon,
    transport: fallback([http(), http('https://polygon-mainnet.g.alchemy.com/v2/demo')]),
  }),
  polygonMumbai: createPublicClient({
    chain: polygonMumbai,
    transport: fallback([http(), http('https://polygon-mumbai.g.alchemy.com/v2/demo')]),
  }),
  bsc: createPublicClient({
    chain: bsc,
    transport: fallback([http(), http('https://bsc-dataseed.binance.org')]),
  }),
  bscTestnet: createPublicClient({
    chain: bscTestnet,
    transport: fallback([http(), http('https://data-seed-prebsc-1-s1.binance.org:8545')]),
  }),
};

// Helper function to get client for a specific chain
export function getClientForChain(chainId: number) {
  switch (chainId) {
    case 1:
      return clients.mainnet;
    case 11155111:
      return clients.sepolia;
    case 137:
      return clients.polygon;
    case 80001:
      return clients.polygonMumbai;
    case 56:
      return clients.bsc;
    case 97:
      return clients.bscTestnet;
    default:
      return publicClient; // fallback to mainnet
  }
}
