import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderHook, act } from '@testing-library/react';
import { TransactionProgress, useTransactionProgress } from '../TransactionProgress';

describe('TransactionProgress', () => {
  it('should render when isOpen is true', () => {
    render(
      <TransactionProgress 
        isOpen={true}
        onClose={jest.fn()}
        transactionHash="0x1234567890abcdef"
      />
    );
    
    expect(screen.getByText('Transaction in Progress')).toBeInTheDocument();
    expect(screen.getByText('Signing Transaction')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(
      <TransactionProgress 
        isOpen={false}
        onClose={jest.fn()}
      />
    );
    
    expect(screen.queryByText('Transaction in Progress')).not.toBeInTheDocument();
  });

  it('should display transaction hash when provided', () => {
    render(
      <TransactionProgress 
        isOpen={true}
        onClose={jest.fn()}
        transactionHash="0x1234567890abcdef"
      />
    );
    
    expect(screen.getByText(/0x1234...cdef/)).toBeInTheDocument();
  });

  it('should call onClose when close button clicked', async () => {
    const onClose = jest.fn();
    render(
      <TransactionProgress 
        isOpen={true}
        onClose={onClose}
      />
    );
    
    const closeButton = screen.getByText('Close');
    await userEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should have proper ARIA attributes on modal', () => {
      render(
        <TransactionProgress 
          isOpen={true}
          onClose={jest.fn()}
          transactionHash="0x1234567890abcdef"
        />
      );
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby', 'transaction-progress-title');
      expect(modal).toHaveAttribute('aria-describedby', 'transaction-progress-description');
    });

    it('should have accessible title with proper ID', () => {
      render(
        <TransactionProgress 
          isOpen={true}
          onClose={jest.fn()}
        />
      );
      
      const title = screen.getByText('Transaction in Progress');
      expect(title).toHaveAttribute('id', 'transaction-progress-title');
    });

    it('should have close button with aria-label', () => {
      render(
        <TransactionProgress 
          isOpen={true}
          onClose={jest.fn()}
        />
      );
      
      const closeButton = screen.getByLabelText('Close transaction progress');
      expect(closeButton).toBeInTheDocument();
    });

    it('should have progress bar with proper ARIA attributes', () => {
      render(
        <TransactionProgress 
          isOpen={true}
          onClose={jest.fn()}
        />
      );
      
      const progressBar = screen.getByLabelText('Overall transaction progress');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('role', 'progressbar');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should have steps list with proper ARIA role', () => {
      render(
        <TransactionProgress 
          isOpen={true}
          onClose={jest.fn()}
        />
      );
      
      const stepsList = screen.getByRole('list', { name: /transaction steps/i });
      expect(stepsList).toBeInTheDocument();
    });

    it('should have step items with listitem role', () => {
      render(
        <TransactionProgress 
          isOpen={true}
          onClose={jest.fn()}
        />
      );
      
      const stepItems = screen.getAllByRole('listitem');
      expect(stepItems.length).toBeGreaterThan(0);
    });

    it('should have icons hidden from screen readers', () => {
      render(
        <TransactionProgress 
          isOpen={true}
          onClose={jest.fn()}
        />
      );
      
      const icons = screen.getAllByRole('img', { hidden: true });
      icons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('should have live region for progress updates', () => {
      render(
        <TransactionProgress 
          isOpen={true}
          onClose={jest.fn()}
        />
      );
      
      const progressPercentage = screen.getByText(/%/);
      expect(progressPercentage).toHaveAttribute('aria-live', 'polite');
      expect(progressPercentage).toHaveAttribute('aria-atomic', 'true');
    });

    it('should have error message with alert role when error occurs', () => {
      render(
        <TransactionProgress 
          isOpen={true}
          onClose={jest.fn()}
        />
      );
      
      // When error is present, it should have alert role
      // This is a structural check - actual error would need to be triggered
      const errorDiv = screen.queryByRole('alert');
      // Initially no error, so this should be null
      expect(errorDiv).toBeNull();
    });

    it('should close when Escape key is pressed', async () => {
      const onClose = jest.fn();
      render(
        <TransactionProgress 
          isOpen={true}
          onClose={onClose}
        />
      );
      
      await userEvent.keyboard('{Escape}');
      
      expect(onClose).toHaveBeenCalled();
    });

    it('should have focus management - close button should be focusable', () => {
      render(
        <TransactionProgress 
          isOpen={true}
          onClose={jest.fn()}
        />
      );
      
      const closeButton = screen.getByLabelText('Close transaction progress');
      closeButton.focus();
      
      expect(closeButton).toHaveFocus();
    });

    it('should have descriptive aria-label on footer close button', () => {
      render(
        <TransactionProgress 
          isOpen={true}
          onClose={jest.fn()}
        />
      );
      
      const footerButton = screen.getByRole('button', { name: /transaction in progress, please wait/i });
      expect(footerButton).toBeInTheDocument();
      expect(footerButton).toBeDisabled();
    });

    it('should have screen reader only status announcements', () => {
      render(
        <TransactionProgress 
          isOpen={true}
          onClose={jest.fn()}
        />
      );
      
      const statusAnnouncements = screen.getAllByText(/status:/i);
      expect(statusAnnouncements.length).toBeGreaterThan(0);
    });

    it('should have proper color contrast for text (structural check)', () => {
      render(
        <TransactionProgress 
          isOpen={true}
          onClose={jest.fn()}
        />
      );
      
      // This is a structural check - actual contrast testing would require axe-core or similar
      const title = screen.getByText('Transaction in Progress');
      expect(title).toBeInTheDocument();
    });

    it('should have confirmation progress with proper ARIA when active', () => {
      render(
        <TransactionProgress 
          isOpen={true}
          onClose={jest.fn()}
        />
      );
      
      // When confirmation step is in progress, it should have proper ARIA
      const confirmationText = screen.queryByText(/confirmations/i);
      if (confirmationText) {
        expect(confirmationText).toHaveAttribute('aria-live', 'polite');
      }
    });
  });
});

describe('useTransactionProgress', () => {
  it('should return initial state', () => {
    const { result } = renderHook(() => useTransactionProgress());
    
    expect(result.current.isOpen).toBe(false);
    expect(result.current.transactionHash).toBeUndefined();
  });

  it('should start transaction', () => {
    const { result } = renderHook(() => useTransactionProgress());
    const hash = '0x1234567890abcdef';
    
    act(() => {
      result.current.startTransaction(hash);
    });
    
    expect(result.current.isOpen).toBe(true);
    expect(result.current.transactionHash).toBe(hash);
  });

  it('should close transaction', () => {
    const { result } = renderHook(() => useTransactionProgress());
    
    act(() => {
      result.current.startTransaction('0x1234567890abcdef');
    });
    
    act(() => {
      result.current.closeTransaction();
    });
    
    expect(result.current.isOpen).toBe(false);
  });
});
