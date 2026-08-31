# Phishing Denylist

## Overview

The phishing denylist is sourced from a trusted CDN at runtime with a signed manifest. A small fallback list is bundled for offline protection.

## CDN Manifest Schema

```json
{
  "version": "1.0.0",
  "updatedAt": "2026-06-27T00:00:00Z",
  "domains": ["phishing-domain-1.com", "phishing-domain-2.com"],
  "contracts": ["0x1234..."],
  "signature": "base64-encoded-signature"
}
```

## Update Procedure

1. Update the phishing manifest JSON with new domains/contracts
2. Sign the manifest with the project's signing key
3. Upload to the CDN at `https://cdn.propchain.io/security/phishing-manifest.json`
4. The frontend automatically fetches the latest manifest (cached for 1 hour)
5. If the manifest fails verification, the fallback list is used

## Signing

The manifest `signature` is an EIP-191 personal-message signature over the
canonical JSON payload of the manifest with the `signature` field excluded,
using stable key order: `version`, `updatedAt`, `domains`, `contracts`.

Example (Node.js):

```js
import { privateKeyToAccount } from 'viem/accounts';

const { signature, ...payload } = manifest; // payload = { version, updatedAt, domains, contracts }
const account = privateKeyToAccount(process.env.MANIFEST_PRIVATE_KEY);
const signature = await account.signMessage({ message: JSON.stringify(payload) });
```

The verifier recovers the signer address from the signature and requires it to
match `NEXT_PUBLIC_MANIFEST_SIGNING_KEY`.

## Configuration

Set `NEXT_PUBLIC_PHISHING_MANIFEST_URL` and `NEXT_PUBLIC_MANIFEST_SIGNING_KEY` in your environment.

`NEXT_PUBLIC_MANIFEST_SIGNING_KEY` is the Ethereum address of the key that
signs the manifest. It is **required**: the manifest is never fetched or
applied without it, and a manifest whose signature does not recover to this
address is rejected. When unset, the CDN manifest is disabled (the bundled
fallback list is still used) and a warning is logged.

## Fallback List

A minimal fallback list is bundled for offline/startup scenarios:
- `metamask.io.fake`
- `myetherwallet.com.scam`
- `trustwallet.app.phish`
