# ADR-006: Canonical Web3 Stack — viem + wagmi, with a bounded ethers exception

**Status**: Accepted
**Date**: 2026-09-26
**Deciders**: PropChain Frontend Team
**Resolves**: [#1095](https://github.com/MettaChain/PropChain-FrontEnd/issues/1095)

---

## Context

[ADR-001](ADR-001-wagmi-over-web3-react.md) already settled the wallet-integration
layer on **wagmi**, and therefore on **viem** underneath it. Connection, account
state, chain switching and contract reads all go through wagmi/viem.

`ethers` v6 was nevertheless also a direct dependency, and it had spread across
the codebase in two different ways:

1. **Value imports used for pure utilities.** `formatEther`, `formatUnits`,
   `sha256` and friends were pulled from `ethers` in files that never touch a
   wallet — `src/lib/cacheManager.ts` hashes a cache-queue payload with
   `ethers.sha256`, and `src/components/audit/TransactionAuditTrail.tsx`
   formats wei with `ethers.formatEther`. Every one of these ships a second
   Ethereum runtime into the client bundle for a one-line call that `viem`
   already provides.
2. **Value imports used only to name a type.** `useTransaction`,
   `useSecureTransaction` and `SecureTransactionConfirmation` each did
   `import { ethers } from "ethers"` and then used `ethers.JsonRpcSigner` in a
   prop or parameter type. A type reference should not cost a runtime import,
   but `import { ethers }` is a value import, so it did.

The two cases have completely different remedies, and conflating them is what
makes "delete ethers" the wrong instruction. It is also why the boundary has to
be enforced rather than merely agreed: nothing stopped the next file from
reaching for `ethers` the same way.

## Decision Drivers

- One library should own chain data and transaction encoding, so a `Hash`, a
  chain id or a typed-data payload means the same thing everywhere
- Security review of the transaction-signing path should not require reasoning
  about two libraries' semantics for the same operation
- Bundle weight: the client should not ship a second Ethereum runtime for calls
  that the canonical stack already covers
- Where a third party genuinely requires `ethers`, the team should know exactly
  where and why, rather than rediscovering it
- The boundary should only ever shrink, and ideally fail a build if it grows

## Decision

**`viem` + `wagmi` is the canonical Web3 stack.** `ethers` remains a dependency,
but only at two boundaries that a third party forces, and nowhere else.

### Where `ethers` is still allowed

| File | Why it needs `ethers` |
| --- | --- |
| `src/hooks/useSafeInfo.ts` | `@safe-global/protocol-kit`'s `EthersAdapter` is constructed with an ethers `signerOrProvider`. The Safe SDK's own adapter API is ethers-typed; there is no viem adapter to swap in without replacing the SDK. |
| `src/utils/eip712/eip712Signing.ts` | The EIP-712 signing entry point. Its public contract takes an ethers `JsonRpcSigner` and calls `signer.signTypedData(...)`; viem's equivalent is a `WalletClient` action with a different shape. Changing it is a real migration, not a rename — see Follow-ups. |
| `src/types/ethersSigner.ts` | Re-exports the `JsonRpcSigner` **type only** so the two boundaries above can be referenced without every consumer importing `ethers`. Erased at compile time; costs nothing at runtime. |

### What changed in this ADR

- Pure-utility `ethers` calls moved to `viem`: `cacheManager.ts` now uses
  `sha256`/`toBytes`, `secureTransactionUtils.ts` and `TransactionAuditTrail.tsx`
  use `formatEther`. `viem`'s `formatEther` takes a `bigint` where `ethers` took
  a string, so the call sites convert and guard the conversion, since audit
  entries persist wei as a string.
- The three type-only consumers import `JsonRpcSigner` from
  `@/types/ethersSigner` instead of importing `ethers`.
- `no-restricted-imports` in `eslint.config.mjs` now rejects `ethers` and
  `@ethersproject/*` from every `src/**` module except the three files above.
  Test and story files are exempt, because they assert against the real
  behaviour of those two boundaries.
- `__mocks__/viem.js` gained `sha256` and `toBytes` so the `cacheManager` tests
  still exercise the hashing path under the mocked viem module.

### Why not delete the dependency outright

The issue allows "one stack removed **or** a justified split", and this is the
justified split. Removing `ethers` from `package.json` is blocked on the Safe
SDK, not on effort: `EthersAdapter` is the supported way to hand a signer to
`@safe-global/protocol-kit`, so multisig support needs `ethers` to exist at all.
Claiming otherwise would mean either dropping Safe support or vendoring an
adapter, which is a much larger product decision than a stack cleanup issue.

What the split buys is the part that actually hurts: the boundary is now
three named files instead of "most of `src/`", the accidental value imports are
gone, and ESLint stops it from growing back.

## Consequences

- `ethers` stays in `package.json`, grouped with the other web3 packages by the
  dependabot `web3` group. It is no longer imported by any module that does not
  need it, so the parts of the app that never touch a signer no longer pull it
  into their chunk graph.
- Adding a new `ethers` call is now a lint error, which is the point: if a
  future SDK or signing path needs it, that is an ADR update with a stated
  reason, not an accident.
- There are still two representations of chain data in the codebase, because
  the EIP-712 boundary speaks ethers. That is a known, documented cost rather
  than an unknown one.
- `SignTypedData` semantics differ subtly between the libraries. The EIP-712
  tests in `src/utils/eip712/__tests__/eip712Signing.test.ts` pin the current
  behaviour, so a future migration to viem is a deliberate change with a
  test-visible diff.

## Follow-ups

- Migrate the EIP-712 signing path (`eip712Signing.ts` plus its
  `JsonRpcSigner`-typed consumers) to a viem `WalletClient`, then drop
  `ethersSigner.ts` and shrink the ESLint allowlist to `useSafeInfo.ts`.
- Investigate a viem-native Safe adapter, or a replacement SDK, which would
  remove the last `ethers` import and the dependency itself.
- Re-check bundle composition after both, and record the before/after in the PR
  that lands them.
