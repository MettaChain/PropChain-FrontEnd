export interface EIP712Domain {
  name?: string;
  version?: string;
  chainId?: number;
  verifyingContract?: string;
  salt?: string;
}

export interface EIP712Type {
  name: string;
  type: string;
}

export interface EIP712Message {
  types: Record<string, EIP712Type[]>;
  primaryType: string;
  domain: EIP712Domain;
  message: Record<string, any>;
}

export interface TransactionTypedData {
  to: string;
  value: string;
  gasLimit?: string;
  gasPrice?: string;
  data?: string;
  nonce?: number;
  deadline?: number;
}

export interface SignatureVerification {
  isValid: boolean;
  signer?: string;
  error?: string;
}

export interface SignedTransaction {
  transaction: TransactionTypedData;
  signature: string;
  domain: EIP712Domain;
  signer: string;
  timestamp: number;
  verified: boolean;
}
