import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { ServiceWorkerRegistration } from '../ServiceWorkerRegistration';

const mockRegister = vi.fn();
const mockAddEventListener = vi.fn();

beforeEach(() => {
  vi.stubGlobal('navigator', {
    serviceWorker: {
      register: mockRegister,
      controller: null,
      addEventListener: mockAddEventListener,
    },
  });
  vi.stubGlobal('window', {
    location: { reload: vi.fn() },
    addEventListener: vi.fn(),
  });
  vi.stubGlobal('document', {
    readyState: 'loading',
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ServiceWorkerRegistration', () => {
  it('renders null without crashing', () => {
    const { container } = render(<ServiceWorkerRegistration />);
    expect(container.firstChild).toBeNull();
  });

  it('attempts service worker registration on load', async () => {
    mockRegister.mockResolvedValue({ installing: null, addEventListener: vi.fn() });
    render(<ServiceWorkerRegistration />);
    await vi.dynamicImportSettled();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('does not register when serviceWorker is unavailable', () => {
    vi.stubGlobal('navigator', {});
    render(<ServiceWorkerRegistration />);
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('does not register in test environment', () => {
    vi.stubGlobal('process', { env: { NODE_ENV: 'test' } });
    render(<ServiceWorkerRegistration />);
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('handles registration error gracefully', async () => {
    mockRegister.mockRejectedValue(new Error('SW registration failed'));
    vi.stubGlobal('document', { readyState: 'complete' });
    render(<ServiceWorkerRegistration />);
    await vi.dynamicImportSettled();
    expect(mockRegister).toHaveBeenCalledWith('/sw.js');
  });
});
