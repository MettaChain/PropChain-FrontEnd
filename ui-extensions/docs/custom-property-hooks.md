# Guide: Creating Custom Hooks for Property Data

New hooks for extensions live in `ui-extensions/hooks/` and their tests in `ui-extensions/tests/`. The patterns below follow the existing hooks in `src/hooks/` (`usePropertySearchQuery.ts`, `usePropertyCardData.ts`). Import main-app code through the `@/` alias, as `src/hooks/` does.

## Hook architecture patterns

Two patterns are used in `src/hooks/`:

| Pattern | Use for | Example |
|---|---|---|
| React Query wrapper (`useQuery` / `useMutation`) | Server data and writes | `usePropertySearchQuery`, `usePropertyQuery` |
| Pure derivation with `useMemo` over store state | Display-ready values | `usePropertyCardData` |

Rules of thumb:

- Keep a hook single-purpose: it fetches, derives or mutates, not all three.
- Export a query-key factory next to the hook (see `propertySearchQueryKeys`) so cache keys are defined once.
- Call services (`propertyService` from `@/lib/propertyService`) from `queryFn`; do not call `fetch` inside components.
- Types come from `@/types/property` (`Property`, `SearchFilters`, ...).

## Example 1: `usePropertyData`

`propertyService.getPropertyById(id)` already exists; `usePropertyQuery` in `src/hooks/usePropertySearchQuery.ts` wraps it. An extension hook adds its own key and options:

```ts
// ui-extensions/hooks/usePropertyData.ts
import { useQuery } from "@tanstack/react-query";
import { propertyService } from "@/lib/propertyService";

export const propertyDataKeys = {
  detail: (id: string) => ["extensions", "propertyData", id] as const,
};

export function usePropertyData(id: string) {
  return useQuery({
    queryKey: propertyDataKeys.detail(id),
    queryFn: () => propertyService.getPropertyById(id),
    enabled: !!id, // do not fetch with an empty id
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: (failureCount, error) => {
      const status = (error as { status?: number } | null)?.status;
      if (status && status >= 400 && status < 500) return false; // never retry 4xx
      return failureCount < 3;
    },
  });
}
```

## Example 2: `usePropertyStats`

A derivation hook. It uses the same `Property` fields that `usePropertyCardData` reads (`metrics.roi`, `tokenInfo.available`, `tokenInfo.totalSupply`):

```ts
// ui-extensions/hooks/usePropertyStats.ts
import { useMemo } from "react";
import type { Property } from "@/types/property";

export function usePropertyStats(property: Property | undefined) {
  return useMemo(() => {
    if (!property) return null;
    const { available, totalSupply } = property.tokenInfo;
    return {
      roi: property.metrics.roi,
      percentSold: totalSupply > 0 ? ((totalSupply - available) / totalSupply) * 100 : 0,
    };
  }, [property]);
}
```

## Example 3: `usePropertyActions`

A write hook built on `useMutation`. The repository has no generic "property action" endpoint, so the hook takes the action as an argument instead of inventing an API:

```ts
// ui-extensions/hooks/usePropertyActions.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { propertyDataKeys } from "./usePropertyData";

export function usePropertyActions<TVars>(
  propertyId: string,
  action: (vars: TVars) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: propertyDataKeys.detail(propertyId) }),
  });
}
```

## Error handling and loading states

`useQuery` / `useMutation` already expose the state; surface all three in the component:

```tsx
const { data, isPending, isError, error, refetch } = usePropertyData(id);

if (isPending) return <p role="status">Loading property...</p>;
if (isError) {
  return (
    <div role="alert">
      <p>{error instanceof Error ? error.message : "Could not load property."}</p>
      <button onClick={() => refetch()}>Retry</button>
    </div>
  );
}
```

For mutations use `isPending` to disable the trigger button and `isError` to show a message.

## Caching strategies

Values used by the existing hooks in `src/hooks/usePropertySearchQuery.ts`:

| Data | `staleTime` | `gcTime` |
|---|---|---|
| Search results | 5 min | 10 min |
| Autocomplete | 2 min | 5 min |
| Single property | 10 min | 30 min |

- Longer for slow-changing detail data, shorter for lists.
- `refetchOnWindowFocus: false` is used on all three.
- After a write, invalidate the affected key (`usePropertyActions` above) instead of editing the cache by hand.
- `enabled` gates a query until its inputs are valid (autocomplete requires 2+ characters).

## Testing examples

Hook tests in `src/hooks/__tests__/` use `*.test.ts(x)` files. A test for the pure hook needs no providers:

```ts
// ui-extensions/tests/usePropertyStats.test.ts
import { renderHook } from "@testing-library/react";
import { usePropertyStats } from "../hooks/usePropertyStats";

it("returns null without a property", () => {
  const { result } = renderHook(() => usePropertyStats(undefined));
  expect(result.current).toBeNull();
});
```

Query hooks need a `QueryClientProvider` wrapper (create a fresh `QueryClient` per test with `defaultOptions: { queries: { retry: false } }`) and a mocked `@/lib/propertyService`.
