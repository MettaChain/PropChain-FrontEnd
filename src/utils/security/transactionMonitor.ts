import { logger } from '@/utils/logger';
export interface TransactionPattern {
  type: 'frequency' | 'value' | 'recipient' | 'timing' | 'gas_price';
  riskScore: number;
  description: string;
  detectedAt: number;
}

export interface AnomalyDetection {
  id: string;
  timestamp: number;
  walletAddress: string;
  anomalyType: 'unusual_frequency' | 'high_value' | 'suspicious_recipient' | 'gas_anomaly' | 'timing_pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  details: Record<string, any>;
  suggestedAction: string;
}

export interface TransactionMetrics {
  totalTransactions: number;
  totalValue: string;
  averageValue: string;
  uniqueRecipients: number;
  frequencyScore: number;
  riskScore: number;
  lastTransactionTime: number;
  transactionFrequency: number; // transactions per hour
}

export class TransactionMonitor {
  private static instance: TransactionMonitor;
  private transactionHistory: Map<string, any[]> = new Map(); // wallet -> transactions
  private anomalies: AnomalyDetection[] = [];
  private baselineMetrics: Map<string, TransactionMetrics> = new Map();
  private readonly ANALYSIS_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  static getInstance(): TransactionMonitor {
    if (!this.instance) {
      this.instance = new TransactionMonitor();
    }
    return this.instance;
  }

  /**
   * Adds a transaction for monitoring
   */
  addTransaction(
    walletAddress: string,
    transaction: {
      hash: string;
      to: string;
      value: string;
      gasUsed?: string;
      gasPrice?: string;
      timestamp: number;
      data?: string;
    }
  ): void {
    if (!this.transactionHistory.has(walletAddress)) {
      this.transactionHistory.set(walletAddress, []);
    }

    const history = this.transactionHistory.get(walletAddress)!;
    history.push(transaction);

    // Keep only recent transactions (last 24 hours)
    const cutoffTime = Date.now() - this.ANALYSIS_WINDOW;
    const recentTransactions = history.filter(tx => tx.timestamp > cutoffTime);
    this.transactionHistory.set(walletAddress, recentTransactions);

    // Analyze for anomalies
    this.analyzeTransaction(walletAddress, transaction, recentTransactions);

    // Update baseline metrics
    this.updateBaselineMetrics(walletAddress, recentTransactions);
  }

  /**
   * Analyzes a transaction for anomalies
   */
  private analyzeTransaction(
    walletAddress: string,
    transaction: any,
    history: any[]
  ): void {
    const anomalies: AnomalyDetection[] = [];

    // Check for unusual frequency
    const frequencyAnomaly = this.detectFrequencyAnomaly(walletAddress, history);
    if (frequencyAnomaly) anomalies.push(frequencyAnomaly);

    // Check for high value transactions
    const valueAnomaly = this.detectValueAnomaly(walletAddress, transaction, history);
    if (valueAnomaly) anomalies.push(valueAnomaly);

    // Check for suspicious recipients
    const recipientAnomaly = this.detectRecipientAnomaly(walletAddress, transaction, history);
    if (recipientAnomaly) anomalies.push(recipientAnomaly);

    // Check for gas anomalies
    const gasAnomaly = this.detectGasAnomaly(walletAddress, transaction, history);
    if (gasAnomaly) anomalies.push(gasAnomaly);

    // Check for timing patterns
    const timingAnomaly = this.detectTimingAnomaly(walletAddress, transaction, history);
    if (timingAnomaly) anomalies.push(timingAnomaly);

    // Store detected anomalies
    anomalies.forEach(anomaly => {
      this.anomalies.push(anomaly);
      this.notifyAnomaly(anomaly);
    });

    // Clean up old anomalies
    this.cleanupOldAnomalies();
  }

  /**
   * Detects unusual transaction frequency
   */
  private detectFrequencyAnomaly(walletAddress: string, history: any[]): AnomalyDetection | null {
    const recentHourTransactions = history.filter(tx => 
      tx.timestamp > Date.now() - (60 * 60 * 1000)
    );

    const transactionCount = recentHourTransactions.length;
    const baseline = this.baselineMetrics.get(walletAddress);

    // If more than 10 transactions in an hour, flag as anomaly
    if (transactionCount > 10) {
      return {
        id: this.generateId(),
        timestamp: Date.now(),
        walletAddress,
        anomalyType: 'unusual_frequency',
        severity: transactionCount > 20 ? 'high' : 'medium',
        description: `Unusually high transaction frequency: ${transactionCount} transactions in the last hour`,
        details: {
          transactionCount,
          timeframe: '1 hour',
          baselineAverage: baseline?.transactionFrequency || 0
        },
        suggestedAction: 'Review recent transactions for potential unauthorized activity'
      };
    }

    return null;
  }

  /**
   * Detects high value transactions
   */
  private detectValueAnomaly(walletAddress: string, transaction: any, history: any[]): AnomalyDetection | null {
    const transactionValue = BigInt(transaction.value || '0');
    const baseline = this.baselineMetrics.get(walletAddress);

    if (!baseline || history.length < 3) return null; // Need baseline data

    const averageValue = BigInt(baseline.averageValue || '0');
    const threshold = averageValue * BigInt(5); // 5x average value

    if (transactionValue > threshold && transactionValue > BigInt('1000000000000000000')) { // > 1 ETH
      return {
        id: this.generateId(),
        timestamp: Date.now(),
        walletAddress,
        anomalyType: 'high_value',
        severity: transactionValue > BigInt('10000000000000000000') ? 'critical' : 'high', // > 10 ETH
        description: `High value transaction detected: ${this.formatEther(transactionValue)} ETH`,
        details: {
          transactionValue: transaction.value,
          averageValue: baseline.averageValue,
          multiple: Number(transactionValue / averageValue)
        },
        suggestedAction: 'Verify transaction legitimacy and confirm with user'
      };
    }

    return null;
  }

  /**
   * Detects suspicious recipients
   */
  private detectRecipientAnomaly(walletAddress: string, transaction: any, history: any[]): AnomalyDetection | null {
    const recipient = transaction.to;
    if (!recipient) return null;

    // Check for transactions to known suspicious addresses
    if (this.isSuspiciousAddress(recipient)) {
      return {
        id: this.generateId(),
        timestamp: Date.now(),
        walletAddress,
        anomalyType: 'suspicious_recipient',
        severity: 'high',
        description: `Transaction to suspicious address detected: ${recipient}`,
        details: {
          recipient,
          reason: 'Address flagged in security database'
        },
        suggestedAction: 'Block transaction and investigate immediately'
      };
    }

    // Check for new recipient (first time interaction)
    const previousRecipients = new Set(history.map(tx => tx.to).filter(Boolean));
    if (!previousRecipients.has(recipient) && history.length > 5) {
      return {
        id: this.generateId(),
        timestamp: Date.now(),
        walletAddress,
        anomalyType: 'suspicious_recipient',
        severity: 'low',
        description: `First time transaction to new recipient: ${recipient}`,
        details: {
          recipient,
          totalPreviousRecipients: previousRecipients.size
        },
        suggestedAction: 'Verify recipient address with user'
      };
    }

    return null;
  }

  /**
   * Detects gas price anomalies
   */
  private detectGasAnomaly(walletAddress: string, transaction: any, history: any[]): AnomalyDetection | null {
    const gasPrice = transaction.gasPrice;
    if (!gasPrice) return null;

    const gasPriceBN = BigInt(gasPrice);
    const baseline = this.baselineMetrics.get(walletAddress);

    if (!baseline || history.length < 3) return null;

    // Calculate average gas price from history
    const gasPrices = history
      .map(tx => tx.gasPrice ? BigInt(tx.gasPrice) : BigInt(0))
      .filter(price => price > BigInt(0));

    if (gasPrices.length === 0) return null;

    const averageGasPrice = gasPrices.reduce((sum, price) => sum + price, BigInt(0)) / BigInt(gasPrices.length);
    const threshold = averageGasPrice * BigInt(3); // 3x average gas price

    if (gasPriceBN > threshold) {
      return {
        id: this.generateId(),
        timestamp: Date.now(),
        walletAddress,
        anomalyType: 'gas_anomaly',
        severity: 'medium',
        description: `Unusually high gas price detected`,
        details: {
          gasPrice,
          averageGasPrice: averageGasPrice.toString(),
          multiple: Number(gasPriceBN / averageGasPrice)
        },
        suggestedAction: 'Review for potential front-running or MEV extraction'
      };
    }

    return null;
  }

  /**
   * Detects unusual timing patterns
   */
  private detectTimingAnomaly(walletAddress: string, transaction: any, history: any[]): AnomalyDetection | null {
    const currentHour = new Date(transaction.timestamp).getHours();
    
    // Check for transactions at unusual hours (e.g., 2-4 AM)
    if (currentHour >= 2 && currentHour <= 4) {
      const unusualHourTransactions = history.filter(tx => {
        const hour = new Date(tx.timestamp).getHours();
        return hour >= 2 && hour <= 4;
      });

      if (unusualHourTransactions.length > 3) {
        return {
          id: this.generateId(),
          timestamp: Date.now(),
          walletAddress,
          anomalyType: 'timing_pattern',
          severity: 'low',
          description: `Multiple transactions during unusual hours (2-4 AM)`,
          details: {
            hour: currentHour,
            unusualHourTransactionCount: unusualHourTransactions.length
          },
          suggestedAction: 'Monitor for potential automated or unauthorized activity'
        };
      }
    }

    return null;
  }

  /**
   * Updates baseline metrics for a wallet
   */
  private updateBaselineMetrics(walletAddress: string, history: any[]): void {
    if (history.length === 0) return;

    const totalValue = history.reduce((sum, tx) => {
      const value = BigInt(tx.value || '0');
      return sum + value;
    }, BigInt(0));

    const averageValue = totalValue / BigInt(history.length);
    const uniqueRecipients = new Set(history.map(tx => tx.to).filter(Boolean)).size;
    const lastTransactionTime = Math.max(...history.map(tx => tx.timestamp));
    const frequencyScore = this.calculateFrequencyScore(history);

    const metrics: TransactionMetrics = {
      totalTransactions: history.length,
      totalValue: totalValue.toString(),
      averageValue: averageValue.toString(),
      uniqueRecipients,
      frequencyScore,
      riskScore: this.calculateRiskScore(history),
      lastTransactionTime,
      transactionFrequency: history.length / 24 // transactions per hour (24h window)
    };

    this.baselineMetrics.set(walletAddress, metrics);
  }

  /**
   * Calculates transaction frequency score
   */
  private calculateFrequencyScore(history: any[]): number {
    if (history.length < 2) return 0;

    const timeDiffs = [];
    for (let i = 1; i < history.length; i++) {
      timeDiffs.push(history[i].timestamp - history[i - 1].timestamp);
    }

    const avgTimeDiff = timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length;
    const hourlyFrequency = (60 * 60 * 1000) / avgTimeDiff;

    return Math.min(hourlyFrequency / 10, 100); // Normalize to 0-100
  }

  /**
   * Calculates overall risk score for transactions
   */
  private calculateRiskScore(history: any[]): number {
    let riskScore = 0;

    // High value transactions increase risk
    const highValueCount = history.filter(tx => 
      BigInt(tx.value || '0') > BigInt('1000000000000000000') // > 1 ETH
    ).length;
    riskScore += highValueCount * 10;

    // Many different recipients increase risk
    const uniqueRecipients = new Set(history.map(tx => tx.to).filter(Boolean)).size;
    riskScore += uniqueRecipients > 10 ? 20 : uniqueRecipients * 2;

    // High frequency increases risk
    riskScore += this.calculateFrequencyScore(history);

    return Math.min(riskScore, 100);
  }

  /**
   * Gets transaction metrics for a wallet
   */
  getWalletMetrics(walletAddress: string): TransactionMetrics | null {
    return this.baselineMetrics.get(walletAddress) || null;
  }

  /**
   * Gets recent anomalies for a wallet
   */
  getWalletAnomalies(walletAddress: string, limit = 10): AnomalyDetection[] {
    return this.anomalies
      .filter(anomaly => anomaly.walletAddress === walletAddress)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Gets all recent anomalies
   */
  getAllAnomalies(limit = 50): AnomalyDetection[] {
    return this.anomalies
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Gets risk assessment for a wallet
   */
  getRiskAssessment(walletAddress: string): {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    riskScore: number;
    factors: string[];
    recommendations: string[];
  } {
    const metrics = this.baselineMetrics.get(walletAddress);
    const recentAnomalies = this.getWalletAnomalies(walletAddress, 10);

    if (!metrics) {
      return {
        riskLevel: 'low',
        riskScore: 0,
        factors: ['No transaction history'],
        recommendations: ['Monitor transaction patterns']
      };
    }

    const factors: string[] = [];
    let riskScore = metrics.riskScore;

    // Add anomaly-based risk
    recentAnomalies.forEach(anomaly => {
      switch (anomaly.severity) {
        case 'critical': riskScore += 30; break;
        case 'high': riskScore += 20; break;
        case 'medium': riskScore += 10; break;
        case 'low': riskScore += 5; break;
      }
      factors.push(anomaly.description);
    });

    // Add metric-based factors
    if (metrics.transactionFrequency > 5) {
      factors.push('High transaction frequency');
      riskScore += 15;
    }

    if (metrics.uniqueRecipients > 20) {
      factors.push('Many different recipients');
      riskScore += 10;
    }

    const avgValue = BigInt(metrics.averageValue);
    if (avgValue > BigInt('500000000000000000')) { // > 0.5 ETH average
      factors.push('High average transaction value');
      riskScore += 15;
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (riskScore >= 75) riskLevel = 'critical';
    else if (riskScore >= 50) riskLevel = 'high';
    else if (riskScore >= 25) riskLevel = 'medium';

    // Generate recommendations
    const recommendations: string[] = [];
    if (riskScore >= 50) {
      recommendations.push('Enable additional security verification');
      recommendations.push('Review all recent transactions');
    }
    if (recentAnomalies.length > 0) {
      recommendations.push('Investigate detected anomalies');
    }
    if (metrics.transactionFrequency > 5) {
      recommendations.push('Consider rate limiting for this wallet');
    }

    return {
      riskLevel,
      riskScore: Math.min(riskScore, 100),
      factors,
      recommendations
    };
  }

  /**
   * Checks if an address is suspicious
   */
  private isSuspiciousAddress(address: string): boolean {
    // This would integrate with external security databases
    // For now, return false as placeholder
    return false;
  }

  /**
   * Formats ether values
   */
  private formatEther(wei: bigint): string {
    const ether = Number(wei) / 1e18;
    return ether.toFixed(4);
  }

  /**
   * Notifies about detected anomalies
   */
  private notifyAnomaly(anomaly: AnomalyDetection): void {
    logger.warn('Transaction Anomaly Detected:', anomaly);
    
    // In a real implementation, this would:
    // - Send alerts to security team
    // - Integrate with monitoring systems
    // - Potentially block suspicious transactions
  }

  /**
   * Cleans up old anomalies
   */
  private cleanupOldAnomalies(): void {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    this.anomalies = this.anomalies.filter(anomaly => anomaly.timestamp > oneWeekAgo);
  }

  /**
   * Generates a unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

// Export singleton instance
export const transactionMonitor = TransactionMonitor.getInstance();
