# Guide: Integrating Wallet Connectors in Extensions

Reference code: `src/config/wagmi.ts`, `src/lib/walletConnectors/` and `src/hooks/useWalletConnector.ts`. Extension components under `ui-extensions/` should reuse these instead of configuring wallets again. Import them via the `@/` alias.

## wagmi configuration

`src/config/wagmi.ts` exports a single `config` built with `createConfig`:

- Chains: `mainnet`, `polygon`, `bsc`. A local Foundry chain (31337) is added when a local RPC URL is configured, and a Hardhat preview chain (31338) when `NEXT_PUBLIC_PREVIEW_FORK_URL` is set.
- Transports: one `http(...)` per chain, with RPC URLs from `@/config/env`.
- Connectors: `[injected()]`, or `[mockConnector]` when `NEXT_PUBLIC_MOCK_WALLET === "true"` and `NODE_ENV !== "production"` (dev only).

Do not create a second config in an extension; the app's provider already supplies it.

## Two ways to connect

| Approach | Where | Use when |
|---|---|---|
| wagmi hooks (`useAccount`, `useConnect`) | components inside the wagmi provider | you want wagmi state (address, chain, status) |
| `useWalletConnector` | `@/hooks/useWalletConnector` | you want the lazy-loaded MetaMask / Coinbase / WalletConnect connectors |

The lazy connectors in `src/lib/walletConnectors/` (`metamask.ts`, `coinbase.ts`, `walletconnect.ts`) are dynamically imported on first click to keep SDKs out of the initial bundle. `useWalletConnector` exposes `connectWallet(walletId)` with `SupportedWalletId = 'metamask' | 'walletconnect' | 'coinbase'`, plus `isLoadingConnector` and `connectorError`, and resolves to `{ address, chainId }`.

## `useAccount` and `useConnect`

```tsx
import { useAccount, useConnect, useDisconnect } from "wagmi";

export function AccountStatus() {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div>
        <span>{address} (chain {chainId})</span>
        <button onClick={() => disconnect()}>Disconnect</button>
      </div>
    );
  }
  // connectors comes from src/config/wagmi.ts: the injected wallet
  return (
    <>
      {connectors.map((connector) => (
        <button key={connector.uid} onClick={() => connect({ connector })} disabled={isPending}>
          {isPending ? "Connecting..." : `Connect ${connector.name}`}
        </button>
      ))}
      {error && <p role="alert">{error.message}</p>}
    </>
  );
}
```

## Connection button with the lazy connectors

Based on `src/lib/walletConnectors/README.md`:

```tsx
import { useWalletConnector } from "@/hooks/useWalletConnector";

export function ConnectMetaMask() {
  const { connectWallet, isLoadingConnector, connectorError, clearError } = useWalletConnector();

  const onClick = async () => {
    try {
      const { address, chainId } = await connectWallet("metamask");
      console.log("Connected", address, chainId);
    } catch {
      // message is already stored in connectorError
    }
  };

  return (
    <>
      <button onClick={onClick} disabled={isLoadingConnector}>
        {isLoadingConnector ? "Loading..." : "Connect MetaMask"}
      </button>
      {connectorError && (
        <p role="alert">
          {connectorError} <button onClick={clearError}>Dismiss</button>
        </p>
      )}
    </>
  );
}
```

## Error handling for connection failures

- `connectWallet` catches errors, stores a readable message via `getFriendlyWeb3ErrorMessage` (`@/utils/errorHandling`) in `connectorError`, and rethrows, so always wrap the call in `try/catch`.
- `metamask.ts` throws friendly errors for: not installed, `isMetaMask` missing, no accounts, user rejection (code `4001`), and request already pending (`-32002`).
- `@/utils/errorHandling` also exports `isUserRejectionError` and `isNetworkError`; use them to decide whether to show a retry prompt.
- Show errors in an element with `role="alert"` and let the user retry.
- `isMetaMaskAvailable()` and `isCoinbaseAvailable()` can be used to hide or label buttons before a click.

## Multi-chain support

`useAccount()` returns the current `chainId`; compare it against the chains in `config.chains`. Switch with wagmi's `useSwitchChain`:

```tsx
import { useAccount, useSwitchChain } from "wagmi";

export function ChainSwitcher() {
  const { chainId } = useAccount();
  const { chains, switchChain, isPending, error } = useSwitchChain();

  return (
    <>
      {chains.map((chain) => (
        <button
          key={chain.id}
          disabled={isPending || chain.id === chainId}
          onClick={() => switchChain({ chainId: chain.id })}
        >
          {chain.name}
        </button>
      ))}
      {error && <p role="alert">{error.message}</p>}
    </>
  );
}
```

The WalletConnect connector is preconfigured for chains `1`, `137` and `56` (Ethereum, Polygon, BSC), matching the wagmi config.
