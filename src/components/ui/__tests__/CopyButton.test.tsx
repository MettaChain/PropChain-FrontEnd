import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CopyButton } from '../CopyButton';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

describe('CopyButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render copy button with default variant', () => {
    render(<CopyButton text="test text" />);
    
    expect(screen.getByText('Copy')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should render copy button with icon variant', () => {
    render(<CopyButton text="test text" variant="icon" />);
    
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.queryByText('Copy')).not.toBeInTheDocument();
  });

  it('should render copy button with text variant', () => {
    render(<CopyButton text="test text" variant="text" label="Copy Text" />);
    
    expect(screen.getByText('Copy Text')).toBeInTheDocument();
  });

  it('should copy text to clipboard when clicked', async () => {
    render(<CopyButton text="test text" />);
    
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text');
  });

  it('should show copied state after click', async () => {
    render(<CopyButton text="test text" />);
    
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });
});
