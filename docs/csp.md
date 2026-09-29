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

Whether the enforcing header is sent is controlled by `CSP_ENFORCE` — see the table below. Since issue #1107, the secure default enforces the CSP in production and staging without any configuration.

## CSP Reports

CSP violations are reported to `POST /api/csp-report`. In development mode, reports are logged to the console.

## Environment Control: `CSP_ENFORCE`

The middleware uses the environment variable `CSP_ENFORCE` to toggle between **enforcement** and **report-only** modes. As of issue #1107 it has a **secure, environment-aware default**:

| `CSP_ENFORCE` | Environment | Header Sent | Behaviour |
|---|---|---|---|
| `"true"` | Any | `Content-Security-Policy` | Violations are **blocked** by the browser |
| `"false"` | Any | *No CSP header* | CSP is disabled entirely (warns at boot outside development) |
| unset / empty | production, staging | `Content-Security-Policy` | **Secure default: enforced** |
| unset / empty | development | *No CSP header* | Dev convenience: no nonce bookkeeping while coding |

> **Default decision (#1107):** CSP is **enforced in production and staging by default** — no configuration required. Developers only need to set `CSP_ENFORCE=true` explicitly when they want to test the policy locally. An explicit `"false"` in production logs a warning at boot and at `npm run validate:env`.

> **Note**: In development (`NODE_ENV=development`), the `script-src` directive includes `'unsafe-eval'` to support hot reload. This is **never** included in production builds.

### Adding `CSP_ENFORCE` to your environment

```env
# .env.local (development — CSP disabled by default for easier debugging)
# CSP_ENFORCE=true   # uncomment to test CSP enforcement locally

# .env.production (optional — already enforced by the secure default)
# CSP_ENFORCE=true
```

### Verifying enforcement (`curl -I`)

After deploying, confirm the policy is live:

```bash
# 1. Enforcing header present (secure default in production/staging):
curl -sI https://your-domain.example.com/ | grep -i content-security-policy
# → content-security-policy: default-src 'self'; script-src 'self' 'nonce-...'; ...

# 2. The nonce is unique per request:
curl -sI https://your-domain.example.com/ | grep -oiP "nonce-\K[A-Za-z0-9+/=]+"
curl -sI https://your-domain.example.com/ | grep -oiP "nonce-\K[A-Za-z0-9+/=]+"
# → two different values = per-request nonce working

# 3. Exclusions (no CSP header expected):
curl -sI https://your-domain.example.com/api/health | grep -i content-security-policy
# → (no output)
```

If you get **no** CSP header in production, check that the middleware matcher isn't excluding the route and that `CSP_ENFORCE` isn't explicitly set to `"false"` — the boot log and `npm run validate:env` both warn about it.

### How to extend the CSP

To add new directives or allow additional origins:

1. Edit `src/middleware.ts` → `buildCspHeader()`.
2. Add the new directive to the `directives` array.
3. Ensure nonce-based scripts are properly handled (the `x-nonce` request header is forwarded).
4. Test in development first by setting `CSP_ENFORCE=true` locally and checking the browser console for violation reports.
5. Violations are automatically posted to `POST /api/csp-report` for monitoring.

## Exclusions

The following paths are excluded from CSP:
- `/api/*` - API routes
- `/sw.js` - Service Worker script
- `/_next/static/*` - Next.js static assets
- `/_next/image/*` - Next.js image optimization
- `/favicon.ico`, `/sitemap.xml`, `/robots.txt`
