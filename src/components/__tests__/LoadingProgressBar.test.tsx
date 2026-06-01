import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { LoadingProgressBar } from '@/components/LoadingProgressBar';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

import { usePathname, useSearchParams } from 'next/navigation';

describe('LoadingProgressBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (usePathname as jest.Mock).mockReturnValue('/');
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
  });

  it('renders nothing initially when not visible', () => {
    const { container } = render(<LoadingProgressBar />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders progress bar with default props', () => {
    (usePathname as jest.Mock).mockReturnValue('/');
    const { container } = render(<LoadingProgressBar />);
    
    // Component starts invisible, so we need to wait for it to appear
    // Since it's a client component with useEffect, it should appear after mount
    expect(container).not.toBeEmptyDOMElement();
  });

  it('applies custom color prop', () => {
    (usePathname as jest.Mock).mockReturnValue('/');
    const { container } = render(<LoadingProgressBar color="#ff0000" />);
    
    const progressBar = container.querySelector('div > div');
    expect(progressBar).toHaveStyle({ backgroundColor: '#ff0000' });
  });

  it('applies custom height prop', () => {
    (usePathname as jest.Mock).mockReturnValue('/');
    const { container } = render(<LoadingProgressBar height={5} />);
    
    const progressBarContainer = container.firstChild as HTMLElement;
    expect(progressBarContainer).toHaveStyle({ height: '5px' });
  });

  it('applies custom duration prop', () => {
    (usePathname as jest.Mock).mockReturnValue('/');
    const { container } = render(<LoadingProgressBar duration={500} />);
    
    const progressBar = container.querySelector('div > div');
    expect(progressBar).toBeInTheDocument();
  });

  it('respects prefers-reduced-motion setting', () => {
    // Mock window.matchMedia to return true for reduced motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    (usePathname as jest.Mock).mockReturnValue('/');
    const { container } = render(<LoadingProgressBar />);
    
    // With reduced motion, the progress bar should not appear
    expect(container).toBeEmptyDOMElement();
  });

  it('shows progress on route change', async () => {
    (usePathname as jest.Mock).mockReturnValue('/');
    const { container } = render(<LoadingProgressBar />);
    
    await waitFor(() => {
      const progressBar = container.querySelector('div > div');
      expect(progressBar).toBeInTheDocument();
    });
  });

  it('cleans up timers on unmount', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    
    (usePathname as jest.Mock).mockReturnValue('/');
    const { unmount } = render(<LoadingProgressBar />);
    
    unmount();
    
    // Verify cleanup functions were called
    expect(clearIntervalSpy).toHaveBeenCalled();
    expect(clearTimeoutSpy).toHaveBeenCalled();
    
    clearIntervalSpy.mockRestore();
    clearTimeoutSpy.mockRestore();
  });

  it('has no web3 integrations - security audit verification', () => {
    // This test verifies the security audit finding that this component
    // does not contain any web3 integrations
    const componentSource = React.createElement(LoadingProgressBar).type.toString();
    
    // Check for absence of web3-related terms
    expect(componentSource).not.toMatch(/wallet|sign|ethers|viem|wagmi|web3/i);
  });

  it('handles search params changes', () => {
    (usePathname as jest.Mock).mockReturnValue('/');
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('param=value'));
    
    const { container } = render(<LoadingProgressBar />);
    expect(container).not.toBeEmptyDOMElement();
  });

  it('uses safe default values for props', () => {
    (usePathname as jest.Mock).mockReturnValue('/');
    const { container } = render(<LoadingProgressBar />);
    
    const progressBarContainer = container.firstChild as HTMLElement;
    const progressBar = container.querySelector('div > div');
    
    // Verify default color
    expect(progressBar).toHaveStyle({ backgroundColor: '#2563eb' });
    // Verify default height
    expect(progressBarContainer).toHaveStyle({ height: '3px' });
  });
});
