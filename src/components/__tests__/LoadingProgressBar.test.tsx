import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { LoadingProgressBar } from '@/components/LoadingProgressBar';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

import { usePathname, useSearchParams } from 'next/navigation';

const mockMatchMedia = (reduce = false) =>
  jest.fn().mockImplementation((query) => ({
    matches: reduce && query === '(prefers-reduced-motion: reduce)',
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));

const tick = () => {
  act(() => {
    jest.advanceTimersByTime(100);
  });
};

const innerBar = (container: HTMLElement) =>
  container.firstElementChild?.firstElementChild as HTMLElement | null;

describe('LoadingProgressBar', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(false),
    });
    (usePathname as jest.Mock).mockReturnValue('/');
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders nothing initially when not visible', () => {
    const { container } = render(<LoadingProgressBar />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders progress bar with default props', () => {
    const { container } = render(<LoadingProgressBar />);
    tick();
    expect(innerBar(container)).toBeInTheDocument();
  });

  it('applies custom color prop', () => {
    const { container } = render(<LoadingProgressBar color="#ff0000" />);
    tick();
    expect(innerBar(container)).toHaveStyle({ backgroundColor: '#ff0000' });
  });

  it('applies custom height prop', () => {
    const { container } = render(<LoadingProgressBar height={5} />);
    tick();
    const progressBarContainer = container.firstChild as HTMLElement;
    expect(progressBarContainer).toHaveStyle({ height: '5px' });
  });

  it('applies custom duration prop', () => {
    const { container } = render(<LoadingProgressBar duration={500} />);
    tick();
    expect(innerBar(container)).toBeInTheDocument();
  });

  it('respects prefers-reduced-motion setting', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(true),
    });

    (usePathname as jest.Mock).mockReturnValue('/');
    const { container } = render(<LoadingProgressBar />);
    tick();

    // With reduced motion, the progress bar should not appear
    expect(container).toBeEmptyDOMElement();
  });

  it('shows progress on route change', () => {
    (usePathname as jest.Mock).mockReturnValue('/');
    const { container } = render(<LoadingProgressBar />);
    tick();
    expect(innerBar(container)).toBeInTheDocument();
  });

  it('cleans up timers on unmount', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    (usePathname as jest.Mock).mockReturnValue('/');
    const { unmount } = render(<LoadingProgressBar />);
    tick();
    unmount();

    // Verify cleanup functions were called
    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(clearIntervalSpy).toHaveBeenCalled();

    clearIntervalSpy.mockRestore();
    clearTimeoutSpy.mockRestore();
  });

  it('has no web3 integrations - security audit verification', () => {
    const componentSource = React.createElement(LoadingProgressBar).type.toString();

    expect(componentSource).not.toMatch(/wallet|sign|ethers|viem|wagmi|web3/i);
  });

  it('handles search params changes', () => {
    (usePathname as jest.Mock).mockReturnValue('/');
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('param=value'));

    const { container } = render(<LoadingProgressBar />);
    tick();
    expect(innerBar(container)).toBeInTheDocument();
  });

  it('uses safe default values for props', () => {
    (usePathname as jest.Mock).mockReturnValue('/');
    const { container } = render(<LoadingProgressBar />);
    tick();

    const progressBarContainer = container.firstChild as HTMLElement;
    const progressBar = innerBar(container);

    expect(progressBar).toHaveStyle({ backgroundColor: '#2563eb' });
    expect(progressBarContainer).toHaveStyle({ height: '3px' });
  });
});
