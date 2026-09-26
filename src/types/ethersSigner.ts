/**
 * The one module in the app permitted to name an ethers type (#1095).
 *
 * ADR-006 makes viem + wagmi the canonical Web3 stack. `ethers` survives only
 * at two boundaries that genuinely require it — the Gnosis Safe protocol-kit
 * adapter and EIP-712 typed-data signing — and this module exists so that
 * consumers of that signer type do not have to import `ethers` themselves.
 *
 * Everything here is a *type*, so this re-export is erased at compile time and
 * contributes nothing to the client bundle. That is the whole point: before
 * this module, `useTransaction`, `useSecureTransaction` and
 * `SecureTransactionConfirmation` each did `import { ethers } from "ethers"`
 * purely to write `ethers.JsonRpcSigner` in a prop type, dragging the runtime
 * of a second Ethereum library into files that never call it.
 *
 * New code should prefer a viem wallet client. Reaching for `JsonRpcSigner`
 * means you are inside the EIP-712/Safe boundary, which is a deliberate choice
 * rather than a default.
 */
export type { JsonRpcSigner } from "ethers";
