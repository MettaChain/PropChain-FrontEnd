import { renderHook, act } from '@testing-library/react';
import { useSecurity } from '../useSecurity';

jest.mock('@/utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('@/store/walletStore', () => ({
  useWalletStore: jest.fn(),
}));

jest.mock('@/utils/security/auditLogger', () => ({
  auditLogger: {
    logWalletConnection: jest.fn(),
    logTransactionSigning: jest.fn(),
    logSignatureRequest: jest.fn(),
    logWalletDisconnection: jest.fn(),
    logNetworkSwitch: jest.fn(),
    getSecurityAlerts: jest.fn().mockReturnValue([]),
  },
}));

jest.mock('@/utils/security/transactionMonitor', () => ({
  transactionMonitor: {
    addTransaction: jest.fn(),
    getWalletMetrics: jest.fn().mockReturnValue(null),
    getWalletAnomalies: jest.fn().mockReturnValue([]),
    getRiskAssessment: jest.fn().mockReturnValue({
      riskScore: 0,
      factors: [],
      recommendations: [],
    }),
  },
}));

jest.mock('@/utils/security/blockchainSecurity', () => ({
  blockchainSecurity: {
    checkAddressRisk: jest.fn().mockResolvedValue({ riskLevel: 'low', riskScore: 10 }),
    validateTransaction: jest.fn().mockResolvedValue({
      riskScore: 10,
      warnings: [],
      blocks: [],
    }),
  },
}));

jest.mock('@/utils/security/rateLimiter', () => {
  const checkFn = jest.fn().mockReturnValue({
    allowed: true,
    remainingAttempts: 5,
    retryAfter: undefined,
  });
  return {
    RateLimiter: {
      getInstance: jest.fn().mockReturnValue({ check: checkFn }),
    },
    RateLimiters: {
      WALLET_CONNECTION: { maxAttempts: 5, windowMs: 300000 },
      TRANSACTION_SIGNING: { maxAttempts: 10, windowMs: 60000 },
      SIGNATURE_REQUESTS: { maxAttempts: 3, windowMs: 60000 },
    },
    __mockCheck: checkFn,
  };
});

jest.mock('@/utils/security/walletValidator', () => ({
  WalletValidator: {
    verifyDomain: jest.fn().mockReturnValue({
      isVerified: true,
      warnings: [],
    }),
    validateWalletConnection: jest.fn().mockResolvedValue({
      isValid: true,
      warnings: [],
      errors: [],
    }),
    validateTransaction: jest.fn().mockReturnValue({
      isValid: true,
      warnings: [],
      errors: [],
      riskScore: 0,
    }),
  },
}));

jest.mock('@/utils/security/phishingProtection', () => ({
  PhishingProtection: {
    detectPhishing: jest.fn().mockReturnValue({
      isPhishing: false,
      warnings: [],
    }),
    validateTransactionData: jest.fn().mockReturnValue({
      isMalicious: false,
      warnings: [],
    }),
    validateSignature: jest.fn().mockResolvedValue({
      isValid: true,
      isMalicious: false,
      warnings: [],
    }),
    createSecureSignatureRequest: jest.fn().mockReturnValue({
      safeMessage: 'safe message',
      warnings: [],
    }),
  },
}));

import { useWalletStore } from '@/store/walletStore';
import { auditLogger } from '@/utils/security/auditLogger';
import { transactionMonitor } from '@/utils/security/transactionMonitor';
import { blockchainSecurity } from '@/utils/security/blockchainSecurity';
import { WalletValidator } from '@/utils/security/walletValidator';
import { PhishingProtection } from '@/utils/security/phishingProtection';
import { RateLimiter } from '@/utils/security/rateLimiter';

const mockUseWalletStore = useWalletStore as jest.MockedFunction<
  typeof useWalletStore
>;

const setupWalletStore = (
  overrides: Partial<ReturnType<typeof useWalletStore>> = {},
) => {
  const defaults = {
    address: '0x1234567890123456789012345678901234567890',
    isConnected: true,
    chainId: 1,
  };
  mockUseWalletStore.mockReturnValue({ ...defaults, ...overrides } as any);
};

describe('useSecurity', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setupWalletStore();

    (auditLogger.getSecurityAlerts as jest.Mock).mockReturnValue([]);
    (transactionMonitor.getWalletMetrics as jest.Mock).mockReturnValue(null);
    (transactionMonitor.getWalletAnomalies as jest.Mock).mockReturnValue([]);
    (transactionMonitor.getRiskAssessment as jest.Mock).mockReturnValue({
      riskScore: 0,
      factors: [],
      recommendations: [],
    });
    (blockchainSecurity.checkAddressRisk as jest.Mock).mockResolvedValue({
      riskLevel: 'low',
      riskScore: 10,
    });
    (blockchainSecurity.validateTransaction as jest.Mock).mockResolvedValue({
      riskScore: 10,
      warnings: [],
      blocks: [],
    });
    (RateLimiter.getInstance as jest.Mock).mockReturnValue({
      check: jest.fn().mockReturnValue({
        allowed: true,
        remainingAttempts: 5,
        retryAfter: undefined,
      }),
    });
    (WalletValidator.verifyDomain as jest.Mock).mockReturnValue({
      isVerified: true,
      warnings: [],
    });
    (WalletValidator.validateWalletConnection as jest.Mock).mockResolvedValue({
      isValid: true,
      warnings: [],
      errors: [],
    });
    (WalletValidator.validateTransaction as jest.Mock).mockReturnValue({
      isValid: true,
      warnings: [],
      errors: [],
      riskScore: 0,
    });
    (PhishingProtection.detectPhishing as jest.Mock).mockReturnValue({
      isPhishing: false,
      warnings: [],
    });
    (PhishingProtection.validateTransactionData as jest.Mock).mockReturnValue({
      isMalicious: false,
      warnings: [],
    });
    (PhishingProtection.validateSignature as jest.Mock).mockResolvedValue({
      isValid: true,
      isMalicious: false,
      warnings: [],
    });
    (PhishingProtection.createSecureSignatureRequest as jest.Mock).mockReturnValue(
      {
        safeMessage: 'safe message',
        warnings: [],
      },
    );
  });

  it('returns initial security state with isSecure true', () => {
    const { result } = renderHook(() => useSecurity());

    expect(result.current.securityState.isSecure).toBe(true);
    expect(result.current.securityState.riskScore).toBe(0);
    expect(result.current.securityState.warnings).toEqual([]);
    expect(result.current.securityState.alerts).toEqual([]);
  });

  it('validateWalletConnection returns valid when all checks pass', async () => {
    const { result } = renderHook(() => useSecurity());

    const response = await result.current.validateWalletConnection(
      '0x1234567890123456789012345678901234567890',
      'metamask',
      1,
    );

    expect(response.isValid).toBe(true);
    expect(response.blocks).toEqual([]);
  });

  it('validateWalletConnection blocks on rate limit', async () => {
    (RateLimiter.getInstance as jest.Mock).mockReturnValue({
      check: jest.fn().mockReturnValue({
        allowed: false,
        remainingAttempts: 0,
        retryAfter: 60,
      }),
    });

    const { result } = renderHook(() => useSecurity());

    const response = await result.current.validateWalletConnection(
      '0x1234567890123456789012345678901234567890',
      'metamask',
      1,
    );

    expect(response.isValid).toBe(false);
    expect(response.blocks.some((b) => b.includes('Rate limit'))).toBe(true);
  });

  it('validateWalletConnection blocks on blacklisted domain', async () => {
    (WalletValidator.verifyDomain as jest.Mock).mockReturnValue({
      isVerified: false,
      warnings: ['Domain is blacklisted for security reasons'],
    });

    const { result } = renderHook(() => useSecurity());

    const response = await result.current.validateWalletConnection(
      '0x1234567890123456789012345678901234567890',
      'metamask',
      1,
    );

    expect(response.blocks.some((b) => b.includes('blacklisted'))).toBe(true);
  });

  it('validateWalletConnection blocks on critical address risk', async () => {
    (blockchainSecurity.checkAddressRisk as jest.Mock).mockResolvedValue({
      riskLevel: 'critical',
      riskScore: 90,
    });

    const { result } = renderHook(() => useSecurity());

    const response = await result.current.validateWalletConnection(
      '0x1234567890123456789012345678901234567890',
      'metamask',
      1,
    );

    expect(response.blocks.some((b) => b.includes('critical'))).toBe(true);
  });

  it('validateWalletConnection blocks on phishing detection', async () => {
    (PhishingProtection.detectPhishing as jest.Mock).mockReturnValue({
      isPhishing: true,
      warnings: [],
    });

    const { result } = renderHook(() => useSecurity());

    const response = await result.current.validateWalletConnection(
      '0x1234567890123456789012345678901234567890',
      'metamask',
      1,
    );

    expect(response.blocks.some((b) => b.includes('Phishing'))).toBe(true);
  });

  it('validateWalletConnection returns valid false on error', async () => {
    (WalletValidator.validateWalletConnection as jest.Mock).mockRejectedValue(
      new Error('test error'),
    );

    const { result } = renderHook(() => useSecurity());

    const response = await result.current.validateWalletConnection(
      '0x1234567890123456789012345678901234567890',
      'metamask',
      1,
    );

    expect(response.isValid).toBe(false);
  });

  it('validateTransaction returns valid false when wallet not connected', async () => {
    setupWalletStore({ address: null, isConnected: false });

    const { result } = renderHook(() => useSecurity());

    const response = await result.current.validateTransaction(
      '0xabcdef',
      '1000',
      '0x',
    );

    expect(response.isValid).toBe(false);
    expect(response.blocks).toContain('Wallet must be connected');
  });

  it('validateTransaction blocks on rate limit', async () => {
    (RateLimiter.getInstance as jest.Mock).mockReturnValue({
      check: jest.fn().mockReturnValue({
        allowed: false,
        remainingAttempts: 0,
        retryAfter: 60,
      }),
    });

    const { result } = renderHook(() => useSecurity());

    const response = await result.current.validateTransaction(
      '0xabcdef0000000000000000000000000000000000',
      '1000',
      '0x',
    );

    expect(response.isValid).toBe(false);
    expect(response.blocks.some((b) => b.includes('rate limit'))).toBe(true);
  });

  it('validateTransaction sets requiresConfirmation for high risk', async () => {
    (WalletValidator.validateTransaction as jest.Mock).mockReturnValue({
      isValid: true,
      warnings: ['High value transaction: 1.5 ETH'],
      errors: [],
      riskScore: 50,
    });

    const { result } = renderHook(() => useSecurity());

    const response = await result.current.validateTransaction(
      '0x1234567890123456789012345678901234567890',
      '1000',
      '0x',
    );

    expect(response.requiresConfirmation).toBe(true);
  });

  it('validateTransaction blocks on malicious transaction data', async () => {
    (PhishingProtection.validateTransactionData as jest.Mock).mockReturnValue({
      isMalicious: true,
      warnings: [],
    });

    const { result } = renderHook(() => useSecurity());

    const response = await result.current.validateTransaction(
      '0x1234567890123456789012345678901234567890',
      '1000',
      '0xa9059cbb000000000000000000000000abcdef1234567890abcdef1234567890',
    );

    expect(response.blocks.some((b) => b.includes('malicious') || b.includes('Suspicious'))).toBe(true);
  });

  it('validateSignature returns valid false when wallet not connected', async () => {
    setupWalletStore({ address: null, isConnected: false });

    const { result } = renderHook(() => useSecurity());

    const response = await result.current.validateSignature('test message');

    expect(response.isValid).toBe(false);
    expect(response.blocks).toContain('Wallet must be connected');
  });

  it('validateSignature blocks on rate limit', async () => {
    (RateLimiter.getInstance as jest.Mock).mockReturnValue({
      check: jest.fn().mockReturnValue({
        allowed: false,
        remainingAttempts: 0,
        retryAfter: 60,
      }),
    });

    const { result } = renderHook(() => useSecurity());

    const response = await result.current.validateSignature('test message');

    expect(response.isValid).toBe(false);
    expect(response.blocks.some((b) => b.includes('rate limit'))).toBe(true);
  });

  it('validateSignature validates signature when provided', async () => {
    (PhishingProtection.validateSignature as jest.Mock).mockResolvedValue({
      isValid: true,
      isMalicious: false,
      warnings: [],
    });

    const { result } = renderHook(() => useSecurity());

    const response = await result.current.validateSignature(
      'test message',
      '0xsignature',
    );

    expect(response.isValid).toBe(true);
    expect(PhishingProtection.validateSignature).toHaveBeenCalledWith(
      'test message',
      '0xsignature',
      '0x1234567890123456789012345678901234567890',
    );
  });

  it('monitorTransaction calls transactionMonitor.addTransaction', () => {
    const { result } = renderHook(() => useSecurity());

    result.current.monitorTransaction(
      '0xhash',
      '0xto',
      '1000',
      '21000',
      '20000000000',
    );

    expect(transactionMonitor.addTransaction).toHaveBeenCalledWith(
      '0x1234567890123456789012345678901234567890',
      expect.objectContaining({
        hash: '0xhash',
        to: '0xto',
        value: '1000',
      }),
    );
  });

  it('getRiskAssessment returns null when no address', () => {
    setupWalletStore({ address: null, isConnected: false });

    const { result } = renderHook(() => useSecurity());

    expect(result.current.getRiskAssessment()).toBeNull();
  });

  it('getRiskAssessment returns metrics and anomalies', () => {
    const mockMetrics = { totalTransactions: 5 };
    const mockAnomalies = [{ type: 'high_value' }];
    (transactionMonitor.getWalletMetrics as jest.Mock).mockReturnValue(
      mockMetrics,
    );
    (transactionMonitor.getWalletAnomalies as jest.Mock).mockReturnValue(
      mockAnomalies,
    );

    const { result } = renderHook(() => useSecurity());

    const assessment = result.current.getRiskAssessment();
    expect(assessment).not.toBeNull();
    expect(assessment!.metrics).toEqual(mockMetrics);
    expect(assessment!.anomalies).toEqual(mockAnomalies);
  });

  it('handleWalletDisconnection logs disconnection', () => {
    const { result } = renderHook(() => useSecurity());

    result.current.handleWalletDisconnection();

    expect(auditLogger.logWalletDisconnection).toHaveBeenCalledWith(
      '0x1234567890123456789012345678901234567890',
    );
  });

  it('handleNetworkSwitch logs network switch', () => {
    const { result } = renderHook(() => useSecurity());

    result.current.handleNetworkSwitch(1, 137);

    expect(auditLogger.logNetworkSwitch).toHaveBeenCalledWith(
      1,
      137,
      '0x1234567890123456789012345678901234567890',
    );
  });

  it('updateSecurityState updates rate limit status', () => {
    const checkMock = jest.fn().mockReturnValue({
      allowed: true,
      remainingAttempts: 3,
      retryAfter: undefined,
    });
    (RateLimiter.getInstance as jest.Mock).mockReturnValue({
      check: checkMock,
    });

    const { result } = renderHook(() => useSecurity());

    act(() => {
      result.current.updateSecurityState();
    });

    expect(checkMock).toHaveBeenCalled();
    expect(result.current.securityState.rateLimitStatus).toBeDefined();
  });
});
