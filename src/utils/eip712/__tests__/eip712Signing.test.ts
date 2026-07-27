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

// Mock ethers functions
jest.mock('ethers', () => {
  const actual = jest.requireActual('ethers');
  return {
    ...actual,
    ethers: {
      ...actual.ethers,
      verifyTypedData: jest.fn(),
    },
  };
});

describe('EIP-712 Signing', () => {
  let mockSigner: any;
  let testDomain: EIP712Domain;
  let testTransaction: TxData;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSigner = {
      signTypedData: jest.fn(),
      getAddress: jest.fn(),
    };

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
        value: '101000000000000000000', // 101 ETH (must be > 100)
      };
      const result = validateTransactionParameters(highValueTx);

      expect(result.isValid).toBe(true);
      expect(result.risks.length).toBeGreaterThan(0);
      expect(result.risks[0]).toContain('High value transaction');
    });

    it('should detect high gas prices', () => {
      const highGasTx = {
        ...testTransaction,
        gasPrice: '101000000000', // 101 gwei (must be > 100)
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
    it('should verify a valid signature', () => {
      const mockSignature = '0x1234567890abcdef';
      const mockAddress = '0x9876543210987654321098765432109876543210';

      (
        ethers.verifyTypedData as unknown as jest.Mock
      ).mockReturnValue(mockAddress);

      const result = verifyTypedDataSignature(testTransaction, mockSignature, testDomain);

      expect(result.isValid).toBe(true);
      expect(result.signer).toBe(mockAddress);
      expect(result.error).toBeUndefined();
    });

    it('should handle invalid signatures', () => {
      const mockSignature = '0xinvalid';

      (
        ethers.verifyTypedData as unknown as jest.Mock
      ).mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const result = verifyTypedDataSignature(testTransaction, mockSignature, testDomain);

      expect(result.isValid).toBe(false);
      expect(result.signer).toBeUndefined();
      expect(result.error).toBe('Invalid signature');
    });
  });

  describe('signTypedData', () => {
    it('should sign typed data successfully', async () => {
      const mockSignature = '0x1234567890abcdef';
      const mockAddress = '0x9876543210987654321098765432109876543210';

      mockSigner.signTypedData.mockResolvedValue(mockSignature);
      mockSigner.getAddress.mockResolvedValue(mockAddress);

      const result = await signTypedData(mockSigner, testTransaction, testDomain);

      expect(result.signature).toBe(mockSignature);
      expect(result.signerAddress).toBe(mockAddress);
    });

    it('should handle signing errors', async () => {
      mockSigner.signTypedData.mockRejectedValue(new Error('User rejected'));

      await expect(
        signTypedData(mockSigner, testTransaction, testDomain)
      ).rejects.toThrow('Failed to sign typed data: User rejected');
    });

    it('should handle a signer returning empty address', async () => {
      const mockSignature = '0x1234567890abcdef';
      mockSigner.signTypedData.mockResolvedValue(mockSignature);
      mockSigner.getAddress.mockResolvedValue(ethers.ZeroAddress);

      const result = await signTypedData(mockSigner, testTransaction, testDomain);

      expect(result.signature).toBe(mockSignature);
      expect(result.signerAddress).toBe(ethers.ZeroAddress);
    });

    it('should handle non-Error rejections during signing', async () => {
      mockSigner.signTypedData.mockRejectedValue('String rejection');

      await expect(
        signTypedData(mockSigner, testTransaction, testDomain)
      ).rejects.toThrow('Failed to sign typed data: Unknown error');
    });
  });

  describe('createSignedTransaction', () => {
    it('should create a signed transaction with verification', async () => {
      const mockSignature = '0x1234567890abcdef';
      const mockAddress = '0x9876543210987654321098765432109876543210';

      mockSigner.signTypedData.mockResolvedValue(mockSignature);
      mockSigner.getAddress.mockResolvedValue(mockAddress);
      (
        ethers.verifyTypedData as unknown as jest.Mock
      ).mockReturnValue(mockAddress);

      const result = await createSignedTransaction(mockSigner, testTransaction, 1);

      expect(result.transaction).toEqual(testTransaction);
      expect(result.signature).toBe(mockSignature);
      expect(result.signer).toBe(mockAddress);
      expect(result.domain.chainId).toBe(1);
      expect(result.verified).toBe(true);
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it('should handle signing failures', async () => {
      mockSigner.signTypedData.mockRejectedValue(new Error('Signing failed'));

      await expect(
        createSignedTransaction(mockSigner, testTransaction, 1)
      ).rejects.toThrow('Failed to sign typed data: Signing failed');
    });
  });

  describe('Edge Cases: Empty Signers', () => {
    it('should reject transaction to zero address in validation', () => {
      const zeroAddrTx: TxData = {
        to: ethers.ZeroAddress,
        value: '0',
      };
      const result = validateTransactionParameters(zeroAddrTx);
      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain('Transaction is to zero address');
    });

    it('should handle missing nonce in transaction defaults', () => {
      const noNonceTx: TxData = {
        to: '0x9876543210987654321098765432109876543210',
        value: '0',
      };
      const typedData = createTransactionTypedData(noNonceTx, testDomain);
      expect(typedData.message.nonce).toBe(0);
    });
  });

  describe('Edge Cases: Malformed Payloads', () => {
    it('should handle undefined data field in transaction', () => {
      const noDataTx: TxData = {
        to: '0x9876543210987654321098765432109876543210',
        value: '0',
        data: undefined,
      };
      const typedData = createTransactionTypedData(noDataTx, testDomain);
      expect(typedData.message.data).toBe('0x');
    });

    it('should handle completely empty transaction object', () => {
      const emptyTx = {} as TxData;
      expect(() => createTransactionTypedData(emptyTx, testDomain)).toThrow();
    });

    it('should handle an invalid / non-address to field', () => {
      const invalidAddrTx: TxData = {
        to: 'not-an-address',
        value: '0',
      };
      const typedData = createTransactionTypedData(invalidAddrTx, testDomain);
      expect(typedData.message.to).toBe('not-an-address');
    });

    it('should handle missing domain fields gracefully', () => {
      const partialDomain: EIP712Domain = { name: 'Test' };
      const typedData = createTransactionTypedData(testTransaction, partialDomain);
      expect(typedData.domain.name).toBe('Test');
      expect(typedData.domain.version).toBeUndefined();
      expect(typedData.domain.chainId).toBeUndefined();
    });

    it('should handle transaction with zero value', () => {
      const zeroValueTx: TxData = {
        to: '0x9876543210987654321098765432109876543210',
        value: '0',
      };
      const typedData = createTransactionTypedData(zeroValueTx, testDomain);
      expect(typedData.message.value).toBe('0');

      const validation = validateTransactionParameters(zeroValueTx);
      expect(validation.isValid).toBe(true);
    });

    it('should handle negative deadline', () => {
      const negativeDeadlineTx: TxData = {
        to: '0x9876543210987654321098765432109876543210',
        value: '0',
        deadline: -1,
      };
      const validation = validateTransactionParameters(negativeDeadlineTx);
      expect(validation.isValid).toBe(false);
      expect(validation.warnings).toContain('Transaction deadline has passed');
    });

    it('should handle extremely large gas price', () => {
      const extremeGasTx: TxData = {
        to: '0x9876543210987654321098765432109876543210',
        value: '0',
        gasPrice: '1000000000000000',
      };
      const result = validateTransactionParameters(extremeGasTx);
      expect(result.risks.length).toBeGreaterThan(0);
      expect(result.risks[0]).toContain('High gas price');
    });

    it('should handle undefined value in validateTransactionParameters', () => {
      const noValueTx: TxData = {
        to: '0x9876543210987654321098765432109876543210',
        value: undefined as unknown as string,
      };
      const result = validateTransactionParameters(noValueTx);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Edge Cases: Replay Protection', () => {
    it('should enforce deadline on expired transactions', () => {
      const expiredTx: TxData = {
        to: '0x9876543210987654321098765432109876543210',
        value: '0',
        deadline: Math.floor(Date.now() / 1000) - 7200,
      };
      const result = validateTransactionParameters(expiredTx);
      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain('Transaction deadline has passed');
    });

    it('should warn about near-expiry deadlines', () => {
      const nearExpiryTx: TxData = {
        to: '0x9876543210987654321098765432109876543210',
        value: '0',
        deadline: Math.floor(Date.now() / 1000) + 120,
      };
      const result = validateTransactionParameters(nearExpiryTx);
      expect(result.warnings).toContain('Transaction deadline is very soon');
    });

    it('should validate transactions with unique nonces', () => {
      const txNonce1: TxData = { ...testTransaction, nonce: 1 };
      const txNonce2: TxData = { ...testTransaction, nonce: 2 };

      const typedData1 = createTransactionTypedData(txNonce1, testDomain);
      const typedData2 = createTransactionTypedData(txNonce2, testDomain);

      expect(typedData1.message.nonce).toBe(1);
      expect(typedData2.message.nonce).toBe(2);
      expect(typedData1.message.nonce).not.toBe(typedData2.message.nonce);
    });

    it('should create domain with different chain IDs for replay protection', () => {
      const domain1 = createDomain(1);
      const domain137 = createDomain(137);

      expect(domain1.chainId).toBe(1);
      expect(domain137.chainId).toBe(137);
      expect(domain1.chainId).not.toBe(domain137.chainId);
    });

    it('should include verifyingContract in domain for replay protection', () => {
      const domainWithContract = createDomain(
        1,
        '0x1234567890123456789012345678901234567890'
      );
      expect(domainWithContract.verifyingContract).toBe(
        '0x1234567890123456789012345678901234567890'
      );
    });

    it('should default to ZeroAddress when no verifyingContract is provided', () => {
      const domain = createDomain(1);
      expect(domain.verifyingContract).toBe(ethers.ZeroAddress);
    });

    it('should ensure typed data messages differ with different deadlines', () => {
      const tx1: TxData = { ...testTransaction, deadline: 1000 };
      const tx2: TxData = { ...testTransaction, deadline: 2000 };

      const typedData1 = createTransactionTypedData(tx1, testDomain);
      const typedData2 = createTransactionTypedData(tx2, testDomain);

      expect(typedData1.message.deadline).toBe(1000);
      expect(typedData2.message.deadline).toBe(2000);
    });
  });
});
