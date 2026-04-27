import { SecurityAuditLogger, auditLogger } from '../auditLogger';

// Mock window and document for browser APIs
Object.defineProperty(window, 'location', {
  value: { hostname: 'test.com' },
  writable: true
});

Object.defineProperty(window, 'navigator', {
  value: { userAgent: 'test-agent' },
  writable: true
});

Object.defineProperty(window, 'document', {
  value: { referrer: 'https://referrer.com' },
  writable: true
});

describe('SecurityAuditLogger', () => {
  let logger: SecurityAuditLogger;

  beforeEach(() => {
    // Reset singleton instance
    (SecurityAuditLogger as any).instance = null;
    logger = SecurityAuditLogger.getInstance();
    logger.clearLogs(); // Clear logs between tests
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = SecurityAuditLogger.getInstance();
      const instance2 = SecurityAuditLogger.getInstance();
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(logger);
    });
  });

  describe('logWalletConnection', () => {
    it('should log wallet connection event', () => {
      const validationResults = { isValid: true, riskScore: 10 };
      logger.logWalletConnection(
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
        'metamask',
        1,
        validationResults,
        'user123'
      );

      const logs = logger.getUserLogs('user123');
      expect(logs).toHaveLength(1);
      expect(logs[0].eventType).toBe('wallet_connection');
      expect(logs[0].walletAddress).toBe('0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45');
      expect(logs[0].chainId).toBe(1);
      expect(logs[0].details.walletType).toBe('metamask');
      expect(logs[0].details.validationResults).toBe(validationResults);
      expect(logs[0].riskScore).toBe(10);
    });

    it('should handle missing userId', () => {
      logger.logWalletConnection(
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
        'metamask',
        1,
        { isValid: true, riskScore: 0 }
      );

      const logs = logger.getWalletLogs('0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45');
      expect(logs).toHaveLength(1);
      expect(logs[0].userId).toBeUndefined();
    });
  });

  describe('logWalletDisconnection', () => {
    it('should log wallet disconnection event', () => {
      logger.logWalletDisconnection('0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45', 'user123');

      const logs = logger.getUserLogs('user123');
      expect(logs).toHaveLength(1);
      expect(logs[0].eventType).toBe('wallet_disconnection');
      expect(logs[0].walletAddress).toBe('0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45');
      expect(logs[0].riskScore).toBe(0);
    });
  });

  describe('logTransactionSigning', () => {
    it('should log transaction signing event', () => {
      const validationResults = { isValid: true, riskScore: 25 };
      logger.logTransactionSigning(
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
        '0x1234567890123456789012345678901234567890',
        '1000000000000000000',
        '0x',
        validationResults,
        'user123'
      );

      const logs = logger.getUserLogs('user123');
      expect(logs).toHaveLength(1);
      expect(logs[0].eventType).toBe('transaction_signing');
      expect(logs[0].walletAddress).toBe('0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45');
      expect(logs[0].details.transaction.to).toBe('0x1234567890123456789012345678901234567890');
      expect(logs[0].details.transaction.value).toBe('1000000000000000000');
      expect(logs[0].riskScore).toBe(25);
    });

    it('should truncate long transaction data', () => {
      const longData = '0x' + 'a'.repeat(100);
      logger.logTransactionSigning(
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
        '0x1234567890123456789012345678901234567890',
        '1000000000000000000',
        longData,
        { isValid: true, riskScore: 0 }
      );

      const logs = logger.getWalletLogs('0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45');
      expect(logs[0].details.transaction.data).toBe(longData.slice(0, 20) + '...');
    });
  });

  describe('logSignatureRequest', () => {
    it('should log signature request event', () => {
      const validationResults = { isValid: true, isMalicious: false };
      const message = 'Please sign this message';
      logger.logSignatureRequest(
        message,
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
        validationResults,
        'user123'
      );

      const logs = logger.getUserLogs('user123');
      expect(logs).toHaveLength(1);
      expect(logs[0].eventType).toBe('signature_request');
      expect(logs[0].walletAddress).toBe('0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45');
      expect(logs[0].details.message).toBe(message);
      expect(logs[0].details.messageLength).toBe(message.length);
    });

    it('should truncate long messages', () => {
      const longMessage = 'a'.repeat(200);
      logger.logSignatureRequest(
        longMessage,
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
        { isValid: true, isMalicious: false }
      );

      const logs = logger.getWalletLogs('0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45');
      expect(logs[0].details.message).toBe(longMessage.slice(0, 100) + '...');
    });
  });

  describe('logNetworkSwitch', () => {
    it('should log network switch event', () => {
      logger.logNetworkSwitch(1, 5, '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45', 'user123');

      const logs = logger.getUserLogs('user123');
      expect(logs).toHaveLength(1);
      expect(logs[0].eventType).toBe('network_switch');
      expect(logs[0].chainId).toBe(5);
      expect(logs[0].details.fromChainId).toBe(1);
      expect(logs[0].details.toChainId).toBe(5);
      expect(logs[0].details.networkChangeType).toBe('mainnet_to_testnet');
    });

    it('should calculate correct risk score for network switches', () => {
      logger.logNetworkSwitch(1, 5, '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45'); // mainnet to testnet
      logger.logNetworkSwitch(5, 1, '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45'); // testnet to mainnet

      const logs = logger.getWalletLogs('0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45');
      expect(logs[0].riskScore).toBe(20); // testnet to mainnet
      expect(logs[1].riskScore).toBe(30); // mainnet to testnet
    });
  });

  describe('logAccountSwitch', () => {
    it('should log account switch event', () => {
      const fromAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45';
      const toAddress = '0x1234567890123456789012345678901234567890';

      logger.logAccountSwitch(fromAddress, toAddress, 'user123');

      const logs = logger.getUserLogs('user123');
      expect(logs).toHaveLength(1);
      expect(logs[0].eventType).toBe('account_switch');
      expect(logs[0].walletAddress).toBe(toAddress);
      expect(logs[0].details.fromAddress).toBe(fromAddress);
      expect(logs[0].details.toAddress).toBe(toAddress);
      expect(logs[0].details.addressChangeType).toBe('different_address');
    });

    it('should handle case changes', () => {
      const address1 = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45';
      const address2 = '0x742d35cc6634c0532925a3b8d4c9db96c4b4db45';

      logger.logAccountSwitch(address1, address2);

      const logs = logger.getWalletLogs(address2);
      expect(logs[0].details.addressChangeType).toBe('case_change');
    });
  });

  describe('createSecurityAlert', () => {
    it('should create and store security alerts', () => {
      logger.createSecurityAlert(
        'phishing_attempt',
        'high',
        'Suspicious activity detected',
        { url: 'https://phishing.com' },
        'user123',
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45'
      );

      const alerts = logger.getSecurityAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('phishing_attempt');
      expect(alerts[0].severity).toBe('high');
      expect(alerts[0].message).toBe('Suspicious activity detected');
      expect(alerts[0].details.url).toBe('https://phishing.com');
    });
  });

  describe('getUserLogs', () => {
    it('should return logs for specific user', () => {
      logger.logWalletConnection('0x1', 'metamask', 1, {}, 'user1');
      logger.logWalletConnection('0x2', 'metamask', 1, {}, 'user2');
      logger.logWalletConnection('0x3', 'metamask', 1, {}, 'user1');

      const user1Logs = logger.getUserLogs('user1');
      const user2Logs = logger.getUserLogs('user2');

      expect(user1Logs).toHaveLength(2);
      expect(user2Logs).toHaveLength(1);
    });

    it('should limit results', () => {
      for (let i = 0; i < 5; i++) {
        logger.logWalletConnection(`0x${i}`, 'metamask', 1, {}, 'user1');
      }

      const logs = logger.getUserLogs('user1', 3);
      expect(logs).toHaveLength(3);
    });

    it('should return logs in reverse chronological order', () => {
      logger.logWalletConnection('0x1', 'metamask', 1, {}, 'user1');
      jest.advanceTimersByTime(1000);
      logger.logWalletConnection('0x2', 'metamask', 1, {}, 'user1');

      const logs = logger.getUserLogs('user1');
      expect(logs[0].walletAddress).toBe('0x2'); // Most recent first
      expect(logs[1].walletAddress).toBe('0x1');
    });
  });

  describe('getWalletLogs', () => {
    it('should return logs for specific wallet address', () => {
      const address1 = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45';
      const address2 = '0x1234567890123456789012345678901234567890';

      logger.logWalletConnection(address1, 'metamask', 1, {});
      logger.logWalletConnection(address2, 'metamask', 1, {});
      logger.logTransactionSigning(address1, address2, '1000', '0x', {});

      const address1Logs = logger.getWalletLogs(address1);
      const address2Logs = logger.getWalletLogs(address2);

      expect(address1Logs).toHaveLength(2); // connection + transaction
      expect(address2Logs).toHaveLength(1); // connection only
    });
  });

  describe('getLogsByEventType', () => {
    it('should return logs filtered by event type', () => {
      logger.logWalletConnection('0x1', 'metamask', 1, {});
      logger.logWalletDisconnection('0x1');
      logger.logTransactionSigning('0x1', '0x2', '1000', '0x', {});

      const connections = logger.getLogsByEventType('wallet_connection');
      const disconnections = logger.getLogsByEventType('wallet_disconnection');
      const transactions = logger.getLogsByEventType('transaction_signing');

      expect(connections).toHaveLength(1);
      expect(disconnections).toHaveLength(1);
      expect(transactions).toHaveLength(1);
    });
  });

  describe('exportLogs', () => {
    it('should export logs as JSON', () => {
      logger.logWalletConnection('0x1', 'metamask', 1, {});

      const jsonExport = logger.exportLogs('json');
      const parsed = JSON.parse(jsonExport);

      expect(parsed.logs).toHaveLength(1);
      expect(parsed.alerts).toHaveLength(0);
      expect(parsed.exportedAt).toBeDefined();
    });

    it('should export logs as CSV', () => {
      logger.logWalletConnection('0x1', 'metamask', 1, {}, 'user1');

      const csvExport = logger.exportLogs('csv');
      const lines = csvExport.split('\n');

      expect(lines[0]).toContain('id,timestamp,eventType,userId,walletAddress,riskScore');
      expect(lines).toHaveLength(2); // header + 1 data row
    });
  });

  describe('clearLogs', () => {
    it('should clear all logs and alerts', () => {
      logger.logWalletConnection('0x1', 'metamask', 1, {});
      logger.createSecurityAlert('test', 'low', 'test', {});

      expect(logger.getWalletLogs('0x1')).toHaveLength(1);
      expect(logger.getSecurityAlerts()).toHaveLength(1);

      logger.clearLogs();

      expect(logger.getWalletLogs('0x1')).toHaveLength(0);
      expect(logger.getSecurityAlerts()).toHaveLength(0);
    });
  });

  describe('automatic alert creation', () => {
    it('should create alert for rapid wallet connections', () => {
      const address = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45';

      // Log multiple connections in short time
      for (let i = 0; i < 6; i++) {
        logger.logWalletConnection(address, 'metamask', 1, {});
      }

      const alerts = logger.getSecurityAlerts();
      expect(alerts.some(alert => alert.type === 'unusual_activity')).toBe(true);
    });

    it('should create alert for high-risk transactions', () => {
      logger.logTransactionSigning(
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
        '0x1234567890123456789012345678901234567890',
        '1000000000000000000',
        '0x',
        { riskScore: 80 }
      );

      const alerts = logger.getSecurityAlerts();
      expect(alerts.some(alert => alert.type === 'suspicious_transaction')).toBe(true);
    });
  });

  describe('private methods', () => {
    describe('calculateRiskScore', () => {
      it('should extract risk score from validation results', () => {
        expect((logger as any).calculateRiskScore({ riskScore: 50 })).toBe(50);
        expect((logger as any).calculateRiskScore({})).toBe(0);
        expect((logger as any).calculateRiskScore(null)).toBe(0);
      });
    });

    describe('calculateNetworkSwitchRisk', () => {
      it('should calculate risk for network switches', () => {
        expect((logger as any).calculateNetworkSwitchRisk(1, 5)).toBe(30); // mainnet to testnet
        expect((logger as any).calculateNetworkSwitchRisk(5, 1)).toBe(20); // testnet to mainnet
        expect((logger as any).calculateNetworkSwitchRisk(1, 137)).toBe(10); // mainnet to mainnet
      });
    });

    describe('getNetworkChangeType', () => {
      it('should identify network change types', () => {
        expect((logger as any).getNetworkChangeType(1, 1)).toBe('no_change');
        expect((logger as any).getNetworkChangeType(1, 5)).toBe('mainnet_to_testnet');
        expect((logger as any).getNetworkChangeType(5, 1)).toBe('testnet_to_mainnet');
        expect((logger as any).getNetworkChangeType(1, 137)).toBe('mainnet_to_mainnet');
      });
    });

    describe('calculateAccountSwitchRisk', () => {
      it('should calculate risk for account switches', () => {
        expect((logger as any).calculateAccountSwitchRisk('0x1', '0x1')).toBe(0);
        expect((logger as any).calculateAccountSwitchRisk('0x1', '0x2')).toBe(25);
      });
    });

    describe('getAddressChangeType', () => {
      it('should identify address change types', () => {
        expect((logger as any).getAddressChangeType('0x1', '0x1')).toBe('no_change');
        expect((logger as any).getAddressChangeType('0x1', '0x2')).toBe('different_address');
        expect((logger as any).getAddressChangeType('0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45', '0x742d35cc6634c0532925a3b8d4c9db96c4b4db45')).toBe('case_change');
      });
    });

    describe('getSessionStartTime', () => {
      it('should return session start time', () => {
        const address = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45';
        logger.logWalletConnection(address, 'metamask', 1, {});

        const startTime = (logger as any).getSessionStartTime(address);
        expect(startTime).toBeDefined();
        expect(typeof startTime).toBe('number');
      });
    });

    describe('cleanupOldLogs', () => {
      it('should remove logs older than one week', () => {
        // Add a log
        logger.logWalletConnection('0x1', 'metamask', 1, {});

        // Mock time to be more than a week later
        const originalNow = Date.now;
        const weekLater = Date.now() + (8 * 24 * 60 * 60 * 1000);
        global.Date.now = jest.fn(() => weekLater);

        (logger as any).cleanupOldLogs();

        const logs = logger.getWalletLogs('0x1');
        expect(logs).toHaveLength(0);

        global.Date.now = originalNow;
      });
    });

    describe('generateId and generateSessionId', () => {
      it('should generate unique IDs', () => {
        const id1 = (logger as any).generateId();
        const id2 = (logger as any).generateId();
        const sessionId1 = (logger as any).generateSessionId();
        const sessionId2 = (logger as any).generateSessionId();

        expect(id1).not.toBe(id2);
        expect(sessionId1).not.toBe(sessionId2);
        expect(typeof id1).toBe('string');
        expect(typeof sessionId1).toBe('string');
        expect(sessionId1.startsWith('session_')).toBe(true);
      });
    });
  });

  describe('auditLogger export', () => {
    it('should export the singleton instance', () => {
      expect(auditLogger).toBeInstanceOf(SecurityAuditLogger);
      expect(auditLogger).toBe(SecurityAuditLogger.getInstance());
    });
  });
});