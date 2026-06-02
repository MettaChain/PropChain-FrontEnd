import {
  formatAddress,
  parseBalance,
  formatBalanceForDisplay,
  fetchWalletBalance,
  updateWalletBalance,
  disconnectWallet,
} from '../walletHelpers';

// ============================================================================
// formatAddress
// ============================================================================

describe('formatAddress', () => {
  it('should truncate a long Ethereum address with ellipsis', () => {
    const address = '0x1234567890abcdef1234567890abcdef12345678';
    expect(formatAddress(address)).toBe('0x1234...5678');
  });

  it('should return short addresses unchanged', () => {
    const short = '0x1234';
    expect(formatAddress(short)).toBe('0x1234');
  });

  it('should handle addresses exactly at the boundary length', () => {
    // 6 + 4 = 10 chars (the boundary)
    const boundary = '0x12345678';
    expect(formatAddress(boundary)).toBe('0x12345678');
  });

  it('should handle addresses just above the boundary length', () => {
    // 11 chars — should be truncated
    const justAbove = '0x123456789';
    // First 6 chars: '0x1234', last 4 chars: '6789'
    expect(formatAddress(justAbove)).toBe('0x1234...6789');
  });

  it('should handle empty string', () => {
    expect(formatAddress('')).toBe('');
  });
});

// ============================================================================
// parseBalance
// ============================================================================

describe('parseBalance', () => {
  it('should convert wei to ETH with default 4 decimals', () => {
    // 1 ETH = 10^18 wei
    const oneEth = '1000000000000000000';
    expect(parseBalance(oneEth)).toBe('1.0000');
  });

  it('should handle zero wei', () => {
    expect(parseBalance('0')).toBe('0.0000');
  });

  it('should handle fractional ETH values', () => {
    // 0.5 ETH
    const halfEth = '500000000000000000';
    expect(parseBalance(halfEth)).toBe('0.5000');
  });

  it('should respect the decimals parameter', () => {
    const oneEth = '1000000000000000000';
    expect(parseBalance(oneEth, 2)).toBe('1.00');
  });

  it('should handle small wei amounts that round to zero', () => {
    const oneWei = '1';
    expect(parseBalance(oneWei)).toBe('0.0000');
  });

  it('should return "0.0000" for invalid input', () => {
    expect(parseBalance('not-a-number')).toBe('0.0000');
  });

  it('should handle large ETH amounts', () => {
    // 1000 ETH
    const thousandEth = '1000000000000000000000';
    expect(parseBalance(thousandEth)).toBe('1000.0000');
  });
});

// ============================================================================
// formatBalanceForDisplay
// ============================================================================

describe('formatBalanceForDisplay', () => {
  it('should format balance with default 3 decimals', () => {
    expect(formatBalanceForDisplay('1.2345678')).toBe('1.235');
  });

  it('should format balance with custom decimals', () => {
    expect(formatBalanceForDisplay('1.2345678', 2)).toBe('1.23');
  });

  it('should handle zero', () => {
    expect(formatBalanceForDisplay('0')).toBe('0.000');
  });

  it('should handle NaN gracefully', () => {
    expect(formatBalanceForDisplay('not-a-number')).toBe('0.000');
  });

  it('should round up correctly', () => {
    expect(formatBalanceForDisplay('1.9999', 2)).toBe('2.00');
  });
});

// ============================================================================
// fetchWalletBalance
// ============================================================================

describe('fetchWalletBalance', () => {
  const mockAddress = '0x1234567890abcdef1234567890abcdef12345678';
  const mockBalanceWei = '1000000000000000000'; // 1 ETH

  it('should fetch and return balance successfully', async () => {
    const requestMock = jest.fn().mockResolvedValue(mockBalanceWei);
    const mockProvider = { request: requestMock };

    const result = await fetchWalletBalance(mockProvider as any, mockAddress);

    expect(result).not.toBeNull();
    expect(result!.raw).toBe(mockBalanceWei);
    expect(result!.formatted).toBe('1.0000');
    expect(requestMock).toHaveBeenCalledWith({
      method: 'eth_getBalance',
      params: [mockAddress, 'latest'],
    });
  });

  it('should return null when no provider is available', async () => {
    const result = await fetchWalletBalance(undefined, mockAddress);
    expect(result).toBeNull();
  });

  it('should return null when provider request fails', async () => {
    const mockProvider = {
      request: jest.fn().mockRejectedValue(new Error('User rejected')),
    };

    const result = await fetchWalletBalance(mockProvider as any, mockAddress);
    expect(result).toBeNull();
  });

  it('should return null when balance response is not a string', async () => {
    const mockProvider = {
      request: jest.fn().mockResolvedValue(12345),
    };

    const result = await fetchWalletBalance(mockProvider as any, mockAddress);
    expect(result).toBeNull();
  });
});

// ============================================================================
// updateWalletBalance
// ============================================================================

describe('updateWalletBalance', () => {
  const mockAddress = '0x1234567890abcdef1234567890abcdef12345678';

  it('should set balance in store when fetch succeeds', async () => {
    const mockProvider = {
      request: jest.fn().mockResolvedValue('1000000000000000000'),
    };

    const setBalance = jest.fn();

    await updateWalletBalance(mockProvider as any, mockAddress, setBalance);

    expect(setBalance).toHaveBeenCalledWith('1.0000');
  });

  it('should not set balance when fetch fails', async () => {
    const mockProvider = {
      request: jest.fn().mockRejectedValue(new Error('RPC error')),
    };

    const setBalance = jest.fn();

    await updateWalletBalance(mockProvider as any, mockAddress, setBalance);

    expect(setBalance).not.toHaveBeenCalled();
  });

  it('should not set balance when no provider', async () => {
    const setBalance = jest.fn();
    await updateWalletBalance(undefined, mockAddress, setBalance);
    expect(setBalance).not.toHaveBeenCalled();
  });
});

// ============================================================================
// disconnectWallet
// ============================================================================

describe('disconnectWallet', () => {
  it('should call setDisconnected and clearError', () => {
    const setDisconnected = jest.fn();
    const clearError = jest.fn();

    disconnectWallet(setDisconnected, clearError);

    expect(setDisconnected).toHaveBeenCalledTimes(1);
    expect(clearError).toHaveBeenCalledTimes(1);
  });
});
