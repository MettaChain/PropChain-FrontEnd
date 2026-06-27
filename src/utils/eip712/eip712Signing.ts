import { ethers } from 'ethers';
import type { 
  EIP712Domain, 
  EIP712Message, 
  TransactionTypedData, 
  SignatureVerification,
  SignedTransaction 
} from './eip712Types';

export const EIP712_DOMAIN_NAME = 'PropChain';
export const EIP712_DOMAIN_VERSION = '1';

/**
 * Creates EIP-712 domain separator for transaction signing
 */
export function createDomain(chainId: number, verifyingContract?: string): EIP712Domain {
  return {
    name: EIP712_DOMAIN_NAME,
    version: EIP712_DOMAIN_VERSION,
    chainId,
    verifyingContract: verifyingContract || ethers.ZeroAddress,
  };
}

/**
 * Creates EIP-712 typed data for transaction signing
 */
export function createTransactionTypedData(
  transaction: TransactionTypedData,
  domain: EIP712Domain
): EIP712Message {
  return {
    types: {
      Transaction: [
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'gasLimit', type: 'uint256' },
        { name: 'gasPrice', type: 'uint256' },
        { name: 'data', type: 'bytes' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    },
    primaryType: 'Transaction',
    domain,
    message: {
      to: transaction.to.toLowerCase(),
      value: transaction.value || '0',
      gasLimit: transaction.gasLimit || '0',
      gasPrice: transaction.gasPrice || '0',
      data: transaction.data || '0x',
      nonce: transaction.nonce || 0,
      deadline: transaction.deadline || Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    },
  };
}

/**
 * Signs EIP-712 typed data using the provided signer
 */
export async function signTypedData(
  signer: ethers.JsonRpcSigner,
  transaction: TransactionTypedData,
  domain: EIP712Domain
): Promise<{ signature: string; signerAddress: string }> {
  const typedData = createTransactionTypedData(transaction, domain);
  
  try {
    const signature = await signer.signTypedData(
      typedData.domain,
      typedData.types,
      typedData.message
    );
    
    const signerAddress = await signer.getAddress();
    
    return { signature, signerAddress };
  } catch (error) {
    throw new Error(`Failed to sign typed data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verifies an EIP-712 signature
 */
export function verifyTypedDataSignature(
  transaction: TransactionTypedData,
  signature: string,
  domain: EIP712Domain
): SignatureVerification {
  try {
    const typedData = createTransactionTypedData(transaction, domain);
    
    // Recover the signer address from the signature
    const recoveredAddress = ethers.verifyTypedData(
      typedData.domain,
      typedData.types,
      typedData.message,
      signature
    );
    
    return {
      isValid: true,
      signer: recoveredAddress,
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Signature verification failed',
    };
  }
}

/**
 * Creates a signed transaction object with verification
 */
export async function createSignedTransaction(
  signer: ethers.JsonRpcSigner,
  transaction: TransactionTypedData,
  chainId: number,
  verifyingContract?: string
): Promise<SignedTransaction> {
  const domain = createDomain(chainId, verifyingContract);
  const { signature, signerAddress } = await signTypedData(signer, transaction, domain);
  
  // Verify the signature immediately
  const verification = verifyTypedDataSignature(transaction, signature, domain);
  
  return {
    transaction,
    signature,
    domain,
    signer: signerAddress,
    timestamp: Date.now(),
    verified: verification.isValid,
  };
}

/**
 * Validates transaction parameters for security warnings
 */
export function validateTransactionParameters(transaction: TransactionTypedData): {
  isValid: boolean;
  warnings: string[];
  risks: string[];
} {
  const warnings: string[] = [];
  const risks: string[] = [];
  let isValid = true;

  // Check for zero address recipient
  if (transaction.to === ethers.ZeroAddress) {
    warnings.push('Transaction is to zero address');
    isValid = false;
  }

  // Check for unusually high value
  const valueEth = parseFloat(ethers.formatEther(transaction.value || '0'));
  if (valueEth > 100) {
    risks.push(`High value transaction: ${valueEth.toFixed(4)} ETH`);
  }

  // Check for empty data but high value (potential mistake)
  if (!transaction.data || transaction.data === '0x') {
    if (valueEth > 1) {
      warnings.push('High value ETH transfer without contract interaction');
    }
  }

  // Check for unusual gas price
  if (transaction.gasPrice) {
    const gasPriceGwei = parseFloat(ethers.formatUnits(transaction.gasPrice, 'gwei'));
    if (gasPriceGwei > 100) {
      risks.push(`High gas price: ${gasPriceGwei.toFixed(2)} gwei`);
    }
  }

  // Check deadline
  if (transaction.deadline) {
    const now = Math.floor(Date.now() / 1000);
    if (transaction.deadline <= now) {
      warnings.push('Transaction deadline has passed');
      isValid = false;
    } else if (transaction.deadline <= now + 300) { // Less than 5 minutes
      warnings.push('Transaction deadline is very soon');
    }
  }

  return {
    isValid,
    warnings,
    risks,
  };
}
