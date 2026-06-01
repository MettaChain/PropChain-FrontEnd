import React from 'react';
import { render, screen } from '@testing-library/react';
import PropertyPageSkeleton from '@/components/PropertyPageSkeleton';

describe('PropertyPageSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<PropertyPageSkeleton />);
    expect(container).not.toBeEmptyDOMElement();
  });

  it('renders a sticky header section', () => {
    const { container } = render(<PropertyPageSkeleton />);
    const header = container.querySelector('header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('sticky');
  });

  it('renders the correct number of filter skeleton items (5)', () => {
    const { container } = render(<PropertyPageSkeleton />);
    // The filter row has 5 skeleton pills
    const filterRow = container.querySelector('.flex.flex-wrap.gap-3');
    expect(filterRow).toBeInTheDocument();
    const filterSkeletons = filterRow!.querySelectorAll('[class*="h-10"]');
    expect(filterSkeletons).toHaveLength(5);
  });

  it('renders the correct number of property card skeletons (9)', () => {
    const { container } = render(<PropertyPageSkeleton />);
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    // Each card is a direct child div of the grid
    const cards = grid!.querySelectorAll(':scope > div');
    expect(cards).toHaveLength(9);
  });

  it('each property card skeleton contains an image placeholder and content rows', () => {
    const { container } = render(<PropertyPageSkeleton />);
    const grid = container.querySelector('.grid');
    const cards = grid!.querySelectorAll(':scope > div');

    cards.forEach((card) => {
      // Image placeholder: h-48 skeleton
      const imageSkeleton = card.querySelector('[class*="h-48"]');
      expect(imageSkeleton).toBeInTheDocument();
      // Content area
      const contentArea = card.querySelector('.p-4');
      expect(contentArea).toBeInTheDocument();
    });
  });

  it('applies dark mode classes for theming', () => {
    const { container } = render(<PropertyPageSkeleton />);
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain('dark:bg-gray-900');
  });

  it('renders a full-height layout wrapper', () => {
    const { container } = render(<PropertyPageSkeleton />);
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain('min-h-screen');
  });
});
