import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  BasicContainerExample,
  StyledContainerExample,
  NestedContainersExample,
  FluidContainerExample,
  PageLayoutExample,
  ComparisonExample,
  ResponsiveContainerDemo,
} from '../ResponsiveContainerExample';

describe('ResponsiveContainerExample', () => {
  describe('BasicContainerExample', () => {
    it('should render without crashing', () => {
      render(<BasicContainerExample />);
      expect(screen.getByText('Welcome to PropChain')).toBeInTheDocument();
    });

    it('should display responsive padding description', () => {
      render(<BasicContainerExample />);
      expect(screen.getByText(/responsive padding that adapts to your screen size/i)).toBeInTheDocument();
    });

    it('should mention mobile, tablet, and desktop padding values', () => {
      render(<BasicContainerExample />);
      expect(screen.getByText(/16px/i)).toBeInTheDocument();
      expect(screen.getByText(/24px/i)).toBeInTheDocument();
      expect(screen.getByText(/32px/i)).toBeInTheDocument();
    });
  });

  describe('StyledContainerExample', () => {
    it('should render property details', () => {
      render(<StyledContainerExample />);
      expect(screen.getByText('Property Details')).toBeInTheDocument();
    });

    it('should display location information', () => {
      render(<StyledContainerExample />);
      expect(screen.getByText(/San Francisco, CA/i)).toBeInTheDocument();
    });

    it('should display price', () => {
      render(<StyledContainerExample />);
      expect(screen.getByText(/\$1,200,000/)).toBeInTheDocument();
    });

    it('should display bedroom and bathroom counts', () => {
      render(<StyledContainerExample />);
      expect(screen.getByText(/Bedrooms:\s*3/i)).toBeInTheDocument();
      expect(screen.getByText(/Bathrooms:\s*2/i)).toBeInTheDocument();
    });
  });

  describe('NestedContainersExample', () => {
    it('should render dashboard layout', () => {
      render(<NestedContainersExample />);
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('should display statistics section', () => {
      render(<NestedContainersExample />);
      expect(screen.getByText('Statistics')).toBeInTheDocument();
      expect(screen.getByText('Total Properties: 42')).toBeInTheDocument();
    });

    it('should display recent activity section', () => {
      render(<NestedContainersExample />);
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText(/Last updated:/i)).toBeInTheDocument();
    });
  });

  describe('FluidContainerExample', () => {
    it('should render fluid padding container', () => {
      render(<FluidContainerExample />);
      expect(screen.getByText('Fluid Padding Container')).toBeInTheDocument();
    });

    it('should explain fluid scaling behavior', () => {
      render(<FluidContainerExample />);
      expect(screen.getByText(/smooth, fluid padding that scales/i)).toBeInTheDocument();
    });

    it('should display CSS clamp formula', () => {
      render(<FluidContainerExample />);
      expect(screen.getByText(/clamp\(16px, 4vw, 32px\)/i)).toBeInTheDocument();
    });
  });

  describe('PageLayoutExample', () => {
    it('should render complete page layout', () => {
      render(<PageLayoutExample />);
      expect(screen.getByText('PropChain')).toBeInTheDocument();
    });

    it('should render navigation links', () => {
      render(<PageLayoutExample />);
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Properties')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
    });

    it('should display featured properties section', () => {
      render(<PageLayoutExample />);
      expect(screen.getByText('Featured Properties')).toBeInTheDocument();
    });

    it('should render property cards', () => {
      render(<PageLayoutExample />);
      expect(screen.getByText('Property 1')).toBeInTheDocument();
      expect(screen.getByText('Property 2')).toBeInTheDocument();
      expect(screen.getByText('Property 3')).toBeInTheDocument();
    });

    it('should render footer with copyright', () => {
      render(<PageLayoutExample />);
      expect(screen.getByText(/© 2024 PropChain/i)).toBeInTheDocument();
    });
  });

  describe('ComparisonExample', () => {
    it('should render both container types', () => {
      render(<ComparisonExample />);
      expect(screen.getByText(/Step-based Container/i)).toBeInTheDocument();
      expect(screen.getByText(/Fluid Container/i)).toBeInTheDocument();
    });

    it('should explain step-based padding', () => {
      render(<ComparisonExample />);
      expect(screen.getByText(/step-based padding that changes at breakpoints/i)).toBeInTheDocument();
    });

    it('should explain fluid padding', () => {
      render(<ComparisonExample />);
      expect(screen.getByText(/fluid padding that scales smoothly/i)).toBeInTheDocument();
    });
  });

  describe('ResponsiveContainerDemo', () => {
    it('should render main demo page', () => {
      render(<ResponsiveContainerDemo />);
      expect(screen.getByText('ResponsiveContainer Examples')).toBeInTheDocument();
    });

    it('should render all example sections', () => {
      render(<ResponsiveContainerDemo />);
      expect(screen.getByText('Basic Usage')).toBeInTheDocument();
      expect(screen.getByText('Styled Container')).toBeInTheDocument();
      expect(screen.getByText('Fluid vs Step-based')).toBeInTheDocument();
      expect(screen.getByText('Nested Containers')).toBeInTheDocument();
    });

    it('should display introductory description', () => {
      render(<ResponsiveContainerDemo />);
      expect(screen.getByText(/Explore different use cases/i)).toBeInTheDocument();
    });

    it('should render child components', () => {
      render(<ResponsiveContainerDemo />);
      expect(screen.getByText('Welcome to PropChain')).toBeInTheDocument();
      expect(screen.getByText('Property Details')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<ResponsiveContainerDemo />);
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();
    });

    it('should have readable text contrast (basic check)', () => {
      render(<BasicContainerExample />);
      const text = screen.getByText('Welcome to PropChain');
      expect(text).toBeVisible();
    });

    it('should maintain semantic structure in page layout', () => {
      render(<PageLayoutExample />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content gracefully', () => {
      const { container } = render(<BasicContainerExample />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle long text content', () => {
      render(<BasicContainerExample />);
      const description = screen.getByText(/responsive padding that adapts to your screen size/i);
      expect(description).toBeInTheDocument();
    });

    it('should handle multiple nested containers', () => {
      render(<NestedContainersExample />);
      const containers = screen.getAllByText(/Statistics|Recent Activity/i);
      expect(containers.length).toBeGreaterThan(0);
    });
  });
});
