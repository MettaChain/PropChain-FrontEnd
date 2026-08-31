/**
 * ResponsiveContainer Component
 *
 * A container component with responsive padding that scales with viewport size.
 * Provides consistent padding across all pages with fluid scaling between breakpoints.
 *
 * Accessibility (WCAG 2.1):
 * - Supports polymorphic `as` prop so consumers can render semantic HTML elements
 *   (main, section, article, aside, header, footer, nav) instead of a plain <div>.
 * - Accepts `aria-label`, `aria-labelledby`, and `aria-describedby` to give
 *   screen readers a meaningful context for landmark / sectioning elements.
 * - Accepts `role` so consumers can assign explicit ARIA landmark roles when a
 *   native semantic element is not appropriate.
 * - Forwards all standard HTML div attributes so keyboard-navigation props
 *   (tabIndex, onKeyDown, etc.) flow through without extra wrapping.
 * - The `data-testid` attribute defaults to `"responsive-container"` to make
 *   the element easily targetable in automated accessibility tests.
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

// ---------------------------------------------------------------------------
// Allowed semantic element types for the polymorphic `as` prop
// ---------------------------------------------------------------------------
type AllowedElement =
  | 'div'
  | 'main'
  | 'section'
  | 'article'
  | 'aside'
  | 'header'
  | 'footer'
  | 'nav';

export interface ResponsiveContainerProps
  extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;

  /**
   * Render as a semantic HTML element instead of a plain <div>.
   * Defaults to "div".
   *
   * @example
   * <ResponsiveContainer as="main" aria-label="Main content">
   *   ...
   * </ResponsiveContainer>
   */
  as?: AllowedElement;

  /**
   * ARIA role override. Useful when `as="div"` but a landmark role is needed.
   * Prefer using the `as` prop with a native semantic element where possible,
   * as that provides better screen-reader compatibility.
   */
  role?: React.AriaRole;

  /**
   * Accessible label for this container region.
   * Required (or `aria-labelledby`) when the container is rendered as a
   * landmark element (main, nav, section, aside, etc.) so that screen readers
   * can distinguish multiple regions of the same type.
   */
  'aria-label'?: string;

  /** References the id of an element that labels this container region. */
  'aria-labelledby'?: string;

  /** References the id of an element that describes this container region. */
  'aria-describedby'?: string;

  /** data-testid for automated testing. Defaults to "responsive-container". */
  'data-testid'?: string;
}

/**
 * ResponsiveContainer provides consistent, viewport-aware padding
 *
 * Padding scales:
 * - Mobile (<768px): 16px
 * - Tablet (768-1024px): 24px (fluid scaling)
 * - Desktop (≥1024px): 32px
 *
 * @example Basic usage
 * ```tsx
 * <ResponsiveContainer>
 *   <h1>Page Content</h1>
 *   <p>This content has responsive padding</p>
 * </ResponsiveContainer>
 * ```
 *
 * @example Semantic landmark — accessible main content region
 * ```tsx
 * <ResponsiveContainer as="main" aria-label="Main content">
 *   <h1>Welcome</h1>
 * </ResponsiveContainer>
 * ```
 *
 * @example Navigation region
 * ```tsx
 * <ResponsiveContainer as="nav" aria-label="Primary navigation">
 *   <a href="/home">Home</a>
 *   <a href="/properties">Properties</a>
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
  as: Element = 'div',
  'data-testid': testId = 'responsive-container',
  ...rest
}) => {
  const { category } = useViewport();

  // Calculate padding based on viewport category
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
    <Element
      className={cn('responsive-container', className)}
      style={{
        padding: getPadding(),
        // Ensure no horizontal overflow (Requirement 3.1)
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
      data-testid={testId}
      {...rest}
    >
      {children}
    </Element>
  );
};

// ---------------------------------------------------------------------------
// Fluid variant
// ---------------------------------------------------------------------------

export interface ResponsiveContainerFluidProps
  extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;

  /**
   * Render as a semantic HTML element. Defaults to "div".
   */
  as?: AllowedElement;

  role?: React.AriaRole;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;

  /** data-testid for automated testing. Defaults to "responsive-container-fluid". */
  'data-testid'?: string;
}

/**
 * Alternative implementation using CSS clamp() for fluid scaling.
 * This version provides smooth scaling between breakpoints.
 *
 * @example
 * ```tsx
 * <ResponsiveContainerFluid as="section" aria-labelledby="section-title">
 *   <h2 id="section-title">Section Heading</h2>
 *   <p>Content with fluid responsive padding</p>
 * </ResponsiveContainerFluid>
 * ```
 */
export const ResponsiveContainerFluid: React.FC<
  ResponsiveContainerFluidProps
> = ({
  children,
  className,
  as: Element = 'div',
  'data-testid': testId = 'responsive-container-fluid',
  ...rest
}) => {
  return (
    <Element
      className={cn('responsive-container-fluid', className)}
      style={{
        // Fluid padding using clamp()
        // Formula: clamp(min, preferred, max)
        // Scales linearly from 16px at narrow viewports to 32px at wide viewports
        padding: 'clamp(16px, 4vw, 32px)',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
      data-testid={testId}
      {...rest}
    >
      {children}
    </Element>
  );
};

// Export both versions, with step-based as default
export default ResponsiveContainer;
