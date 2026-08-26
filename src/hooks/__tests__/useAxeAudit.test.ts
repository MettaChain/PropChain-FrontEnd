import { renderHook, act } from '@testing-library/react';
import { logger } from '@/utils/logger';
import { useAxeAudit } from '../useAxeAudit';

jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const mockRun = jest.fn();
jest.mock('axe-core', () => ({
  default: { run: mockRun },
}));

describe('useAxeAudit', () => {
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    jest.useRealTimers();
    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete (process.env as any).NODE_ENV;
    }
  });

  it('does nothing when NODE_ENV is production', () => {
    process.env.NODE_ENV = 'production';

    renderHook(() => useAxeAudit());

    jest.advanceTimersByTime(2000);

    expect(mockRun).not.toHaveBeenCalled();
  });

  it('runs axe-core in development environment', async () => {
    process.env.NODE_ENV = 'development';
    mockRun.mockResolvedValue({ violations: [] });

    renderHook(() => useAxeAudit());

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockRun).toHaveBeenCalled();
  });

  it('logs no violations message when clean', async () => {
    process.env.NODE_ENV = 'development';
    mockRun.mockResolvedValue({ violations: [] });

    renderHook(() => useAxeAudit());

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('No accessibility violations found')
    );
  });

  it('logs violations when found', async () => {
    process.env.NODE_ENV = 'development';
    mockRun.mockResolvedValue({
      violations: [
        {
          id: 'color-contrast',
          impact: 'serious',
          description: 'Elements must have sufficient color contrast',
          helpUrl: 'https://example.com',
          nodes: [{ html: '<div>low contrast</div>' }],
        },
      ],
    });

    renderHook(() => useAxeAudit());

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('color-contrast')
    );
  });

  it('cleans up timeout on unmount', () => {
    process.env.NODE_ENV = 'development';
    mockRun.mockResolvedValue({ violations: [] });

    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    const { unmount } = renderHook(() => useAxeAudit());

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it('handles axe-core import failure silently', async () => {
    process.env.NODE_ENV = 'development';
    mockRun.mockRejectedValue(new Error('import failed'));

    renderHook(() => useAxeAudit());

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(logger.error).not.toHaveBeenCalled();
  });
});
