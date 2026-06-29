import { logger } from '@/utils/logger';
export interface AuditLogEntry {
  id: string;
  timestamp: number;
  eventType: 'wallet_connection' | 'wallet_disconnection' | 'transaction_signing' | 'signature_request' | 'network_switch' | 'account_switch' | 'security_alert' | 'auth_failure' | 'settings_change' | 'kyc_status_change' | 'transaction_initiation' | 'transaction_completion';
  userId?: string;
  walletAddress?: string;
  chainId?: number;
  details: Record<string, any>;
  riskScore: number;
  userAgent: string;
  ipAddress?: string;
  sessionId: string;
}

export interface SecurityAlert {
  id: string;
  timestamp: number;
  type: 'phishing_attempt' | 'suspicious_transaction' | 'rate_limit_exceeded' | 'malicious_signature' | 'domain_spoofing' | 'unusual_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: Record<string, any>;
  userId?: string;
  walletAddress?: string;
}

export interface AuditLogRotationConfig {
  maxLogSize: number;
  maxAlertSize: number;
  retentionPeriodMs: number;
  evictionThreshold: number;
  remoteExportUrl?: string;
}

export class SecurityAuditLogger {
  private static instance: SecurityAuditLogger;
  private logs: AuditLogEntry[] = [];
  private alerts: SecurityAlert[] = [];
  private sessionId: string;
  private readonly MAX_LOG_SIZE = 10000;
  private readonly MAX_ALERT_SIZE = 1000;
  private readonly RETENTION_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;
  private readonly EVICTION_THRESHOLD = 0.9;
  private evictionCount = 0;
  private evictionWarningIssued = false;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.cleanupOldLogs();
  }

  static getInstance(): SecurityAuditLogger {
    if (!this.instance) {
      this.instance = new SecurityAuditLogger();
    }
    return this.instance;
  }

  /**
   * Logs a wallet connection event
   */
  logWalletConnection(
    walletAddress: string,
    walletType: string,
    chainId: number,
    validationResults: any,
    userId?: string
  ): void {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      eventType: 'wallet_connection',
      userId,
      walletAddress,
      chainId,
      details: {
        walletType,
        validationResults,
        domain: window.location.hostname,
        referrer: document.referrer
      },
      riskScore: this.calculateRiskScore(validationResults),
      userAgent: navigator.userAgent,
      sessionId: this.sessionId
    };

    this.addLog(entry);
  }

  /**
   * Logs a wallet disconnection event
   */
  logWalletDisconnection(walletAddress: string, userId?: string): void {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      eventType: 'wallet_disconnection',
      userId,
      walletAddress,
      details: {
        sessionDuration: Date.now() - this.getSessionStartTime(walletAddress)
      },
      riskScore: 0,
      userAgent: navigator.userAgent,
      sessionId: this.sessionId
    };

    this.addLog(entry);
  }

  /**
   * Logs a transaction signing event
   */
  logTransactionSigning(
    from: string,
    to: string,
    value: string,
    data: string,
    validationResults: any,
    userId?: string
  ): void {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      eventType: 'transaction_signing',
      userId,
      walletAddress: from,
      chainId: undefined, // Would need to get from current wallet state
      details: {
        transaction: {
          to,
          value,
          data: data.slice(0, 20) + '...', // Log only first 20 chars for security
          gasLimit: undefined, // Would need to get from transaction
        },
        validationResults
      },
      riskScore: this.calculateRiskScore(validationResults),
      userAgent: navigator.userAgent,
      sessionId: this.sessionId
    };

    this.addLog(entry);
  }

  /**
   * Logs a signature request event
   */
  logSignatureRequest(
    message: string,
    address: string,
    validationResults: any,
    userId?: string
  ): void {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      eventType: 'signature_request',
      userId,
      walletAddress: address,
      details: {
        message: message.slice(0, 100) + '...', // Log only first 100 chars
        validationResults,
        messageLength: message.length
      },
      riskScore: this.calculateRiskScore(validationResults),
      userAgent: navigator.userAgent,
      sessionId: this.sessionId
    };

    this.addLog(entry);
  }

  /**
   * Logs a network switch event
   */
  logNetworkSwitch(
    fromChainId: number,
    toChainId: number,
    walletAddress: string,
    userId?: string
  ): void {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      eventType: 'network_switch',
      userId,
      walletAddress,
      chainId: toChainId,
      details: {
        fromChainId,
        toChainId,
        networkChangeType: this.getNetworkChangeType(fromChainId, toChainId)
      },
      riskScore: this.calculateNetworkSwitchRisk(fromChainId, toChainId),
      userAgent: navigator.userAgent,
      sessionId: this.sessionId
    };

    this.addLog(entry);
  }

  /**
   * Logs an account switch event
   */
  logAccountSwitch(
    fromAddress: string,
    toAddress: string,
    userId?: string
  ): void {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      eventType: 'account_switch',
      userId,
      walletAddress: toAddress,
      details: {
        fromAddress,
        toAddress,
        addressChangeType: this.getAddressChangeType(fromAddress, toAddress)
      },
      riskScore: this.calculateAccountSwitchRisk(fromAddress, toAddress),
      userAgent: navigator.userAgent,
      sessionId: this.sessionId
    };

    this.addLog(entry);
  }

  /**
   * Creates a security alert
   */
  createSecurityAlert(
    type: SecurityAlert['type'],
    severity: SecurityAlert['severity'],
    message: string,
    details: Record<string, any>,
    userId?: string,
    walletAddress?: string
  ): void {
    const alert: SecurityAlert = {
      id: this.generateId(),
      timestamp: Date.now(),
      type,
      severity,
      message,
      details,
      userId,
      walletAddress
    };

    this.alerts.push(alert);

    if (this.alerts.length > this.MAX_ALERT_SIZE) {
      this.alerts.sort((a, b) => b.timestamp - a.timestamp);
      this.alerts = this.alerts.slice(0, Math.floor(this.MAX_ALERT_SIZE * 0.7));
    }

    this.notifySecurityAlert(alert);
  }

  /**
   * Gets all logs for a specific user
   */
  getUserLogs(userId: string, limit = 100): AuditLogEntry[] {
    return this.logs
      .filter(log => log.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Gets all logs for a specific wallet address
   */
  getWalletLogs(walletAddress: string, limit = 100): AuditLogEntry[] {
    return this.logs
      .filter(log => log.walletAddress === walletAddress)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Gets recent security alerts
   */
  getSecurityAlerts(limit = 50): SecurityAlert[] {
    return this.alerts
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Gets logs by event type
   */
  getLogsByEventType(eventType: AuditLogEntry['eventType'], limit = 100): AuditLogEntry[] {
    return this.logs
      .filter(log => log.eventType === eventType)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Logs a failed authentication attempt
   */
  logAuthFailure(
    reason: string,
    walletAddress?: string,
    userId?: string
  ): void {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      eventType: 'auth_failure',
      userId,
      walletAddress,
      details: { reason },
      riskScore: 40,
      userAgent: navigator.userAgent,
      sessionId: this.sessionId,
    };
    this.addLog(entry);
  }

  /**
   * Logs a user settings change
   */
  logSettingsChange(
    setting: string,
    previousValue: unknown,
    newValue: unknown,
    walletAddress?: string,
    userId?: string
  ): void {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      eventType: 'settings_change',
      userId,
      walletAddress,
      details: { setting, previousValue, newValue },
      riskScore: 5,
      userAgent: navigator.userAgent,
      sessionId: this.sessionId,
    };
    this.addLog(entry);
  }

  /**
   * Logs a KYC status change
   */
  logKycStatusChange(
    previousStatus: string,
    newStatus: string,
    walletAddress?: string,
    userId?: string
  ): void {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      eventType: 'kyc_status_change',
      userId,
      walletAddress,
      details: { previousStatus, newStatus },
      riskScore: 10,
      userAgent: navigator.userAgent,
      sessionId: this.sessionId,
    };
    this.addLog(entry);
  }

  /**
   * Logs a transaction initiation event
   */
  logTransactionInitiation(
    from: string,
    to: string,
    value: string,
    txType: string,
    userId?: string
  ): void {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      eventType: 'transaction_initiation',
      userId,
      walletAddress: from,
      details: { to, value, txType },
      riskScore: 15,
      userAgent: navigator.userAgent,
      sessionId: this.sessionId,
    };
    this.addLog(entry);
  }

  /**
   * Logs a transaction completion (success or failure)
   */
  logTransactionCompletion(
    txHash: string,
    from: string,
    success: boolean,
    errorMessage?: string,
    userId?: string
  ): void {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      eventType: 'transaction_completion',
      userId,
      walletAddress: from,
      details: { txHash, success, errorMessage },
      riskScore: success ? 0 : 20,
      userAgent: navigator.userAgent,
      sessionId: this.sessionId,
    };
    this.addLog(entry);
  }

  /**
   * Exports logs for analysis
   */
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    const exportData = {
      logs: this.logs,
      alerts: this.alerts,
      exportedAt: Date.now(),
      sessionId: this.sessionId
    };

    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    } else {
      // Simple CSV export
      const csvHeaders = ['id', 'timestamp', 'eventType', 'userId', 'walletAddress', 'riskScore'];
      const csvRows = this.logs.map(log => [
        log.id,
        log.timestamp,
        log.eventType,
        log.userId || '',
        log.walletAddress || '',
        log.riskScore
      ]);
      
      return [csvHeaders, ...csvRows].map(row => row.join(',')).join('\n');
    }
  }

  /**
   * Clears all logs (for privacy/security)
   */
  clearLogs(): void {
    this.logs = [];
    this.alerts = [];
  }

  /**
   * Adds a log entry and manages log size with LRU-by-time eviction
   */
  private addLog(entry: AuditLogEntry): void {
    this.logs.push(entry);

    if (this.logs.length > this.MAX_LOG_SIZE) {
      this.evictLRU();
    }

    if (!this.evictionWarningIssued && this.logs.length > this.MAX_LOG_SIZE * this.EVICTION_THRESHOLD) {
      console.warn(
        `[AuditLogger] Log storage at ${Math.round((this.logs.length / this.MAX_LOG_SIZE) * 100)}% capacity. Eviction will begin at ${this.MAX_LOG_SIZE} entries.`
      );
      this.evictionWarningIssued = true;
    }

    this.checkForSuspiciousPatterns(entry);
  }

  /**
   * Evicts oldest entries (LRU-by-time) and exports them before removal
   */
  private evictLRU(): void {
    const excess = this.logs.length - Math.floor(this.MAX_LOG_SIZE * 0.7);
    const toEvict = this.logs.splice(0, excess);
    this.evictionCount += toEvict.length;

    this.exportToRemoteSink(toEvict).catch(() => {
      console.warn('[AuditLogger] Remote export failed during eviction');
    });

    if (this.evictionCount % 1000 === 0) {
      console.warn(`[AuditLogger] ${this.evictionCount} total log entries evicted`);
    }
  }

  /**
   * Exports log entries to a remote sink before eviction
   */
  private async exportToRemoteSink(entries: AuditLogEntry[]): Promise<void> {
    const exportUrl = process.env.NEXT_PUBLIC_AUDIT_EXPORT_URL;
    if (!exportUrl) return;
    try {
      await fetch(exportUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries, sessionId: this.sessionId, exportedAt: Date.now() }),
      });
    } catch {
      // Silently fail - export is best-effort
    }
  }

  /**
   * Checks for suspicious patterns in logs
   */
  private checkForSuspiciousPatterns(entry: AuditLogEntry): void {
    // Check for rapid wallet connections
    const recentConnections = this.logs.filter(log => 
      log.eventType === 'wallet_connection' &&
      log.walletAddress === entry.walletAddress &&
      log.timestamp > Date.now() - 60000 // Last minute
    );

    if (recentConnections.length > 5) {
      this.createSecurityAlert(
        'unusual_activity',
        'medium',
        'Multiple wallet connections detected in short time',
        { connectionCount: recentConnections.length, timeframe: '1 minute' },
        entry.userId,
        entry.walletAddress
      );
    }

    // Check for high-risk transactions
    if (entry.eventType === 'transaction_signing' && entry.riskScore > 70) {
      this.createSecurityAlert(
        'suspicious_transaction',
        'high',
        'High-risk transaction detected',
        entry.details,
        entry.userId,
        entry.walletAddress
      );
    }
  }

  /**
   * Notifies about security alerts
   */
  private notifySecurityAlert(alert: SecurityAlert): void {
    // In a real implementation, this would send notifications to security team
    logger.warn('Security Alert:', alert);
    
    // Could also integrate with external monitoring services
    if (alert.severity === 'critical') {
      // Immediate notification for critical alerts
      this.sendCriticalAlert(alert);
    }
  }

  /**
   * Sends critical security alerts
   */
  private sendCriticalAlert(alert: SecurityAlert): void {
    // Integration with external security monitoring
    // This would typically send to services like:
    // - Security team email/Slack
    // - SIEM systems
    // - Incident response platforms
    logger.error('CRITICAL SECURITY ALERT:', alert);
  }

  /**
   * Calculates risk score from validation results
   */
  private calculateRiskScore(validationResults: any): number {
    if (!validationResults) return 0;
    return validationResults.riskScore || 0;
  }

  /**
   * Calculates network switch risk
   */
  private calculateNetworkSwitchRisk(fromChainId: number, toChainId: number): number {
    // Higher risk for switching to testnets or unusual networks
    const testnetIds = [5, 11155111, 80001, 97]; // Goerli, Sepolia, Mumbai, BSC Testnet
    if (testnetIds.includes(toChainId)) return 30;
    if (testnetIds.includes(fromChainId)) return 20;
    return 10;
  }

  /**
   * Gets network change type
   */
  private getNetworkChangeType(fromChainId: number, toChainId: number): string {
    if (fromChainId === toChainId) return 'no_change';
    const testnetIds = [5, 11155111, 80001, 97];
    const fromTestnet = testnetIds.includes(fromChainId);
    const toTestnet = testnetIds.includes(toChainId);
    
    if (fromTestnet && !toTestnet) return 'testnet_to_mainnet';
    if (!fromTestnet && toTestnet) return 'mainnet_to_testnet';
    return 'mainnet_to_mainnet';
  }

  /**
   * Calculates account switch risk
   */
  private calculateAccountSwitchRisk(fromAddress: string, toAddress: string): number {
    if (fromAddress === toAddress) return 0;
    // Higher risk for completely different addresses
    return 25;
  }

  /**
   * Gets address change type
   */
  private getAddressChangeType(fromAddress: string, toAddress: string): string {
    if (fromAddress === toAddress) return 'no_change';
    if (fromAddress.toLowerCase() === toAddress.toLowerCase()) return 'case_change';
    return 'different_address';
  }

  /**
   * Gets session start time for a wallet
   */
  private getSessionStartTime(walletAddress: string): number {
    const connectionLog = this.logs
      .filter(log => log.eventType === 'wallet_connection' && log.walletAddress === walletAddress)
      .sort((a, b) => a.timestamp - b.timestamp)[0];
    
    return connectionLog?.timestamp || Date.now();
  }

  /**
   * Cleans up old logs based on retention period
   */
  private cleanupOldLogs(): void {
    const cutoff = Date.now() - this.RETENTION_PERIOD_MS;
    const oldLogs = this.logs.filter(log => log.timestamp <= cutoff);
    const oldAlerts = this.alerts.filter(alert => alert.timestamp <= cutoff);

    if (oldLogs.length > 0) {
      this.exportToRemoteSink(oldLogs).catch(() => {});
    }

    this.logs = this.logs.filter(log => log.timestamp > cutoff);
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoff);
  }

  /**
   * Generates a unique ID
   */
  private generateId(): string {
    return crypto.randomUUID().replace(/-/g, '').substring(0, 9) + Date.now().toString(36);
  }

  /**
   * Generates a session ID
   */
  private generateSessionId(): string {
    return 'session_' + Date.now().toString(36) + '_' + crypto.randomUUID().replace(/-/g, '').substring(0, 9);
  }
}

// Export singleton instance
export const auditLogger = SecurityAuditLogger.getInstance();
