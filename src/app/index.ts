/**
 * App Layer - Feature-Sliced Design
 *
 * This module provides a clean import structure following
 * Feature-Sliced Design architecture.
 *
 * Layers (from top to bottom):
 * - app: Pages and layouts
 * - widgets: Complex UI blocks
 * - features: User-facing features
 * - entities: Business entities
 * - shared: Reusable UI primitives and utilities
 */

// Shared UI primitives
export * from './shared/ui';

// Business entities
export * from './entities';

// User-facing features
export * from './features';

// Complex UI blocks
export * from './widgets';
