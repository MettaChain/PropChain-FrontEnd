# QR Code Security

## Overview

The `QRCode` component renders shareable property links for print views. Because QR codes encode arbitrary strings that wallets and browsers may open, URLs are validated before rendering.

## Validation Rules

Implemented in `src/utils/security/qrCodeSecurity.ts`:

- Only `http:` and `https:` protocols are allowed
- `javascript:`, `data:`, `blob:`, and `vbscript:` schemes are blocked
- URLs longer than 2048 characters are rejected
- Known phishing domains are blocked via `PhishingProtection.detectPhishing`
- Unofficial domains produce a non-blocking warning in the UI

## Usage

```tsx
import { QRCode } from '@/components/QRCode';

<QRCode
  url="https://propchain.io/properties/123"
  size={200}
  allowedHosts={['propchain.io', 'localhost']}
/>
```

Invalid URLs render an accessible error state instead of encoding unsafe content.

## Testing

- Unit tests: `src/components/__tests__/QRCode.test.tsx`
- Security utility tests: `src/utils/security/__tests__/qrCodeSecurity.test.ts`

Run:

```bash
npm run test -- QRCode qrCodeSecurity
```

## Related Components

- `src/components/PropertyDetail.tsx` — embeds `QRCode` in print-only view
- `src/utils/security/phishingProtection.ts` — phishing domain detection
