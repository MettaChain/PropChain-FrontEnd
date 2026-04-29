import { isAddress, getAddress, formatEther, parseEther, Hex, isHex } from 'viem';
import { publicClient } from '@/lib/viem-client';
import { normalize } from 'viem/ens';

export interface WalletValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  riskScore: number; // 0-100, higher is more risky
  address?: string;
  ensName?: string;
  isChecksumValid?: boolean;
  isBlacklisted?: boolean;
}

export interface AddressValidationResult {
  isValid: boolean;
  address: string;
  ensName?: string;
  errors: string[];
  warnings: string[];
  riskScore: number;
  isChecksumValid: boolean;
  isBlacklisted: boolean;
  isVerified: boolean;
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
    'malicious-wallet.com',
    'metamask.io.fake'
  ];

  private static readonly RISKY_WALLETS: string[] = [
    // Known scam and compromised addresses
    '0x0000000000000000000000000000000000000000', // Null address
    '0xdeaddeaddeaddeaddeaddeaddeaddeaddeaddead', // Dead address
    // Add more known scam addresses as needed
  ];

  private static readonly KNOWN_SCAM_ADDRESSES: string[] = [
    // Known scam addresses (to be updated regularly)
    '0x1234567890123456789012345678901234567890', // Example scam address
    // Add more known scam addresses
  ];

  // Ethereum address regex pattern
  private static readonly ETHEREUM_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;
  
  // ENS name regex pattern
  private static readonly ENS_NAME_REGEX = /^[a-zA-Z0-9-]+\.eth$/;

  /**
   * Validates and sanitizes wallet address input with comprehensive security checks
   */
  static async validateWalletAddressInput(
    input: string,
    options: {
      allowENS?: boolean;
      requireChecksum?: boolean;
      checkBlacklist?: boolean;
    } = {}
  ): Promise<AddressValidationResult> {
    const {
      allowENS = true,
      requireChecksum = true,
      checkBlacklist = true
    } = options;

    const errors: string[] = [];
    const warnings: string[] = [];
    let riskScore = 0;
    let address = input;
    let ensName: string | undefined;
    let isChecksumValid = false;
    let isBlacklisted = false;
    let isVerified = false;

    // Trim and sanitize input
    const sanitizedInput = input.trim().toLowerCase();
    
    if (!sanitizedInput) {
      errors.push('Address input cannot be empty');
      return {
        isValid: false,
        address: input,
        errors,
        warnings,
        riskScore: 100,
        isChecksumValid: false,
        isBlacklisted: false,
        isVerified: false
      };
    }

    // Check if input is an ENS name
    if (allowENS && this.ENS_NAME_REGEX.test(sanitizedInput)) {
      try {
        const resolvedAddress = await this.resolveENSName(sanitizedInput);
        if (resolvedAddress) {
          address = resolvedAddress;
          ensName = sanitizedInput;
          warnings.push(`ENS name resolved: ${sanitizedInput}`);
        } else {
          errors.push(`ENS name could not be resolved: ${sanitizedInput}`);
          return {
            isValid: false,
            address: input,
            errors,
            warnings,
            riskScore: 80,
            isChecksumValid: false,
            isBlacklisted: false,
            isVerified: false
          };
        }
      } catch (error) {
        errors.push(`Failed to resolve ENS name: ${sanitizedInput}`);
        return {
          isValid: false,
          address: input,
          errors,
          warnings,
          riskScore: 80,
          isChecksumValid: false,
          isBlacklisted: false,
          isVerified: false
        };
      }
    }

    // Regex validation for Ethereum address format
    if (!this.ETHEREUM_ADDRESS_REGEX.test(address)) {
      errors.push('Invalid Ethereum address format');
      return {
        isValid: false,
        address: input,
        errors,
        warnings,
        riskScore: 100,
        isChecksumValid: false,
        isBlacklisted: false,
        isVerified: false
      };
    }

    // Basic address validation using viem
    if (!isAddress(address)) {
      errors.push('Invalid wallet address');
      return {
        isValid: false,
        address: input,
        errors,
        warnings,
        riskScore: 100,
        isChecksumValid: false,
        isBlacklisted: false,
        isVerified: false
      };
    }

    // Checksum validation (EIP-55)
    const checksumAddress = getAddress(address);
    isChecksumValid = address === checksumAddress;
    
    if (!isChecksumValid) {
      if (requireChecksum) {
        errors.push('Invalid address checksum (EIP-55)');
        riskScore += 20;
      } else {
        warnings.push('Address checksum validation failed (EIP-55)');
        riskScore += 10;
      }
    }

    // Blacklist check
    if (checkBlacklist) {
      const normalizedAddress = address.toLowerCase();
      if (this.RISKY_WALLETS.includes(normalizedAddress) || 
          this.KNOWN_SCAM_ADDRESSES.includes(normalizedAddress)) {
        isBlacklisted = true;
        errors.push('Address is flagged as known scam or compromised');
        riskScore += 50;
      }
    }

    // Address verification check
    isVerified = await this.verifyAddress(address);
    if (!isVerified) {
      warnings.push('Address is not verified - exercise caution');
      riskScore += 15;
    }

    // Additional security checks
    const securityChecks = this.performAdditionalSecurityChecks(address);
    warnings.push(...securityChecks.warnings);
    riskScore += securityChecks.riskScoreIncrease;

    return {
      isValid: errors.length === 0,
      address: checksumAddress,
      ensName,
      errors,
      warnings,
      riskScore: Math.min(riskScore, 100),
      isChecksumValid,
      isBlacklisted,
      isVerified
    };
  }

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
    const knownScamContracts: string[] = [
      // Add known scam contract addresses
    ];
    return knownScamContracts.includes(address.toLowerCase());
  }

  /**
   * Resolves ENS name to address
   */
  private static async resolveENSName(ensName: string): Promise<string | null> {
    try {
      const normalizedEnsName = normalize(ensName);
      const address = await publicClient.getEnsAddress({
        name: normalizedEnsName
      });
      return address;
    } catch (error) {
      console.error('ENS resolution failed:', error);
      return null;
    }
  }

  /**
   * Verifies if an address is known/trusted
   */
  private static async verifyAddress(address: string): Promise<boolean> {
    try {
      // Check if address has transaction history (basic verification)
      const balance = await publicClient.getBalance({ address });
      
      // Addresses with zero balance might be newly created or suspicious
      // However, this is not definitive, so we use it as a warning signal
      if (balance === BigInt('0')) {
        return false;
      }

      // Additional verification logic could include:
      // - Checking if address is a known contract
      // - Verifying against known exchange/deposit addresses
      // - Checking age of the address (first transaction)
      
      return true;
    } catch (error) {
      console.error('Address verification failed:', error);
      return false;
    }
  }

  /**
   * Performs additional security checks on the address
   */
  private static performAdditionalSecurityChecks(address: string): {
    warnings: string[];
    riskScoreIncrease: number;
  } {
    const warnings: string[] = [];
    let riskScoreIncrease = 0;

    // Check for address patterns that might indicate spoofing
    const normalizedAddress = address.toLowerCase();
    
    // Check for addresses with many repeated characters (potential typosquatting)
    const repeats = normalizedAddress.match(/(.)\1{4,}/g);
    if (repeats && repeats.length > 0) {
      warnings.push('Address contains repeated character patterns - verify carefully');
      riskScoreIncrease += 5;
    }

    // Check for addresses that look similar to common addresses
    const commonAddresses = [
      '0x742d35cc6634c0532925a3b8d4c9db96c4b4db45', // Example common address
      // Add more known addresses to check against
    ];

    for (const commonAddr of commonAddresses) {
      if (this.calculateSimilarity(normalizedAddress, commonAddr) > 0.8) {
        warnings.push('Address is very similar to a known address - verify carefully');
        riskScoreIncrease += 10;
        break;
      }
    }

    // Check for newly created addresses (heuristic based on address pattern)
    // This is a simple heuristic - in production, you'd want to check actual blockchain data
    const firstByte = normalizedAddress.slice(2, 4);
    if (firstByte === '00' || firstByte === 'ff') {
      warnings.push('Address pattern suggests it might be newly created');
      riskScoreIncrease += 3;
    }

    return { warnings, riskScoreIncrease };
  }

  /**
   * Calculates similarity between two addresses (Levenshtein distance)
   */
  private static calculateSimilarity(addr1: string, addr2: string): number {
    const longer = addr1.length > addr2.length ? addr1 : addr2;
    const shorter = addr1.length > addr2.length ? addr2 : addr1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculates Levenshtein distance between two strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
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
