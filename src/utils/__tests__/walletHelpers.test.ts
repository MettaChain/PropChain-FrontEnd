import { describe, it, expect } from 'vitest';
import { assertValidAddress, fetchWalletBalance } from '@/utils/walletHelpers';

describe('assertValidAddress', () => {
  // EIP-55 valid checksummed addresses
  const validChecksummed = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45';
  const anotherValid = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';

  it('returns checksummed address for valid EIP-55 address', () => {
    const result = assertValidAddress(validChecksummed);
    expect(result).toBe(validChecksummed);
  });

  it('returns checksummed address for another valid EIP-55 address', () => {
    const result = assertValidAddress(anotherValid);
    expect(result).toBe(anotherValid);
  });

  it('normalizes and returns checksummed address for mixed-case input', () => {
    // The viem getAddress will checksum and return the correct address
    const mixedCase = '0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed';
    const result = assertValidAddress(mixedCase);
    expect(result).toBe(anotherValid);
  });

  it('throws for empty address', () => {
    expect(() => assertValidAddress('')).toThrow('Wallet address is required');
    expect(() => assertValidAddress('   ')).toThrow('Wallet address is required');
  });

  it('throws for invalid address format', () => {
    expect(() => assertValidAddress('not-an-address')).toThrow(
      'Invalid wallet address format'
    );
  });

  it('throws for too-short address', () => {
    expect(() => assertValidAddress('0x123')).toThrow(
      'Invalid wallet address format'
    );
  });

  it('throws for too-long address', () => {
    const longAddr = '0x' + '1'.repeat(41);
    expect(() => assertValidAddress(longAddr)).toThrow(
      'Invalid wallet address format'
    );
  });

  it('accepts all-lowercase valid address', () => {
    const lowercase = validChecksummed.toLowerCase();
    const result = assertValidAddress(lowercase);
    // getAddress should return the checksummed version
    expect(result).toBe(validChecksummed);
  });

  it('throws for adversarial addresses with invalid checksum', () => {
    // Slightly altered checksum - one character changed
    const tampered = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db46';
    expect(() => assertValidAddress(tampered)).toThrow(
      'Invalid wallet address checksum'
    );
  });

  it('handles whitespace trimming', () => {
    const padded = `  ${validChecksummed}  `;
    const result = assertValidAddress(padded);
    expect(result).toBe(validChecksummed);
  });

  it('rejects non-hex addresses', () => {
    expect(() => assertValidAddress('0xGGGGZZZZGGGGZZZZGGGGZZZZGGGGZZZZGGGGZZZZ')).toThrow(
      'Invalid wallet address format'
    );
  });

  it('rejects address missing 0x prefix', () => {
    const noPrefix = '742d35Cc6634C0532925a3b8D4C9db96C4b4Db45';
    expect(() => assertValidAddress(noPrefix)).toThrow(
      'Invalid wallet address format'
    );
  });
});

describe('fetchWalletBalance', () => {
  it('validates address before any provider call', async () => {
    // fetchWalletBalance should throw on invalid address immediately
    await expect(fetchWalletBalance('')).rejects.toThrow('Wallet address is required');
    await expect(fetchWalletBalance('invalid')).rejects.toThrow(
      'Invalid wallet address format'
    );
  });

  it('throws on invalid checksum address', async () => {
    // Invalid checksum should be rejected before provider call
    const tampered = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db46';
    await expect(fetchWalletBalance(tampered)).rejects.toThrow(
      'Invalid wallet address checksum'
    );
  });
});
