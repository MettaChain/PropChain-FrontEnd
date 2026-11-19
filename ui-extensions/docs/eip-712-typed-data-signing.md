# EIP-712 Typed Data Signing in the Frontend

See also the existing helpers in `src/utils/eip712/`.

## 1. What EIP-712 is

EIP-712 defines a standard for signing structured, typed data instead of opaque
byte strings. Wallets can show the user readable fields (who, what, how much)
and the signature is bound to an application and chain, which prevents it from
being replayed elsewhere.

## 2. Domain separator

The domain identifies the signing context. Typical fields:

| Field               | Purpose                                   |
| ------------------- | ----------------------------------------- |
| `name`              | Human-readable app/contract name          |
| `version`           | Version of the signing schema             |
| `chainId`           | Prevents cross-chain replay               |
| `verifyingContract` | Contract (or verifier) that checks it     |

```ts
const domain = {
  name: "PropChain",
  version: "1",
  chainId: 1,
  verifyingContract: "0x0000000000000000000000000000000000000000",
} as const;
```

Replace the placeholder values with your real deployment values. The `chainId`
should come from the connected chain, not a hard-coded constant, in production.

## 3. Typed data structure

Declare each struct and its fields. Types must match what the verifier uses
exactly, including field order.

```ts
const types = {
  Approval: [
    { name: "owner", type: "address" },
    { name: "propertyId", type: "uint256" },
    { name: "amount", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;
```

## 4. Signing with wagmi

```tsx
import { useAccount, useSignTypedData } from "wagmi";

export function ApproveButton({ propertyId, amount, nonce }: Props) {
  const { address } = useAccount();
  const { signTypedDataAsync, isPending } = useSignTypedData();

  async function onClick() {
    if (!address) return;
    const message = {
      owner: address,
      propertyId,
      amount,
      nonce,
      deadline: BigInt(Math.floor(Date.now() / 1000) + 15 * 60),
    };
    const signature = await signTypedDataAsync({
      domain,
      types,
      primaryType: "Approval",
      message,
    });
    // send { message, signature } to the backend
  }

  return <button onClick={onClick} disabled={isPending}>Sign approval</button>;
}
```

Use `bigint` for `uint256` values. Handle user rejection as a normal outcome,
not an error to retry automatically.

## 5. Verification on the backend

Never trust a signature the client says is valid. The server should rebuild the
typed data itself and recover the signer, for example with viem:

```ts
import { verifyTypedData } from "viem";

const valid = await verifyTypedData({
  address: expectedOwner,
  domain,
  types,
  primaryType: "Approval",
  message,
  signature,
});
```

Then check that the nonce is unused and the deadline has not passed, and mark
the nonce as consumed. For smart-contract wallets (ERC-1271), use a verifier
that supports contract signatures, such as a public client's
`verifyTypedData`.

## 6. Security considerations

- Always include `chainId` and `verifyingContract` in the domain.
- Include a per-user `nonce` and a `deadline` to prevent replay and stale use.
- The server must reconstruct the message from its own trusted data; do not
  sign or verify client-supplied domains or types blindly.
- Show the user exactly what they are signing in the UI before requesting the
  signature, and keep the message fields minimal.
- Treat signatures as credentials: do not log them or store them longer than
  necessary.
- Version the schema (`version`) and reject unknown versions.
