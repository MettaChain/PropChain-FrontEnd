import { isAddress, getAddress, formatEther, parseEther, Hex, isHex } from 'viem';

export interface WalletValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  riskScore: number; // 0-100, higher is more risky
}

export interface DomainVerificationResult {
  isVerified: boolean;
  domain: string;
  expectedDomain: string;
  warnings: string[];
}

export class WalletValidator {
  private static readonly TRUSTED_DOMAINS = [
    'propchain.io',
    'localhost',
    '127.0.0.1',
    '0.0.0.0'
  ];

  private static readonly BLACKLISTED_DOMAINS = [
    'phishing-site.com',
    'malicious-wallet.com'
  ];

  private static readonly RISKY_WALLETS = [
    // Add wallet addresses known to be compromised
  ];

  /**
   * Validates wallet connection with comprehensive security checks
   */
  static async validateWalletConnection(
    address: string,
    walletType: string,
    chainId: number
  ): Promise<WalletValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let riskScore = 0;

    // Address format validation
    if (!isAddress(address)) {
      errors.push('Invalid wallet address format');
      return { isValid: false, errors, warnings, riskScore: 100 };
    }

    // Checksum validation
    if (address !== getAddress(address)) {
      warnings.push('Address checksum validation failed');
      riskScore += 10;
    }

    // Blacklist check
    if (this.RISKY_WALLETS.includes(address.toLowerCase())) {
      errors.push('Wallet address is flagged as compromised');
      riskScore += 50;
    }

    // Wallet type validation
    if (!['metamask', 'walletconnect', 'coinbase'].includes(walletType)) {
      warnings.push('Unrecognized wallet type');
      riskScore += 15;
    }

    // Chain ID validation
    if (!this.isValidChainId(chainId)) {
      errors.push('Invalid or unsupported chain ID');
      riskScore += 25;
    }

    // Check for common attack patterns
    const attackPatterns = this.checkAttackPatterns(address);
    if (attackPatterns.length > 0) {
      warnings.push(...attackPatterns.map(pattern => `Potential attack pattern: ${pattern}`));
      riskScore += 20;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      riskScore: Math.min(riskScore, 100)
    };
  }

  /**
   * Verifies the current domain against expected domains
   */
  static verifyDomain(): DomainVerificationResult {
    const currentDomain = window.location.hostname;
    const warnings: string[] = [];

    // Check if domain is blacklisted
    if (this.BLACKLISTED_DOMAINS.includes(currentDomain)) {
      return {
        isVerified: false,
        domain: currentDomain,
        expectedDomain: this.TRUSTED_DOMAINS[0],
        warnings: ['Domain is blacklisted for security reasons']
      };
    }

    // Check if domain is trusted
    const isTrusted = this.TRUSTED_DOMAINS.some(trusted => 
      currentDomain === trusted || currentDomain.endsWith(`.${trusted}`)
    );

    if (!isTrusted) {
      warnings.push('Domain is not in the trusted list');
    }

    // HTTPS check for production domains
    if (currentDomain !== 'localhost' && currentDomain !== '127.0.0.1' && window.location.protocol !== 'https:') {
      warnings.push('Insecure connection - HTTPS required for production');
    }

    return {
      isVerified: isTrusted && warnings.length === 0,
      domain: currentDomain,
      expectedDomain: this.TRUSTED_DOMAINS[0],
      warnings
    };
  }

  /**
   * Validates transaction details before signing
   */
  static validateTransaction(
    to: string,
    value: string,
    data: string,
    from: string
  ): WalletValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let riskScore = 0;

    // Validate recipient address
    if (!isAddress(to)) {
      errors.push('Invalid recipient address');
      riskScore += 40;
    }

    // Validate sender address
    if (!isAddress(from)) {
      errors.push('Invalid sender address');
      riskScore += 40;
    }

    // Validate value format
    try {
      const valueBN = BigInt(value);
      if (valueBN < BigInt(0)) {
        errors.push('Transaction value cannot be negative');
        riskScore += 30;
      }
    } catch {
      errors.push('Invalid transaction value format');
      riskScore += 30;
    }

    // Validate transaction data
    if (data && !isHex(data)) {
      errors.push('Invalid transaction data format');
      riskScore += 25;
    }

    // Check for suspicious transaction patterns
    const suspiciousPatterns = this.checkSuspiciousTransactionPatterns(to, value, data);
    if (suspiciousPatterns.length > 0) {
      warnings.push(...suspiciousPatterns);
      riskScore += 20;
    }

    // High value transaction warning
    try {
      const valueBN = BigInt(value);
      const ethValue = Number(formatEther(valueBN));
      if (ethValue > 1.0) { // Warning for transactions > 1 ETH
        warnings.push(`High value transaction: ${ethValue} ETH`);
        riskScore += 10;
      }
    } catch {
      // Invalid value already caught above
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      riskScore: Math.min(riskScore, 100)
    };
  }

  /**
   * Checks if chain ID is valid and supported
   */
  private static isValidChainId(chainId: number): boolean {
    const supportedChains = [1, 5, 11155111, 137, 80001, 56, 97]; // Mainnet, Goerli, Sepolia, Polygon, Mumbai, BSC, BSC Testnet
    return supportedChains.includes(chainId);
  }

  /**
   * Checks for common attack patterns in addresses
   */
  private static checkAttackPatterns(address: string): string[] {
    const patterns: string[] = [];

    // Check for address impersonation (similar to known addresses)
    if (this.hasSimilarityToKnownAddresses(address)) {
      patterns.push('Address similarity to known addresses detected');
    }

    // Check for newly created addresses (low transaction count would need blockchain query)
    // This is a placeholder - actual implementation would need blockchain API calls

    return patterns;
  }

  /**
   * Checks for suspicious transaction patterns
   */
  private static checkSuspiciousTransactionPatterns(to: string, value: string, data: string): string[] {
    const patterns: string[] = [];

    // Check for zero-value transactions with data (potential approval scams)
    try {
      const valueBN = BigInt(value);
      if (valueBN === BigInt(0) && data && data !== '0x') {
        patterns.push('Zero-value transaction with contract data');
      }
    } catch {
      // Invalid value already caught in validation
    }

    // Check for known scam contract addresses
    if (this.isKnownScamContract(to)) {
      patterns.push('Transaction to known scam contract');
    }

    // Check for suspicious contract interactions
    if (data && data.length > 10) {
      const methodSignature = data.slice(0, 10);
      if (this.isSuspiciousMethod(methodSignature)) {
        patterns.push('Suspicious contract method call');
      }
    }

    return patterns;
  }

  /**
   * Validates hex data format
   */
  private static isValidHexData(data: string): boolean {
    return /^0x[0-9a-fA-F]*$/.test(data);
  }

  /**
   * Checks if address has similarity to known addresses (placeholder implementation)
   */
  private static hasSimilarityToKnownAddresses(address: string): boolean {
    // This would need a more sophisticated implementation
    // Could compare against known exchange addresses, project addresses, etc.
    return false;
  }

  /**
   * Checks if address is a known scam contract (placeholder implementation)
   */
  private static isKnownScamContract(address: string): boolean {
    // This would need to be maintained and updated regularly
    const knownScamContracts = [
      // Add known scam contract addresses
    ];
    return knownScamContracts.includes(address.toLowerCase());
  }

  /**
   * Checks if method signature is suspicious (placeholder implementation)
   */
  private static isSuspiciousMethod(methodSignature: string): boolean {
    // This would need to be maintained based on common scam patterns
    const suspiciousMethods = [
      '0x', // Empty method
      // Add known suspicious method signatures
    ];
    return suspiciousMethods.includes(methodSignature);
  }
}
