import { renderHook, waitFor } from '@testing-library/react';
import { useSafeInfo } from '../useSafeInfo';

const mockGetBytecode = jest.fn();
const mockSafeCreate = jest.fn();

jest.mock('viem', () => ({
  createPublicClient: jest.fn(() => ({ getBytecode: (...args: unknown[]) => mockGetBytecode(...args) })),
  http: jest.fn(),
}));

jest.mock('viem/chains', () => ({
  mainnet: {},
}));

jest.mock('ethers', () => ({
  providers: {
    Web3Provider: jest.fn(() => ({ getSigner: () => ({}) })),
  },
}));

jest.mock('@safe-global/protocol-kit', () => ({
  EthersAdapter: jest.fn(() => ({})),
  default: { create: (...args: unknown[]) => mockSafeCreate(...args) },
}));

jest.mock('@/utils/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

// Master copy address used by the hook, lowercased hex without 0x prefix.
const MASTER_COPY_HEX = '6851d6f8adc5e91a94aab91f358a4f3d4293504a';

const mockSafeSdk = {
  getOwners: jest.fn().mockResolvedValue(['0xOwner1', '0xOwner2']),
  getThreshold: jest.fn().mockResolvedValue(2),
  getPendingTransactions: jest.fn().mockResolvedValue([]),
  getContractVersion: jest.fn().mockResolvedValue('1.3.0'),
};

describe('useSafeInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSafeCreate.mockResolvedValue(mockSafeSdk);
  });

  it('starts in the loading state while checking', () => {
    mockGetBytecode.mockResolvedValue('0x1234');
    const { result } = renderHook(() => useSafeInfo('0xabc...123'));

    expect(result.current.loading).toBe(true);
    expect(result.current.isSafe).toBe(false);
    expect(result.current.safeInfo).toBeNull();
  });

  it('stops loading immediately when no address is provided', async () => {
    const { result } = renderHook(() => useSafeInfo(undefined));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isSafe).toBe(false);
    expect(result.current.safeInfo).toBeNull();
    expect(mockGetBytecode).not.toHaveBeenCalled();
  });

  it('reports a non-safe address when the bytecode does not match a Safe master copy', async () => {
    mockGetBytecode.mockResolvedValue('0x0000000000000000000000000000000000000000');
    const { result } = renderHook(() => useSafeInfo('0xabc...123'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isSafe).toBe(false);
    expect(result.current.safeInfo).toBeNull();
  });

  it('loads safe info when the address holds a Safe master copy', async () => {
    mockGetBytecode.mockResolvedValue(`0x${MASTER_COPY_HEX}00`);
    const { result } = renderHook(() => useSafeInfo('0xabc...123'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isSafe).toBe(true);
    expect(result.current.safeInfo).not.toBeNull();
    expect(result.current.safeInfo.owners).toEqual(['0xOwner1', '0xOwner2']);
    expect(result.current.safeInfo.threshold).toBe(2);
    expect(result.current.safeInfo.version).toBe('1.3.0');
  });

  it('handles lookup errors gracefully', async () => {
    mockGetBytecode.mockRejectedValue(new Error('RPC unavailable'));
    const { result } = renderHook(() => useSafeInfo('0xabc...123'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isSafe).toBe(false);
    expect(result.current.safeInfo).toBeNull();
  });
});
