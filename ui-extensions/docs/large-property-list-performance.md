# Performance Optimization for Large Property Lists

Techniques for keeping long property lists fast. See also
`src/components/VirtualizedPropertyGrid.tsx` and `docs/lazy-loading-system.md`.

## 1. Virtualization

Rendering thousands of cards creates thousands of DOM nodes, which slows layout,
paint and memory use. A virtualized list renders only the rows inside (or near)
the viewport and positions them with absolute offsets or spacer elements.
Cost then scales with the visible window, not the list length.

Rules of thumb: use a fixed or estimated row height, add a small overscan
(a few rows) to avoid flicker while scrolling, and keep stable `key`s (the
property id, never the array index).

## 2. Code splitting with `React.lazy` and `Suspense`

Heavy, non-critical pieces (maps, charts, detail panels) should load on demand.

```tsx
import { lazy, Suspense } from "react";

const PropertyMap = lazy(() => import("./PropertyMap"));

export function ListWithMap({ showMap }: { showMap: boolean }) {
  return (
    <Suspense fallback={<div aria-busy="true">Loading map...</div>}>
      {showMap && <PropertyMap />}
    </Suspense>
  );
}
```

In Next.js, `next/dynamic` offers the same idea with an `ssr: false` option for
browser-only libraries.

## 3. `useMemo` and `useCallback`

Memoize derived data and handlers passed to memoized children, otherwise every
parent render re-renders every card.

```tsx
const PropertyCardMemo = memo(PropertyCard);

function PropertyList({ properties, query }: Props) {
  const visible = useMemo(
    () => properties.filter((p) => p.name.toLowerCase().includes(query)),
    [properties, query],
  );
  const handleSelect = useCallback((id: string) => select(id), [select]);

  return visible.map((p) => (
    <PropertyCardMemo key={p.id} property={p} onSelect={handleSelect} />
  ));
}
```

Only memoize where profiling shows a benefit; memoization has its own cost.

## 4. Image lazy loading

Images are usually the largest cost in a property card.

- Use `loading="lazy"` and `decoding="async"` on below-the-fold images.
- Always set `width`/`height` (or an aspect ratio) to avoid layout shift.
- Load the first row eagerly (`loading="eager"` / `priority` with `next/image`)
  since it is likely the largest contentful paint element.
- Serve appropriately sized, modern-format images.

```tsx
<img src={p.image} alt={p.name} width={400} height={300}
     loading="lazy" decoding="async" />
```

## 5. Debounced search

Filtering on every keystroke wastes work. Debounce the value that drives the
filter or network request.

```tsx
function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
```

Keep the input itself controlled by the undebounced value so typing stays
responsive; use the debounced value for filtering.

## 6. Benchmark comparison

Measure on your own data and devices; the table is a template to fill in, not
reported results. Use the React Profiler and Chrome DevTools Performance panel
with the same dataset (for example 5,000 properties) and CPU throttling.

| Approach                         | DOM nodes | Initial render (ms) | Scroll FPS | Memory (MB) |
| -------------------------------- | --------- | ------------------- | ---------- | ----------- |
| Plain list                       | _measure_ | _measure_           | _measure_  | _measure_   |
| + memoized cards                 | _measure_ | _measure_           | _measure_  | _measure_   |
| + virtualization                 | _measure_ | _measure_           | _measure_  | _measure_   |
| + lazy images and debounced search | _measure_ | _measure_         | _measure_  | _measure_   |

Expect virtualization to give the largest improvement for long lists.
