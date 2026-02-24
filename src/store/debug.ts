// State debugging and monitoring utilities
import { logger } from '@/utils/logger';

// Interface for state change logging
export interface StateLogEntry {
  timestamp: number;
  storeName: string;
  action: string;
  prevState: any;
  nextState: any;
  payload?: any;
}

// Global state logger
class StateLogger {
  private logs: StateLogEntry[] = [];
  private maxSize: number;
  private isEnabled: boolean;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
    this.isEnabled = process.env.NODE_ENV !== 'production';
  }

  public log(entry: StateLogEntry): void {
    if (!this.isEnabled) return;

    this.logs.push(entry);

    // Trim logs if they exceed max size
    if (this.logs.length > this.maxSize) {
      this.logs = this.logs.slice(-this.maxSize);
    }

    // Also log to console for immediate visibility during development
    if (process.env.NODE_ENV !== 'production') {
      logger.debug(`[${entry.storeName}] ${entry.action}:`, {
        prevState: entry.prevState,
        nextState: entry.nextState,
        payload: entry.payload
      });
    }
  }

  public getLogs(): StateLogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
  }

  public enable(): void {
    this.isEnabled = true;
  }

  public disable(): void {
    this.isEnabled = false;
  }

  public getLogsByStore(storeName: string): StateLogEntry[] {
    return this.logs.filter(log => log.storeName === storeName);
  }

  public getLogsByAction(action: string): StateLogEntry[] {
    return this.logs.filter(log => log.action === action);
  }
}

// Create a singleton instance
export const stateLogger = new StateLogger();

// Middleware for Zustand stores to enable logging
export const createDebugMiddleware = (storeName: string) => {
  return (config: any) => (set: any, get: any, api: any) => {
    // Wrap the original set function to intercept state changes
    const originalSet = set;
    const enhancedSet = (partial: any, replace?: any) => {
      const prevState = { ...get() };
      
      // Apply the state change
      originalSet(partial, replace);
      
      const nextState = { ...get() };
      
      // Log the change
      stateLogger.log({
        timestamp: Date.now(),
        storeName,
        action: 'UPDATE',
        prevState,
        nextState,
        payload: typeof partial === 'function' ? 'computed update' : partial,
      });
    };

    // Return the original config with the enhanced set function
    return config(enhancedSet, get, api);
  };
};

// State inspector utility
export class StateInspector {
  public inspectStore(getState: () => any, storeName: string): any {
    const state = getState();
    console.group(`%cInspecting ${storeName} State`, 'color: #0000ff; font-weight: bold;');
    console.table(state);
    console.groupEnd();
    return state;
  }

  public compareStates(prevState: any, nextState: any, storeName: string): void {
    console.group(`%cComparing ${storeName} States`, 'color: #ff6600; font-weight: bold;');
    
    // Compare keys
    const prevKeys = Object.keys(prevState);
    const nextKeys = Object.keys(nextState);
    
    const addedKeys = nextKeys.filter(key => !prevKeys.includes(key));
    const removedKeys = prevKeys.filter(key => !nextKeys.includes(key));
    const changedKeys = nextKeys.filter(key => 
      prevKeys.includes(key) && 
      JSON.stringify(prevState[key]) !== JSON.stringify(nextState[key])
    );
    
    if (addedKeys.length > 0) {
      logger.debug('Added Keys:', addedKeys);
    }
    
    if (removedKeys.length > 0) {
      logger.debug('Removed Keys:', removedKeys);
    }
    
    if (changedKeys.length > 0) {
      logger.debug('Changed Keys:', changedKeys);
      changedKeys.forEach(key => {
        logger.debug(`  ${key}:`, { from: prevState[key], to: nextState[key] });
      });
    }
    
    if (addedKeys.length === 0 && removedKeys.length === 0 && changedKeys.length === 0) {
      logger.debug('No changes detected');
    }
    
    console.groupEnd();
  }

  public getStoreSnapshot(getState: () => any, storeName: string): string {
    const state = getState();
    return JSON.stringify(state, null, 2);
  }
}

// Create a singleton inspector
export const stateInspector = new StateInspector();

// Performance monitoring for state updates
export class StatePerformanceMonitor {
  private measurements: Array<{
    storeName: string;
    action: string;
    duration: number;
    timestamp: number;
  }> = [];

  public measure<T>(storeName: string, action: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    this.measurements.push({
      storeName,
      action,
      duration: end - start,
      timestamp: Date.now(),
    });
    
    // Keep only the last 1000 measurements
    if (this.measurements.length > 1000) {
      this.measurements = this.measurements.slice(-1000);
    }
    
    // Log slow updates (>16ms - one frame at 60fps)
    if (end - start > 16) {
      logger.warn(`Slow state update detected in ${storeName}: ${action} took ${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  }

  public getSlowUpdates(threshold: number = 16): Array<{ storeName: string; action: string; duration: number; timestamp: number; }> {
    return this.measurements.filter(measurement => measurement.duration > threshold);
  }

  public getAverageDuration(storeName?: string): number {
    const filteredMeasurements = storeName 
      ? this.measurements.filter(m => m.storeName === storeName)
      : this.measurements;
    
    if (filteredMeasurements.length === 0) return 0;
    
    const total = filteredMeasurements.reduce((sum, m) => sum + m.duration, 0);
    return total / filteredMeasurements.length;
  }

  public clearMeasurements(): void {
    this.measurements = [];
  }
}

// Create a singleton performance monitor
export const statePerformanceMonitor = new StatePerformanceMonitor();

// Debug utility functions
export const debugUtils = {
  // Force trigger a re-render to test state changes
  forceUpdate: (setState: (state: any) => void, getState: () => any) => {
    setState((prevState: any) => ({ ...prevState, _debugTimestamp: Date.now() }));
  },

  // Get human-readable state summary
  getStateSummary: (state: any): any => {
    const summary: any = {};
    
    for (const [key, value] of Object.entries(state)) {
      if (typeof value === 'function') {
        summary[key] = '[Function]';
      } else if (Array.isArray(value)) {
        summary[key] = `[Array: ${value.length} items]`;
      } else if (typeof value === 'object' && value !== null) {
        summary[key] = '[Object]';
      } else {
        summary[key] = value;
      }
    }
    
    return summary;
  },

  // Validate state structure
  validateState: (state: any, expectedShape: any): boolean => {
    for (const key in expectedShape) {
      if (!(key in state)) {
        logger.error(`Missing expected property: ${key}`);
        return false;
      }
      if (typeof state[key] !== typeof expectedShape[key] && expectedShape[key] !== undefined) {
        logger.warn(`Type mismatch for property: ${key}`);
      }
    }
    return true;
  },

  // Export logs as downloadable file
  exportLogs: (filename: string = 'state-logs.json'): void => {
    const logs = stateLogger.getLogs();
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};