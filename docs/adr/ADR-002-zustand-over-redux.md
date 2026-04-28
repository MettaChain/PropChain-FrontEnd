# ADR-002: Use Zustand Instead of Redux for State Management

**Status**: Accepted  
**Date**: 2024-01-20  
**Deciders**: PropChain Frontend Team

---

## Context

PropChain Frontend requires client-side state management for wallet state, search filters, transaction history, and UI state. We evaluated **Zustand** and **Redux Toolkit** as the primary candidates.

## Decision Drivers

- Minimal boilerplate for common CRUD-style state operations
- TypeScript ergonomics
- Bundle size
- Learning curve for new contributors
- Compatibility with React 19 concurrent features
- Ability to use state outside React components (e.g. in utility functions)

## Options Considered

### Option A: Zustand

- Minimal API: a store is created with a single `create()` call
- No actions, reducers, or dispatchers — state updates are plain function calls
- Stores are plain JavaScript objects accessible outside React
- ~1 KB gzipped bundle size
- Full TypeScript support with good inference
- Supports middleware (immer, devtools, persist) as opt-in plugins
- No Provider wrapper required

### Option B: Redux Toolkit (RTK)

- Industry-standard solution with a large ecosystem
- Excellent DevTools support for time-travel debugging
- RTK Query provides built-in data fetching and caching
- More verbose: requires slices, actions, and selectors even for simple state
- ~12 KB gzipped (redux + @reduxjs/toolkit)
- Requires a `<Provider>` wrapper at the app root
- Steeper learning curve for developers new to Redux patterns

### Option C: React Context + useReducer

- Zero additional dependencies
- Suitable for small, infrequently-updated state
- Performance issues with large state trees (all consumers re-render on any change)
- No DevTools support out of the box

## Decision

**We chose Zustand (Option A).**

## Rationale

PropChain's state is composed of several independent domains (wallet, search, transactions, UI). Zustand's per-store model maps naturally to this structure without the overhead of a single global Redux store. The minimal API reduces onboarding time for contributors and the tiny bundle size is important for our mobile-first performance targets.

Server state (API data) is handled separately by TanStack Query, which means we don't need RTK Query's data-fetching capabilities.

## Consequences

### Positive
- Dramatically less boilerplate than Redux
- Stores can be imported and read/written in non-React contexts (e.g. security utilities)
- Easy to add persistence via `zustand/middleware/persist`
- Smaller bundle contribution

### Negative
- Less mature DevTools compared to Redux DevTools (though Zustand supports the Redux DevTools extension via middleware)
- No built-in support for complex derived state — selectors must be written manually
- Smaller community than Redux, so fewer third-party integrations

## References

- [Zustand GitHub](https://github.com/pmndrs/zustand)
- [Redux Toolkit documentation](https://redux-toolkit.js.org)
- [Zustand vs Redux comparison](https://docs.pmnd.rs/zustand/getting-started/comparison)
