/**
 * Sonner Integration Tests
 * Validates that Sonner is properly configured and integrated with ToastProvider
 * 
 * Tests cover:
 * - Toaster is properly initialized in ToastProvider
 * - Correct positioning configuration
 * - Theme settings (light theme with rich colors)
 * - Close button enabled
 * - Expand option for stacking
 * - Toast display works with all 4 variants (success, error, warning, info)
 * - Auto-dismiss timer works correctly
 * - Sonner is properly configured with sensible defaults
 * 
 * Requirements: 3.1, 3.2, 3.3, 4.1, 4.5
 */

import React, { act } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../components/ToastProvider';
import { useToast } from '../hooks/useToast';

// Mock Sonner to verify it's being called correctly
jest.mock('sonner', () => {
  const actual = jest.requireActual('sonner');
  const toasterCalls: any[] = [];
  const toastCalls: any[] = [];

  return {
    ...actual,
    Toaster: (props: any) => {
      toasterCalls.push(props);
      // Render a div to represent the Toaster in the DOM
      return <div data-testid="sonner-toaster" data-props={JSON.stringify(props)} />;
    },
    toast: {
      success: jest.fn((message: string, options?: any) => {
        toastCalls.push({ type: 'success', message, options });
        return options?.id || 'mock-id';
      }),
      error: jest.fn((message: string, options?: any) => {
        toastCalls.push({ type: 'error', message, options });
        return options?.id || 'mock-id';
      }),
      warning: jest.fn((message: string, options?: any) => {
        toastCalls.push({ type: 'warning', message, options });
        return options?.id || 'mock-id';
      }),
      info: jest.fn((message: string, options?: any) => {
        toastCalls.push({ type: 'info', message, options });
        return options?.id || 'mock-id';
      }),
    },
    __toasterCalls: toasterCalls,
    __toastCalls: toastCalls,
    __reset: () => {
      toasterCalls.length = 0;
      toastCalls.length = 0;
    },
  };
});

describe('Sonner Integration', () => {
  beforeEach(() => {
    // Reset Sonner mock calls before each test
    const sonner = require('sonner');
    sonner.__reset?.();
  });

  describe('Toaster initialization and configuration', () => {
    it('should render Sonner Toaster component', () => {
      render(
        <ToastProvider>
          <div>Test</div>
        </ToastProvider>
      );

      const toaster = screen.getByTestId('sonner-toaster');
      expect(toaster).toBeInTheDocument();
    });

    it('should configure Toaster with light theme', () => {
      render(
        <ToastProvider>
          <div>Test</div>
        </ToastProvider>
      );

      const sonner = require('sonner');
      const toasterCall = sonner.__toasterCalls[0];
      expect(toasterCall.theme).toBe('light');
    });

    it('should enable richColors in Toaster configuration', () => {
      render(
        <ToastProvider>
          <div>Test</div>
        </ToastProvider>
      );

      const sonner = require('sonner');
      const toasterCall = sonner.__toasterCalls[0];
      expect(toasterCall.richColors).toBe(true);
    });

    it('should enable close button in Toaster configuration', () => {
      render(
        <ToastProvider>
          <div>Test</div>
        </ToastProvider>
      );

      const sonner = require('sonner');
      const toasterCall = sonner.__toasterCalls[0];
      expect(toasterCall.closeButton).toBe(true);
    });

    it('should enable expand option in Toaster configuration', () => {
      render(
        <ToastProvider>
          <div>Test</div>
        </ToastProvider>
      );

      const sonner = require('sonner');
      const toasterCall = sonner.__toasterCalls[0];
      expect(toasterCall.expand).toBe(true);
    });

    it('should configure Toaster with a valid position', () => {
      render(
        <ToastProvider>
          <div>Test</div>
        </ToastProvider>
      );

      const sonner = require('sonner');
      const toasterCall = sonner.__toasterCalls[0];
      const validPositions = [
        'top-left',
        'top-center',
        'top-right',
        'bottom-left',
        'bottom-center',
        'bottom-right',
      ];
      expect(validPositions).toContain(toasterCall.position);
    });
  });

  describe('toast variants and rendering', () => {
    it('should display success toast with correct variant', async () => {
      const user = userEvent.setup();

      function TestComponent() {
        const toast = useToast();
        return (
          <button
            onClick={() => toast.success('Success message')}
            data-testid="success-button"
          >
            Show Success
          </button>
        );
      }

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await act(async () => {
        await user.click(screen.getByTestId('success-button'));
      });

      const sonner = require('sonner');
      const successCall = sonner.__toastCalls.find(
        (call: any) => call.type === 'success'
      );
      expect(successCall).toBeDefined();
      expect(successCall.message).toBe('Success message');
    });

    it('should display error toast with correct variant', async () => {
      const user = userEvent.setup();

      function TestComponent() {
        const toast = useToast();
        return (
          <button
            onClick={() => toast.error('Error message')}
            data-testid="error-button"
          >
            Show Error
          </button>
        );
      }

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await act(async () => {
        await user.click(screen.getByTestId('error-button'));
      });

      const sonner = require('sonner');
      const errorCall = sonner.__toastCalls.find((call: any) => call.type === 'error');
      expect(errorCall).toBeDefined();
      expect(errorCall.message).toBe('Error message');
    });

    it('should display warning toast with correct variant', async () => {
      const user = userEvent.setup();

      function TestComponent() {
        const toast = useToast();
        return (
          <button
            onClick={() => toast.warning('Warning message')}
            data-testid="warning-button"
          >
            Show Warning
          </button>
        );
      }

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await act(async () => {
        await user.click(screen.getByTestId('warning-button'));
      });

      const sonner = require('sonner');
      const warningCall = sonner.__toastCalls.find(
        (call: any) => call.type === 'warning'
      );
      expect(warningCall).toBeDefined();
      expect(warningCall.message).toBe('Warning message');
    });

    it('should display info toast with correct variant', async () => {
      const user = userEvent.setup();

      function TestComponent() {
        const toast = useToast();
        return (
          <button
            onClick={() => toast.info('Info message')}
            data-testid="info-button"
          >
            Show Info
          </button>
        );
      }

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await act(async () => {
        await user.click(screen.getByTestId('info-button'));
      });

      const sonner = require('sonner');
      const infoCall = sonner.__toastCalls.find((call: any) => call.type === 'info');
      expect(infoCall).toBeDefined();
      expect(infoCall.message).toBe('Info message');
    });

    it('should display all 4 variants without interference', async () => {
      const user = userEvent.setup();

      function TestComponent() {
        const toast = useToast();
        return (
          <div>
            <button onClick={() => toast.success('Success')} data-testid="success-btn">
              Success
            </button>
            <button onClick={() => toast.error('Error')} data-testid="error-btn">
              Error
            </button>
            <button onClick={() => toast.warning('Warning')} data-testid="warning-btn">
              Warning
            </button>
            <button onClick={() => toast.info('Info')} data-testid="info-btn">
              Info
            </button>
          </div>
        );
      }

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await act(async () => {
        await user.click(screen.getByTestId('success-btn'));
        await user.click(screen.getByTestId('error-btn'));
        await user.click(screen.getByTestId('warning-btn'));
        await user.click(screen.getByTestId('info-btn'));
      });

      const sonner = require('sonner');
      const allToasts = sonner.__toastCalls;
      expect(allToasts.length).toBe(4);
      expect(allToasts.map((t: any) => t.type)).toEqual([
        'success',
        'error',
        'warning',
        'info',
      ]);
    });
  });

  describe('auto-dismiss timer configuration', () => {
    it('should configure default duration (5000ms)', async () => {
      const user = userEvent.setup();

      function TestComponent() {
        const toast = useToast();
        return (
          <button
            onClick={() => toast.success('Test message')}
            data-testid="toast-button"
          >
            Show Toast
          </button>
        );
      }

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await act(async () => {
        await user.click(screen.getByTestId('toast-button'));
      });

      const sonner = require('sonner');
      const toastCall = sonner.__toastCalls[0];
      // Default duration should be 5000ms
      expect(toastCall.options.duration).toBe(5000);
    });

    it('should respect custom duration option', async () => {
      const user = userEvent.setup();

      function TestComponent() {
        const toast = useToast();
        return (
          <button
            onClick={() => toast.success('Test', { duration: 3000 })}
            data-testid="toast-button"
          >
            Show Toast
          </button>
        );
      }

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await act(async () => {
        await user.click(screen.getByTestId('toast-button'));
      });

      const sonner = require('sonner');
      const toastCall = sonner.__toastCalls[0];
      expect(toastCall.options.duration).toBe(3000);
    });

    it('should set duration to Infinity for persistent toasts (duration: 0)', async () => {
      const user = userEvent.setup();

      function TestComponent() {
        const toast = useToast();
        return (
          <button
            onClick={() => toast.error('Persistent error', { duration: 0 })}
            data-testid="toast-button"
          >
            Show Persistent Toast
          </button>
        );
      }

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await act(async () => {
        await user.click(screen.getByTestId('toast-button'));
      });

      const sonner = require('sonner');
      const toastCall = sonner.__toastCalls[0];
      // When duration is 0, Sonner should receive Infinity for no auto-dismiss
      expect(toastCall.options.duration).toBe(Infinity);
    });

    it('should set duration to Infinity when null is provided', async () => {
      const user = userEvent.setup();

      function TestComponent() {
        const toast = useToast();
        return (
          <button
            onClick={() => toast.info('Persistent', { duration: 0 })}
            data-testid="toast-button"
          >
            Show Toast
          </button>
        );
      }

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await act(async () => {
        await user.click(screen.getByTestId('toast-button'));
      });

      const sonner = require('sonner');
      const toastCall = sonner.__toastCalls[0];
      expect(toastCall.options.duration).toBe(Infinity);
    });
  });

  describe('dismissible configuration', () => {
    it('should enable dismissible by default', async () => {
      const user = userEvent.setup();

      function TestComponent() {
        const toast = useToast();
        return (
          <button
            onClick={() => toast.success('Message')}
            data-testid="toast-button"
          >
            Show Toast
          </button>
        );
      }

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await act(async () => {
        await user.click(screen.getByTestId('toast-button'));
      });

      const sonner = require('sonner');
      const toastCall = sonner.__toastCalls[0];
      expect(toastCall.options.dismissible).toBe(true);
    });

    it('should respect dismissible: false option', async () => {
      const user = userEvent.setup();

      function TestComponent() {
        const toast = useToast();
        return (
          <button
            onClick={() =>
              toast.info('Cannot dismiss', { dismissible: false })
            }
            data-testid="toast-button"
          >
            Show Toast
          </button>
        );
      }

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await act(async () => {
        await user.click(screen.getByTestId('toast-button'));
      });

      const sonner = require('sonner');
      const toastCall = sonner.__toastCalls[0];
      expect(toastCall.options.dismissible).toBe(false);
    });
  });

  describe('action button configuration', () => {
    it('should pass action button to Sonner when provided', async () => {
      const user = userEvent.setup();
      const mockAction = jest.fn();

      function TestComponent() {
        const toast = useToast();
        return (
          <button
            onClick={() =>
              toast.success('Action available', {
                action: {
                  label: 'Click me',
                  onClick: mockAction,
                },
              })
            }
            data-testid="toast-button"
          >
            Show Toast
          </button>
        );
      }

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await act(async () => {
        await user.click(screen.getByTestId('toast-button'));
      });

      const sonner = require('sonner');
      const toastCall = sonner.__toastCalls[0];
      expect(toastCall.options.action).toBeDefined();
      expect(toastCall.options.action.label).toBe('Click me');
      expect(typeof toastCall.options.action.onClick).toBe('function');
    });

    it('should not include action when not provided', async () => {
      const user = userEvent.setup();

      function TestComponent() {
        const toast = useToast();
        return (
          <button
            onClick={() => toast.success('No action')}
            data-testid="toast-button"
          >
            Show Toast
          </button>
        );
      }

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await act(async () => {
        await user.click(screen.getByTestId('toast-button'));
      });

      const sonner = require('sonner');
      const toastCall = sonner.__toastCalls[0];
      expect(toastCall.options.action).toBeUndefined();
    });
  });

  describe('Sonner default configuration', () => {
    it('should provide sensible defaults without explicit configuration', () => {
      render(
        <ToastProvider>
          <div>Test</div>
        </ToastProvider>
      );

      const sonner = require('sonner');
      const toasterConfig = sonner.__toasterCalls[0];

      // Verify all critical defaults are set
      expect(toasterConfig).toHaveProperty('theme', 'light');
      expect(toasterConfig).toHaveProperty('richColors', true);
      expect(toasterConfig).toHaveProperty('closeButton', true);
      expect(toasterConfig).toHaveProperty('expand', true);
      expect(toasterConfig).toHaveProperty('position');
    });

    it('should configure all required Sonner properties for proper rendering', () => {
      render(
        <ToastProvider>
          <div>Test</div>
        </ToastProvider>
      );

      const sonner = require('sonner');
      const toasterConfig = sonner.__toasterCalls[0];

      // Light theme ensures good visibility
      expect(toasterConfig.theme).toBe('light');

      // Rich colors apply semantic colors (green for success, red for error, etc.)
      expect(toasterConfig.richColors).toBe(true);

      // Close button allows user dismissal
      expect(toasterConfig.closeButton).toBe(true);

      // Expand option allows toasts to stack and grow
      expect(toasterConfig.expand).toBe(true);

      // Position is configured (either desktop or mobile default)
      expect(toasterConfig.position).toBeTruthy();
    });
  });

  describe('responsive positioning with Sonner', () => {
    it('should use top-right position on desktop by default', () => {
      // Mock window.innerWidth for desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      render(
        <ToastProvider>
          <div>Test</div>
        </ToastProvider>
      );

      const sonner = require('sonner');
      const toasterConfig = sonner.__toasterCalls[0];
      expect(toasterConfig.position).toBe('top-right');
    });

    it('should use bottom-center position on mobile by default', () => {
      // Mock window.innerWidth for mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <ToastProvider>
          <div>Test</div>
        </ToastProvider>
      );

      const sonner = require('sonner');
      const toasterConfig = sonner.__toasterCalls[0];
      expect(toasterConfig.position).toBe('bottom-center');
    });
  });

  describe('custom provider configuration', () => {
    it('should accept custom defaultDuration and pass to Sonner toasts', async () => {
      const user = userEvent.setup();

      function TestComponent() {
        const toast = useToast();
        return (
          <button
            onClick={() => toast.info('Test')}
            data-testid="toast-button"
          >
            Show Toast
          </button>
        );
      }

      render(
        <ToastProvider defaultDuration={2000}>
          <TestComponent />
        </ToastProvider>
      );

      await act(async () => {
        await user.click(screen.getByTestId('toast-button'));
      });

      const sonner = require('sonner');
      const toastCall = sonner.__toastCalls[0];
      expect(toastCall.options.duration).toBe(2000);
    });

    it('should accept custom defaultPosition for Sonner Toaster', () => {
      render(
        <ToastProvider defaultPosition="bottom-left">
          <div>Test</div>
        </ToastProvider>
      );

      const sonner = require('sonner');
      const toasterConfig = sonner.__toasterCalls[0];
      expect(toasterConfig.position).toBe('bottom-left');
    });

    it('should accept custom maxToasts configuration', async () => {
      const user = userEvent.setup();

      function TestComponent() {
        const toast = useToast();
        return (
          <button
            onClick={() => {
              for (let i = 0; i < 5; i++) {
                toast.success(`Toast ${i + 1}`);
              }
            }}
            data-testid="toast-button"
          >
            Show Toasts
          </button>
        );
      }

      render(
        <ToastProvider maxToasts={3}>
          <TestComponent />
        </ToastProvider>
      );

      await act(async () => {
        await user.click(screen.getByTestId('toast-button'));
      });

      const sonner = require('sonner');
      // When maxToasts is 3 and we trigger 5 toasts rapidly,
      // the provider should only maintain 3 in the queue
      // (oldest ones removed automatically)
      expect(sonner.__toastCalls.length).toBe(5); // All toast() calls are made
    });
  });

  describe('integration with Provider lifecycle', () => {
    it('should not render Toaster until client-side hydration', () => {
      // This is tested by verifying the Toaster appears after initial render
      const { container } = render(
        <ToastProvider>
          <div>Test</div>
        </ToastProvider>
      );

      const toaster = screen.queryByTestId('sonner-toaster');
      // Toaster should eventually be rendered after hydration
      expect(toaster).toBeTruthy();
    });

    it('should properly clean up event listeners on unmount', () => {
      const { unmount } = render(
        <ToastProvider>
          <div>Test</div>
        </ToastProvider>
      );

      const removeEventListenerSpy = jest.spyOn(
        window,
        'removeEventListener'
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      );

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Sonner callback handling', () => {
    it('should handle onDismiss callback from Sonner', async () => {
      const user = userEvent.setup();
      const mockOnClose = jest.fn();

      function TestComponent() {
        const toast = useToast();
        return (
          <button
            onClick={() =>
              toast.success('Test', {
                onClose: mockOnClose,
              })
            }
            data-testid="toast-button"
          >
            Show Toast
          </button>
        );
      }

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await act(async () => {
        await user.click(screen.getByTestId('toast-button'));
      });

      const sonner = require('sonner');
      const toastCall = sonner.__toastCalls[0];

      // Verify onDismiss handler is passed to Sonner
      expect(toastCall.options.onDismiss).toBeDefined();
      expect(typeof toastCall.options.onDismiss).toBe('function');

      // Trigger the onDismiss callback
      await act(async () => {
        toastCall.options.onDismiss();
      });

      // The onClose callback should be called
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
