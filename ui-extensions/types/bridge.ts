/**
 * Cross-chain bridge types (#1357).
 *
 * Follows the string-enum + interface conventions used by `types/governance.ts`
 * and `types/staking.ts`: enums for closed value sets, ISO 8601 strings for
 * timestamps, and token amounts as decimal strings to avoid precision loss on
 * values that exceed `Number.MAX_SAFE_INTEGER`.
 */

export enum BridgeStatus {
  /** Waiting for the user's source-chain signature. */
  Pending = 'pending',
  /** Source-chain transaction mined; awaiting validator attestations. */
  Confirming = 'confirming',
  /** Enough attestations collected; destination transaction submitted. */
  Bridging = 'bridging',
  Completed = 'completed',
  Failed = 'failed',
  /** Timed out or explicitly refunded on the source chain. */
  Refunded = 'refunded',
}

export enum BridgeConfirmationStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Rejected = 'rejected',
}

export interface BridgeChainConfig {
  /** Chain identifier used by the bridge contracts (not the EVM chain id). */
  chainId: string;
  /** Human readable chain name, e.g. "Ethereum". */
  name: string;
  /** Bridge contract address on this chain. */
  bridgeAddress: string;
  /** Native token symbol, e.g. "ETH". */
  nativeSymbol: string;
  /** Native token decimals, e.g. 18. */
  nativeDecimals: number;
  /** Average block time in seconds, used for progress estimates. */
  blockTimeSeconds: number;
  /** Block explorer base URL, without a trailing slash. */
  explorerUrl?: string;
  /** Whether the bridge accepts deposits from this chain right now. */
  enabled: boolean;
  /** Minimum transfer amount, as a decimal string in the native token. */
  minTransferAmount?: string;
  /** Maximum transfer amount, as a decimal string in the native token. */
  maxTransferAmount?: string;
}

export interface ValidatorSet {
  /** Identifier of the set version; sets rotate over time. */
  id: string;
  /** Chain the validators attest on. */
  chainId: string;
  /** Validator addresses, in signing order. */
  validators: string[];
  /** Attestations required to finalise a transfer. */
  threshold: number;
  /** ISO 8601 timestamp the set became active. */
  activatedAt: string;
  /** ISO 8601 timestamp the set was superseded, if any. */
  retiredAt?: string;
}

export interface BridgeConfirmation {
  /** Validator that produced this attestation. */
  validator: string;
  status: BridgeConfirmationStatus;
  /** Signature over the transfer digest, hex encoded. */
  signature?: string;
  /** Source-chain transaction hash being attested. */
  transactionHash: string;
  /** ISO 8601 timestamp the attestation was recorded. */
  observedAt: string;
  /** Reason supplied when `status` is `rejected`. */
  reason?: string;
}

export interface BridgeTransaction {
  id: string;
  status: BridgeStatus;
  /** Source chain identifier, matching `BridgeChainConfig.chainId`. */
  sourceChainId: string;
  /** Destination chain identifier, matching `BridgeChainConfig.chainId`. */
  destinationChainId: string;
  /** Token symbol being transferred. */
  tokenSymbol: string;
  /** Amount as a decimal string, in `tokenSymbol` units. */
  amount: string;
  /** Sender address on the source chain. */
  sender: string;
  /** Recipient address on the destination chain. */
  recipient: string;
  /** Source-chain transaction hash, once submitted. */
  sourceTransactionHash?: string;
  /** Destination-chain transaction hash, once finalised. */
  destinationTransactionHash?: string;
  /** Attestations collected so far. */
  confirmations: BridgeConfirmation[];
  /** Attestations required before the destination transfer is released. */
  requiredConfirmations: number;
  /** ISO 8601 timestamp the transfer was initiated. */
  initiatedAt: string;
  /** ISO 8601 timestamp the transfer completed, failed or was refunded. */
  completedAt?: string;
  /** Bridge fee as a decimal string, in `tokenSymbol` units. */
  fee?: string;
  /** Human readable failure reason, when `status` is `failed`. */
  errorMessage?: string;
}
