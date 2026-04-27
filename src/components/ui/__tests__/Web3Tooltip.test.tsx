import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Web3Tooltip } from '../Web3Tooltip';

describe('Web3Tooltip', () => {
  it('should render children with tooltip icon', () => {
    render(<Web3Tooltip term="gas fee">Gas Fee</Web3Tooltip>);
    
    expect(screen.getByText('Gas Fee')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should not render tooltip for unknown terms', () => {
    render(<Web3Tooltip term="unknown term">Unknown</Web3Tooltip>);
    
    expect(screen.getByText('Unknown')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should render without icon when showIcon is false', () => {
    render(<Web3Tooltip term="gas fee" showIcon={false}>Gas Fee</Web3Tooltip>);
    
    expect(screen.getByText('Gas Fee')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<Web3Tooltip term="gas fee" className="custom-class">Gas Fee</Web3Tooltip>);
    
    const element = screen.getByText('Gas Fee');
    expect(element).toHaveClass('custom-class');
  });

  it('should show tooltip on hover', async () => {
    render(<Web3Tooltip term="gas fee">Gas Fee</Web3Tooltip>);
    
    const trigger = screen.getByRole('button');
    await userEvent.hover(trigger);
    
    // Tooltip content should appear
    expect(screen.getByText(/fee paid to blockchain validators/)).toBeInTheDocument();
  });
});
