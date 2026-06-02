# ADR-003: Adopt Next.js App Router

**Status**: Accepted  
**Date**: 2024-02-01  
**Deciders**: PropChain Frontend Team

---

## Context

PropChain Frontend was initially scaffolded with Next.js Pages Router. With the stable release of the App Router in Next.js 13 and its maturation in Next.js 14–15, we evaluated whether to migrate to the App Router architecture.

## Decision Drivers

- React Server Components (RSC) for improved initial page load performance
- Nested layouts without prop drilling
- Streaming and Suspense support for progressive rendering
- Improved data fetching patterns (async Server Components)
- Long-term alignment with the Next.js roadmap
- SEO and Core Web Vitals improvements

## Options Considered

### Option A: Migrate to App Router

- Enables React Server Components — components that render on the server and send zero JavaScript to the client
- Nested layouts (`layout.tsx`) eliminate the need for wrapper components and context providers at every route
- Built-in support for streaming HTML with `<Suspense>` boundaries
- `loading.tsx` and `error.tsx` conventions simplify loading and error states
- Route groups and parallel routes enable complex UI patterns
- `generateMetadata` provides per-page SEO metadata with full TypeScript support

### Option B: Stay on Pages Router

- No migration cost
- Mature, well-documented API
- All existing patterns (getServerSideProps, getStaticProps) continue to work
- Larger community of examples and tutorials
- Pages Router will continue to be supported but receives fewer new features

## Decision

**We chose to migrate to the App Router (Option A).**

## Rationale

PropChain's property listing pages are a good fit for React Server Components — they fetch data from the blockchain/API and render HTML that doesn't require client-side interactivity. Serving these as RSCs reduces the JavaScript bundle sent to mobile users, directly improving our Core Web Vitals scores.

The nested layout system also simplifies our route structure: the wallet provider, theme provider, and navigation bar are defined once in `app/layout.tsx` rather than being re-imported in every page.

## Migration Notes

- Client components that use hooks or browser APIs must be marked with `'use client'`
- `useRouter` from `next/navigation` replaces `next/router`
- `useSearchParams` requires a `<Suspense>` boundary in the parent
- `getServerSideProps` / `getStaticProps` are replaced by async Server Components and `fetch` with cache options

## Consequences

### Positive
- Smaller JavaScript bundles for server-rendered pages
- Improved Time to First Byte (TTFB) and Largest Contentful Paint (LCP)
- Cleaner data fetching — no need for `getServerSideProps` boilerplate
- Better TypeScript support for metadata and route params

### Negative
- Learning curve for developers familiar only with Pages Router
- Some third-party libraries are not yet compatible with RSC and require `'use client'` wrappers
- Debugging RSC errors can be less intuitive than client-side errors
- Migration from Pages Router required updating all route files and data-fetching patterns

## References

- [Next.js App Router documentation](https://nextjs.org/docs/app)
- [React Server Components RFC](https://github.com/reactjs/rfcs/blob/main/text/0188-server-components.md)
- [Next.js migration guide (Pages → App)](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)
