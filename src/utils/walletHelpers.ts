import { getAddress, isAddress } from 'viem';
import { logger } from '@/utils/logger';
import { publicClient } from '@/lib/viem-client';

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
    logger.warn('EIP-55 checksum validation failed for address:', { address: trimmed.slice(0, 6) + '...' });
    throw new Error(
      'Invalid wallet address checksum. Please verify the address is correct and try again.'
    );
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
