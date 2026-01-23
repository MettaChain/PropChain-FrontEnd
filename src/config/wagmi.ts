import { http, createConfig } from 'wagmi';
import { mainnet, polygon, bsc } from 'wagmi/chains';
import { injected, walletConnect } from '@wagmi/connectors';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

export const config = createConfig({
  chains: [mainnet, polygon, bsc],
  connectors: [
    injected(),
    walletConnect({
      projectId,
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [bsc.id]: http(),
  },
});