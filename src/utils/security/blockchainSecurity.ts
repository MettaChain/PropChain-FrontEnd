import { logger } from '@/utils/logger';
export interface SecurityServiceConfig {
  apiKey?: string;
  baseUrl: string;
  timeout: number;
}

export interface AddressRiskScore {
  address: string;
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  categories: string[];
  labels: string[];
  description: string;
}

export interface TransactionRisk {
  hash: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  alerts: string[];
  sanctions: boolean;
  mixer: boolean;
  gambling: boolean;
  scam: boolean;
}

export interface SecurityAlert {
  type: 'sanctions' | 'scam' | 'mixer' | 'gambling' | 'malware' | 'exchange_hack';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  source: string;
  timestamp: number;
}

export class BlockchainSecurityService {
  // Singleton instance — ensures only one service instance exists across the app
  private static instance: BlockchainSecurityService;
  private config: SecurityServiceConfig;
  // In-memory cache keyed by address/tx hash to avoid redundant API calls
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  // Cache entries expire after 5 minutes to balance freshness vs. performance
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(config: SecurityServiceConfig) {
    this.config = config;
  }

  /**
   * Singleton factory — creates the instance on first call, returns it on subsequent calls.
   * Throws if no config is provided on first initialization.
   */
  static getInstance(config?: SecurityServiceConfig): BlockchainSecurityService {
    if (!this.instance) {
      if (!config) {
        throw new Error('Configuration required for first initialization');
      }
      this.instance = new BlockchainSecurityService(config);
    }
    return this.instance;
  }

  /**
   * Checks address risk score using Chainalysis-like service
   */
  async checkAddressRisk(address: string): Promise<AddressRiskScore> {
    const cacheKey = `address_${address}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // In a real implementation, this would call actual security APIs
      // For now, we'll simulate the response
      const riskScore = await this.simulateAddressRiskCheck(address);
      
      const result: AddressRiskScore = {
        address,
        riskScore: riskScore.score,
        riskLevel: this.getRiskLevel(riskScore.score),
        categories: riskScore.categories,
        labels: riskScore.labels,
        description: riskScore.description
      };

      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      logger.error('Failed to check address risk:', error);
      return this.getDefaultRiskScore(address);
    }
  }

  /**
   * Checks transaction risk
   */
  async checkTransactionRisk(hash: string): Promise<TransactionRisk> {
    const cacheKey = `tx_${hash}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Simulate transaction risk check
      const riskData = await this.simulateTransactionRiskCheck(hash);
      
      const result: TransactionRisk = {
        hash,
        riskScore: riskData.score,
        riskLevel: this.getRiskLevel(riskData.score),
        alerts: riskData.alerts,
        sanctions: riskData.sanctions,
        mixer: riskData.mixer,
        gambling: riskData.gambling,
        scam: riskData.scam
      };

      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      logger.error('Failed to check transaction risk:', error);
      return this.getDefaultTransactionRisk(hash);
    }
  }

  /**
   * Checks if address is on sanctions list
   */
  async checkSanctions(address: string): Promise<boolean> {
    try {
      const riskScore = await this.checkAddressRisk(address);
      return riskScore.categories.includes('sanctions');
    } catch (error) {
      logger.error('Failed to check sanctions:', error);
      return false;
    }
  }

  /**
   * Checks if address is associated with mixing services
   */
  async checkMixer(address: string): Promise<boolean> {
    try {
      const riskScore = await this.checkAddressRisk(address);
      return riskScore.categories.includes('mixer');
    } catch (error) {
      logger.error('Failed to check mixer association:', error);
      return false;
    }
  }

  /**
   * Gets security alerts for an address
   */
  async getSecurityAlerts(address: string): Promise<SecurityAlert[]> {
    try {
      const riskScore = await this.checkAddressRisk(address);
      const alerts: SecurityAlert[] = [];

      riskScore.categories.forEach(category => {
        alerts.push({
          type: this.mapCategoryToAlertType(category),
          severity: this.getAlertSeverity(riskScore.riskLevel),
          description: `Address flagged for ${category}: ${riskScore.description}`,
          source: 'blockchain_security_service',
          timestamp: Date.now()
        });
      });

      return alerts;
    } catch (error) {
      logger.error('Failed to get security alerts:', error);
      return [];
    }
  }

  /**
   * Validates transaction before execution
   */
  async validateTransaction(
    from: string,
    to: string,
    value: string
  ): Promise<{
    isValid: boolean;
    riskScore: number;
    warnings: string[];
    blocks: string[];
  }> {
    const warnings: string[] = [];
    const blocks: string[] = [];
    let totalRiskScore = 0;

    try {
      // Check sender risk — use the highest risk score seen across all checks
      const senderRisk = await this.checkAddressRisk(from);
      totalRiskScore = Math.max(totalRiskScore, senderRisk.riskScore);

      // Critical risk blocks the transaction; high risk only warns
      if (senderRisk.riskLevel === 'critical') {
        blocks.push('Sender address has critical risk level');
      } else if (senderRisk.riskLevel === 'high') {
        warnings.push('Sender address has high risk level');
      }

      // Check recipient risk independently — both parties must be evaluated
      const recipientRisk = await this.checkAddressRisk(to);
      totalRiskScore = Math.max(totalRiskScore, recipientRisk.riskScore);

      if (recipientRisk.riskLevel === 'critical') {
        blocks.push('Recipient address has critical risk level');
      } else if (recipientRisk.riskLevel === 'high') {
        warnings.push('Recipient address has high risk level');
      }

      // Run sanctions checks in parallel to reduce latency
      const [senderSanctions, recipientSanctions] = await Promise.all([
        this.checkSanctions(from),
        this.checkSanctions(to)
      ]);

      // Any sanctioned party is an immediate hard block
      if (senderSanctions) {
        blocks.push('Sender address is on sanctions list');
      }
      if (recipientSanctions) {
        blocks.push('Recipient address is on sanctions list');
      }

      // BigInt comparison: 1 ETH = 10^18 wei; flag high-value sends to risky recipients
      const valueBN = BigInt(value);
      if (valueBN > BigInt('1000000000000000000') && recipientRisk.riskScore > 50) { // > 1 ETH
        warnings.push('High-value transaction to risky address');
      }

      // Run mixer checks in parallel — mixing services are used to obscure fund origins
      const [senderMixer, recipientMixer] = await Promise.all([
        this.checkMixer(from),
        this.checkMixer(to)
      ]);

      if (senderMixer || recipientMixer) {
        warnings.push('Transaction involves mixer-associated address');
      }

    } catch (error) {
      logger.error('Failed to validate transaction:', error);
      // Degrade gracefully — warn rather than block on service failure
      warnings.push('Unable to complete security validation');
    }

    return {
      isValid: blocks.length === 0,
      riskScore: totalRiskScore,
      warnings,
      blocks
    };
  }

  /**
   * Simulates address risk check (placeholder for real API)
   */
  private async simulateAddressRiskCheck(address: string): Promise<{
    score: number;
    categories: string[];
    labels: string[];
    description: string;
  }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Derive a deterministic score from the address hex so the same address
    // always returns the same risk score (useful for testing/demo purposes)
    const addressHash = address.toLowerCase().replace('0x', '');
    // Parse first 8 hex chars as a 32-bit integer, then mod 100 for a 0–99 score
    const score = parseInt(addressHash.slice(0, 8), 16) % 100;

    const categories: string[] = [];
    const labels: string[] = [];

    // Bucket the score into risk tiers and assign matching categories/labels
    if (score > 80) {
      categories.push('high_risk');
      labels.push('suspicious_activity');
    } else if (score > 60) {
      categories.push('medium_risk');
      labels.push('requires_review');
    } else if (score > 40) {
      categories.push('low_risk');
      labels.push('monitor');
    }

    // Heuristic: addresses starting with 0x000 are likely contract addresses
    if (address.startsWith('0x000')) {
      categories.push('contract');
      labels.push('smart_contract');
    }

    // Map score quartile to a human-readable description
    const descriptions = [
      'Address appears to have normal activity',
      'Address shows some unusual patterns',
      'Address has elevated risk factors',
      'Address requires immediate investigation'
    ];

    const description = descriptions[Math.floor(score / 25)];

    return { score, categories, labels, description };
  }

  /**
   * Simulates transaction risk check (placeholder for real API)
   */
  private async simulateTransactionRiskCheck(hash: string): Promise<{
    score: number;
    alerts: string[];
    sanctions: boolean;
    mixer: boolean;
    gambling: boolean;
    scam: boolean;
  }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const hashShort = hash.slice(2, 10);
    const score = parseInt(hashShort, 16) % 100;

    const alerts: string[] = [];
    const sanctions = score > 90;
    const mixer = score > 70 && score < 80;
    const gambling = score > 60 && score < 70;
    const scam = score > 85;

    if (sanctions) alerts.push('Transaction involves sanctioned address');
    if (mixer) alerts.push('Transaction involves mixer service');
    if (gambling) alerts.push('Transaction involves gambling service');
    if (scam) alerts.push('Transaction involves known scam address');

    return { score, alerts, sanctions, mixer, gambling, scam };
  }

  /**
   * Gets default risk score for failed checks
   */
  private getDefaultRiskScore(address: string): AddressRiskScore {
    return {
      address,
      riskScore: 50, // Medium risk by default when we can't check
      riskLevel: 'medium',
      categories: ['unknown'],
      labels: ['unable_to_verify'],
      description: 'Unable to verify address risk due to service unavailability'
    };
  }

  /**
   * Gets default transaction risk for failed checks
   */
  private getDefaultTransactionRisk(hash: string): TransactionRisk {
    return {
      hash,
      riskScore: 50,
      riskLevel: 'medium',
      alerts: ['Unable to verify transaction risk'],
      sanctions: false,
      mixer: false,
      gambling: false,
      scam: false
    };
  }

  /**
   * Maps risk score to risk level
   * Thresholds: 0–24 = low, 25–49 = medium, 50–74 = high, 75–100 = critical
   */
  private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 75) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 25) return 'medium';
    return 'low';
  }

  /**
   * Maps category to alert type
   */
  private mapCategoryToAlertType(category: string): SecurityAlert['type'] {
    const mapping: Record<string, SecurityAlert['type']> = {
      'sanctions': 'sanctions',
      'scam': 'scam',
      'mixer': 'mixer',
      'gambling': 'gambling',
      'malware': 'malware',
      'exchange_hack': 'exchange_hack'
    };
    return mapping[category] || 'scam'; // Default to scam
  }

  /**
   * Gets alert severity from risk level
   */
  private getAlertSeverity(riskLevel: string): SecurityAlert['severity'] {
    const mapping: Record<string, SecurityAlert['severity']> = {
      'critical': 'critical',
      'high': 'high',
      'medium': 'medium',
      'low': 'low'
    };
    return mapping[riskLevel] || 'medium';
  }

  /**
   * Gets data from cache
   * Returns null if the entry is missing or has exceeded CACHE_TTL
   */
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    // Treat stale entries as cache misses to force a fresh API call
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  /**
   * Sets data in cache
   * Stores the current timestamp so TTL can be checked on retrieval
   */
  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clears cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Gets cache statistics
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
    oldestEntry: number;
  } {
    const now = Date.now();
    const validEntries = Array.from(this.cache.values())
      .filter(entry => now - entry.timestamp < this.CACHE_TTL);

    return {
      size: validEntries.length,
      hitRate: 0, // Would need to track hits/misses
      oldestEntry: Math.min(...validEntries.map(entry => entry.timestamp))
    };
  }
}

// Default configuration for development
const defaultConfig: SecurityServiceConfig = {
  baseUrl: 'https://api.chainalysis.com/api/v2',
  timeout: 10000,
  // In production, this would be set via environment variables
  apiKey: typeof window !== 'undefined' ? (window as any).__CHAINALYSIS_API_KEY__ : undefined
};

// Export singleton instance
export const blockchainSecurity = BlockchainSecurityService.getInstance(defaultConfig);
