'use client';

import { useCallback, useEffect, useState } from 'react';
import { useWalletStore } from '@/store/walletStore';
import { auditLogger } from '@/utils/security/auditLogger';
import { transactionMonitor } from '@/utils/security/transactionMonitor';
import { blockchainSecurity } from '@/utils/security/blockchainSecurity';
import { RateLimiter, RateLimiters } from '@/utils/security/rateLimiter';
import { WalletValidator } from '@/utils/security/walletValidator';
import { PhishingProtection } from '@/utils/security/phishingProtection';

export interface SecurityState {
  isSecure: boolean;
  riskScore: number;
  warnings: string[];
  alerts: string[];
  rateLimitStatus: {
    walletConnections: { allowed: boolean; remaining: number; retryAfter?: number };
    transactions: { allowed: boolean; remaining: number; retryAfter?: number };
    signatures: { allowed: boolean; remaining: number; retryAfter?: number };
  };
  lastSecurityCheck: number;
}

export interface TransactionValidation {
  isValid: boolean;
  riskScore: number;
  warnings: string[];
  blocks: string[];
  requiresConfirmation: boolean;
  details: any;
}

export const useSecurity = () => {
  const { address, isConnected, chainId } = useWalletStore();
  const [securityState, setSecurityState] = useState<SecurityState>({
    isSecure: true,
    riskScore: 0,
    warnings: [],
    alerts: [],
    rateLimitStatus: {
      walletConnections: { allowed: true, remaining: 5 },
      transactions: { allowed: true, remaining: 10 },
      signatures: { allowed: true, remaining: 3 }
    },
    lastSecurityCheck: Date.now()
  });

  const walletRateLimiter = RateLimiter.getInstance('wallet', RateLimiters.WALLET_CONNECTION);
  const transactionRateLimiter = RateLimiter.getInstance('transactions', RateLimiters.TRANSACTION_SIGNING);
  const signatureRateLimiter = RateLimiter.getInstance('signatures', RateLimiters.SIGNATURE_REQUESTS);

  /**
   * Validates wallet connection with comprehensive security checks
   */
  const validateWalletConnection = useCallback(async (
    walletAddress: string,
    walletType: string,
    chainId: number
  ): Promise<{ isValid: boolean; warnings: string[]; blocks: string[] }> => {
    const warnings: string[] = [];
    const blocks: string[] = [];

    try {
      // Rate limiting check
      const rateLimitResult = walletRateLimiter.check(walletAddress);
      if (!rateLimitResult.allowed) {
        blocks.push(`Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds`);
        return { isValid: false, warnings, blocks };
      }

      // Domain verification
      const domainVerification = WalletValidator.verifyDomain();
      if (!domainVerification.isVerified) {
        warnings.push(...domainVerification.warnings);
        if (domainVerification.warnings.some(w => w.includes('blacklisted'))) {
          blocks.push('Domain is blacklisted for security reasons');
        }
      }

      // Wallet validation
      const walletValidation = await WalletValidator.validateWalletConnection(
        walletAddress,
        walletType,
        chainId
      );
      
      warnings.push(...walletValidation.warnings);
      if (!walletValidation.isValid) {
        blocks.push(...walletValidation.errors);
      }

      // Blockchain security check
      const addressRisk = await blockchainSecurity.checkAddressRisk(walletAddress);
      if (addressRisk.riskLevel === 'critical') {
        blocks.push('Address has critical security risk');
      } else if (addressRisk.riskLevel === 'high') {
        warnings.push('Address has elevated security risk');
      }

      // Phishing protection
      const phishingDetection = PhishingProtection.detectPhishing(window.location.href);
      if (phishingDetection.isPhishing) {
        blocks.push('Phishing attempt detected');
      }
      warnings.push(...phishingDetection.warnings);

      // Log the connection attempt
      auditLogger.logWalletConnection(
        walletAddress,
        walletType,
        chainId,
        { walletValidation, domainVerification, addressRisk, phishingDetection }
      );

      return {
        isValid: blocks.length === 0,
        warnings,
        blocks
      };

    } catch (error) {
      console.error('Wallet validation error:', error);
      blocks.push('Security validation failed');
      return { isValid: false, warnings, blocks };
    }
  }, [walletRateLimiter]);

  /**
   * Validates transaction before signing
   */
  const validateTransaction = useCallback(async (
    to: string,
    value: string,
    data: string
  ): Promise<TransactionValidation> => {
    if (!address) {
      return {
        isValid: false,
        riskScore: 100,
        warnings: ['Wallet not connected'],
        blocks: ['Wallet must be connected'],
        requiresConfirmation: false,
        details: null
      };
    }

    const warnings: string[] = [];
    const blocks: string[] = [];
    let totalRiskScore = 0;
    let requiresConfirmation = false;

    try {
      // Rate limiting check
      const rateLimitResult = transactionRateLimiter.check(address);
      if (!rateLimitResult.allowed) {
        blocks.push(`Transaction rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds`);
        return {
          isValid: false,
          riskScore: 100,
          warnings,
          blocks,
          requiresConfirmation: false,
          details: null
        };
      }

      // Basic transaction validation
      const transactionValidation = WalletValidator.validateTransaction(to, value, data, address);
      warnings.push(...transactionValidation.warnings);
      totalRiskScore += transactionValidation.riskScore;
      if (!transactionValidation.isValid) {
        blocks.push(...transactionValidation.errors);
      }

      // Blockchain security validation
      const securityValidation = await blockchainSecurity.validateTransaction(address, to, value);
      warnings.push(...securityValidation.warnings);
      blocks.push(...securityValidation.blocks);
      totalRiskScore = Math.max(totalRiskScore, securityValidation.riskScore);

      // Phishing protection for transaction data
      if (data && data !== '0x') {
        const transactionDataValidation = PhishingProtection.validateTransactionData(to, data);
        if (transactionDataValidation.isMalicious) {
          blocks.push('Suspicious transaction data detected');
        }
        warnings.push(...transactionDataValidation.warnings);
      }

      // Determine if confirmation is required
      requiresConfirmation = 
        totalRiskScore > 30 ||
        warnings.length > 0 ||
        BigInt(value) > BigInt('100000000000000000'); // > 0.1 ETH

      // Log the transaction attempt
      auditLogger.logTransactionSigning(address, to, value, data, {
        transactionValidation,
        securityValidation,
        totalRiskScore
      });

      return {
        isValid: blocks.length === 0,
        riskScore: totalRiskScore,
        warnings,
        blocks,
        requiresConfirmation,
        details: {
          transactionValidation,
          securityValidation,
          phishingCheck: data ? PhishingProtection.validateTransactionData(to, data) : null
        }
      };

    } catch (error) {
      console.error('Transaction validation error:', error);
      blocks.push('Transaction validation failed');
      return {
        isValid: false,
        riskScore: 100,
        warnings,
        blocks,
        requiresConfirmation: false,
        details: null
      };
    }
  }, [address, transactionRateLimiter]);

  /**
   * Validates signature requests
   */
  const validateSignature = useCallback(async (
    message: string,
    signature?: string
  ): Promise<{ isValid: boolean; warnings: string[]; blocks: string[]; safeMessage?: string }> => {
    if (!address) {
      return {
        isValid: false,
        warnings: ['Wallet not connected'],
        blocks: ['Wallet must be connected']
      };
    }

    const warnings: string[] = [];
    const blocks: string[] = [];

    try {
      // Rate limiting check
      const rateLimitResult = signatureRateLimiter.check(address);
      if (!rateLimitResult.allowed) {
        blocks.push(`Signature rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds`);
        return { isValid: false, warnings, blocks };
      }

      // Create secure signature request
      const secureRequest = PhishingProtection.createSecureSignatureRequest(message, window.location.origin);
      warnings.push(...secureRequest.warnings);

      // If signature is provided, validate it
      if (signature) {
        const signatureValidation = await PhishingProtection.validateSignature(message, signature, address);
        if (!signatureValidation.isValid) {
          blocks.push('Invalid signature');
        }
        if (signatureValidation.isMalicious) {
          blocks.push('Malicious signature detected');
        }
        warnings.push(...signatureValidation.warnings);
      }

      // Log the signature request
      auditLogger.logSignatureRequest(message, address, { secureRequest, signature });

      return {
        isValid: blocks.length === 0,
        warnings,
        blocks,
        safeMessage: secureRequest.safeMessage
      };

    } catch (error) {
      console.error('Signature validation error:', error);
      blocks.push('Signature validation failed');
      return { isValid: false, warnings, blocks };
    }
  }, [address, signatureRateLimiter]);

  /**
   * Monitors completed transactions for anomalies
   */
  const monitorTransaction = useCallback((
    hash: string,
    to: string,
    value: string,
    gasUsed?: string,
    gasPrice?: string
  ) => {
    if (!address) return;

    transactionMonitor.addTransaction(address, {
      hash,
      to,
      value,
      gasUsed,
      gasPrice,
      timestamp: Date.now()
    });
  }, [address]);

  /**
   * Gets comprehensive risk assessment for current wallet
   */
  const getRiskAssessment = useCallback(() => {
    if (!address) return null;

    const metrics = transactionMonitor.getWalletMetrics(address);
    const anomalies = transactionMonitor.getWalletAnomalies(address);
    const riskAssessment = transactionMonitor.getRiskAssessment(address);

    return {
      metrics,
      anomalies,
      assessment: riskAssessment
    };
  }, [address]);

  /**
   * Updates security state
   */
  const updateSecurityState = useCallback(() => {
    if (!address) return;

    // Update rate limit status
    const walletRateLimit = walletRateLimiter.check(address);
    const transactionRateLimit = transactionRateLimiter.check(address);
    const signatureRateLimit = signatureRateLimiter.check(address);

    // Get risk assessment
    const riskAssessment = getRiskAssessment();
    const baseRiskScore = riskAssessment?.assessment.riskScore || 0;

    // Get recent alerts
    const recentAlerts = auditLogger.getSecurityAlerts(5);
    const alertMessages = recentAlerts.map(alert => alert.message);

    setSecurityState(prev => ({
      ...prev,
      isSecure: baseRiskScore < 50 && alertMessages.filter(a => a.includes('critical')).length === 0,
      riskScore: baseRiskScore,
      warnings: riskAssessment?.assessment.factors || [],
      alerts: alertMessages,
      rateLimitStatus: {
        walletConnections: {
          allowed: walletRateLimit.allowed,
          remaining: walletRateLimit.remainingAttempts,
          retryAfter: walletRateLimit.retryAfter
        },
        transactions: {
          allowed: transactionRateLimit.allowed,
          remaining: transactionRateLimit.remainingAttempts,
          retryAfter: transactionRateLimit.retryAfter
        },
        signatures: {
          allowed: signatureRateLimit.allowed,
          remaining: signatureRateLimit.remainingAttempts,
          retryAfter: signatureRateLimit.retryAfter
        }
      },
      lastSecurityCheck: Date.now()
    }));
  }, [address, walletRateLimiter, transactionRateLimiter, signatureRateLimiter, getRiskAssessment]);

  /**
   * Handles wallet disconnection with security logging
   */
  const handleWalletDisconnection = useCallback(() => {
    if (address) {
      auditLogger.logWalletDisconnection(address);
    }
  }, [address]);

  /**
   * Handles network switching with security logging
   */
  const handleNetworkSwitch = useCallback((fromChainId: number, toChainId: number) => {
    if (address) {
      auditLogger.logNetworkSwitch(fromChainId, toChainId, address);
    }
  }, [address]);

  // Update security state when wallet changes
  useEffect(() => {
    if (isConnected && address) {
      updateSecurityState();
    }
  }, [isConnected, address, chainId, updateSecurityState]);

  // Periodic security updates
  useEffect(() => {
    if (!isConnected || !address) return;

    const interval = setInterval(updateSecurityState, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [isConnected, address, updateSecurityState]);

  return {
    securityState,
    validateWalletConnection,
    validateTransaction,
    validateSignature,
    monitorTransaction,
    getRiskAssessment,
    handleWalletDisconnection,
    handleNetworkSwitch,
    updateSecurityState
  };
};
