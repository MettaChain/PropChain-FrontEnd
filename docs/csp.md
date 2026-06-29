# Content Security Policy (CSP)

## Overview

PropChain enforces a strict Content Security Policy to prevent XSS attacks. The policy is applied via Next.js middleware.

## Policy Directives

- `default-src 'self'` - Only same-origin resources by default
- `img-src 'self' data: ipfs:` - Images from self, data URIs, and IPFS
- `script-src 'self' 'nonce-...'` - Only same-origin scripts with valid nonce
- `style-src 'self' 'unsafe-inline'` - Styles from self (inline allowed for Tailwind)
- `font-src 'self' data:` - Fonts from self and data URIs
- `connect-src 'self'` - API connections only to same origin
- `frame-src 'self'` - Frames only from same origin
- `base-uri 'self'` - Base URIs restricted to same origin
- `form-action 'self'` - Form submissions only to same origin
- `frame-ancestors 'self'` - Framing only by same origin

## Environment Behavior

- **Production**: `Content-Security-Policy` header (enforced)
- **Non-production**: `Content-Security-Policy-Report-Only` header (reported only)

## CSP Reports

CSP violations are reported to `POST /api/csp-report`. In development mode, reports are logged to the console.

## Exclusions

The following paths are excluded from CSP:
- `/api/*` - API routes
- `/_next/static/*` - Next.js static assets
- `/_next/image/*` - Next.js image optimization
- `/favicon.ico`, `/sitemap.xml`, `/robots.txt`
