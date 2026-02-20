import { create } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';

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
export interface StoreConfig {
  persist?: boolean;
  persistOptions?: PersistOptions<any, any>;
  name: string;
}

// Enhanced create function with base functionality
export const createBaseStore = <
  T extends BaseState,
  A extends BaseActions
>(
  initialState: T,
  actions: (set: any, get: any) => A,
  config?: StoreConfig
) => {
  const store = (set: any, get: any) => ({
    ...initialState,
    ...actions(set, get),
  });

  if (config?.persist) {
    return create<BaseStore<T> & A>()(
      persist(store, {
        name: config.name,
        ...config.persistOptions,
      })
    );
  }

  return create<BaseStore<T> & A>()(store);
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
    const errorMessage = error?.message || 'An unknown error occurred';
    setError(errorMessage);
    throw error;
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