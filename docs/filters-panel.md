# FiltersPanel

`SearchFilterForm` (`src/components/forms/SearchFilterForm.tsx`) is the one filter UI in the app. It is rendered on `/properties` and `/forms`, validates through `searchFilterSchema`, and emits the canonical `SearchFilters` shape.

```tsx
<SearchFilterForm
  filters={filters}                 // current SearchFilters (e.g. from useSearchStore)
  onApplyFilters={handleApply}      // called with the full SearchFilters on change
  onClearFilters={handleClear}      // called when "Clear filters" is pressed
/>
```

## Behaviour

- Checkbox and number changes are applied immediately.
- The search query is debounced by `QUERY_DEBOUNCE_MS` (300 ms).
- `onApplyFilters` fires only when the emitted filters actually change. Re-rendering with equal `filters` does not emit again.
- If the parent passes back the filters the panel just emitted, the form does not reset. A query you are still typing is kept when another filter round-trips through the store.
- If the parent passes in filters that differ from the last ones emitted (URL sync, saved search, external reset), the form resets to them.

## Keyboard support

The panel is a `role="search"` landmark labelled "Property filters".

| Where | Key | Action |
| --- | --- | --- |
| Search query | `Escape` | Clears the query |
| Checkbox group | `Tab` / `Shift+Tab` | Enters or leaves the group (one tab stop per group) |
| Checkbox group | `ArrowDown` / `ArrowRight` | Next option (wraps) |
| Checkbox group | `ArrowUp` / `ArrowLeft` | Previous option (wraps) |
| Checkbox group | `Home` / `End` | First / last option |
| Checkbox group | `Space` | Toggles the focused option |

Each group (Property type, Blockchain, Bedrooms, Bathrooms, Status) is a `role="group"` labelled by its heading and uses a roving `tabindex`. Tabbing back into a group returns to the option that was focused last.

## Re-render model

- **Form body**: rendered once. Text and number inputs are uncontrolled (`register`), so typing does not re-render the panel.
- **`FilterAutoApply`**: holds the `useWatch` subscription and the debounce, and renders nothing. A keystroke re-renders only this leaf.
- **`CheckboxGroupField`**: memoized, and subscribes to its own field with `useController`. Toggling an option re-renders only that group.
- **Option lists**: module-level constants, so memoized groups never get new array props.
- **`SearchFilterForm` / inner form**: wrapped in `React.memo`, so a parent re-render with the same props is skipped.

Pass stable callbacks (`useCallback`) for `onApplyFilters` / `onClearFilters` to keep the memoization effective.

## Tests

- `src/components/forms/__tests__/SearchFilterForm.test.tsx`: unit tests covering rendering, emitting, debounce, and keyboard navigation.
- `src/components/forms/__tests__/SearchFilterForm.renders.test.tsx`: re-render budget, using a checkbox that counts its own renders.
- `src/components/forms/__tests__/SearchFilterForm.integration.test.tsx`: the panel wired to the real `useSearchStore`, covering the full control → store → props loop.
- `src/components/forms/__tests__/FilterUiConsolidation.test.tsx`: guards against reintroducing duplicate filter UIs.
