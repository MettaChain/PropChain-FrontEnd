import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecoveryDialog } from './RecoveryDialog';


describe('RecoveryDialog', () => {
  it('does not render when isOpen is false', () => {
    render(
      <RecoveryDialog 
        isOpen={false} 
        onConfirm={jest.fn()} 
        onCancel={jest.fn()} 
        context={null} 
      />
    );
    expect(screen.queryByText('Application Recovery')).not.toBeInTheDocument();
  });

  it('renders correctly when isOpen is true', () => {
    render(
      <RecoveryDialog 
        isOpen={true} 
        onConfirm={jest.fn()} 
        onCancel={jest.fn()} 
        context={{ errorId: '123', timestamp: 0, reason: 'Memory leak detected' }} 
      />
    );
    expect(screen.getByText('Application Recovery')).toBeInTheDocument();
    expect(screen.getByText(/Memory leak detected/)).toBeInTheDocument();
  });

  it('calls onConfirm when reload button is clicked', () => {
    const onConfirm = jest.fn();
    render(
      <RecoveryDialog 
        isOpen={true} 
        onConfirm={onConfirm} 
        onCancel={jest.fn()} 
        context={null} 
      />
    );
    fireEvent.click(screen.getByText('Reload Application'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = jest.fn();
    render(
      <RecoveryDialog 
        isOpen={true} 
        onConfirm={jest.fn()} 
        onCancel={onCancel} 
        context={null} 
      />
    );
    fireEvent.click(screen.getByText('Wait, let me check'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
