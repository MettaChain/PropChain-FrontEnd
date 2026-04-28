import { WalletValidator, AddressValidationResult } from '../walletValidator';

// Mock viem functions
jest.mock('viem', () => ({
  isAddress: jest.fn(),
  getAddress: jest.fn(),
  formatEther: jest.fn(),
  parseEther: jest.fn(),
  isHex: jest.fn(),
  Hex: {} as any
}));

// Mock viem/ens
jest.mock('viem/ens', () => ({
  normalize: jest.fn()
}));

// Mock public client
jest.mock('@/lib/viem-client', () => ({
  publicClient: {
    getEnsAddress: jest.fn(),
    getBalance: jest.fn()
  }
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

  describe('validateWalletAddressInput', () => {
    const mockPublicClient = require('@/lib/viem-client').publicClient;
    const { isAddress, getAddress } = require('viem');
    const { normalize } = require('viem/ens');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should validate a correct Ethereum address', async () => {
      isAddress.mockReturnValue(true);
      getAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45');
      mockPublicClient.getBalance.mockResolvedValue(BigInt('1000000000000000000'));

      const result = await WalletValidator.validateWalletAddressInput(
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45'
      );

      expect(result.isValid).toBe(true);
      expect(result.address).toBe('0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45');
      expect(result.errors).toHaveLength(0);
      expect(result.isChecksumValid).toBe(true);
      expect(result.isBlacklisted).toBe(false);
      expect(result.isVerified).toBe(true);
      expect(result.riskScore).toBeLessThan(30);
    });

    it('should reject invalid address format', async () => {
      const result = await WalletValidator.validateWalletAddressInput(
        'invalid-address'
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid Ethereum address format');
      expect(result.riskScore).toBe(100);
    });

    it('should reject empty input', async () => {
      const result = await WalletValidator.validateWalletAddressInput('');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Address input cannot be empty');
      expect(result.riskScore).toBe(100);
    });

    it('should handle checksum validation failure', async () => {
      isAddress.mockReturnValue(true);
      getAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45');
      mockPublicClient.getBalance.mockResolvedValue(BigInt('1000000000000000000'));

      const result = await WalletValidator.validateWalletAddressInput(
        '0x742d35cc6634c0532925a3b8d4c9db96c4b4db45', // lowercase
        { requireChecksum: true }
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid address checksum (EIP-55)');
      expect(result.riskScore).toBeGreaterThanOrEqual(20);
    });

    it('should warn about checksum validation when not required', async () => {
      isAddress.mockReturnValue(true);
      getAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45');
      mockPublicClient.getBalance.mockResolvedValue(BigInt('1000000000000000000'));

      const result = await WalletValidator.validateWalletAddressInput(
        '0x742d35cc6634c0532925a3b8d4c9db96c4b4db45', // lowercase
        { requireChecksum: false }
      );

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Address checksum validation failed (EIP-55)');
      expect(result.riskScore).toBeGreaterThanOrEqual(10);
    });

    it('should resolve ENS names successfully', async () => {
      normalize.mockReturnValue('vitalik.eth');
      mockPublicClient.getEnsAddress.mockResolvedValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45');
      isAddress.mockReturnValue(true);
      getAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45');
      mockPublicClient.getBalance.mockResolvedValue(BigInt('1000000000000000000'));

      const result = await WalletValidator.validateWalletAddressInput(
        'vitalik.eth',
        { allowENS: true }
      );

      expect(result.isValid).toBe(true);
      expect(result.address).toBe('0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45');
      expect(result.ensName).toBe('vitalik.eth');
      expect(result.warnings).toContain('ENS name resolved: vitalik.eth');
    });

    it('should reject ENS names when ENS is disabled', async () => {
      const result = await WalletValidator.validateWalletAddressInput(
        'vitalik.eth',
        { allowENS: false }
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid Ethereum address format');
    });

    it('should handle ENS resolution failure', async () => {
      normalize.mockReturnValue('nonexistent.eth');
      mockPublicClient.getEnsAddress.mockResolvedValue(null);

      const result = await WalletValidator.validateWalletAddressInput(
        'nonexistent.eth',
        { allowENS: true }
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ENS name could not be resolved: nonexistent.eth');
      expect(result.riskScore).toBe(80);
    });

    it('should detect blacklisted addresses', async () => {
      isAddress.mockReturnValue(true);
      getAddress.mockReturnValue('0x0000000000000000000000000000000000000000');
      mockPublicClient.getBalance.mockResolvedValue(BigInt('0'));

      const result = await WalletValidator.validateWalletAddressInput(
        '0x0000000000000000000000000000000000000000',
        { checkBlacklist: true }
      );

      expect(result.isValid).toBe(false);
      expect(result.isBlacklisted).toBe(true);
      expect(result.errors).toContain('Address is flagged as known scam or compromised');
      expect(result.riskScore).toBeGreaterThanOrEqual(50);
    });

    it('should skip blacklist check when disabled', async () => {
      isAddress.mockReturnValue(true);
      getAddress.mockReturnValue('0x0000000000000000000000000000000000000000');
      mockPublicClient.getBalance.mockResolvedValue(BigInt('0'));

      const result = await WalletValidator.validateWalletAddressInput(
        '0x0000000000000000000000000000000000000000',
        { checkBlacklist: false }
      );

      expect(result.isBlacklisted).toBe(false);
      expect(result.errors).not.toContain('Address is flagged as known scam or compromised');
    });

    it('should warn about unverified addresses', async () => {
      isAddress.mockReturnValue(true);
      getAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45');
      mockPublicClient.getBalance.mockResolvedValue(BigInt('0')); // Zero balance = unverified

      const result = await WalletValidator.validateWalletAddressInput(
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45'
      );

      expect(result.isVerified).toBe(false);
      expect(result.warnings).toContain('Address is not verified - exercise caution');
      expect(result.riskScore).toBeGreaterThanOrEqual(15);
    });

    it('should detect addresses with repeated character patterns', async () => {
      isAddress.mockReturnValue(true);
      getAddress.mockReturnValue('0x7777777777777777777777777777777777777777');
      mockPublicClient.getBalance.mockResolvedValue(BigInt('1000000000000000000'));

      const result = await WalletValidator.validateWalletAddressInput(
        '0x7777777777777777777777777777777777777777'
      );

      expect(result.warnings).toContain('Address contains repeated character patterns - verify carefully');
      expect(result.riskScore).toBeGreaterThanOrEqual(5);
    });

    it('should handle addresses similar to known addresses', async () => {
      isAddress.mockReturnValue(true);
      getAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45');
      mockPublicClient.getBalance.mockResolvedValue(BigInt('1000000000000000000'));

      const result = await WalletValidator.validateWalletAddressInput(
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db46' // Very similar to known address
      );

      expect(result.warnings).toContain('Address is very similar to a known address - verify carefully');
      expect(result.riskScore).toBeGreaterThanOrEqual(10);
    });

    it('should handle newly created address patterns', async () => {
      isAddress.mockReturnValue(true);
      getAddress.mockReturnValue('0x0012345678901234567890123456789012345678');
      mockPublicClient.getBalance.mockResolvedValue(BigInt('1000000000000000000'));

      const result = await WalletValidator.validateWalletAddressInput(
        '0x0012345678901234567890123456789012345678'
      );

      expect(result.warnings).toContain('Address pattern suggests it might be newly created');
      expect(result.riskScore).toBeGreaterThanOrEqual(3);
    });

    it('should handle viem validation failure', async () => {
      isAddress.mockReturnValue(false); // viem says invalid

      const result = await WalletValidator.validateWalletAddressInput(
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45'
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid wallet address');
      expect(result.riskScore).toBe(100);
    });

    it('should trim and sanitize input', async () => {
      isAddress.mockReturnValue(true);
      getAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45');
      mockPublicClient.getBalance.mockResolvedValue(BigInt('1000000000000000000'));

      const result = await WalletValidator.validateWalletAddressInput(
        '  0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45  '
      );

      expect(result.isValid).toBe(true);
      expect(result.address).toBe('0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45');
    });

    it('should handle ENS resolution errors gracefully', async () => {
      normalize.mockReturnValue('error.eth');
      mockPublicClient.getEnsAddress.mockRejectedValue(new Error('Network error'));

      const result = await WalletValidator.validateWalletAddressInput(
        'error.eth',
        { allowENS: true }
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Failed to resolve ENS name: error.eth');
      expect(result.riskScore).toBe(80);
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
    it('should reject invalid sender address', () => {
      const { isAddress, isHex, formatEther } = require('viem');
      isAddress.mockImplementation((addr: string) => addr !== 'invalid-sender');
      isHex.mockReturnValue(true);
      formatEther.mockReturnValue('0.1');

      const result = WalletValidator.validateTransaction(
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
        '0x16345785D8A0000',
        '0x',
        'invalid-sender'
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid sender address');
    });

    it('should handle invalid value format', () => {
      const { isAddress, isHex, formatEther } = require('viem');
      isAddress.mockReturnValue(true);
      isHex.mockReturnValue(true);
      formatEther.mockImplementation(() => { throw new Error('Invalid value'); });

      const result = WalletValidator.validateTransaction(
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
        'invalid-value',
        '0x',
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45'
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid transaction value format');
    });

    it('should detect suspicious transaction patterns', () => {
      const { isAddress, isHex, formatEther } = require('viem');
      isAddress.mockReturnValue(true);
      isHex.mockReturnValue(true);
      formatEther.mockReturnValue('0.1');

      // Mock known scam contract
      jest.spyOn(WalletValidator as any, 'isKnownScamContract').mockReturnValue(true);

      const result = WalletValidator.validateTransaction(
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
        '0x16345785D8A0000',
        '0x',
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45'
      );

      expect(result.warnings).toContain('Transaction to known scam contract');
    });

    it('should detect suspicious method calls', () => {
      const { isAddress, isHex, formatEther } = require('viem');
      isAddress.mockReturnValue(true);
      isHex.mockReturnValue(true);
      formatEther.mockReturnValue('0.1');

      jest.spyOn(WalletValidator as any, 'isSuspiciousMethod').mockReturnValue(true);

      const result = WalletValidator.validateTransaction(
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
        '0x16345785D8A0000',
        '0xa9059cbb00000000000000000000000012345678901234567890123456789012345678900000000000000000000000000000000000000000000000000000000000000001',
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45'
      );

      expect(result.warnings).toContain('Suspicious contract method call');
    });
  });

  describe('validateWalletConnection edge cases', () => {
    it('should flag compromised wallet addresses', async () => {
      const { isAddress, getAddress } = require('viem');
      isAddress.mockReturnValue(true);
      getAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45');

      // Mock RISKY_WALLETS to include test address
      (WalletValidator as any).RISKY_WALLETS = ['0x742d35cc6634c0532925a3b8d4c9db96c4b4db45'];

      const result = await WalletValidator.validateWalletConnection(
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
        'metamask',
        1
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Wallet address is flagged as compromised');
    });

    it('should handle attack pattern detection', async () => {
      const { isAddress, getAddress } = require('viem');
      isAddress.mockReturnValue(true);
      getAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45');

      jest.spyOn(WalletValidator as any, 'hasSimilarityToKnownAddresses').mockReturnValue(true);

      const result = await WalletValidator.validateWalletConnection(
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
        'metamask',
        1
      );

      expect(result.warnings).toContain('Potential attack pattern: Address similarity to known addresses detected');
    });
  });

  describe('verifyDomain edge cases', () => {
    it('should verify subdomains of trusted domains', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'app.propchain.io', protocol: 'https:' },
        writable: true
      });

      const result = WalletValidator.verifyDomain();
      expect(result.isVerified).toBe(true);
    });

    it('should handle localhost with different ports', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost', protocol: 'http:' },
        writable: true
      });

      const result = WalletValidator.verifyDomain();
      expect(result.isVerified).toBe(true);
    });

    it('should handle 127.0.0.1', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: '127.0.0.1', protocol: 'http:' },
        writable: true
      });

      const result = WalletValidator.verifyDomain();
      expect(result.isVerified).toBe(true);
    });

    it('should handle 0.0.0.0', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: '0.0.0.0', protocol: 'http:' },
        writable: true
      });

      const result = WalletValidator.verifyDomain();
      expect(result.isVerified).toBe(true);
    });
  });

  describe('private methods', () => {
    describe('isValidChainId', () => {
      it('should validate supported chain IDs', () => {
        const supportedChains = [1, 5, 11155111, 137, 80001, 56, 97];
        supportedChains.forEach(chainId => {
          expect((WalletValidator as any).isValidChainId(chainId)).toBe(true);
        });

        expect((WalletValidator as any).isValidChainId(999)).toBe(false);
        expect((WalletValidator as any).isValidChainId(0)).toBe(false);
      });
    });

    describe('checkAttackPatterns', () => {
      it('should detect address similarity', () => {
        jest.spyOn(WalletValidator as any, 'hasSimilarityToKnownAddresses').mockReturnValue(true);

        const patterns = (WalletValidator as any).checkAttackPatterns('0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45');
        expect(patterns).toContain('Address similarity to known addresses detected');
      });

      it('should return empty array for clean addresses', () => {
        jest.spyOn(WalletValidator as any, 'hasSimilarityToKnownAddresses').mockReturnValue(false);

        const patterns = (WalletValidator as any).checkAttackPatterns('0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45');
        expect(patterns).toEqual([]);
      });
    });

    describe('checkSuspiciousTransactionPatterns', () => {
      it('should detect zero-value transactions with data', () => {
        const patterns = (WalletValidator as any).checkSuspiciousTransactionPatterns(
          '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
          '0x0',
          '0xa9059cbb...'
        );
        expect(patterns).toContain('Zero-value transaction with contract data');
      });

      it('should detect known scam contracts', () => {
        jest.spyOn(WalletValidator as any, 'isKnownScamContract').mockReturnValue(true);

        const patterns = (WalletValidator as any).checkSuspiciousTransactionPatterns(
          '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
          '0x16345785D8A0000',
          '0x'
        );
        expect(patterns).toContain('Transaction to known scam contract');
      });

      it('should detect suspicious methods', () => {
        jest.spyOn(WalletValidator as any, 'isSuspiciousMethod').mockReturnValue(true);

        const patterns = (WalletValidator as any).checkSuspiciousTransactionPatterns(
          '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
          '0x16345785D8A0000',
          '0xa9059cbb...'
        );
        expect(patterns).toContain('Suspicious contract method call');
      });
    });

    describe('isValidHexData', () => {
      it('should validate hex data format', () => {
        expect((WalletValidator as any).isValidHexData('0x')).toBe(true);
        expect((WalletValidator as any).isValidHexData('0x1234567890abcdef')).toBe(true);
        expect((WalletValidator as any).isValidHexData('0x1234567890abcdefg')).toBe(false);
        expect((WalletValidator as any).isValidHexData('123456')).toBe(false);
      });
    });

    describe('hasSimilarityToKnownAddresses', () => {
      it('should return false (placeholder implementation)', () => {
        const result = (WalletValidator as any).hasSimilarityToKnownAddresses('0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45');
        expect(result).toBe(false);
      });
    });

    describe('isKnownScamContract', () => {
      it('should return false (placeholder implementation)', () => {
        const result = (WalletValidator as any).isKnownScamContract('0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45');
        expect(result).toBe(false);
      });
    });

    describe('isSuspiciousMethod', () => {
      it('should return false (placeholder implementation)', () => {
        const result = (WalletValidator as any).isSuspiciousMethod('0xa9059cbb');
        expect(result).toBe(false);
      });
    });  });
});
