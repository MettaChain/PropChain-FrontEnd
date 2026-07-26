import { getAddress, isAddress, formatEther } from 'viem';
import { logger } from '@/utils/logger';
import { publicClient } from '@/lib/viem-client';
import { useWalletStore } from '@/store/walletStore';

/**
 * Validates and normalizes an Ethereum wallet address using EIP-55 checksum.
 * Uses viem's getAddress which throws on invalid checksummed addresses.
 * Returns the checksummed address on success.
 *
 * @param addr - The address string to validate
 * @returns The checksummed address
 * @throws Error with a user-safe message if the address is invalid
 */
export function assertValidAddress(addr: string): string {
  const trimmed = addr.trim();

  if (!trimmed) {
    throw new Error('Wallet address is required');
  }

  if (!isAddress(trimmed)) {
    throw new Error('Invalid wallet address format. Please check the address and try again.');
  }

  try {
    // getAddress validates EIP-55 checksum and normalizes the address
    const checksummed = getAddress(trimmed);
    return checksummed;
  } catch {
    logger.warn('Failed to parse balance');
    return '0.0000';
  }
}

/**
 * Fetches the balance for a wallet address after validating it.
 * The address is checksum-validated before any provider call.
 *
 * @param address - The wallet address to look up
 * @returns The balance as a bigint
 */
export async function fetchWalletBalance(address: string): Promise<bigint> {
  const validatedAddress = assertValidAddress(address);

  try {
    const balance = await publicClient.getBalance({ address: validatedAddress as `0x${string}` });
    return balance;
  } catch (error) {
    logger.error('Failed to fetch wallet balance:', error);
    throw new Error('Unable to fetch wallet balance. Please try again later.');
  }
}

/**
 * Formats a wallet address for display: 0x1234...5678
 */
export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Formats a balance string/number/bigint for display.
 */
export function formatBalanceForDisplay(balance: string | number | bigint, decimals: number = 3): string {
  if (balance === undefined || balance === null) return '0.000';
  const num = Number(balance);
  return num.toFixed(decimals);
}

/**
 * Disconnects the wallet in the store.
 */
export function disconnectWallet(): void {
  useWalletStore.getState().setDisconnected();
}

/**
 * Fetches and updates the balance in the store.
 */
export async function updateWalletBalance(
  provider: any,
  address: string,
  setBalance: (balance: string) => void
): Promise<void> {
  try {
    const rawBalance = await fetchWalletBalance(address);
    const formatted = formatEther(rawBalance);
    setBalance(formatted);
  } catch (error) {
    logger.error('Failed to update wallet balance:', error);
    setBalance('0.000');
  }
}
