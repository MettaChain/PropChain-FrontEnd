/**
 * Public type surface for `ui-extensions` (#1357, #1359).
 *
 * Consumers should import from here rather than reaching into individual
 * modules, so moving a type between files does not break imports:
 *
 *   import type { InspectionReport, BridgeTransaction } from './types';
 */

export * from './amenity';
export * from './bridge';
export * from './governance';
export * from './inspection';
export * from './staking';
export * from './valuation';
