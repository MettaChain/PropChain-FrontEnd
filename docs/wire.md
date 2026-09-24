# Transaction Lifecycle Architecture

This document provides a diagrammatic summary of the transaction lifecycle from sign through confirmation.

## Overview

The PropChain transaction lifecycle involves multiple components working together to securely sign, submit, and confirm blockchain transactions.

## Transaction Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           TRANSACTION LIFECYCLE                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

User Action                    Backend Processing                 Blockchain
─────────────                  ──────────────────                 ──────────

┌──────────────┐
│  1. User     │
│  Initiates   │
│  Transaction │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  2. Validate │
│  Input &     │
│  Permissions │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  3. EIP-712  │
│  Sign Typed  │
│  Data        │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  4. Sign     │
│  Transaction │
│  with Wallet │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  5. Submit   │
│  to Network  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  6. Monitor  │
│  Transaction │
│  Status      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  7. Confirm  │
│  & Update    │
│  State       │
└──────────────┘
```

## Detailed Component Flow

### 1. User Initiates Transaction

**Components:**
- `src/components/TransactionButton.tsx`
- `src/hooks/useTransaction.ts`

**Flow:**
```
User Click → Validate Inputs → Check Wallet Connection → Proceed to Signing
```

### 2. Validate Input & Permissions

**Components:**
- `src/utils/validation.ts`
- `src/utils/security/permissions.ts`

**Checks:**
- Sufficient token balance
- Correct network selected
- Required permissions granted
- Input validation (amounts, addresses)

### 3. EIP-712 Sign Typed Data

**Components:**
- `src/utils/eip712/eip712Signing.ts`
- `src/utils/eip712/types.ts`

**Flow:**
```
Construct EIP-712 Domain → Create Typed Data → Prepare for Signing
```

**Key Functions:**
```typescript
// src/utils/eip712/eip712Signing.ts
export async function signTypedData(params: SignParams): Promise<string>
export function constructDomain(chainId: number): EIP712Domain
export function createTypedData(message: TransactionMessage): TypedData
```

### 4. Sign Transaction with Wallet

**Components:**
- `src/hooks/useSecureTransaction.ts`
- `src/utils/walletConnectors/`

**Flow:**
```
Request Signature → Wallet Popup → User Approves → Signature Returned
```

**Security Features:**
- Transaction simulation before signing
- Gas estimation
- Nonce management
- Replay protection

### 5. Submit to Network

**Components:**
- `src/lib/transactionService.ts`
- `src/lib/blockchainSecurity.ts`

**Flow:**
```
Serialize Transaction → Send to RPC Node → Get Transaction Hash → Return to Client
```

**Error Handling:**
- Network congestion detection
- Gas price optimization
- Retry logic for transient failures

### 6. Monitor Transaction Status

**Components:**
- `src/lib/transactionMonitor.ts`
- `src/store/transactionStore.ts`

**Flow:**
```
Poll Transaction Receipt → Check Block Confirmations → Update Status
```

**States:**
- `pending` - Transaction submitted, not yet confirmed
- `confirming` - Transaction in mempool, waiting for blocks
- `confirmed` - Transaction included in block
- `failed` - Transaction reverted or dropped

### 7. Confirm & Update State

**Components:**
- `src/store/transactionStore.ts`
- `src/hooks/useTransactionHistory.ts`

**Actions:**
- Update transaction status in store
- Refresh token balances
- Show success/error notification
- Update UI state

## Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                             │
├─────────────────────────────────────────────────────────────────┤
│  Layer 1: Input Validation                                      │
│  - Amount validation                                            │
│  - Address format validation                                    │
│  - Permission checks                                            │
├─────────────────────────────────────────────────────────────────┤
│  Layer 2: EIP-712 Typed Data                                    │
│  - Structured data signing                                      │
│  - Domain separation                                            │
│  - Replay protection                                            │
├─────────────────────────────────────────────────────────────────┤
│  Layer 3: Wallet Security                                       │
│  - Secure enclave signing                                       │
│  - User confirmation                                            │
│  - Transaction simulation                                       │
├─────────────────────────────────────────────────────────────────┤
│  Layer 4: Network Security                                      │
│  - RPC endpoint validation                                      │
│  - Chain ID verification                                        │
│  - Nonce management                                             │
└─────────────────────────────────────────────────────────────────┘
```

## Error Recovery

```
┌─────────────────────────────────────────────────────────────────┐
│                      ERROR RECOVERY                              │
├─────────────────────────────────────────────────────────────────┤
│  Error Type              │  Recovery Action                     │
├──────────────────────────┼──────────────────────────────────────┤
│  Insufficient Gas        │  Re-estimate and retry               │
│  Nonce Too Low           │  Refresh nonce and retry             │
│  Network Congestion      │  Increase gas price                  │
│  Transaction Reverted    │  Show error, allow retry             │
│  Wallet Disconnected     │  Prompt reconnection                 │
│  Chain Mismatch          │  Prompt network switch               │
└─────────────────────────────────────────────────────────────────┘
```

## State Management

```typescript
// Transaction State Interface
interface TransactionState {
  id: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  chainId: number;
  status: 'pending' | 'confirming' | 'confirmed' | 'failed';
  confirmations: number;
  blockNumber?: number;
  timestamp: number;
  error?: string;
}
```

## Testing Strategy

1. **Unit Tests**: Individual component testing
2. **Integration Tests**: End-to-end transaction flow
3. **E2E Tests**: Full user journey with wallet simulation
4. **Security Tests**: Signature verification, replay attacks

## Key Files

| File | Purpose |
|------|---------|
| `src/utils/eip712/eip712Signing.ts` | EIP-712 typed data signing |
| `src/hooks/useSecureTransaction.ts` | Secure transaction hook |
| `src/lib/transactionService.ts` | Transaction submission |
| `src/lib/blockchainSecurity.ts` | Security validations |
| `src/lib/transactionMonitor.ts` | Status monitoring |
| `src/store/transactionStore.ts` | State management |
