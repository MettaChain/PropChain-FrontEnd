import { create, type StateCreator } from 'zustand';
import { persist, type PersistOptions } from 'zustand/middleware';

// Base state interface for common properties
export interface BaseState {
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

// Base actions interface for common operations
export interface BaseActions<T = {}> {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setLastUpdated: (timestamp: number) => void;
  reset: () => void;
}

// Base store type combining state and actions
export type BaseStore<T extends BaseState> = T & BaseActions;

// Store configuration options
export interface StoreConfig<S> {
  persist?: boolean;
  persistOptions?: PersistOptions<S, Partial<S>>;
  name: string;
}

/**
 * Type-safe Zustand store factory.
 *
 * Usage:
 *   const useMyStore = createTypedStore<MyState & MyActions>()(
 *     (set, get) => ({ ...initialState, myAction: () => set({ … }) })
 *   );
 */
export function createTypedStore<S>() {
  return function (
    stateCreator: StateCreator<S>,
    config?: Pick<StoreConfig<S>, 'persist' | 'name' | 'persistOptions'>
  ) {
    if (config?.persist && config.name) {
      return create<S>()(
        persist(stateCreator, {
          name: config.name,
          ...config.persistOptions,
        })
      );
    }
    return create<S>()(stateCreator);
  };
}

// Enhanced create function with base functionality (legacy — prefer createTypedStore)
export const createBaseStore = <
  T extends BaseState,
  A extends BaseActions
>(
  initialState: T,
  actions: StateCreator<T & A, [], [], A>,
  config?: StoreConfig<T & A>
) => {
  const storeCreator: StateCreator<BaseStore<T> & A> = (set, get, api) => ({
    ...initialState,
    ...(actions as StateCreator<BaseStore<T> & A>)(set, get, api),
  });

  if (config?.persist) {
    return create<BaseStore<T> & A>()(
      persist(storeCreator, {
        name: config.name,
        ...config.persistOptions,
      })
    );
  }

  return create<BaseStore<T> & A>()(storeCreator);
};

// Selector helpers for performance optimization
export const createSelector = <T, R>(
  selector: (state: T) => R
): ((state: T) => R) => selector;

// Async action wrapper for consistent error handling
export const withAsyncAction = async <T>(
  action: () => Promise<T>,
  setError: (error: string | null) => void,
  setLoading: (loading: boolean) => void
): Promise<T> => {
  try {
    setLoading(true);
    setError(null);
    const result = await action();
    return result;
  } catch (error: any) {
    let errorMessage: string;
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error.message === 'string') {
      errorMessage = error.message;
    } else if (error !== undefined && error !== null) {
      try {
        errorMessage = String(error);
      } catch {
        errorMessage = 'An unknown error occurred';
      }
    } else {
      errorMessage = 'An unknown error occurred';
    }

    setError(errorMessage);
    // Don't rethrow — return null so callers can continue.
    return Promise.resolve(null as unknown as T);
  } finally {
    setLoading(false);
  }
};

// State persistence utilities
export const clearAllPersistedState = () => {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('propchain-')) {
      localStorage.removeItem(key);
    }
  });
};

// Memoization helper for derived state
export const createMemoizedSelector = <T, R>(
  selector: (state: T) => R,
  equalityFn: (a: R, b: R) => boolean = Object.is
) => {
  let lastResult: R | undefined;
  let lastInput: T | undefined;

  return (state: T): R => {
    if (lastInput === undefined || !equalityFn(selector(lastInput), selector(state))) {
      lastResult = selector(state);
      lastInput = state;
    }
    return lastResult!;
  };
};