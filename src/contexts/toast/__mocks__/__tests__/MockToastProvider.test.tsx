/**
 * Unit Tests for MockToastProvider
 * 
 * Tests the mock provider's ability to capture toasts and work with the useToast hook.
 * Ensures mock provider is compatible with Jest, Vitest, and React Testing Library.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MockToastProvider } from '../MockToastProvider';
import { useToast } from '../../hooks/useToast';
import type { Toast } from '../../types';

/**
 * Test component that uses the useToast hook
 */
function TestComponent() {
  const toast = useToast();

  return (
    <div>
      <button onClick={() => toast.success('Success!')}>Success Toast</button>
      <button onClick={() => toast.error('Error!')}>Error Toast</button>
      <button
        onClick={() => toast.warning('Warning!', { duration: 3000 })}
      >
        Warning Toast
      </button>
      <button onClick={() => toast.info('Info!')}>Info Toast</button>
      <button
        onClick={() =>
          toast.success('With Action', {
            action: {
              label: 'Undo',
              onClick: () => console.log('Undo clicked'),
            },
          })
        }
      >
        Toast with Action
      </button>
      <button
        onClick={() =>
          toast.toast({
            type: 'info',
            message: 'Generic toast',
            duration: 0,
          })
        }
      >
        Generic Toast
      </button>
    </div>
  );
}

describe('MockToastProvider', () => {
  /**
   * Requirement 12.4, 12.5: useToast() should work with mock provider
   */
  describe('useToast() compatibility', () => {
    it('should allow useToast hook to trigger toasts', () => {
      render(
        <MockToastProvider>
          <TestComponent />
        </MockToastProvider>
      );

      const successButton = screen.getByText('Success Toast');
      fireEvent.click(successButton);

      // Verify toast was captured
      expect(MockToastProvider.__toasts).toHaveLength(1);
      expect(MockToastProvider.__toasts[0]).toMatchObject({
        type: 'success',
        message: 'Success!',
      });

      MockToastProvider.__reset();
    });

    it('should return unique IDs for each toast', () => {
      render(
        <MockToastProvider>
          <TestComponent />
        </MockToastProvider>
      );

      const successButton = screen.getByText('Success Toast');
      fireEvent.click(successButton);
      fireEvent.click(successButton);

      expect(MockToastProvider.__toasts).toHaveLength(2);
      expect(MockToastProvider.__toasts[0].id).not.toBe(
        MockToastProvider.__toasts[1].id
      );

      MockToastProvider.__reset();
    });

    it('should work at any nesting depth', () => {
      function NestedComponent() {
        return (
          <div>
            <TestComponent />
          </div>
        );
      }

      render(
        <MockToastProvider>
          <NestedComponent />
        </MockToastProvider>
      );

      const successButton = screen.getByText('Success Toast');
      fireEvent.click(successButton);

      expect(MockToastProvider.__toasts).toHaveLength(1);
      expect(MockToastProvider.__toasts[0].type).toBe('success');

      MockToastProvider.__reset();
    });
  });

  /**
   * Requirement 12.1, 12.2: Mock provider should capture toasts in accessible array
   */
  describe('toast capture and storage', () => {
    it('should capture success toasts', () => {
      render(
        <MockToastProvider>
          <TestComponent />
        </MockToastProvider>
      );

      const successButton = screen.getByText('Success Toast');
      fireEvent.click(successButton);

      expect(MockToastProvider.__toasts).toHaveLength(1);
      expect(MockToastProvider.__toasts[0]).toMatchObject({
        type: 'success',
        message: 'Success!',
      });

      MockToastProvider.__reset();
    });

    it('should capture error toasts', () => {
      render(
        <MockToastProvider>
          <TestComponent />
        </MockToastProvider>
      );

      const errorButton = screen.getByText('Error Toast');
      fireEvent.click(errorButton);

      expect(MockToastProvider.__toasts).toHaveLength(1);
      expect(MockToastProvider.__toasts[0]).toMatchObject({
        type: 'error',
        message: 'Error!',
      });

      MockToastProvider.__reset();
    });

    it('should capture warning toasts with options', () => {
      render(
        <MockToastProvider>
          <TestComponent />
        </MockToastProvider>
      );

      const warningButton = screen.getByText('Warning Toast');
      fireEvent.click(warningButton);

      expect(MockToastProvider.__toasts).toHaveLength(1);
      expect(MockToastProvider.__toasts[0]).toMatchObject({
        type: 'warning',
        message: 'Warning!',
        duration: 3000,
      });

      MockToastProvider.__reset();
    });

    it('should capture info toasts', () => {
      render(
        <MockToastProvider>
          <TestComponent />
        </MockToastProvider>
      );

      const infoButton = screen.getByText('Info Toast');
      fireEvent.click(infoButton);

      expect(MockToastProvider.__toasts).toHaveLength(1);
      expect(MockToastProvider.__toasts[0]).toMatchObject({
        type: 'info',
        message: 'Info!',
      });

      MockToastProvider.__reset();
    });

    it('should capture toasts with action buttons', () => {
      render(
        <MockToastProvider>
          <TestComponent />
        </MockToastProvider>
      );

      const actionButton = screen.getByText('Toast with Action');
      fireEvent.click(actionButton);

      expect(MockToastProvider.__toasts).toHaveLength(1);
      expect(MockToastProvider.__toasts[0]).toMatchObject({
        type: 'success',
        message: 'With Action',
        action: {
          label: 'Undo',
        },
      });
      expect(MockToastProvider.__toasts[0].action?.onClick).toBeDefined();

      MockToastProvider.__reset();
    });

    it('should capture generic toasts via toast() method', () => {
      render(
        <MockToastProvider>
          <TestComponent />
        </MockToastProvider>
      );

      const genericButton = screen.getByText('Generic Toast');
      fireEvent.click(genericButton);

      expect(MockToastProvider.__toasts).toHaveLength(1);
      expect(MockToastProvider.__toasts[0]).toMatchObject({
        type: 'info',
        message: 'Generic toast',
        duration: 0, // Persistent toast
      });

      MockToastProvider.__reset();
    });

    it('should capture multiple toasts', () => {
      render(
        <MockToastProvider>
          <TestComponent />
        </MockToastProvider>
      );

      const successButton = screen.getByText('Success Toast');
      const errorButton = screen.getByText('Error Toast');

      fireEvent.click(successButton);
      fireEvent.click(errorButton);
      fireEvent.click(successButton);

      expect(MockToastProvider.__toasts).toHaveLength(3);
      expect(MockToastProvider.__toasts[0].type).toBe('success');
      expect(MockToastProvider.__toasts[1].type).toBe('error');
      expect(MockToastProvider.__toasts[2].type).toBe('success');

      MockToastProvider.__reset();
    });
  });

  /**
   * Requirement 12.3: Mock provider should be compatible with Jest, Vitest, React Testing Library
   */
  describe('React Testing Library integration', () => {
    it('should work with render utility', () => {
      const { container } = render(
        <MockToastProvider>
          <TestComponent />
        </MockToastProvider>
      );

      expect(container).toBeInTheDocument();
      expect(screen.getByText('Success Toast')).toBeInTheDocument();

      MockToastProvider.__reset();
    });

    it('should work with fireEvent', () => {
      render(
        <MockToastProvider>
          <TestComponent />
        </MockToastProvider>
      );

      fireEvent.click(screen.getByText('Success Toast'));

      expect(MockToastProvider.__toasts).toHaveLength(1);

      MockToastProvider.__reset();
    });

    it('should support test assertions', () => {
      render(
        <MockToastProvider>
          <TestComponent />
        </MockToastProvider>
      );

      fireEvent.click(screen.getByText('Success Toast'));

      // Various assertion patterns
      expect(MockToastProvider.__toasts).toContainEqual(
        expect.objectContaining({
          type: 'success',
          message: 'Success!',
        })
      );

      expect(MockToastProvider.__toasts[0].id).toBeDefined();
      expect(typeof MockToastProvider.__toasts[0].id).toBe('string');

      MockToastProvider.__reset();
    });
  });

  /**
   * Requirement 12.5: Mock provider should expose __reset() method
   */
  describe('test state management', () => {
    it('should reset captured toasts', () => {
      render(
        <MockToastProvider>
          <TestComponent />
        </MockToastProvider>
      );

      const successButton = screen.getByText('Success Toast');
      fireEvent.click(successButton);
      fireEvent.click(successButton);

      expect(MockToastProvider.__toasts).toHaveLength(2);

      MockToastProvider.__reset();

      expect(MockToastProvider.__toasts).toHaveLength(0);
    });

    it('should prevent test pollution with reset', () => {
      // First test
      const { unmount: unmount1 } = render(
        <MockToastProvider>
          <TestComponent />
        </MockToastProvider>
      );

      fireEvent.click(screen.getByText('Success Toast'));
      expect(MockToastProvider.__toasts).toHaveLength(1);

      unmount1();
      MockToastProvider.__reset();

      // Second test (should start fresh)
      render(
        <MockToastProvider>
          <TestComponent />
        </MockToastProvider>
      );

      expect(MockToastProvider.__toasts).toHaveLength(0);

      fireEvent.click(screen.getByText('Success Toast'));
      expect(MockToastProvider.__toasts).toHaveLength(1);

      MockToastProvider.__reset();
    });
  });

  /**
   * Requirement 1.2, 1.6: Mock provider should respect provider config
   */
  describe('provider configuration', () => {
    it('should use custom defaultDuration', () => {
      render(
        <MockToastProvider defaultDuration={2000}>
          <TestComponent />
        </MockToastProvider>
      );

      const successButton = screen.getByText('Success Toast');
      fireEvent.click(successButton);

      expect(MockToastProvider.__toasts[0].duration).toBe(2000);

      MockToastProvider.__reset();
    });

    it('should use custom defaultPosition', () => {
      render(
        <MockToastProvider defaultPosition="bottom-center">
          <TestComponent />
        </MockToastProvider>
      );

      const successButton = screen.getByText('Success Toast');
      fireEvent.click(successButton);

      expect(MockToastProvider.__toasts[0].position).toBe('bottom-center');

      MockToastProvider.__reset();
    });

    it('should use custom maxToasts', () => {
      render(
        <MockToastProvider maxToasts={3}>
          <TestComponent />
        </MockToastProvider>
      );

      const successButton = screen.getByText('Success Toast');

      // Add 5 toasts with max of 3
      fireEvent.click(successButton);
      fireEvent.click(successButton);
      fireEvent.click(successButton);
      fireEvent.click(successButton);
      fireEvent.click(successButton);

      // Should only have 3 toasts (oldest removed)
      expect(MockToastProvider.__toasts).toHaveLength(3);

      MockToastProvider.__reset();
    });

    it('should allow options to override defaults', () => {
      render(
        <MockToastProvider defaultDuration={5000} defaultPosition="top-right">
          <TestComponent />
        </MockToastProvider>
      );

      const warningButton = screen.getByText('Warning Toast');
      fireEvent.click(warningButton);

      // Warning has custom duration of 3000, should override default
      expect(MockToastProvider.__toasts[0].duration).toBe(3000);

      MockToastProvider.__reset();
    });
  });

  /**
   * Requirement 12.4: Mock provider should work like real provider
   */
  describe('mock provider behavior parity', () => {
    it('should enforce max queue like real provider', () => {
      render(
        <MockToastProvider maxToasts={2}>
          <TestComponent />
        </MockToastProvider>
      );

      const successButton = screen.getByText('Success Toast');

      fireEvent.click(successButton); // 1
      fireEvent.click(successButton); // 2
      fireEvent.click(successButton); // 3 - oldest should be removed

      expect(MockToastProvider.__toasts).toHaveLength(2);

      // First toast should be gone (FIFO removal)
      const firstToastId = MockToastProvider.__toasts[0].id;
      fireEvent.click(successButton); // 4

      // Original first toast should still be gone
      expect(MockToastProvider.__toasts).toHaveLength(2);
      expect(
        MockToastProvider.__toasts.map((t) => t.id)
      ).not.toContain(firstToastId);

      MockToastProvider.__reset();
    });

    it('should generate unique IDs like real provider', () => {
      render(
        <MockToastProvider>
          <TestComponent />
        </MockToastProvider>
      );

      const successButton = screen.getByText('Success Toast');

      fireEvent.click(successButton);
      fireEvent.click(successButton);
      fireEvent.click(successButton);

      const ids = MockToastProvider.__toasts.map((t) => t.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);

      MockToastProvider.__reset();
    });

    it('should capture all toast properties', () => {
      render(
        <MockToastProvider>
          <TestComponent />
        </MockToastProvider>
      );

      const actionButton = screen.getByText('Toast with Action');
      fireEvent.click(actionButton);

      const toast = MockToastProvider.__toasts[0];

      // Check all expected properties exist
      expect(toast).toHaveProperty('id');
      expect(toast).toHaveProperty('type');
      expect(toast).toHaveProperty('message');
      expect(toast).toHaveProperty('duration');
      expect(toast).toHaveProperty('position');
      expect(toast).toHaveProperty('action');
      expect(toast).toHaveProperty('dismissible');

      MockToastProvider.__reset();
    });
  });

  /**
   * Static accessor functionality
   */
  describe('static properties', () => {
    it('should expose __toasts static property', () => {
      expect(MockToastProvider.__toasts).toBeDefined();
      expect(Array.isArray(MockToastProvider.__toasts)).toBe(true);
    });

    it('should expose __reset static method', () => {
      expect(typeof MockToastProvider.__reset).toBe('function');
    });

    it('should update __toasts after toast creation', () => {
      render(
        <MockToastProvider>
          <TestComponent />
        </MockToastProvider>
      );

      expect(MockToastProvider.__toasts).toHaveLength(0);

      fireEvent.click(screen.getByText('Success Toast'));

      expect(MockToastProvider.__toasts).toHaveLength(1);

      MockToastProvider.__reset();
    });
  });
});
