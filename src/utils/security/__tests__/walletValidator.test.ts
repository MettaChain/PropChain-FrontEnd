import { WalletValidator } from '../walletValidator';

// Mock viem functions
jest.mock('viem', () => ({
  isAddress: jest.fn(),
  getAddress: jest.fn(),
  formatEther: jest.fn(),
  parseEther: jest.fn(),
  isHex: jest.fn(),
  Hex: {} as any
}));

describe('WalletValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'localhost',
        protocol: 'http:'
      },
      writable: true
    });
  });

  describe('validateWalletConnection', () => {
    it('should validate a legitimate wallet connection', async () => {
      const { isAddress, getAddress } = require('viem');
      isAddress.mockReturnValue(true);
      getAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45');

      const result = await WalletValidator.validateWalletConnection(
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
        'metamask',
        1
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.riskScore).toBeLessThan(30);
    });

    it('should reject invalid address format', async () => {
      const { isAddress } = require('viem');
      isAddress.mockReturnValue(false);

      const result = await WalletValidator.validateWalletConnection(
        'invalid-address',
        'metamask',
        1
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid wallet address format');
      expect(result.riskScore).toBe(100);
    });

    it('should warn about checksum validation failure', async () => {
      const { isAddress, getAddress } = require('viem');
      isAddress.mockReturnValue(true);
      getAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45');

      const result = await WalletValidator.validateWalletConnection(
        '0x742d35cc6634c0532925a3b8d4c9db96c4b4db45', // lowercase
        'metamask',
        1
      );

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Address checksum validation failed');
      expect(result.riskScore).toBeGreaterThanOrEqual(10);
    });

    it('should reject unsupported chain IDs', async () => {
      const { isAddress, getAddress } = require('viem');
      isAddress.mockReturnValue(true);
      getAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45');

      const result = await WalletValidator.validateWalletConnection(
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
        'metamask',
        999
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid or unsupported chain ID');
      expect(result.riskScore).toBeGreaterThanOrEqual(25);
    });

    it('should warn about unrecognized wallet types', async () => {
      const { isAddress, getAddress } = require('viem');
      isAddress.mockReturnValue(true);
      getAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45');

      const result = await WalletValidator.validateWalletConnection(
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
        'unknown-wallet',
        1
      );

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Unrecognized wallet type');
      expect(result.riskScore).toBeGreaterThanOrEqual(15);
    });
  });

  describe('verifyDomain', () => {
    it('should verify trusted domains', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost', protocol: 'http:' },
        writable: true
      });

      const result = WalletValidator.verifyDomain();

      expect(result.isVerified).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should warn about untrusted domains', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'suspicious-site.com', protocol: 'https:' },
        writable: true
      });

      const result = WalletValidator.verifyDomain();

      expect(result.isVerified).toBe(false);
      expect(result.warnings).toContain('Domain is not in the trusted list');
    });

    it('should warn about insecure connections on production domains', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'propchain.io', protocol: 'http:' },
        writable: true
      });

      const result = WalletValidator.verifyDomain();

      expect(result.isVerified).toBe(false);
      expect(result.warnings).toContain('Insecure connection - HTTPS required for production');
    });

    it('should reject blacklisted domains', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'metamask.io.fake', protocol: 'https:' },
        writable: true
      });

      const result = WalletValidator.verifyDomain();

      expect(result.isVerified).toBe(false);
      expect(result.warnings).toContain('Domain is blacklisted for security reasons');
    });
  });

  describe('validateTransaction', () => {
    it('should validate legitimate transactions', () => {
      const { isAddress, isHex, formatEther } = require('viem');
      isAddress.mockReturnValue(true);
      isHex.mockReturnValue(true);
      formatEther.mockReturnValue('0.1');

      const result = WalletValidator.validateTransaction(
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
        '0x16345785D8A0000',
        '0x',
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45'
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.riskScore).toBeLessThan(30);
    });

    it('should reject invalid recipient address', () => {
      const { isAddress, isHex, formatEther } = require('viem');
      isAddress.mockImplementation((addr: string) => addr === '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45');
      isHex.mockReturnValue(true);
      formatEther.mockReturnValue('0.1');

      const result = WalletValidator.validateTransaction(
        'invalid-address',
        '0x16345785D8A0000',
        '0x',
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45'
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid recipient address');
      expect(result.riskScore).toBeGreaterThanOrEqual(40);
    });

    it('should reject negative transaction values', () => {
      const { isAddress, isHex, formatEther } = require('viem');
      isAddress.mockReturnValue(true);
      isHex.mockReturnValue(true);
      formatEther.mockReturnValue('-1.0');

      const result = WalletValidator.validateTransaction(
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
        '-1000000000000000000',
        '0x',
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45'
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Transaction value cannot be negative');
      expect(result.riskScore).toBeGreaterThanOrEqual(30);
    });

    it('should reject invalid transaction data', () => {
      const { isAddress, isHex, formatEther } = require('viem');
      isAddress.mockReturnValue(true);
      isHex.mockReturnValue(false);
      formatEther.mockReturnValue('0.1');

      const result = WalletValidator.validateTransaction(
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
        '0x16345785D8A0000',
        'invalid-data',
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45'
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid transaction data format');
      expect(result.riskScore).toBeGreaterThanOrEqual(25);
    });

    it('should warn about high value transactions', () => {
      const { isAddress, isHex, formatEther } = require('viem');
      isAddress.mockReturnValue(true);
      isHex.mockReturnValue(true);
      formatEther.mockReturnValue('2.5');

      const result = WalletValidator.validateTransaction(
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
        '0x22B1C8C9A050000000', // 2.5 ETH
        '0x',
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45'
      );

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('High value transaction: 2.5 ETH');
      expect(result.riskScore).toBeGreaterThanOrEqual(10);
    });

    it('should warn about zero-value transactions with data', () => {
      const { isAddress, isHex, formatEther } = require('viem');
      isAddress.mockReturnValue(true);
      isHex.mockReturnValue(true);
      formatEther.mockReturnValue('0.0');

      const result = WalletValidator.validateTransaction(
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
        '0x0',
        '0xa9059cbb0000000000000000000000001234567890123456789012345678901234567890000000000000000000000000000000000000000000000000000000000000001',
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45'
      );

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Zero-value transaction with contract data');
      expect(result.riskScore).toBeGreaterThanOrEqual(20);
    });
  });
});
