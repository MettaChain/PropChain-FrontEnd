import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Web3Tooltip } from '../Web3Tooltip';

describe('Web3Tooltip', () => {
  it('should render children with tooltip icon', () => {
    render(<Web3Tooltip term="gas fee">Gas Fee</Web3Tooltip>);
    
    expect(screen.getByText('Gas Fee')).toBeInTheDocument();
    const el = screen.getByText('Gas Fee');
    expect(el.closest('span')?.querySelector('svg')).toBeTruthy();
  });

  it('should not render tooltip for unknown terms', () => {
    render(<Web3Tooltip term="unknown term">Unknown</Web3Tooltip>);
    
    expect(screen.getByText('Unknown')).toBeInTheDocument();
    const el = screen.getByText('Unknown');
    expect(el.closest('span')).toBeNull();
  });

  it('should render without icon when showIcon is false', () => {
    render(<Web3Tooltip term="gas fee" showIcon={false}>Gas Fee</Web3Tooltip>);
    
    expect(screen.getByText('Gas Fee')).toBeInTheDocument();
    const el = screen.getByText('Gas Fee');
    expect(el.closest('span')?.querySelector('svg')).toBeNull();
  });

  it('should apply custom className', () => {
    render(<Web3Tooltip term="gas fee" className="custom-class">Gas Fee</Web3Tooltip>);
    
    const element = screen.getByText('Gas Fee');
    expect(element).toHaveClass('custom-class');
  });

  it('should show tooltip on hover', async () => {
    render(<Web3Tooltip term="gas fee">Gas Fee</Web3Tooltip>);
    
    const el = screen.getByText('Gas Fee');
    const trigger = el.closest('span') as HTMLElement;
    await userEvent.hover(trigger);
    
    // Tooltip content should appear (may render multiple nodes for accessibility)
    const matches = screen.getAllByText(/fee paid to blockchain validators/);
    expect(matches.length).toBeGreaterThan(0);
  });
});
