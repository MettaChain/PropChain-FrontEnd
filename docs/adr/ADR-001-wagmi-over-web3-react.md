# ADR-001: Use wagmi Instead of web3-react for Wallet Integration

**Status**: Accepted  
**Date**: 2024-01-15  
**Deciders**: PropChain Frontend Team

---

## Context

PropChain Frontend needs a library to manage Ethereum wallet connections, account state, and contract interactions in a React application. The two primary candidates evaluated were **wagmi** and **web3-react**.

## Decision Drivers

- TypeScript-first developer experience
- Support for multiple wallet connectors (MetaMask, WalletConnect, Coinbase Wallet)
- React hooks API that integrates naturally with our component architecture
- Active maintenance and community support
- Bundle size impact
- Multi-chain support (Ethereum, Polygon, BSC)

## Options Considered

### Option A: wagmi

- Built on top of viem (a modern, TypeScript-native Ethereum library)
- Provides a comprehensive set of React hooks (`useAccount`, `useConnect`, `useContractRead`, etc.)
- First-class TypeScript support with auto-generated types from ABIs
- Actively maintained by the Paradigm team with frequent releases
- Tree-shakeable — only the hooks you use are included in the bundle
- Built-in support for WalletConnect v2, MetaMask, Coinbase Wallet, and more

### Option B: web3-react

- Older, more established library
- Uses a context/connector pattern rather than hooks
- TypeScript support is available but not as ergonomic
- Slower release cadence; some connectors are community-maintained
- Larger bundle size due to ethers.js dependency
- WalletConnect v2 support was added later and is less polished

## Decision

**We chose wagmi (Option A).**

## Rationale

wagmi's hook-based API aligns directly with our React component architecture and reduces boilerplate significantly. The viem foundation provides better TypeScript inference than ethers.js, catching contract interaction errors at compile time. The active maintenance cadence and first-class WalletConnect v2 support were also decisive factors given our multi-wallet requirements.

## Consequences

### Positive
- Strongly typed contract interactions reduce runtime errors
- Smaller bundle size through tree-shaking
- Easier to add new wallet connectors as the ecosystem evolves
- Built-in caching and request deduplication via TanStack Query integration

### Negative
- Team members familiar with web3-react need to learn the wagmi API
- viem's API differs from ethers.js, requiring some migration effort for utility functions
- wagmi v2 introduced breaking changes from v1; future major versions may require migration work

## References

- [wagmi documentation](https://wagmi.sh)
- [viem documentation](https://viem.sh)
- [web3-react GitHub](https://github.com/Uniswap/web3-react)
