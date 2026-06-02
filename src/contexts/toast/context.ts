/**
 * Toast Context Definition
 * Defines the React Context for the Global Toast Notification System
 */

import { createContext } from 'react';
import type { ToastContextType } from './types';

/**
 * The Toast Context.
 * 
 * Provides access to the toast queue and methods to manage notifications globally.
 * Should be used with the ToastProvider component and the useToast hook.
 * 
 * @throws {Error} If accessed outside of a ToastProvider
 * 
 * @example
 * // In a component (use the useToast hook instead of accessing context directly):
 * const toast = useToast();
 */
export const ToastContext = createContext<ToastContextType | undefined>(
  undefined
);

ToastContext.displayName = 'ToastContext';
