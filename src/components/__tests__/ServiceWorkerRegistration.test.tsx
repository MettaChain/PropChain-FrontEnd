/**
 * Tests for ServiceWorkerRegistration with deferred registration.
 *
 * Uses jest + jsdom. requestIdleCallback / setTimeout behaviour is verified
 * via direct property assignment on globalThis rather than replacing the
 * entire window object.
 */

// Mock logger
jest.mock('@/utils/logger', () => ({
  logger: { warn: jest.fn() },
}));

// Mock offline transaction queue
jest.mock('@/lib/offlineTransactionQueue', () => ({
  startQueueAutoFlush: jest.fn(() => jest.fn()),
}));

import { render } from '@testing-library/react';
import { ServiceWorkerRegistration } from '../ServiceWorkerRegistration';

const mockRegister = jest.fn();
const mockSwAddEventListener = jest.fn();
let requestIdleCallbackSpy: jest.Mock;
let cancelIdleCallbackSpy: jest.Mock;
let idleCallback: (() => void) | null = null;

beforeEach(() => {
  jest.clearAllMocks();
  idleCallback = null;

  // Set up requestIdleCallback on the existing jsdom window
  requestIdleCallbackSpy = jest.fn((cb: () => void) => {
    idleCallback = cb;
    return 1;
  });
  cancelIdleCallbackSpy = jest.fn();

  (globalThis as any).requestIdleCallback = requestIdleCallbackSpy;
  (globalThis as any).cancelIdleCallback = cancelIdleCallbackSpy;

  // Set up service worker mock
  Object.defineProperty(navigator, 'serviceWorker', {
    value: {
      register: mockRegister,
      controller: null,
      addEventListener: mockSwAddEventListener,
    },
    writable: true,
    configurable: true,
  });

  process.env.NODE_ENV = 'development';
});

afterEach(() => {
  delete (globalThis as any).requestIdleCallback;
  delete (globalThis as any).cancelIdleCallback;
  jest.restoreAllMocks();
});

describe('ServiceWorkerRegistration', () => {
  it('renders null without crashing', () => {
    const { container } = render(<ServiceWorkerRegistration />);
    expect(container.firstChild).toBeNull();
  });

  it('defers registration via requestIdleCallback', () => {
    render(<ServiceWorkerRegistration />);

    expect(requestIdleCallbackSpy).toHaveBeenCalledWith(
      expect.any(Function),
      { timeout: 5000 }
    );
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('registers service worker when idle callback fires', async () => {
    mockRegister.mockResolvedValue({
      installing: null,
      addEventListener: jest.fn(),
    });

    render(<ServiceWorkerRegistration />);

    expect(idleCallback).not.toBeNull();
    await idleCallback!();

    expect(mockRegister).toHaveBeenCalledWith('/sw.js');
  });

  it('sets up controllerchange listener', async () => {
    mockRegister.mockResolvedValue({
      installing: null,
      addEventListener: jest.fn(),
    });

    render(<ServiceWorkerRegistration />);

    await idleCallback!();

    expect(mockSwAddEventListener).toHaveBeenCalledWith(
      'controllerchange',
      expect.any(Function)
    );
  });

  it('does not register when serviceWorker is unavailable', () => {
    const origSw = (navigator as any).serviceWorker;
    delete (navigator as any).serviceWorker;

    render(<ServiceWorkerRegistration />);
    expect(requestIdleCallbackSpy).not.toHaveBeenCalled();
    expect(mockRegister).not.toHaveBeenCalled();

    // Restore
    Object.defineProperty(navigator, 'serviceWorker', {
      value: origSw,
      writable: true,
      configurable: true,
    });
  });

  it('does not register in test environment', () => {
    process.env.NODE_ENV = 'test';

    render(<ServiceWorkerRegistration />);
    expect(requestIdleCallbackSpy).not.toHaveBeenCalled();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('handles registration error gracefully', async () => {
    mockRegister.mockRejectedValue(new Error('SW registration failed'));
    const { logger } = require('@/utils/logger');

    render(<ServiceWorkerRegistration />);
    await idleCallback!();

    expect(logger.warn).toHaveBeenCalledWith(
      'Service worker registration failed',
      expect.any(Error)
    );
  });

  it('falls back to setTimeout when requestIdleCallback is unavailable', () => {
    delete (globalThis as any).requestIdleCallback;

    const setTimeoutSpy = jest.spyOn(globalThis, 'setTimeout').mockReturnValue(
      2 as unknown as NodeJS.Timeout
    );

    render(<ServiceWorkerRegistration />);

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 2000);
    expect(mockRegister).not.toHaveBeenCalled();

    setTimeoutSpy.mockRestore();
  });

  it('cancels idle callback on unmount', () => {
    const { unmount } = render(<ServiceWorkerRegistration />);
    unmount();

    expect(cancelIdleCallbackSpy).toHaveBeenCalledWith(1);
  });

  it('cleans up auto-flush on unmount', () => {
    const { unmount } = render(<ServiceWorkerRegistration />);
    unmount();

    // The startQueueAutoFlush mock returns a cleanup fn which should be called
    const { startQueueAutoFlush } = require('@/lib/offlineTransactionQueue');
    expect(startQueueAutoFlush).toHaveBeenCalled();
  });
});
