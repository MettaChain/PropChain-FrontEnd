import { isAddress, verifyMessage, Hex, isHex } from 'viem';

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

export class PhishingProtection {
  private static readonly KNOWN_PHISHING_DOMAINS = [
    'metamask.io.fake',
    'myetherwallet.com.scam',
    'trustwallet.app.phish',
    // Add more known phishing domains
  ];

  private static readonly MALICIOUS_CONTRACTS = [
    '0x0000000000000000000000000000000000000000', // Example placeholder
    // Add known malicious contract addresses
  ];

  private static readonly SUSPICIOUS_METHODS = [
    '0xa9059cbb', // transfer
    '0x095ea7b3', // approve
    '0x2e1a7d4d', // withdraw
    // Add more suspicious method signatures
  ];

  /**
   * Detects phishing attempts based on domain and content analysis
   */
  static detectPhishing(url: string, content?: string): PhishingDetectionResult {
    const threats: string[] = [];
    const warnings: string[] = [];
    let riskScore = 0;

    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      // Check against known phishing domains
      if (this.isKnownPhishingDomain(domain)) {
        threats.push('Known phishing domain detected');
        riskScore += 90;
      }

      // Check for domain spoofing
      if (this.isDomainSpoofing(domain)) {
        threats.push('Domain spoofing detected');
        riskScore += 70;
      }

      // Check for suspicious URL patterns
      if (this.hasSuspiciousUrlPatterns(url)) {
        warnings.push('Suspicious URL patterns detected');
        riskScore += 30;
      }

      // Check content if provided
      if (content) {
        const contentAnalysis = this.analyzeContent(content);
        threats.push(...contentAnalysis.threats);
        warnings.push(...contentAnalysis.warnings);
        riskScore += contentAnalysis.riskScore;
      }

    } catch (error) {
      warnings.push('Invalid URL format');
      riskScore += 20;
    }

    return {
      isPhishing: riskScore >= 70,
      riskScore: Math.min(riskScore, 100),
      threats,
      warnings
    };
  }

  /**
   * Validates transaction signatures for malicious intent
   */
  static validateSignature(
    message: string,
    signature: string,
    address: string
  ): SignatureValidationResult {
    const warnings: string[] = [];
    let isMalicious = false;
    let decodedData: any;

    try {
      // Recover the signing address
      const recoveredAddress = verifyMessage({ message, signature });
      
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

    // Check if recipient is a known malicious contract
    if (this.isMaliciousContract(to)) {
      warnings.push('Transaction to known malicious contract');
      isMalicious = true;
    }

    // Analyze transaction data
    if (data && data !== '0x') {
      try {
        // Decode function selector
        const functionSelector = data.slice(0, 10);
        
        if (this.isSuspiciousMethod(functionSelector)) {
          warnings.push('Suspicious function call detected');
          isMalicious = true;
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
        warnings.push('Unable to decode transaction data');
      }
    }

    return {
      isValid: !isMalicious,
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
   * Checks if a domain is known for phishing
   */
  private static isKnownPhishingDomain(domain: string): boolean {
    return this.KNOWN_PHISHING_DOMAINS.some(phishingDomain =>
      domain === phishingDomain || domain.endsWith(`.${phishingDomain}`)
    );
  }

  /**
   * Checks for domain spoofing attempts
   */
  private static isDomainSpoofing(domain: string): boolean {
    const legitimateDomains = ['metamask.io', 'myetherwallet.com', 'trustwallet.app'];
    
    return legitimateDomains.some(legit => {
      const similarity = this.calculateStringSimilarity(domain, legit);
      return similarity > 0.8 && domain !== legit;
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
    return this.MALICIOUS_CONTRACTS.includes(address.toLowerCase());
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
      /^[0-9a-f]{130,}$/, // Long hex strings
      /^[A-Za-z0-9+/]{100,}={0,2}$/, // Long base64 strings
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
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}
