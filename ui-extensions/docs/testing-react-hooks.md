# Testing Strategies for React Hooks

This guide shows how to test custom hooks placed in `ui-extensions/hooks/`. It follows the patterns already used in `src/hooks/__tests__/`. The project runs unit tests with **Jest** (`npm test`) and **@testing-library/react** (`renderHook`, `act`). Vitest is only used for Storybook (`npm run test:storybook`).

Place hook tests in `ui-extensions/tests/` (or next to the hook in a `__tests__` folder) and name them `useThing.test.ts`.

## 1. `renderHook` and `act`

Use `renderHook` to mount a hook without a component. Read the latest return value from `result.current`. Wrap anything that changes state in `act`.

```ts
import { renderHook, act } from '@testing-library/react';
import { useToggle } from '../hooks/useToggle';

it('toggles', () => {
  const { result } = renderHook(() => useToggle(false));
  expect(result.current.value).toBe(false);

  act(() => result.current.toggle());

  expect(result.current.value).toBe(true);
});
```

Pass `{ wrapper }` as the second argument when the hook needs a provider (for example React Query).

## 2. Async hooks

Use `waitFor` for state that settles after a promise resolves, or `await act(async () => ...)` when you trigger the async work yourself.

```ts
import { renderHook, waitFor } from '@testing-library/react';

it('loads data', async () => {
  const { result } = renderHook(() => useThing());
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.data).toEqual({ id: 1 });
});
```

Mock network or service calls with `jest.fn().mockResolvedValue(...)` so tests stay deterministic. See `src/hooks/__tests__/usePortfolioQuery.test.tsx` for a query hook with a wrapper.

## 3. Mocking wallet and library providers (wagmi/viem)

Mock the module that supplies the hook's dependencies with `jest.mock`, declared before the import of the hook under test. `src/hooks/__tests__/useToast.test.ts` mocks `sonner` this way; the same shape applies to wallet libraries such as `wagmi` or `viem`.

```ts
const mockUseAccount = jest.fn();
jest.mock('wagmi', () => ({
  useAccount: () => mockUseAccount(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAccount.mockReturnValue({ address: '0xabc', isConnected: true });
});
```

Only mock the exports your hook actually calls, and change the return value per test (`mockUseAccount.mockReturnValue(...)`) to cover connected and disconnected states.

## 4. Testing URL state

`src/hooks/__tests__/usePaginationUrl.test.ts` mocks the router's search-params hook with a mutable `URLSearchParams`, then asserts on both the params and the setter:

```ts
const mockSetSearchParams = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock('react-router-dom', () => ({
  useSearchParams: () => [mockSearchParams, (...a: unknown[]) => mockSetSearchParams(...a)],
}), { virtual: true });

it('parses the page param', () => {
  mockSearchParams = new URLSearchParams('page=3');
  const { result } = renderHook(() => usePaginationUrl());
  expect(result.current.page).toBe(3);
});
```

Reset `mockSearchParams` in `beforeEach`, and test the fallback for invalid values (e.g. `page=abc`).

## 5. localStorage persistence

jsdom (via `jest-environment-jsdom`) provides `localStorage`. Clear it between tests, seed it before rendering to test restore, and read it after `act` to test save.

```ts
beforeEach(() => localStorage.clear());

it('restores the saved value', () => {
  localStorage.setItem('theme', 'dark');
  const { result } = renderHook(() => useStoredTheme());
  expect(result.current.theme).toBe('dark');
});

it('persists changes', () => {
  const { result } = renderHook(() => useStoredTheme());
  act(() => result.current.setTheme('light'));
  expect(localStorage.getItem('theme')).toBe('light');
});
```

## 6. Complete example

A hook that keeps a counter in `localStorage`, and its test:

```ts
// ui-extensions/hooks/useStoredCounter.ts
import { useCallback, useState } from 'react';

export function useStoredCounter(key: string) {
  const [count, setCount] = useState(() => Number(localStorage.getItem(key) ?? 0));
  const increment = useCallback(() => {
    setCount((c) => {
      localStorage.setItem(key, String(c + 1));
      return c + 1;
    });
  }, [key]);
  return { count, increment };
}
```

```ts
// ui-extensions/tests/useStoredCounter.test.ts
import { renderHook, act } from '@testing-library/react';
import { useStoredCounter } from '../hooks/useStoredCounter';

describe('useStoredCounter', () => {
  beforeEach(() => localStorage.clear());

  it('starts at 0', () => {
    const { result } = renderHook(() => useStoredCounter('c'));
    expect(result.current.count).toBe(0);
  });

  it('restores a stored value', () => {
    localStorage.setItem('c', '5');
    const { result } = renderHook(() => useStoredCounter('c'));
    expect(result.current.count).toBe(5);
  });

  it('increments and persists', () => {
    const { result } = renderHook(() => useStoredCounter('c'));
    act(() => result.current.increment());
    expect(result.current.count).toBe(1);
    expect(localStorage.getItem('c')).toBe('1');
  });
});
```

## Checklist

- One behavior per `it`; reset mocks and storage in `beforeEach`.
- Wrap state updates in `act`; use `waitFor` for async results.
- Mock only the modules the hook imports.
- Test the failure and empty paths (invalid URL param, missing storage key, disconnected wallet).
