/**
 * ResponsiveContainer Component
 * 
 * A container component with responsive padding that scales with viewport size.
 * Provides consistent padding across all pages with fluid scaling between breakpoints.
 * 
 * Features:
 * - Responsive padding: 16px (mobile) → 24px (tablet) → 32px (desktop)
 * - Fluid scaling between breakpoints using CSS clamp()
 * - Uses Viewport Provider for viewport detection
 * - Supports custom className for additional styling
 * 
 * Requirements: 3.1, 3.2, 8.5
 */

'use client';

import React from 'react';
import { useViewport } from '@/providers/ViewportProvider';
import { cn } from '@/lib/utils';

export interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * ResponsiveContainer provides consistent, viewport-aware padding
 * 
 * Padding scales:
 * - Mobile (<768px): 16px
 * - Tablet (768-1024px): 24px (fluid scaling)
 * - Desktop (≥1024px): 32px
 * 
 * @example
 * ```tsx
 * <ResponsiveContainer>
 *   <h1>Page Content</h1>
 *   <p>This content has responsive padding</p>
 * </ResponsiveContainer>
 * ```
 * 
 * @example With custom className
 * ```tsx
 * <ResponsiveContainer className="bg-gray-100">
 *   <div>Custom styled container</div>
 * </ResponsiveContainer>
 * ```
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className,
}) => {
  const { category } = useViewport();

  // Calculate padding based on viewport category
  // Using inline styles for precise control, but could also use Tailwind classes
  const getPadding = (): string => {
    switch (category) {
      case 'mobile':
        return '16px';
      case 'tablet':
        return '24px';
      case 'desktop':
        return '32px';
      default:
        return '16px'; // Fallback to mobile
    }
  };

  return (
    <div
      className={cn('responsive-container', className)}
      style={{
        padding: getPadding(),
        // Ensure no horizontal overflow (Requirement 3.1)
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
    >
      {children}
    </div>
  );
};

/**
 * Alternative implementation using CSS clamp() for fluid scaling
 * This version provides smooth scaling between breakpoints
 */
export const ResponsiveContainerFluid: React.FC<ResponsiveContainerProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn('responsive-container-fluid', className)}
      style={{
        // Fluid padding using clamp()
        // Formula: clamp(min, preferred, max)
        // Preferred value scales linearly: min + (max - min) * (viewport - minViewport) / (maxViewport - minViewport)
        // Using CSS calc with viewport units for automatic scaling
        padding: 'clamp(16px, 4vw, 32px)',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
    >
      {children}
    </div>
  );
};

// Export both versions, with step-based as default
export default ResponsiveContainer;
