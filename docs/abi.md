# Smart Contract ABI Integration Guide

This guide explains how to integrate new smart contract ABIs into the frontend codebase, generate typed hooks, and use them in the application.

## Overview

The process involves three main steps:

1.  **Store the ABI:** Add the new contract ABI to the `src/config/abis.ts` file.
2.  **Generate Hooks:** Use the `wagmi/cli` to generate typed hooks for the new ABI.
3.  **Use the Hooks:** Import and use the generated hooks in your components.

## 1. Store the ABI

All smart contract ABIs are stored in the `src/config/abis.ts` file. This provides a single source of truth for all contract interfaces.

To add a new ABI, simply export it as a new constant from this file:

```typescript
// src/config/abis.ts

export const MyNewContractABI = [...] as const;
```

## 2. Generate Hooks

We use the `wagmi/cli` to automatically generate typed React hooks from the ABIs. This is configured in the `wagmi.config.ts` file.

To regenerate the hooks after adding a new ABI, run the following command:

```bash
npm run wagmi:generate
```

This will create a new file with the generated hooks, which you can then import and use in your application.

## 3. Use the Hooks

The generated hooks provide a simple and type-safe way to interact with your smart contracts.

Here's an example of how to use a generated hook to call a contract method:

```typescript
import { useMyNewContractWrite } from '../generated';

function MyComponent() {
  const { write } = useMyNewContractWrite({
    functionName: 'myFunction',
  });

  return <button onClick={() => write()}>Call My Function</button>;
}
```

## Cross-linking to Backend Repo

The canonical source for all ABIs is the [Backend repository](https://github.com/your-org/backend-repo). Please ensure that you are using the latest version of the ABI from that repository.
