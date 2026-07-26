import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecoveryDialog } from './RecoveryDialog';
import { describe, it, expect, vi } from 'vitest';

describe('RecoveryDialog', () => {
  it('does not render when isOpen is false', () => {
    render(
      <RecoveryDialog 
        isOpen={false} 
        onConfirm={vi.fn()} 
        onCancel={vi.fn()} 
        context={null} 
      />
    );
    expect(screen.queryByText('Application Recovery')).not.toBeInTheDocument();
  });

  it('renders correctly when isOpen is true', () => {
    render(
      <RecoveryDialog 
        isOpen={true} 
        onConfirm={vi.fn()} 
        onCancel={vi.fn()} 
        context={{ errorId: '123', timestamp: 0, reason: 'Memory leak detected' }} 
      />
    );
    expect(screen.getByText('Application Recovery')).toBeInTheDocument();
    expect(screen.getByText(/Memory leak detected/)).toBeInTheDocument();
  });

  it('calls onConfirm when reload button is clicked', () => {
    const onConfirm = vi.fn();
    render(
      <RecoveryDialog 
        isOpen={true} 
        onConfirm={onConfirm} 
        onCancel={vi.fn()} 
        context={null} 
      />
    );
    fireEvent.click(screen.getByText('Reload Application'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(
      <RecoveryDialog 
        isOpen={true} 
        onConfirm={vi.fn()} 
        onCancel={onCancel} 
        context={null} 
      />
    );
    fireEvent.click(screen.getByText('Wait, let me check'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
