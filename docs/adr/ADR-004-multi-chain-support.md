# ADR-004: Multi-Chain Support Strategy

**Status**: Accepted  
**Date**: 2024-02-15  
**Deciders**: PropChain Frontend Team

---

## Context

PropChain needs to support property token transactions across multiple EVM-compatible blockchains (Ethereum, Polygon, BSC) while providing a seamless user experience. We needed to decide how to architect multi-chain support in the frontend.

## Decision Drivers

- Users should be able to switch networks without losing application state
- Property listings may exist on different chains; the UI must clearly indicate which chain a property is on
- Gas costs and transaction speeds differ significantly between chains
- Testnet support is required for development and QA
- The architecture must be extensible to add new chains without major refactoring

## Options Considered

### Option A: Chain-Agnostic Architecture with wagmi

- Define all supported chains in a central `src/config/chains.ts` configuration file
- Use wagmi's `useChainId` and `useSwitchChain` hooks to manage the active chain
- Store chain-specific contract addresses in the chain config (not hardcoded in components)
- Display a network indicator in the header; prompt users to switch if they're on an unsupported chain
- Use viem's `createPublicClient` with the appropriate chain for read operations

### Option B: Single-Chain with Manual Network Switching

- Support only Ethereum mainnet/Sepolia in the initial release
- Add other chains as separate deployments (e.g. `polygon.propchain.io`)
- Simpler initial implementation but poor UX for users who want to compare properties across chains

### Option C: Cross-Chain Aggregation Layer

- Build a backend aggregation service that normalizes data from all chains
- Frontend only talks to the aggregation API, unaware of individual chains
- Hides chain complexity from the UI but adds significant backend complexity
- Reduces real-time blockchain interaction capabilities

## Decision

**We chose Option A: Chain-Agnostic Architecture with wagmi.**

## Implementation

Supported chains are defined in `src/config/chains.ts`:

```ts
export const SUPPORTED_CHAINS = [mainnet, sepolia, polygon, polygonMumbai, bsc, bscTestnet];
```

Each chain entry includes:
- Chain ID
- RPC URL (from environment variables)
- Contract addresses for PropChain smart contracts
- Block explorer URL for transaction links
- Native currency symbol and decimals

The wagmi config is initialized with all supported chains, and `useSwitchChain` is used to prompt network switches when a user tries to interact with a property on a different chain than their current wallet network.

## Consequences

### Positive
- Single codebase supports all chains — no separate deployments needed
- Chain configuration is centralized and easy to extend
- wagmi handles the low-level chain-switching RPC calls
- Users can browse properties across chains in one session

### Negative
- UI complexity increases: chain indicators, network mismatch warnings, and per-chain gas estimates must all be handled
- RPC rate limits must be managed per chain (each chain needs its own RPC endpoint)
- Testing requires maintaining testnet deployments for each supported chain
- Some wallets (especially hardware wallets) have limited multi-chain support

## References

- [wagmi chain configuration](https://wagmi.sh/core/chains)
- [viem chains](https://viem.sh/docs/chains/introduction)
- [EIP-3085: wallet_addEthereumChain](https://eips.ethereum.org/EIPS/eip-3085)
