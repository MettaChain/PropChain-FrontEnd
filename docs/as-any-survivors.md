# `as any` allow-list

This document lists the remaining justified `as any` (or `no-explicit-any`) sites.
The ESLint rule `@typescript-eslint/no-explicit-any` is set to `"warn"` so new occurrences
surface in CI without breaking the build.

## Production source survivors

| File | Line | Reason |
|------|------|--------|
| `src/components/TransactionHistory.tsx:248` | Dynamic key access on generic row object in CSV export helper. Requires a keyed index signature that is intentionally not typed upstream. Replace when the row type is refined. |

## Test-only survivors

Test files (`__tests__/`, `*.test.*`, `*.spec.*`) are excluded from the warning because
mocking and spy utilities routinely require `as any`. These do not affect runtime type safety.
