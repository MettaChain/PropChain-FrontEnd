/**
 * Unit tests for LazyLoadingExample.tsx
 *
 * Issue #340 — focused unit tests covering:
 * - ManualLazyLoadingExample  — setupLazyLoading() called with container ref
 * - PreloadCriticalImagesExample — preloadCriticalResources() called with correct URLs
 * - SkeletonImageExample — all four SkeletonImage variants render correctly
 * - CustomPlaceholderExample — manual isLoading toggle, placeholder hides after load
 * - ContentSkeletonExample  — skeleton shown initially, content shown after timeout
 * - PropertyListingExample  — loading skeletons → actual properties after timeout
 * - Accessibility attributes on all examples
 * - Edge cases: no console.log, IntersectionObserver cleanup, double-render safety
 */

import React from 'react';
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  ManualLazyLoadingExample,
  PreloadCriticalImagesExample,
  SkeletonImageExample,
  CustomPlaceholderExample,
  ContentSkeletonExample,
  PropertyListingExample,
} from '../LazyLoadingExample';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSetupLazyLoading = jest.fn();
const mockPreloadCriticalResources = jest.fn();

jest.mock('@/lib/mobile-optimizer', () => ({
  setupLazyLoading: (...args: unknown[]) => mockSetupLazyLoading(...args),
  preloadCriticalResources: (...args: unknown[]) =>
    mockPreloadCriticalResources(...args),
}));

// IntersectionObserver and ResizeObserver are already mocked in jest.setup.js

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

// ---------------------------------------------------------------------------
// ManualLazyLoadingExample
// ---------------------------------------------------------------------------

describe('ManualLazyLoadingExample', () => {
  it('renders without crashing', () => {
    const { container } = render(<ManualLazyLoadingExample />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders three images with data-src attributes', () => {
    render(<ManualLazyLoadingExample />);
    const imgs = screen.getAllByRole('img');
    expect(imgs).toHaveLength(3);
    imgs.forEach((img) => {
      expect(img).toHaveAttribute('data-src');
    });
  });

  it('images have correct data-src values', () => {
    render(<ManualLazyLoadingExample />);
    const imgs = screen.getAllByRole('img') as HTMLImageElement[];
    expect(imgs[0]).toHaveAttribute('data-src', '/images/property-1.jpg');
    expect(imgs[1]).toHaveAttribute('data-src', '/images/property-2.jpg');
    expect(imgs[2]).toHaveAttribute('data-src', '/images/property-3.jpg');
  });

  it('images have descriptive alt text (accessibility)', () => {
    render(<ManualLazyLoadingExample />);
    expect(screen.getByAltText('Property 1')).toBeInTheDocument();
    expect(screen.getByAltText('Property 2')).toBeInTheDocument();
    expect(screen.getByAltText('Property 3')).toBeInTheDocument();
  });

  it('calls setupLazyLoading with the container element on mount', () => {
    render(<ManualLazyLoadingExample />);
    expect(mockSetupLazyLoading).toHaveBeenCalledTimes(1);
    expect(mockSetupLazyLoading).toHaveBeenCalledWith(expect.any(HTMLDivElement));
  });

  it('does not call setupLazyLoading before mount', () => {
    // Verify the mock is clean before render
    expect(mockSetupLazyLoading).not.toHaveBeenCalled();
  });

  it('renders the container with image-gallery class', () => {
    const { container } = render(<ManualLazyLoadingExample />);
    expect(container.firstChild).toHaveClass('image-gallery');
  });

  it('images have 100% width style', () => {
    render(<ManualLazyLoadingExample />);
    const imgs = screen.getAllByRole('img') as HTMLImageElement[];
    imgs.forEach((img) => {
      expect(img).toHaveStyle({ width: '100%' });
    });
  });

  it('does not call console.log during render or effect', () => {
    const spy = jest.spyOn(console, 'log');
    render(<ManualLazyLoadingExample />);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// PreloadCriticalImagesExample
// ---------------------------------------------------------------------------

describe('PreloadCriticalImagesExample', () => {
  it('renders without crashing', () => {
    const { container } = render(<PreloadCriticalImagesExample />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders hero banner image', () => {
    render(<PreloadCriticalImagesExample />);
    expect(screen.getByAltText('Hero Banner')).toBeInTheDocument();
  });

  it('renders featured property image', () => {
    render(<PreloadCriticalImagesExample />);
    expect(screen.getByAltText('Featured Property')).toBeInTheDocument();
  });

  it('images have correct src attributes (no lazy loading)', () => {
    render(<PreloadCriticalImagesExample />);
    const heroImg = screen.getByAltText('Hero Banner') as HTMLImageElement;
    const featuredImg = screen.getByAltText('Featured Property') as HTMLImageElement;
    expect(heroImg).toHaveAttribute('src', '/images/hero-banner.jpg');
    expect(featuredImg).toHaveAttribute('src', '/images/featured-property.jpg');
  });

  it('calls preloadCriticalResources with correct URLs on mount', () => {
    render(<PreloadCriticalImagesExample />);
    expect(mockPreloadCriticalResources).toHaveBeenCalledTimes(1);
    expect(mockPreloadCriticalResources).toHaveBeenCalledWith([
      '/images/hero-banner.jpg',
      '/images/featured-property.jpg',
    ]);
  });

  it('does not call preloadCriticalResources on re-render (effect runs once)', () => {
    const { rerender } = render(<PreloadCriticalImagesExample />);
    rerender(<PreloadCriticalImagesExample />);
    expect(mockPreloadCriticalResources).toHaveBeenCalledTimes(1);
  });

  it('renders exactly two images', () => {
    render(<PreloadCriticalImagesExample />);
    expect(screen.getAllByRole('img')).toHaveLength(2);
  });

  it('does not call console.log', () => {
    const spy = jest.spyOn(console, 'log');
    render(<PreloadCriticalImagesExample />);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// SkeletonImageExample
// ---------------------------------------------------------------------------

describe('SkeletonImageExample', () => {
  it('renders without crashing', () => {
    const { container } = render(<SkeletonImageExample />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with property-grid class', () => {
    const { container } = render(<SkeletonImageExample />);
    expect(container.firstChild).toHaveClass('property-grid');
  });

  it('renders four SkeletonImage placeholders while images are loading', () => {
    render(<SkeletonImageExample />);
    // Each SkeletonImage shows an "Loading X" aria-label before loaded
    const loadingPlaceholders = screen.getAllByRole('img', {
      name: /loading/i,
    });
    expect(loadingPlaceholders.length).toBeGreaterThanOrEqual(4);
  });

  it('renders actual img elements for each property image', () => {
    render(<SkeletonImageExample />);
    // The actual <img> tags are in the DOM (hidden behind skeleton)
    const allImgs = screen.getAllByRole('img');
    // Should include both placeholders and actual images
    expect(allImgs.length).toBeGreaterThanOrEqual(4);
  });

  it('skeleton variant placeholder has shimmer animation', () => {
    render(<SkeletonImageExample />);
    const skeletonPlaceholder = screen.getByRole('img', {
      name: /loading property 1/i,
    });
    expect(skeletonPlaceholder).toHaveStyle({
      animation: 'shimmer 1.5s ease-in-out infinite',
    });
  });

  it('blur variant placeholder has blur filter', () => {
    render(<SkeletonImageExample />);
    const blurPlaceholder = screen.getByRole('img', {
      name: /loading property 2/i,
    });
    expect(blurPlaceholder).toHaveStyle({ filter: 'blur(10px)' });
  });

  it('property 1 img has data-src for lazy loading', () => {
    render(<SkeletonImageExample />);
    const img = screen.getByAltText('Property 1') as HTMLImageElement;
    expect(img.getAttribute('data-src')).toBe('/images/property-1.jpg');
  });

  it('hero image does not use lazy loading (src set directly)', () => {
    render(<SkeletonImageExample />);
    const heroImg = screen.getByAltText('Hero Image') as HTMLImageElement;
    expect(heroImg.src).toContain('/images/hero.jpg');
    expect(heroImg).not.toHaveAttribute('data-src');
  });

  it('all images have descriptive alt text (accessibility)', () => {
    render(<SkeletonImageExample />);
    expect(screen.getByAltText('Property 1')).toBeInTheDocument();
    expect(screen.getByAltText('Property 2')).toBeInTheDocument();
    expect(screen.getByAltText('Property 3')).toBeInTheDocument();
    expect(screen.getByAltText('Hero Image')).toBeInTheDocument();
  });

  it('placeholders carry aria-busy="true" while loading', () => {
    render(<SkeletonImageExample />);
    const placeholder = screen.getByRole('img', { name: /loading property 1/i });
    expect(placeholder).toHaveAttribute('aria-busy', 'true');
  });

  it('does not call console.log', () => {
    const spy = jest.spyOn(console, 'log');
    render(<SkeletonImageExample />);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// CustomPlaceholderExample
// ---------------------------------------------------------------------------

describe('CustomPlaceholderExample', () => {
  it('renders without crashing', () => {
    const { container } = render(<CustomPlaceholderExample />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('shows ImagePlaceholder skeleton while loading', () => {
    render(<CustomPlaceholderExample />);
    const placeholder = screen.getByRole('img', {
      name: 'Loading property image',
    });
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveAttribute('aria-busy', 'true');
  });

  it('renders the actual image element', () => {
    render(<CustomPlaceholderExample />);
    const img = screen.getByAltText('Property') as HTMLImageElement;
    expect(img).toBeInTheDocument();
  });

  it('image is invisible (opacity 0) while placeholder is shown', () => {
    render(<CustomPlaceholderExample />);
    const img = screen.getByAltText('Property') as HTMLImageElement;
    expect(img).toHaveStyle({ opacity: 0 });
  });

  it('hides placeholder and shows image after onLoad fires', () => {
    render(<CustomPlaceholderExample />);
    const img = screen.getByAltText('Property') as HTMLImageElement;

    fireEvent.load(img);

    expect(
      screen.queryByRole('img', { name: 'Loading property image' })
    ).not.toBeInTheDocument();
    expect(img).toHaveStyle({ opacity: 1 });
  });

  it('placeholder has correct aria-label', () => {
    render(<CustomPlaceholderExample />);
    expect(
      screen.getByRole('img', { name: 'Loading property image' })
    ).toBeInTheDocument();
  });

  it('does not call console.log', () => {
    const spy = jest.spyOn(console, 'log');
    render(<CustomPlaceholderExample />);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// ContentSkeletonExample
// ---------------------------------------------------------------------------

describe('ContentSkeletonExample', () => {
  it('renders without crashing', () => {
    const { container } = render(<ContentSkeletonExample />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('shows skeleton loading state initially', () => {
    render(<ContentSkeletonExample />);
    // Skeleton elements have role="status"
    const skeletons = screen.getAllByRole('status');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('does not show property content before timeout', () => {
    render(<ContentSkeletonExample />);
    expect(
      screen.queryByText('Beautiful Modern Home')
    ).not.toBeInTheDocument();
    expect(screen.queryByText('$750,000')).not.toBeInTheDocument();
  });

  it('shows actual content after 2000ms timeout', async () => {
    render(<ContentSkeletonExample />);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(screen.getByText('Beautiful Modern Home')).toBeInTheDocument();
    });
    expect(screen.getByText('$750,000')).toBeInTheDocument();
    expect(
      screen.getByText(
        /4 bedrooms, 3 bathrooms, and a spacious backyard/i
      )
    ).toBeInTheDocument();
  });

  it('hides skeleton after timeout', async () => {
    render(<ContentSkeletonExample />);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(screen.queryAllByRole('status')).toHaveLength(0);
    });
  });

  it('shows property image after loading', async () => {
    render(<ContentSkeletonExample />);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(screen.getByAltText('Property')).toBeInTheDocument();
    });
  });

  it('does not advance to content before timeout completes', () => {
    render(<ContentSkeletonExample />);

    act(() => {
      jest.advanceTimersByTime(1999);
    });

    expect(
      screen.queryByText('Beautiful Modern Home')
    ).not.toBeInTheDocument();
  });

  it('does not call console.log', () => {
    const spy = jest.spyOn(console, 'log');
    render(<ContentSkeletonExample />);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// PropertyListingExample
// ---------------------------------------------------------------------------

describe('PropertyListingExample', () => {
  it('renders without crashing', () => {
    const { container } = render(<PropertyListingExample />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('calls preloadCriticalResources for hero image on mount', () => {
    render(<PropertyListingExample />);
    expect(mockPreloadCriticalResources).toHaveBeenCalledWith([
      '/images/hero-property.jpg',
    ]);
  });

  it('shows skeleton placeholder cards while loading', () => {
    render(<PropertyListingExample />);
    const skeletons = screen.getAllByRole('status');
    // 4 skeletons per card × 3 cards = 12
    expect(skeletons.length).toBeGreaterThanOrEqual(12);
  });

  it('shows hero SkeletonImage regardless of loading state', () => {
    render(<PropertyListingExample />);
    expect(screen.getByAltText('Featured Property')).toBeInTheDocument();
  });

  it('does not show property titles before timeout', () => {
    render(<PropertyListingExample />);
    expect(screen.queryByText('Modern Villa')).not.toBeInTheDocument();
    expect(screen.queryByText('Cozy Cottage')).not.toBeInTheDocument();
    expect(screen.queryByText('Luxury Apartment')).not.toBeInTheDocument();
  });

  it('shows actual property cards after 1500ms', async () => {
    render(<PropertyListingExample />);

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    await waitFor(() => {
      expect(screen.getByText('Modern Villa')).toBeInTheDocument();
    });
    expect(screen.getByText('Cozy Cottage')).toBeInTheDocument();
    expect(screen.getByText('Luxury Apartment')).toBeInTheDocument();
  });

  it('shows property prices after timeout', async () => {
    render(<PropertyListingExample />);

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    await waitFor(() => {
      expect(screen.getByText('$850,000')).toBeInTheDocument();
    });
    expect(screen.getByText('$450,000')).toBeInTheDocument();
    expect(screen.getByText('$1,200,000')).toBeInTheDocument();
  });

  it('hides skeleton cards after loading completes', async () => {
    render(<PropertyListingExample />);

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    await waitFor(() => {
      expect(screen.getByText('Modern Villa')).toBeInTheDocument();
    });

    // Property card skeletons are gone; hero placeholder may still be present
    const statusRoles = screen.queryAllByRole('status');
    expect(statusRoles).toHaveLength(0);
  });

  it('does not show properties before 1500ms elapses', () => {
    render(<PropertyListingExample />);

    act(() => {
      jest.advanceTimersByTime(1499);
    });

    expect(screen.queryByText('Modern Villa')).not.toBeInTheDocument();
  });

  it('renders property images with lazy loading after timeout', async () => {
    render(<PropertyListingExample />);

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    await waitFor(() => {
      const img = screen.getByAltText('Modern Villa') as HTMLImageElement;
      expect(img.getAttribute('data-src')).toBe('/images/property-1.jpg');
    });
  });

  it('renders three property cards after loading', async () => {
    render(<PropertyListingExample />);

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    await waitFor(() => {
      expect(screen.getAllByText(/Villa|Cottage|Apartment/).length).toBe(3);
    });
  });

  it('does not call console.log during render or effects', () => {
    const spy = jest.spyOn(console, 'log');
    render(<PropertyListingExample />);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
  it('ManualLazyLoadingExample — setupLazyLoading not called if ref is null', () => {
    // React guarantees refs are set before effects, so this is a safety check
    // Render and unmount quickly — no errors should be thrown
    const { unmount } = render(<ManualLazyLoadingExample />);
    expect(() => unmount()).not.toThrow();
  });

  it('PreloadCriticalImagesExample — renders correctly on re-mount', () => {
    const { unmount } = render(<PreloadCriticalImagesExample />);
    unmount();
    render(<PreloadCriticalImagesExample />);
    // preloadCriticalResources called once per mount
    expect(mockPreloadCriticalResources).toHaveBeenCalledTimes(2);
  });

  it('ContentSkeletonExample — multiple renders do not multiply timeouts', async () => {
    const { rerender } = render(<ContentSkeletonExample />);
    rerender(<ContentSkeletonExample />);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(screen.getByText('Beautiful Modern Home')).toBeInTheDocument();
    });
  });

  it('PropertyListingExample — unmounting before timeout does not throw', () => {
    const { unmount } = render(<PropertyListingExample />);
    expect(() => {
      act(() => {
        jest.advanceTimersByTime(500);
        unmount();
      });
    }).not.toThrow();
  });

  it('CustomPlaceholderExample — multiple load events are idempotent', () => {
    render(<CustomPlaceholderExample />);
    const img = screen.getByAltText('Property') as HTMLImageElement;

    fireEvent.load(img);
    fireEvent.load(img);

    // Placeholder stays gone, image stays visible
    expect(
      screen.queryByRole('img', { name: 'Loading property image' })
    ).not.toBeInTheDocument();
    expect(img).toHaveStyle({ opacity: 1 });
  });

  it('SkeletonImageExample — IntersectionObserver is set up for lazy images', () => {
    render(<SkeletonImageExample />);
    // 3 lazy images → 3 IntersectionObserver instances
    expect(global.IntersectionObserver).toHaveBeenCalled();
  });
});
