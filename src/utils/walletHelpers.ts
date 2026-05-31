import { logger } from './logger';
import type { WalletActions } from '@/store/walletStore';

// ============================================================================
// Types
// ============================================================================

export interface BalanceResult {
  /** Raw balance in wei as a string */
  raw: string;
  /** Balance formatted in ETH as a string */
  formatted: string;
}

// ============================================================================
// Constants
// ============================================================================

const WEI_DECIMALS = 18;
const ADDRESS_DISPLAY_PREFIX_LENGTH = 6;
const ADDRESS_DISPLAY_SUFFIX_LENGTH = 4;

// ============================================================================
// Address Formatting
// ============================================================================

/**
 * Formats an Ethereum wallet address for display by showing only the first
 * and last few characters with an ellipsis in between.
 *
 * @example
 * formatAddress('0x1234567890abcdef1234567890abcdef12345678')
 * // => '0x1234...5678'
 *
 * @param address - The full wallet address to format.
 * @returns The truncated address string, or the original input if it's too short.
 */
export const formatAddress = (address: string): string => {
  if (address.length <= ADDRESS_DISPLAY_PREFIX_LENGTH + ADDRESS_DISPLAY_SUFFIX_LENGTH) {
    return address;
  }
  return `${address.slice(0, ADDRESS_DISPLAY_PREFIX_LENGTH)}...${address.slice(-ADDRESS_DISPLAY_SUFFIX_LENGTH)}`;
};

// ============================================================================
// Balance Parsing
// ============================================================================

/**
 * Converts a raw wei balance string to a human-readable ETH balance.
 *
 * Uses BigInt arithmetic to avoid floating-point precision loss.
 *
 * @example
 * parseBalance('1000000000000000000') // '1.0000'
 *
 * @param wei - The raw wei balance as a string.
 * @param decimals - Number of decimal places to include (default: 4).
 * @returns The formatted ETH balance string.
 */
export const parseBalance = (wei: string, decimals: number = 4): string => {
  try {
    const weiBigInt = BigInt(wei);
    const divisor = BigInt(10 ** WEI_DECIMALS);
    const whole = weiBigInt / divisor;
    const remainder = weiBigInt % divisor;

    const remainderStr = remainder.toString().padStart(WEI_DECIMALS, '0').slice(0, decimals);
    return `${whole.toString()}.${remainderStr}`;
  } catch {
    return '0.0000';
  }
};

/**
 * Formats a balance string for display, trimming to a given number of decimals.
 *
 * @example
 * formatBalanceForDisplay('1.2345678', 3) // '1.234'
 *
 * @param balance - The balance string to format (e.g., '1.2345678').
 * @param decimals - Number of decimal places to keep (default: 3).
 * @returns The trimmed balance string.
 */
export const formatBalanceForDisplay = (balance: string, decimals: number = 3): string => {
  const num = parseFloat(balance);
  if (isNaN(num)) return '0.000';
  return num.toFixed(decimals);
};

// ============================================================================
// Balance Fetching
// ============================================================================

/**
 * Fetches the ETH balance for a given wallet address from the Ethereum provider.
 *
 * @param provider - The Ethereum provider (e.g., window.ethereum).
 * @param address - The wallet address to query.
 * @returns A BalanceResult with raw and formatted balance, or null on failure.
 */
export const fetchWalletBalance = async (
  provider: EthereumProvider | undefined,
  address: string,
): Promise<BalanceResult | null> => {
  if (!provider) {
    logger.warn('fetchWalletBalance: No Ethereum provider available');
    return null;
  }

  try {
    const balance = await provider.request<string>({
      method: 'eth_getBalance',
      params: [address, 'latest'],
    });

    if (typeof balance !== 'string') {
      throw new Error('Invalid balance response: expected string');
    }

    const formatted = parseBalance(balance);
    return { raw: balance, formatted };
  } catch (error) {
    logger.error('Failed to fetch wallet balance:', error);
    return null;
  }
};

/**
 * Updates the wallet balance in the wallet store by fetching from the provider.
 *
 * @param provider - The Ethereum provider.
 * @param address - The wallet address.
 * @param setBalance - The store's setBalance action.
 */
export const updateWalletBalance = async (
  provider: EthereumProvider | undefined,
  address: string,
  setBalance: WalletActions['setBalance'],
): Promise<void> => {
  const result = await fetchWalletBalance(provider, address);
  if (result) {
    setBalance(result.formatted);
  }
};

// ============================================================================
// Disconnect
// ============================================================================

/**
 * Disconnects the wallet and clears any errors from the store.
 *
 * @param setDisconnected - The store's setDisconnected action.
 * @param clearError - The store's clearError action.
 */
export const disconnectWallet = (
  setDisconnected: WalletActions['setDisconnected'],
  clearError: WalletActions['clearError'],
): void => {
  setDisconnected();
  clearError();
};

// ============================================================================
// Type re-export for convenience
// ============================================================================

export type { WalletActions };
