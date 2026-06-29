import { Page } from '@playwright/test';

export interface EthereumMockOptions {
  address?: string;
  chainId?: string;
  balance?: string;
  shouldReject?: boolean;
  isMetaMask?: boolean;
}

const DEFAULT_ADDRESS = '0x1234567890123456789012345678901234567890';
const DEFAULT_CHAIN_ID = '0x1';
const DEFAULT_BALANCE = '0x56BC75E2D630E8000'; // 100 ETH in wei

interface InitArg {
  addr: string;
  cId: string;
  bal: string;
  reject: boolean;
  metaMask: boolean;
}

export async function setupWalletMock(page: Page, options: EthereumMockOptions = {}) {
  const {
    address = DEFAULT_ADDRESS,
    chainId = DEFAULT_CHAIN_ID,
    balance = DEFAULT_BALANCE,
    shouldReject = false,
    isMetaMask = true,
  } = options;

  await page.addInitScript((arg: InitArg) => {
    (window as any).ethereum = {
      isMetaMask: arg.metaMask,
      request: async ({ method }: { method: string }) => {
        if (method === 'eth_requestAccounts') {
          if (arg.reject) {
            throw new Error('User rejected the request');
          }
          return [arg.addr];
        }
        if (method === 'eth_chainId') {
          return arg.cId;
        }
        if (method === 'eth_getBalance') {
          return arg.bal;
        }
        if (method === 'eth_sendTransaction') {
          if (arg.reject) {
            throw new Error('User rejected the transaction');
          }
          const hex = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
          return '0x' + hex;
        }
        if (method === 'wallet_switchEthereumChain') {
          return null;
        }
        return null;
      },
      on: () => {},
      removeListener: () => {},
      isConnected: () => !arg.reject,
    };
  }, { addr: address, cId: chainId, bal: balance, reject: shouldReject, metaMask: isMetaMask });
}
