import { parseEther } from 'viem';
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
  /**
   * True only when the score came from a real screening provider. False when
   * the provider is unconfigured/unavailable — callers must not present the
   * score as a real risk signal in that case.
   */
  verified: boolean;
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
  /**
   * True only when a real transaction-risk provider produced this result.
   */
  verified: boolean;
}

export interface SecurityAlert {
  /** Alert type indicating the security category */
  type: 'sanctions' | 'scam' | 'mixer' | 'gambling' | 'malware' | 'exchange_hack';
  /** Alert severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Human-readable description of the alert */
  description: string;
  /** Source system that generated the alert */
  source: string;
  /** Unix timestamp of when the alert was generated */
  timestamp: number;
}

/**
 * Normalises a transaction value string into a BigInt.
 * Handles hex strings (0x-prefixed), scientific notation, and decimal strings.
 * Throws a typed error for unparseable values.
 */
function normalizeToBigInt(value: string): bigint {
  if (typeof value !== 'string' || value.length === 0) {
    throw new BlockchainSecurityError(
      'Invalid value: must be a non-empty string',
      'INVALID_VALUE'
    );
  }

  let normalised = value.trim();

  // Handle hex (0x-prefixed) — viem-style wei values
  if (normalised.startsWith('0x') || normalised.startsWith('0X')) {
    try {
      return BigInt(normalised);
    } catch {
      throw new BlockchainSecurityError(
        `Unable to parse hex value: "${normalised}"`,
        'INVALID_HEX_VALUE'
      );
    }
  }

  // Handle scientific notation (e.g. "1e18", "1.5e-3")
  if (/[eE]/.test(normalised)) {
    const asNumber = Number(normalised);
    if (!Number.isFinite(asNumber)) {
      throw new BlockchainSecurityError(
        `Scientific notation overflow: "${normalised}"`,
        'VALUE_OVERFLOW'
      );
    }
    // Convert to a whole-number string suitable for BigInt
    try {
      return BigInt(Math.round(asNumber));
    } catch {
      throw new BlockchainSecurityError(
        `Unable to parse scientific notation: "${normalised}"`,
        'INVALID_SCI_VALUE'
      );
    }
  }

  // Handle fractional decimal (e.g. "1.5" — treat as ether value)
  if (normalised.includes('.')) {
    try {
      return parseEther(normalised as `${number}`);
    } catch {
      throw new BlockchainSecurityError(
        `Unable to parse decimal ether value: "${normalised}"`,
        'INVALID_ETHER_VALUE'
      );
    }
  }

  // Plain decimal string (wei)
  try {
    return BigInt(normalised);
  } catch {
    throw new BlockchainSecurityError(
      `Unable to parse value: "${normalised}"`,
      'INVALID_VALUE'
    );
  }
}

export class BlockchainSecurityError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'BlockchainSecurityError';
    this.code = code;
  }
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
   * Checks address risk score using a Chainalysis-like service.
   *
   * Returns an "unable to verify" result (`verified: false`) whenever the
   * service is not configured or unavailable, instead of fabricating a score.
   */
  async checkAddressRisk(address: string): Promise<AddressRiskScore> {
    const cacheKey = `address_${address}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Call the local API proxy route which securely holds the API key server-side.
      // This avoids exposing the key in the client bundle.
      const baseUrl = typeof window !== 'undefined'
        ? window.location.origin
        : this.config.baseUrl;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      let response;
      try {
        response = await fetch(
          `${baseUrl}/api/security/address-check?address=${encodeURIComponent(address)}`,
          { signal: controller.signal }
        );
      } finally {
        clearTimeout(timeoutId);
      }

      if (response && response.ok) {
        const body = await response.json();
        const score = typeof body.risk_score === 'number' ? body.risk_score : null;
        const verified = score !== null && body.verified !== false;

        // No trustworthy score: report honestly rather than guessing.
        if (!verified || score === null) {
          const result = this.getDefaultRiskScore(address);
          this.setCache(cacheKey, result);
          return result;
        }

        const categories = Array.isArray(body.categories) ? body.categories : [];
        const result: AddressRiskScore = {
          address,
          riskScore: score,
          riskLevel: this.getRiskLevel(score),
          categories,
          labels: Array.isArray(body.labels) ? body.labels : [],
          description: body.description || '',
          verified: true
        };
        this.setCache(cacheKey, result);
        return result;
      }

      // Proxy unavailable: no verified risk data exists, so report honestly.
      const result = this.getDefaultRiskScore(address);
      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      logger.error('Failed to check address risk:', error);
      return this.getDefaultRiskScore(address);
    }
  }

  /**
   * Checks transaction risk.
   *
   * No real transaction-risk data source is integrated yet, so this returns the
   * honest "unable to verify" result instead of deriving a score from the hash.
   */
  async checkTransactionRisk(hash: string): Promise<TransactionRisk> {
    const cacheKey = `tx_${hash}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const result = this.getDefaultTransactionRisk(hash);
    this.setCache(cacheKey, result);
    return result;
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
    verified: boolean;
  }> {
    const warnings: string[] = [];
    const blocks: string[] = [];
    let totalRiskScore = 0;
    let allVerified = true;

    try {
      // Check sender risk — use the highest risk score seen across all checks
      const senderRisk = await this.checkAddressRisk(from);
      allVerified = allVerified && senderRisk.verified;
      totalRiskScore = Math.max(totalRiskScore, senderRisk.riskScore);

      // Critical risk blocks the transaction; high risk only warns
      if (senderRisk.riskLevel === 'critical') {
        blocks.push('Sender address has critical risk level');
      } else if (senderRisk.riskLevel === 'high') {
        warnings.push('Sender address has high risk level');
      }

      // Check recipient risk independently — both parties must be evaluated
      const recipientRisk = await this.checkAddressRisk(to);
      allVerified = allVerified && recipientRisk.verified;
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

      // Check for high-value transaction to risky address
      const valueBN = normalizeToBigInt(value);
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
      allVerified = false;
      warnings.push('Unable to complete security validation');
    }

    return {
      isValid: blocks.length === 0,
      riskScore: totalRiskScore,
      warnings,
      blocks,
      verified: allVerified
    };
  }

  /**
   * Gets the honest default for checks that could not be performed.
   */
  private getDefaultRiskScore(address: string): AddressRiskScore {
    return {
      address,
      riskScore: 50, // Medium risk by default when we can't check
      riskLevel: 'medium',
      categories: ['unknown'],
      labels: ['unable_to_verify'],
      description: 'Unable to verify address risk due to service unavailability',
      verified: false
    };
  }

  /**
   * Gets the honest default for transaction checks that could not be performed.
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
      scam: false,
      verified: false
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
  baseUrl: 'http://localhost:3000',
  timeout: 10000,
  // API key is now configured only on the server side via CHAINALYSIS_API_KEY env var.
  // The browser never has access to this key.
  apiKey: undefined
};

// Client-side proxy: calls our own API endpoint so the API key never reaches the browser.
export async function checkAddressRiskViaProxy(address: string): Promise<AddressRiskScore> {
  const res = await fetch(`/api/security/address-check?address=${encodeURIComponent(address)}`);
  if (!res.ok) {
    return {
      address,
      riskScore: 50,
      riskLevel: 'medium',
      categories: ['unknown'],
      labels: ['unable_to_verify'],
      description: 'Unable to verify address risk via proxy',
      verified: false
    };
  }
  const body = await res.json();
  const hasScore = typeof body.risk_score === 'number';
  return {
    address,
    riskScore: hasScore ? body.risk_score : 50,
    riskLevel: body.risk_level ?? 'medium',
    categories: Array.isArray(body.categories) ? body.categories : [],
    labels: Array.isArray(body.labels) ? body.labels : [],
    description: body.description ?? '',
    verified: hasScore && body.verified !== false
  };
}

export const blockchainSecurity = BlockchainSecurityService.getInstance(defaultConfig);
