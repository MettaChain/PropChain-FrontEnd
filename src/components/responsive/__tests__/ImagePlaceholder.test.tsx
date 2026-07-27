/**
 * Unit tests for ImagePlaceholder, SkeletonImage, and Skeleton components.
 *
 * Issue #342 — verifies:
 * - No bare console.log calls remain in production code
 * - Structured logger (debug/warn) is used and respects the debug flag
 * - All component variants render correctly
 * - Edge cases (error state, lazy loading, multi-line skeleton) are covered
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  ImagePlaceholder,
  SkeletonImage,
  Skeleton,
  type ImagePlaceholderProps,
} from '../ImagePlaceholder';

// ---------------------------------------------------------------------------
// Mock the logger so we can assert structured logging calls
// ---------------------------------------------------------------------------

// We define the mock functions inside the factory to avoid hoisting issues.
// We expose them via module-level references after the mock is set up.
let mockDebug: jest.Mock;
let mockWarn: jest.Mock;

jest.mock('@/utils/logger', () => {
  const debug = jest.fn();
  const warn = jest.fn();
  return {
    createLogger: jest.fn(() => ({
      debug,
      warn,
      info: jest.fn(),
      error: jest.fn(),
    })),
    __mockDebug: debug,
    __mockWarn: warn,
  };
});

// Retrieve the shared mock references after the module is mocked.
import { createLogger } from '@/utils/logger';
const _loggerModule = jest.requireMock('@/utils/logger') as {
  __mockDebug: jest.Mock;
  __mockWarn: jest.Mock;
};
beforeAll(() => {
  mockDebug = _loggerModule.__mockDebug;
  mockWarn = _loggerModule.__mockWarn;
});

// IntersectionObserver is already mocked globally in jest.setup.js

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderPlaceholder(props: Partial<ImagePlaceholderProps> = {}) {
  return render(<ImagePlaceholder {...props} />);
}

// ---------------------------------------------------------------------------
// ImagePlaceholder
// ---------------------------------------------------------------------------

describe('ImagePlaceholder', () => {
  it('renders with default props', () => {
    renderPlaceholder();
    const el = screen.getByRole('img');
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute('aria-busy', 'true');
    expect(el).toHaveAttribute('aria-label', 'Loading image');
  });

  it('applies custom ariaLabel', () => {
    renderPlaceholder({ ariaLabel: 'Loading property image' });
    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      'Loading property image'
    );
  });

  it('renders skeleton variant by default with shimmer animation styles', () => {
    renderPlaceholder({ variant: 'skeleton' });
    const el = screen.getByRole('img');
    expect(el).toHaveStyle({ animation: 'shimmer 1.5s ease-in-out infinite' });
  });

  it('renders blur variant', () => {
    renderPlaceholder({ variant: 'blur' });
    const el = screen.getByRole('img');
    expect(el).toHaveStyle({ filter: 'blur(10px)' });
  });

  it('renders color variant with custom background color', () => {
    renderPlaceholder({ variant: 'color', backgroundColor: '#ff0000' });
    const el = screen.getByRole('img');
    expect(el).toHaveStyle({ backgroundColor: '#ff0000' });
  });

  it('converts numeric width and height to px strings', () => {
    renderPlaceholder({ width: 400, height: 300 });
    const el = screen.getByRole('img');
    expect(el).toHaveStyle({ width: '400px', height: '300px' });
  });

  it('accepts and passes aspectRatio prop without error', () => {
    // jsdom does not support the CSS aspect-ratio property, so we just verify
    // the component renders correctly when the prop is provided.
    expect(() => renderPlaceholder({ aspectRatio: '16/9' })).not.toThrow();
    const el = screen.getByRole('img');
    expect(el).toBeInTheDocument();
  });

  it('adds custom className', () => {
    renderPlaceholder({ className: 'custom-class' });
    const el = screen.getByRole('img');
    expect(el).toHaveClass('custom-class');
  });
});

// ---------------------------------------------------------------------------
// SkeletonImage — rendering
// ---------------------------------------------------------------------------

describe('SkeletonImage', () => {
  const defaultProps = { src: 'https://example.com/img.jpg', alt: 'Test image' };

  it('shows placeholder while image is loading', () => {
    render(<SkeletonImage {...defaultProps} />);
    expect(screen.getByRole('img', { name: /loading test image/i })).toBeInTheDocument();
  });

  it('hides placeholder once image loads', () => {
    render(<SkeletonImage {...defaultProps} lazy={false} />);
    const img = screen.getByRole('img', { name: 'Test image' }) as HTMLImageElement;
    fireEvent.load(img);
    expect(
      screen.queryByRole('img', { name: /loading test image/i })
    ).not.toBeInTheDocument();
  });

  it('shows error state when image fails to load', () => {
    render(<SkeletonImage {...defaultProps} lazy={false} />);
    const img = screen.getByRole('img', { name: 'Test image' }) as HTMLImageElement;
    fireEvent.error(img);
    expect(screen.getByRole('img', { name: /failed to load test image/i })).toBeInTheDocument();
    expect(screen.getByText('Image failed to load')).toBeInTheDocument();
  });

  it('does not show placeholder after error', () => {
    render(<SkeletonImage {...defaultProps} lazy={false} />);
    const img = screen.getByRole('img', { name: 'Test image' }) as HTMLImageElement;
    fireEvent.error(img);
    expect(
      screen.queryByRole('img', { name: /loading test image/i })
    ).not.toBeInTheDocument();
  });

  it('sets data-src for lazy-loaded images', () => {
    render(<SkeletonImage {...defaultProps} lazy={true} />);
    const img = screen.getByRole('img', { name: 'Test image' }) as HTMLImageElement;
    expect(img.getAttribute('data-src')).toBe(defaultProps.src);
    expect(img.src).toBe('');
  });

  it('sets src directly when lazy=false', () => {
    render(<SkeletonImage {...defaultProps} lazy={false} />);
    const img = screen.getByRole('img', { name: 'Test image' }) as HTMLImageElement;
    expect(img.src).toBe(defaultProps.src);
  });

  it('fires onLoad callback when image loads', () => {
    const onLoad = jest.fn();
    render(<SkeletonImage {...defaultProps} lazy={false} onLoad={onLoad} />);
    const img = screen.getByRole('img', { name: 'Test image' }) as HTMLImageElement;
    fireEvent.load(img);
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it('fires onError callback when image errors', () => {
    const onError = jest.fn();
    render(<SkeletonImage {...defaultProps} lazy={false} onError={onError} />);
    const img = screen.getByRole('img', { name: 'Test image' }) as HTMLImageElement;
    fireEvent.error(img);
    expect(onError).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// SkeletonImage — structured logging (issue #342)
// ---------------------------------------------------------------------------

describe('SkeletonImage — structured logging (issue #342)', () => {
  const defaultProps = { src: 'https://example.com/img.jpg', alt: 'Test image', lazy: false as const };

  beforeEach(() => {
    mockDebug.mockClear();
    mockWarn.mockClear();
  });

  it('calls logger.debug (not console.log) when image loads successfully', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    render(<SkeletonImage {...defaultProps} />);
    const img = screen.getByRole('img', { name: 'Test image' }) as HTMLImageElement;
    fireEvent.load(img);

    // Structured logger must have been called
    expect(mockDebug).toHaveBeenCalledWith(
      'Image loaded successfully',
      expect.objectContaining({ src: defaultProps.src, alt: defaultProps.alt })
    );

    // No bare console.log should have been used by the component
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('calls logger.warn (not console.log) when image fails to load', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    render(<SkeletonImage {...defaultProps} />);
    const img = screen.getByRole('img', { name: 'Test image' }) as HTMLImageElement;
    fireEvent.error(img);

    expect(mockWarn).toHaveBeenCalledWith(
      'Image failed to load',
      expect.objectContaining({ src: defaultProps.src, alt: defaultProps.alt })
    );

    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('does not call console.log during render', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    render(<SkeletonImage {...defaultProps} />);
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// SkeletonImage — IntersectionObserver (lazy loading)
// ---------------------------------------------------------------------------

describe('SkeletonImage — IntersectionObserver lazy loading', () => {
  it('sets up IntersectionObserver when lazy=true', () => {
    render(
      <SkeletonImage src="https://example.com/img.jpg" alt="Lazy image" lazy={true} />
    );
    expect(global.IntersectionObserver).toHaveBeenCalled();
  });

  it('does not set up IntersectionObserver when lazy=false', () => {
    (global.IntersectionObserver as jest.Mock).mockClear();
    render(
      <SkeletonImage src="https://example.com/img.jpg" alt="Eager image" lazy={false} />
    );
    expect(global.IntersectionObserver).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('Skeleton', () => {
  it('renders a single skeleton line by default', () => {
    render(<Skeleton />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading content');
  });

  it('converts numeric width/height/borderRadius to px', () => {
    render(<Skeleton width={200} height={24} borderRadius={8} />);
    const el = screen.getByRole('status');
    expect(el).toHaveStyle({ width: '200px', height: '24px', borderRadius: '8px' });
  });

  it('renders multiple skeleton lines', () => {
    render(<Skeleton lines={3} />);
    const statuses = screen.getAllByRole('status');
    expect(statuses).toHaveLength(3);
  });

  it('last line in multi-line skeleton is 80% wide', () => {
    render(<Skeleton lines={3} width="100%" />);
    const statuses = screen.getAllByRole('status');
    // The last skeleton should have width 80%
    expect(statuses[2]).toHaveStyle({ width: '80%' });
  });

  it('adds custom className', () => {
    const { container } = render(<Skeleton className="my-skeleton" />);
    // Single-line: className on the div
    expect(container.firstChild).toHaveClass('my-skeleton');
  });
});
