# Wallet Compatibility Matrix

This document outlines the officially tested wallets, their supported versions, and any known issues when using them with our platform.

## Officially Supported Wallets

| Wallet          | Tested Version(s) | Browser Support              | Known Issues                                                 |
| --------------- | ----------------- | ---------------------------- | ------------------------------------------------------------ |
| MetaMask        | 10.18.0           | Chrome, Firefox, Brave, Edge | - Older versions may have issues with EIP-1559 transactions. |
| Coinbase Wallet | 3.4.0             | Chrome, Brave                | - Does not support all networks.                             |
| WalletConnect   | 2.0.0             | (Protocol)                   | - Connection can be slow on some mobile networks.            |

## Experimental Wallets

The following wallets are not officially supported, but we provide experimental connectors for them. Use them at your own risk.

| Wallet       | Connector Status | Known Issues |
| ------------ | ---------------- | ------------ |
| Rabby        | Not Implemented  | -            |
| Phantom      | Not Implemented  | -            |
| Trust Wallet | Not Implemented  | -            |
| Frame        | Not Implemented  | -            |
| Safe         | Not Implemented  | -            |
| Rainbow      | Not Implemented  | -            |

## Connector Implementation Notes

The `WalletConnector.tsx` component handles the connection logic for all wallets. It uses the `useWalletConnector` hook to abstract the details of each wallet's connection process.

### `ethereum.{method}` Quirks

- **MetaMask:** No known quirks.
- **Coinbase Wallet:** No known quirks.
- **WalletConnect:** No known quirks.
