import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  LoadingSpinner,
  LoadingState,
  FullPageLoading,
  Skeleton,
} from '@/components/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with role="status" for screen readers', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has a default aria-label of "Loading"', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading');
  });

  it('accepts a custom aria-label via the label prop', () => {
    render(<LoadingSpinner label="Fetching data" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Fetching data');
  });

  it('renders a visually hidden sr-only span with the label text', () => {
    render(<LoadingSpinner label="Please wait" />);
    const srText = screen.getByText('Please wait');
    expect(srText).toHaveClass('sr-only');
  });

  it('applies the correct size class for sm', () => {
    render(<LoadingSpinner size="sm" />);
    expect(screen.getByRole('status')).toHaveClass('w-4', 'h-4');
  });

  it('applies the correct size class for md (default)', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toHaveClass('w-6', 'h-6');
  });

  it('applies the correct size class for lg', () => {
    render(<LoadingSpinner size="lg" />);
    expect(screen.getByRole('status')).toHaveClass('w-8', 'h-8');
  });

  it('applies a custom className', () => {
    render(<LoadingSpinner className="my-custom-class" />);
    expect(screen.getByRole('status')).toHaveClass('my-custom-class');
  });

  it('applies the animate-spin class', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toHaveClass('animate-spin');
  });
});

describe('LoadingState', () => {
  it('renders at least one element with role="status"', () => {
    render(<LoadingState />);
    // LoadingState wraps a LoadingSpinner, so there are multiple status elements
    const statusEls = screen.getAllByRole('status');
    expect(statusEls.length).toBeGreaterThanOrEqual(1);
  });

  it('the outer wrapper has aria-live="polite" for non-intrusive announcements', () => {
    const { container } = render(<LoadingState />);
    const outer = container.firstChild as HTMLElement;
    expect(outer).toHaveAttribute('aria-live', 'polite');
  });

  it('displays the default message text (visible span)', () => {
    render(<LoadingState />);
    // The visible span has aria-hidden="true"
    const visibleSpan = screen.getByText('Loading...', { selector: '[aria-hidden="true"]' });
    expect(visibleSpan).toBeInTheDocument();
  });

  it('displays a custom message', () => {
    render(<LoadingState message="Fetching properties..." />);
    const visibleSpan = screen.getByText('Fetching properties...', { selector: '[aria-hidden="true"]' });
    expect(visibleSpan).toBeInTheDocument();
  });

  it('the visible message span has aria-hidden to avoid double-announcement', () => {
    render(<LoadingState message="Loading..." />);
    const visibleText = screen.getByText('Loading...', { selector: '[aria-hidden="true"]' });
    expect(visibleText).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('FullPageLoading', () => {
  it('renders at least one element with role="status"', () => {
    render(<FullPageLoading />);
    const statusEls = screen.getAllByRole('status');
    expect(statusEls.length).toBeGreaterThanOrEqual(1);
  });

  it('the outer wrapper has aria-live="polite"', () => {
    const { container } = render(<FullPageLoading />);
    const outer = container.firstChild as HTMLElement;
    expect(outer).toHaveAttribute('aria-live', 'polite');
  });

  it('the outer wrapper has an aria-label matching the message', () => {
    const { container } = render(<FullPageLoading message="Connecting to wallet..." />);
    const outer = container.firstChild as HTMLElement;
    expect(outer).toHaveAttribute('aria-label', 'Connecting to wallet...');
  });

  it('renders the message text visually', () => {
    render(<FullPageLoading message="Please wait" />);
    // The visible <p> has aria-hidden="true"
    const visibleText = screen.getByText('Please wait', { selector: '[aria-hidden="true"]' });
    expect(visibleText).toBeInTheDocument();
  });

  it('covers the full viewport with fixed positioning', () => {
    const { container } = render(<FullPageLoading />);
    const outer = container.firstChild as HTMLElement;
    expect(outer).toHaveClass('fixed', 'inset-0');
  });
});

describe('Skeleton', () => {
  it('renders with role="status" and aria-busy="true"', () => {
    render(<Skeleton />);
    const el = screen.getByRole('status');
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute('aria-busy', 'true');
  });

  it('renders the correct number of skeleton lines', () => {
    render(<Skeleton lines={3} />);
    const el = screen.getByRole('status');
    const animatedLines = el.querySelectorAll('.animate-pulse');
    expect(animatedLines).toHaveLength(3);
  });

  it('renders a sr-only text for screen readers', () => {
    render(<Skeleton />);
    expect(screen.getByText('Loading content')).toHaveClass('sr-only');
  });
});
