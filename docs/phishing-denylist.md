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

## Configuration

Set `NEXT_PUBLIC_PHISHING_MANIFEST_URL` and `NEXT_PUBLIC_MANIFEST_SIGNING_KEY` in your environment.

## Fallback List

A minimal fallback list is bundled for offline/startup scenarios:
- `metamask.io.fake`
- `myetherwallet.com.scam`
- `trustwallet.app.phish`
