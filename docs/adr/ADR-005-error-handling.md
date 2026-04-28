# ADR-005: Error Handling Approach

**Status**: Accepted  
**Date**: 2024-03-01  
**Deciders**: PropChain Frontend Team

---

## Context

PropChain Frontend interacts with blockchain networks, external APIs, and browser APIs — all of which can fail in unpredictable ways. We needed a consistent, application-wide strategy for catching, classifying, and surfacing errors to users without crashing the application.

## Decision Drivers

- Users must always receive meaningful feedback when something goes wrong
- Blockchain errors (rejected transactions, insufficient gas, network congestion) need special handling
- The application must not crash entirely due to a single component error
- Errors should be logged for debugging without exposing sensitive data
- The strategy must be consistent across the codebase so contributors know where to handle errors

## Options Considered

### Option A: Centralized Error Boundary + Typed Error Classes

- React Error Boundaries catch rendering errors and display fallback UI
- Custom error classes (`BlockchainError`, `NetworkError`, `ValidationError`) carry structured metadata
- A global `errorHandler` utility classifies errors and decides whether to show a toast, redirect, or render a fallback
- Sentry integration for production error tracking

### Option B: Try/Catch Everywhere with Toast Notifications

- Each async operation is wrapped in try/catch
- Errors are shown as toast notifications using a consistent message format
- No custom error classes — errors are identified by message string matching
- Simple to implement but leads to inconsistent error messages and duplicated handling logic

### Option C: Error State in Each Component

- Each component manages its own `error` state
- No shared error handling infrastructure
- Maximum flexibility but no consistency; similar errors are handled differently in different components

## Decision

**We chose Option A: Centralized Error Boundary + Typed Error Classes.**

## Implementation

### Error Classes

Custom error classes in `src/utils/errors.ts` extend the base `Error` class:

```ts
class BlockchainError extends Error {
  constructor(
    message: string,
    public readonly code: string,       // e.g. 'USER_REJECTED', 'INSUFFICIENT_FUNDS'
    public readonly txHash?: string,
    public readonly chainId?: number
  ) { super(message); }
}

class NetworkError extends Error {
  constructor(message: string, public readonly statusCode?: number) { super(message); }
}

class ValidationError extends Error {
  constructor(message: string, public readonly field?: string) { super(message); }
}
```

### Error Boundaries

- `<RootErrorBoundary>` wraps the entire app and shows a full-page error screen for catastrophic failures
- `<SectionErrorBoundary>` wraps major page sections (property list, wallet panel) and shows inline fallback UI
- `<ComponentErrorBoundary>` wraps individual widgets and renders a compact error state

### Global Error Handler

`src/utils/errorHandler.ts` provides a `handleError(error: unknown)` function that:
1. Classifies the error type
2. Extracts a user-friendly message
3. Logs to Sentry (production) or console (development)
4. Returns a `{ message, severity, action }` object for the UI layer to consume

### Async Operations

All async functions use the `getErrorMessage` utility from `src/utils/typeGuards.ts` to safely extract a string message from `unknown` error values:

```ts
try {
  await someAsyncOperation();
} catch (err: unknown) {
  setError(getErrorMessage(err, 'Operation failed'));
}
```

## Consequences

### Positive
- Consistent error messages across the application
- Typed errors make it easy to handle specific failure modes (e.g. show a "switch network" prompt for chain mismatch errors)
- Error Boundaries prevent a single broken component from crashing the whole page
- Sentry integration provides production visibility without manual logging in every catch block

### Negative
- Requires discipline to use the typed error classes rather than throwing plain `Error` objects
- Error Boundary components add nesting to the component tree
- Custom error classes must be kept in sync with the error codes returned by the backend API

## References

- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Sentry React SDK](https://docs.sentry.io/platforms/javascript/guides/react/)
- [PropChain Error Handling documentation](../ERROR_HANDLING.md)
