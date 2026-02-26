/**
 * ResponsiveContainer Unit Tests
 * 
 * Tests for the ResponsiveContainer component to ensure:
 * - Correct padding is applied based on viewport category
 * - Custom className is properly merged
 * - No horizontal overflow occurs
 * - Component renders children correctly
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResponsiveContainer, ResponsiveContainerFluid } from '../ResponsiveContainer';
import * as ViewportProvider from '@/providers/ViewportProvider';

// Mock the useViewport hook
vi.mock('@/providers/ViewportProvider', () => ({
  useViewport: vi.fn(),
}));

describe('ResponsiveContainer', () => {
  beforeEach(() => {
    // Reset mock before each test
    vi.clearAllMocks();
  });

  describe('Padding based on viewport category', () => {
    it('should apply 16px padding for mobile viewport', () => {
      // Mock mobile viewport
      vi.mocked(ViewportProvider.useViewport).mockReturnValue({
        width: 375,
        height: 667,
        category: 'mobile',
        breakpoint: 'sm',
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        orientation: 'portrait',
      });

      const { container } = render(
        <ResponsiveContainer>
          <div>Test Content</div>
        </ResponsiveContainer>
      );

      const containerElement = container.firstChild as HTMLElement;
      expect(containerElement.style.padding).toBe('16px');
    });

    it('should apply 24px padding for tablet viewport', () => {
      // Mock tablet viewport
      vi.mocked(ViewportProvider.useViewport).mockReturnValue({
        width: 768,
        height: 1024,
        category: 'tablet',
        breakpoint: 'md',
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        orientation: 'portrait',
      });

      const { container } = render(
        <ResponsiveContainer>
          <div>Test Content</div>
        </ResponsiveContainer>
      );

      const containerElement = container.firstChild as HTMLElement;
      expect(containerElement.style.padding).toBe('24px');
    });

    it('should apply 32px padding for desktop viewport', () => {
      // Mock desktop viewport
      vi.mocked(ViewportProvider.useViewport).mockReturnValue({
        width: 1280,
        height: 720,
        category: 'desktop',
        breakpoint: 'xl',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        orientation: 'landscape',
      });

      const { container } = render(
        <ResponsiveContainer>
          <div>Test Content</div>
        </ResponsiveContainer>
      );

      const containerElement = container.firstChild as HTMLElement;
      expect(containerElement.style.padding).toBe('32px');
    });
  });

  describe('Custom className support', () => {
    it('should apply custom className', () => {
      vi.mocked(ViewportProvider.useViewport).mockReturnValue({
        width: 375,
        height: 667,
        category: 'mobile',
        breakpoint: 'sm',
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        orientation: 'portrait',
      });

      const { container } = render(
        <ResponsiveContainer className="custom-class bg-gray-100">
          <div>Test Content</div>
        </ResponsiveContainer>
      );

      const containerElement = container.firstChild as HTMLElement;
      expect(containerElement.className).toContain('custom-class');
      expect(containerElement.className).toContain('bg-gray-100');
    });

    it('should include base responsive-container class', () => {
      vi.mocked(ViewportProvider.useViewport).mockReturnValue({
        width: 375,
        height: 667,
        category: 'mobile',
        breakpoint: 'sm',
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        orientation: 'portrait',
      });

      const { container } = render(
        <ResponsiveContainer>
          <div>Test Content</div>
        </ResponsiveContainer>
      );

      const containerElement = container.firstChild as HTMLElement;
      expect(containerElement.className).toContain('responsive-container');
    });
  });

  describe('No horizontal overflow', () => {
    it('should set maxWidth to 100%', () => {
      vi.mocked(ViewportProvider.useViewport).mockReturnValue({
        width: 375,
        height: 667,
        category: 'mobile',
        breakpoint: 'sm',
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        orientation: 'portrait',
      });

      const { container } = render(
        <ResponsiveContainer>
          <div>Test Content</div>
        </ResponsiveContainer>
      );

      const containerElement = container.firstChild as HTMLElement;
      expect(containerElement.style.maxWidth).toBe('100%');
    });

    it('should set box-sizing to border-box', () => {
      vi.mocked(ViewportProvider.useViewport).mockReturnValue({
        width: 375,
        height: 667,
        category: 'mobile',
        breakpoint: 'sm',
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        orientation: 'portrait',
      });

      const { container } = render(
        <ResponsiveContainer>
          <div>Test Content</div>
        </ResponsiveContainer>
      );

      const containerElement = container.firstChild as HTMLElement;
      expect(containerElement.style.boxSizing).toBe('border-box');
    });
  });

  describe('Children rendering', () => {
    it('should render children correctly', () => {
      vi.mocked(ViewportProvider.useViewport).mockReturnValue({
        width: 375,
        height: 667,
        category: 'mobile',
        breakpoint: 'sm',
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        orientation: 'portrait',
      });

      render(
        <ResponsiveContainer>
          <div data-testid="child-content">Test Content</div>
        </ResponsiveContainer>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      vi.mocked(ViewportProvider.useViewport).mockReturnValue({
        width: 375,
        height: 667,
        category: 'mobile',
        breakpoint: 'sm',
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        orientation: 'portrait',
      });

      render(
        <ResponsiveContainer>
          <h1>Title</h1>
          <p>Paragraph</p>
          <button>Button</button>
        </ResponsiveContainer>
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Paragraph')).toBeInTheDocument();
      expect(screen.getByText('Button')).toBeInTheDocument();
    });
  });
});

describe('ResponsiveContainerFluid', () => {
  it('should use clamp() for fluid padding', () => {
    const { container } = render(
      <ResponsiveContainerFluid>
        <div>Test Content</div>
      </ResponsiveContainerFluid>
    );

    const containerElement = container.firstChild as HTMLElement;
    expect(containerElement.style.padding).toBe('clamp(16px, 4vw, 32px)');
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ResponsiveContainerFluid className="fluid-custom">
        <div>Test Content</div>
      </ResponsiveContainerFluid>
    );

    const containerElement = container.firstChild as HTMLElement;
    expect(containerElement.className).toContain('fluid-custom');
  });

  it('should prevent horizontal overflow', () => {
    const { container } = render(
      <ResponsiveContainerFluid>
        <div>Test Content</div>
      </ResponsiveContainerFluid>
    );

    const containerElement = container.firstChild as HTMLElement;
    expect(containerElement.style.maxWidth).toBe('100%');
    expect(containerElement.style.boxSizing).toBe('border-box');
  });
});
