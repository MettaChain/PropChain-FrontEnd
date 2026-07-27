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

## Environment Control: `CSP_ENFORCE`

The middleware uses the environment variable `CSP_ENFORCE` to toggle between **enforcement** and **report-only** modes:

| `CSP_ENFORCE` | Environment | Header Sent | Behaviour |
|---|---|---|---|
| `"true"` | Any | `Content-Security-Policy` | Violations are **blocked** by the browser |
| anything else (or unset) | Any | *No CSP header* | CSP is disabled entirely |

> **Note**: In development (`NODE_ENV=development`), the `script-src` directive includes `'unsafe-eval'` to support hot reload. This is **never** included in production builds.

### Adding `CSP_ENFORCE` to your environment

```env
# .env.local (development — CSP disabled by default for easier debugging)
# CSP_ENFORCE=true   # uncomment to test CSP enforcement locally

# .env.production (production — CSP should be enforced)
CSP_ENFORCE=true
```

### How to extend the CSP

To add new directives or allow additional origins:

1. Edit `src/middleware.ts` → `buildCspHeader()`.
2. Add the new directive to the `directives` array.
3. Ensure nonce-based scripts are properly handled (the `x-nonce` request header is forwarded).
4. Test in report-only mode first by setting `CSP_ENFORCE=false` and checking the browser console for violation reports.
5. Violations are automatically posted to `POST /api/csp-report` for monitoring.

## Exclusions

The following paths are excluded from CSP:
- `/api/*` - API routes
- `/sw.js` - Service Worker script
- `/_next/static/*` - Next.js static assets
- `/_next/image/*` - Next.js image optimization
- `/favicon.ico`, `/sitemap.xml`, `/robots.txt`
