import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ethers } from 'ethers';
import {
  createDomain,
  createTransactionTypedData,
  signTypedData,
  verifyTypedDataSignature,
  createSignedTransaction,
  validateTransactionParameters,
  EIP712_DOMAIN_NAME,
  EIP712_DOMAIN_VERSION,
} from '../eip712Signing';
import type { TransactionTypedData as TxData, EIP712Domain } from '../eip712Types';

describe('EIP-712 Signing', () => {
  let mockSigner: ethers.JsonRpcSigner;
  let mockProvider: ethers.BrowserProvider;
  let testDomain: EIP712Domain;
  let testTransaction: TxData;

  beforeEach(() => {
    // Mock provider and signer
    mockProvider = vi.mocked(new ethers.BrowserProvider(window.ethereum!));
    mockSigner = vi.mocked(mockProvider.getSigner()) as ethers.JsonRpcSigner;
    
    testDomain = createDomain(1, '0x1234567890123456789012345678901234567890');
    testTransaction = {
      to: '0x9876543210987654321098765432109876543210',
      value: '1000000000000000000', // 1 ETH
      data: '0x',
      gasLimit: '21000',
      gasPrice: '20000000000', // 20 gwei
      nonce: 0,
      deadline: Math.floor(Date.now() / 1000) + 3600,
    };
  });

  describe('createDomain', () => {
    it('should create a valid EIP-712 domain', () => {
      const domain = createDomain(1, '0x1234567890123456789012345678901234567890');
      
      expect(domain).toEqual({
        name: EIP712_DOMAIN_NAME,
        version: EIP712_DOMAIN_VERSION,
        chainId: 1,
        verifyingContract: '0x1234567890123456789012345678901234567890',
      });
    });

    it('should use zero address if no verifying contract provided', () => {
      const domain = createDomain(1);
      expect(domain.verifyingContract).toBe(ethers.ZeroAddress);
    });
  });

  describe('createTransactionTypedData', () => {
    it('should create valid typed data structure', () => {
      const typedData = createTransactionTypedData(testTransaction, testDomain);
      
      expect(typedData).toHaveProperty('types');
      expect(typedData).toHaveProperty('primaryType', 'Transaction');
      expect(typedData).toHaveProperty('domain');
      expect(typedData).toHaveProperty('message');
      
      expect(typedData.types.Transaction).toHaveLength(7);
      expect(typedData.message.to).toBe(testTransaction.to.toLowerCase());
      expect(typedData.message.value).toBe(testTransaction.value);
    });

    it('should handle missing optional fields', () => {
      const minimalTx: TxData = {
        to: '0x9876543210987654321098765432109876543210',
        value: '0',
      };
      
      const typedData = createTransactionTypedData(minimalTx, testDomain);
      
      expect(typedData.message.gasLimit).toBe('0');
      expect(typedData.message.gasPrice).toBe('0');
      expect(typedData.message.data).toBe('0x');
      expect(typedData.message.nonce).toBe(0);
      expect(typedData.message.deadline).toBeGreaterThan(0);
    });
  });

  describe('validateTransactionParameters', () => {
    it('should validate a normal transaction', () => {
      const result = validateTransactionParameters(testTransaction);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
      expect(result.risks).toHaveLength(0);
    });

    it('should detect zero address recipient', () => {
      const invalidTx = { ...testTransaction, to: ethers.ZeroAddress };
      const result = validateTransactionParameters(invalidTx);
      
      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain('Transaction is to zero address');
    });

    it('should detect high value transactions', () => {
      const highValueTx = {
        ...testTransaction,
        value: '100000000000000000000', // 100 ETH
      };
      const result = validateTransactionParameters(highValueTx);
      
      expect(result.isValid).toBe(true);
      expect(result.risks.length).toBeGreaterThan(0);
      expect(result.risks[0]).toContain('High value transaction');
    });

    it('should detect high gas prices', () => {
      const highGasTx = {
        ...testTransaction,
        gasPrice: '100000000000', // 100 gwei
      };
      const result = validateTransactionParameters(highGasTx);
      
      expect(result.isValid).toBe(true);
      expect(result.risks.length).toBeGreaterThan(0);
      expect(result.risks[0]).toContain('High gas price');
    });

    it('should detect expired deadlines', () => {
      const expiredTx = {
        ...testTransaction,
        deadline: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      };
      const result = validateTransactionParameters(expiredTx);
      
      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain('Transaction deadline has passed');
    });

    it('should warn about high value ETH transfers without data', () => {
      const ethTransfer = {
        ...testTransaction,
        value: '2000000000000000000', // 2 ETH
        data: '0x',
      };
      const result = validateTransactionParameters(ethTransfer);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('High value ETH transfer without contract interaction');
    });
  });

  describe('verifyTypedDataSignature', () => {
    it('should verify a valid signature', async () => {
      const mockSignature = '0x1234567890abcdef';
      
      // Mock ethers.verifyTypedData to return a known address
      vi.mocked(ethers.verifyTypedData).mockReturnValue('0x9876543210987654321098765432109876543210');
      
      const result = verifyTypedDataSignature(testTransaction, mockSignature, testDomain);
      
      expect(result.isValid).toBe(true);
      expect(result.signer).toBe('0x9876543210987654321098765432109876543210');
      expect(result.error).toBeUndefined();
    });

    it('should handle invalid signatures', async () => {
      const mockSignature = '0xinvalid';
      
      // Mock ethers.verifyTypedData to throw an error
      vi.mocked(ethers.verifyTypedData).mockImplementation(() => {
        throw new Error('Invalid signature');
      });
      
      const result = verifyTypedDataSignature(testTransaction, mockSignature, testDomain);
      
      expect(result.isValid).toBe(false);
      expect(result.signer).toBeUndefined();
      expect(result.error).toBe('Invalid signature');
    });
  });

  describe('createSignedTransaction', () => {
    it('should create a signed transaction with verification', async () => {
      const mockSignature = '0x1234567890abcdef';
      const mockAddress = '0x9876543210987654321098765432109876543210';
      
      // Mock signer methods
      vi.mocked(mockSigner.signTypedData).mockResolvedValue(mockSignature);
      vi.mocked(mockSigner.getAddress).mockResolvedValue(mockAddress);
      vi.mocked(ethers.verifyTypedData).mockReturnValue(mockAddress);
      
      const result = await createSignedTransaction(mockSigner, testTransaction, 1);
      
      expect(result.transaction).toEqual(testTransaction);
      expect(result.signature).toBe(mockSignature);
      expect(result.signer).toBe(mockAddress);
      expect(result.domain.chainId).toBe(1);
      expect(result.verified).toBe(true);
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it('should handle signing failures', async () => {
      // Mock signer to throw an error
      vi.mocked(mockSigner.signTypedData).mockRejectedValue(new Error('Signing failed'));
      
      await expect(
        createSignedTransaction(mockSigner, testTransaction, 1)
      ).rejects.toThrow('Failed to sign typed data: Signing failed');
    });
  });

  describe('signTypedData', () => {
    it('should sign typed data successfully', async () => {
      const mockSignature = '0x1234567890abcdef';
      const mockAddress = '0x9876543210987654321098765432109876543210';
      
      vi.mocked(mockSigner.signTypedData).mockResolvedValue(mockSignature);
      vi.mocked(mockSigner.getAddress).mockResolvedValue(mockAddress);
      
      const result = await signTypedData(mockSigner, testTransaction, testDomain);
      
      expect(result.signature).toBe(mockSignature);
      expect(result.signerAddress).toBe(mockAddress);
    });

    it('should handle signing errors', async () => {
      vi.mocked(mockSigner.signTypedData).mockRejectedValue(new Error('User rejected'));
      
      await expect(
        signTypedData(mockSigner, testTransaction, testDomain)
      ).rejects.toThrow('Failed to sign typed data: User rejected');
    });
  });
});
