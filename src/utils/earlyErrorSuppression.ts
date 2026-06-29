import { logger } from './logger';

const stringifyArgs = (args: readonly unknown[]): string =>
  args.map((arg) => (typeof arg === 'string' ? arg : String(arg))).join(' ');

// Patterns for known-noisy wallet extension errors that we silently swallow
// instead of reporting to the structured logger. These come from third-party
// Web3 extensions injecting scripts into the page and have no impact on
// PropChain functionality.
const SUPPRESS_PATTERNS: readonly string[] = [
  'bfnaelmomeimhlpmgjnjophhpkkoljpa',
  'evmAsk.js',
  'selectExtension',
  'chrome-extension://bfnaelmomeimhlpmgjnjophhpkkoljpa',
];

const matchesSuppressionPattern = (...args: unknown[]): boolean => {
  const message = stringifyArgs(args).toLowerCase();
  return SUPPRESS_PATTERNS.some((pattern) => message.includes(pattern.toLowerCase()));
};

/**
 * Early error suppression for wallet extension noise.
 *
 * This module is imported as the very first side-effect in the app bootstrap,
 * so its global listeners are in place before React/wagmi/connectors emit
 * any errors.
 *
 * Design note: we deliberately do NOT monkey-patch the global console API
 * here. Overriding those methods would cause any logger sink that ultimately
 * writes through the global console to either recurse (infinite loop) or
 * silently lose the structured-logger pipeline. Instead we filter at the
 * boundary where vendor code reaches us — the global error and
 * unhandledrejection listeners — and route any non-suppressed event through
 * the structured logger so production telemetry receives correlation IDs,
 * redaction, and breadcrumbs via the existing pipeline.
 */
export const initializeEarlyErrorSuppression = (): void => {
  if (typeof window === 'undefined') return;

  // Suppress global errors that match extension noise patterns; route
  // everything else through the structured logger.
  window.addEventListener(
    'error',
    (event) => {
      if (matchesSuppressionPattern(event.error, event.filename, event.message)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      logger.error('Unhandled error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      });
    },
    true,
  );

  // Suppress unhandled promise rejections that match extension noise;
  // route the rest through the structured logger.
  window.addEventListener('unhandledrejection', (event) => {
    if (matchesSuppressionPattern(event.reason)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    logger.error('Unhandled promise rejection', { reason: event.reason });
  });
};

// Auto-initialize on module import.
initializeEarlyErrorSuppression();
