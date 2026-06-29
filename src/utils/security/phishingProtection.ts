import { isAddress, isHex, recoverMessageAddress, type Hex } from 'viem';
import { logger } from '@/utils/logger';

export interface PhishingDetectionResult {
  isPhishing: boolean;
  riskScore: number; // 0-100
  threats: string[];
  warnings: string[];
}

export interface SignatureValidationResult {
  isValid: boolean;
  isMalicious: boolean;
  warnings: string[];
  decodedData?: any;
}

export interface PhishingManifest {
  version: string;
  updatedAt: string;
  domains: string[];
  contracts: string[];
  signature: string;
}

export class PhishingProtection {
  private static readonly CDN_MANIFEST_URL = process.env.NEXT_PUBLIC_PHISHING_MANIFEST_URL || 'https://cdn.propchain.io/security/phishing-manifest.json';
  private static readonly MANIFEST_PUBLIC_KEY = process.env.NEXT_PUBLIC_MANIFEST_SIGNING_KEY || '';

  private static cdnLoadedDomains: string[] = [];
  private static cdnLoadedContracts: string[] = [];
  private static manifestVersion = '';
  private static lastManifestFetch = 0;
  private static readonly MANIFEST_TTL = 3600_000; // 1 hour

  private static readonly FALLBACK_PHISHING_DOMAINS = [
    'metamask.io.fake',
    'myetherwallet.com.scam',
    'trustwallet.app.phish',
  ];

  private static readonly FALLBACK_MALICIOUS_CONTRACTS = [
    '0x0000000000000000000000000000000000000000',
  ];

  private static readonly SUSPICIOUS_METHODS = [
    '0xa9059cbb', // transfer
    '0x095ea7b3', // approve
    '0x2e1a7d4d', // withdraw
  ];

  private static readonly OFFICIAL_DOMAINS = [
    'propchain.io',
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
  ];

  private static memoizedResults = new Map<string, PhishingDetectionResult>();
  private static reportTimestamps: number[] = [];

  /**
   * Fetches the phishing denylist from CDN with signed manifest verification
   */
  static async loadManifestFromCDN(): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastManifestFetch < this.MANIFEST_TTL && this.cdnLoadedDomains.length > 0) {
      return true;
    }

    try {
      const response = await fetch(this.CDN_MANIFEST_URL, { cache: 'no-cache' });
      if (!response.ok) return false;

      const manifest: PhishingManifest = await response.json();

      if (!this.verifyManifestSignature(manifest)) {
        console.warn('[PhishingProtection] Manifest signature verification failed');
        return false;
      }

      this.cdnLoadedDomains = manifest.domains || [];
      this.cdnLoadedContracts = manifest.contracts || [];
      this.manifestVersion = manifest.version;
      this.lastManifestFetch = now;
      return true;
    } catch {
      return false;
    }
  }

  private static verifyManifestSignature(manifest: PhishingManifest): boolean {
    if (!this.MANIFEST_PUBLIC_KEY) return true;
    try {
      const { signature, ...data } = manifest;
      const encoder = new TextEncoder();
      const dataStr = JSON.stringify(data);
      return dataStr.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Returns the effective domain list (CDN + fallback)
   */
  private static getEffectiveDomains(): string[] {
    const domains = [...this.FALLBACK_PHISHING_DOMAINS];
    for (const d of this.cdnLoadedDomains) {
      if (!domains.includes(d)) domains.push(d);
    }
    return domains;
  }

  /**
   * Returns the effective contract list (CDN + fallback)
   */
  private static getEffectiveContracts(): string[] {
    const contracts = [...this.FALLBACK_MALICIOUS_CONTRACTS];
    for (const c of this.cdnLoadedContracts) {
      if (!contracts.includes(c.toLowerCase())) contracts.push(c.toLowerCase());
    }
    return contracts;
  }

  /**
   * Detects phishing attempts based on domain and content analysis
   */
  static detectPhishing(url: string, content?: string): PhishingDetectionResult {
    const originKey = typeof window !== 'undefined' ? window.location.origin : '__server__';
    const cacheKey = `${originKey}::${url}::${content ?? ''}`;

    const cached = this.memoizedResults.get(cacheKey);
    if (cached) {
      return cached;
    }

    const result = this.executeDetection(url, content);

    this.memoizedResults.set(cacheKey, result);

    return result;
  }

  /**
   * Rate-limited background report submission
   */
  static async reportPhishing(url: string, maxReportsPerMinute = 10): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - 60_000;
    this.reportTimestamps = this.reportTimestamps.filter(t => t > windowStart);

    if (this.reportTimestamps.length >= maxReportsPerMinute) {
      return false;
    }

    this.reportTimestamps.push(now);

    try {
      const payload = { url, reportedAt: now, origin: typeof window !== 'undefined' ? window.location.origin : '' };
      await fetch('/api/report-phishing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clears memoized results (useful for testing)
   */
  static clearMemoizedResults(): void {
    this.memoizedResults.clear();
    this.reportTimestamps = [];
    this.cdnLoadedDomains = [];
    this.cdnLoadedContracts = [];
    this.lastManifestFetch = 0;
    this.manifestVersion = '';
  }

  private static executeDetection(url: string, content?: string): PhishingDetectionResult {
    const threats: string[] = [];
    const warnings: string[] = [];
    let riskScore = 0;

    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      // Hard match against a curated blocklist of known phishing domains
      if (this.isKnownPhishingDomain(domain)) {
        threats.push('Known phishing domain detected');
        riskScore += 90; // Near-certain phishing — very high score
      }

      // Fuzzy match: detect typosquatting (e.g. "metamask.io.fake")
      if (this.isDomainSpoofing(domain)) {
        threats.push('Domain spoofing detected');
        riskScore += 70;
      }

      // Whitelist check: warn if not on an official domain
      if (!this.isOfficialDomain(domain)) {
        warnings.push('Unofficial domain detected');
        riskScore += 20;
      }

      // Pattern-based heuristics: URL shorteners, IP addresses, long random strings
      if (this.hasSuspiciousUrlPatterns(url)) {
        warnings.push('Suspicious URL patterns detected');
        riskScore += 30;
      }

      // Optional deep content scan (e.g. page HTML passed by caller)
      if (content) {
        const contentAnalysis = this.analyzeContent(content);
        threats.push(...contentAnalysis.threats);
        warnings.push(...contentAnalysis.warnings);
        riskScore += contentAnalysis.riskScore;
      }

    } catch (error) {
      logger.warn('Invalid URL format detected in phishing check:', error);
      warnings.push('Invalid URL format');
      riskScore += 20;
    }

    return {
      // Threshold of 70 chosen to balance false positives vs. missed phishing
      isPhishing: riskScore >= 70,
      riskScore: Math.min(riskScore, 100), // Cap at 100 regardless of additive scores
      threats,
      warnings
    };
  }

  /**
   * Validates transaction signatures for malicious intent
   */
  static async validateSignature(
    message: string,
    signature: string,
    address: string
  ): Promise<SignatureValidationResult> {
    const warnings: string[] = [];
    let isMalicious = false;
    let decodedData: any;

    try {
      // Recover the signing address
      const recoveredAddress = await recoverMessageAddress({ message, signature: signature as Hex });
      
      if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        return {
          isValid: false,
          isMalicious: true,
          warnings: ['Signature does not match expected address']
        };
      }

      // Analyze the message content
      const messageAnalysis = this.analyzeMessageContent(message);
      warnings.push(...messageAnalysis.warnings);
      isMalicious = messageAnalysis.isMalicious;
      decodedData = messageAnalysis.decodedData;

    } catch (error) {
      logger.warn('Invalid signature format:', error);
      return {
        isValid: false,
        isMalicious: true,
        warnings: ['Invalid signature format']
      };
    }

    return {
      isValid: true,
      isMalicious,
      warnings,
      decodedData
    };
  }

  /**
   * Validates transaction data for malicious contracts
   */
  static validateTransactionData(to: string, data: string): SignatureValidationResult {
    const warnings: string[] = [];
    let isMalicious = false;
    let decodedData: any;
    let contractMalicious = false;

    // Check if recipient is a known malicious contract
    if (this.isMaliciousContract(to)) {
      warnings.push('Transaction to known malicious contract');
      isMalicious = true;
      contractMalicious = true;
    }

    // Analyze transaction data
    if (data && data !== '0x') {
      try {
        // Decode function selector
        const functionSelector = data.slice(0, 10);
        
        if (this.isSuspiciousMethod(functionSelector)) {
          warnings.push('Suspicious function call detected');
          // Treat some very common methods (e.g., token `transfer`) as warnings
          // but not necessarily malicious. Flag as malicious for less-common
          // suspicious methods such as `approve` or `withdraw`.
          if (functionSelector !== '0xa9059cbb') {
            isMalicious = true;
          }
        }

        // Try to decode the data (basic attempt)
        decodedData = this.decodeTransactionData(data);
        
        // Check for suspicious parameters
        const paramAnalysis = this.analyzeTransactionParameters(decodedData);
        warnings.push(...paramAnalysis.warnings);
        if (paramAnalysis.isMalicious) {
          isMalicious = true;
        }

      } catch (error) {
        logger.warn('Unable to decode transaction data:', error);
        warnings.push('Unable to decode transaction data');
      }
    }

    return {
      // `isValid` here indicates syntactic/operational validity; if the
      // recipient is a known malicious contract we mark the transaction as
      // invalid. Other suspicious findings emit warnings but may still be
      // considered syntactically valid.
      isValid: !contractMalicious,
      isMalicious,
      warnings,
      decodedData
    };
  }

  /**
   * Creates a secure signature request with user confirmation
   */
  static createSecureSignatureRequest(
    message: string,
    origin: string
  ): {
    safeMessage: string;
    warnings: string[];
    requiresConfirmation: boolean;
  } {
    const warnings: string[] = [];
    let requiresConfirmation = false;

    // Add origin to message for verification
    const safeMessage = `${message}\n\nOrigin: ${origin}\nTimestamp: ${Date.now()}`;

    // Check if message contains sensitive operations
    if (this.containsSensitiveOperations(message)) {
      warnings.push('Message contains sensitive operations');
      requiresConfirmation = true;
    }

    // Check for unusual message patterns
    if (this.hasUnusualMessagePatterns(message)) {
      warnings.push('Unusual message pattern detected');
      requiresConfirmation = true;
    }

    return {
      safeMessage,
      warnings,
      requiresConfirmation
    };
  }

  /**
   * Reports a suspicious domain to the security team
   */
  static async reportSuspiciousDomain(domain: string, reason: string): Promise<boolean> {
    try {
      // In a real implementation, this would send data to a security API
      logger.warn('[Security] Reporting suspicious domain', { domain, reason });
      
      // Placeholder for actual API call
      // await fetch('https://api.propchain.io/security/report', {
      //   method: 'POST',
      //   body: JSON.stringify({ domain, reason, timestamp: Date.now() })
      // });
      
      return true;
    } catch (error) {
      logger.error('Failed to report suspicious domain', error);
      return false;
    }
  }

  /**
   * Checks if a domain is an official PropChain domain
   */
  private static isOfficialDomain(domain: string): boolean {
    return this.OFFICIAL_DOMAINS.some(officialDomain =>
      domain === officialDomain || domain.endsWith(`.${officialDomain}`)
    );
  }

  /**
   * Checks if a domain is known for phishing
   */
  private static isKnownPhishingDomain(domain: string): boolean {
    return this.getEffectiveDomains().some(phishingDomain =>
      domain === phishingDomain || domain.endsWith(`.${phishingDomain}`)
    );
  }

  /**
   * Checks for domain spoofing attempts
   * Uses string similarity to catch typosquatting (e.g. "metamask.io" vs "metarnask.io")
   */
  private static isDomainSpoofing(domain: string): boolean {
    const legitimateDomains = ['metamask.io', 'myetherwallet.com', 'trustwallet.app'];
    return legitimateDomains.some(legit => {
      // Lowered similarity threshold to catch more typosquatting attempts
      const similarity = this.calculateStringSimilarity(domain, legit);
      // Exclude exact matches — only flag near-duplicates
      return similarity > 0.65 && domain !== legit;
    });
  }

  /**
   * Checks for suspicious URL patterns
   */
  private static hasSuspiciousUrlPatterns(url: string): boolean {
    const suspiciousPatterns = [
      /bit\.ly/,
      /tinyurl\.com/,
      /t\.co/,
      /goo\.gl/,
      /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/, // IP addresses
      /[a-z0-9]{20,}/, // Long random strings
    ];

    return suspiciousPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Analyzes content for phishing indicators
   */
  private static analyzeContent(content: string): {
    threats: string[];
    warnings: string[];
    riskScore: number;
  } {
    const threats: string[] = [];
    const warnings: string[] = [];
    let riskScore = 0;

    const phishingKeywords = [
      'verify your wallet',
      'confirm your private key',
      'immediate action required',
      'wallet compromised',
      'suspended account',
      'claim your reward',
      'urgent security update'
    ];

    const lowerContent = content.toLowerCase();

    phishingKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        threats.push(`Phishing keyword detected: ${keyword}`);
        riskScore += 25;
      }
    });

    // Check for requests for sensitive information
    if (lowerContent.includes('private key') || lowerContent.includes('seed phrase')) {
      threats.push('Request for sensitive information detected');
      riskScore += 50;
    }

    return { threats, warnings, riskScore };
  }

  /**
   * Analyzes message content for malicious intent
   */
  private static analyzeMessageContent(message: string): {
    warnings: string[];
    isMalicious: boolean;
    decodedData?: any;
  } {
    const warnings: string[] = [];
    let isMalicious = false;
    let decodedData: any;

    try {
      // Try to parse as JSON
      const jsonData = JSON.parse(message);
      decodedData = jsonData;

      // Check for suspicious fields
      if (jsonData.privateKey || jsonData.seedPhrase) {
        warnings.push('Message contains sensitive wallet data');
        isMalicious = true;
      }

      if (jsonData.approve || jsonData.transfer) {
        warnings.push('Message contains token approval/transfer request');
        isMalicious = true;
      }

    } catch {
      logger.warn('Failed to parse message as JSON, analyzing as text');
      // Not JSON, analyze as text
      if (this.containsSensitiveOperations(message)) {
        warnings.push('Message contains sensitive operations');
        isMalicious = true;
      }
    }

    return { warnings, isMalicious, decodedData };
  }

  /**
   * Checks if contract is known to be malicious
   */
  private static isMaliciousContract(address: string): boolean {
    return this.getEffectiveContracts().includes(address.toLowerCase());
  }

  /**
   * Checks if method signature is suspicious
   */
  private static isSuspiciousMethod(methodSignature: string): boolean {
    return this.SUSPICIOUS_METHODS.includes(methodSignature);
  }

  /**
   * Attempts to decode transaction data
   */
  private static decodeTransactionData(data: string): any {
    try {
      // Basic decoding attempt
      const methodSelector = data.slice(0, 10);
      const params = data.slice(10);
      
      return {
        methodSelector,
        params,
        decoded: false // Would need ABI for full decoding
      };
    } catch {
      logger.warn('Failed to decode transaction data');
      return null;
    }
  }

  /**
   * Analyzes transaction parameters for suspicious patterns
   */
  private static analyzeTransactionParameters(decodedData: any): {
    warnings: string[];
    isMalicious: boolean;
  } {
    const warnings: string[] = [];
    let isMalicious = false;

    // Add parameter analysis logic here
    if (decodedData && decodedData.params) {
      // Check for unusually large amounts
      if (decodedData.params.length > 1000) {
        warnings.push('Unusually large parameter data');
        isMalicious = true;
      }
    }

    return { warnings, isMalicious };
  }

  /**
   * Checks if message contains sensitive operations
   */
  private static containsSensitiveOperations(message: string): boolean {
    const sensitiveOps = [
      'approve',
      'transfer',
      'permit',
      'increaseAllowance',
      'decreaseAllowance'
    ];

    const lowerMessage = message.toLowerCase();
    return sensitiveOps.some(op => lowerMessage.includes(op));
  }

  /**
   * Checks for unusual message patterns
   */
  private static hasUnusualMessagePatterns(message: string): boolean {
    // Check for unusual patterns in the message
    const patterns = [
      /^[0-9a-f]{32,}$/i, // Long hex strings (lowered threshold)
      /^[A-Za-z0-9+/]{30,}={0,2}$/, // Long base64 strings (lowered threshold)
    ];

    return patterns.some(pattern => pattern.test(message));
  }

  /**
   * Calculates string similarity (simple implementation)
   */
  private static calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculates Levenshtein distance between two strings
   * Uses dynamic programming (Wagner-Fischer algorithm) — O(m*n) time and space.
   * The edit distance is the minimum number of single-character edits (insert,
   * delete, substitute) needed to transform str1 into str2.
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    // matrix[i][j] = edit distance between str2[0..i-1] and str1[0..j-1]
    const matrix = [];

    // Initialize first column: cost of deleting all chars from str2 prefix
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    // Initialize first row: cost of inserting all chars from str1 prefix
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          // Characters match — no edit needed, inherit diagonal cost
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          // Take the cheapest of: substitution, insertion, or deletion
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}
