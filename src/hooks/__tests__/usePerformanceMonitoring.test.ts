import { renderHook, act } from '@testing-library/react';
import { usePerformanceMonitoring, resetPerformanceMonitoring } from '../usePerformanceMonitoring';

const mockCleanup = jest.fn();
const mockSetupPerformanceMonitoring = jest.fn(() => mockCleanup);

jest.mock('@/lib/mobile-optimizer', () => ({
  setupPerformanceMonitoring: (...args: unknown[]) =>
    mockSetupPerformanceMonitoring(...args),
}));

const sampleMetrics = {
  fcp: 120,
  lcp: 350,
  cls: 0.02,
  fid: 45,
  tti: 800,
  tbt: 90,
  jsSize: 120000,
  cssSize: 30000,
  imageSize: 40000,
  totalSize: 190000,
  connectionType: 'wifi',
  effectiveType: '4g',
  downlink: 10,
  rtt: 25,
};

describe('usePerformanceMonitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetPerformanceMonitoring();
  });

  it('starts performance monitoring on mount', () => {
    renderHook(() => usePerformanceMonitoring(jest.fn()));
    expect(mockSetupPerformanceMonitoring).toHaveBeenCalledTimes(1);
    expect(typeof mockSetupPerformanceMonitoring.mock.calls[0][0]).toBe('function');
  });

  it('reports captured metrics through the callback', () => {
    const onMetrics = jest.fn();
    renderHook(() => usePerformanceMonitoring(onMetrics));

    const emit = mockSetupPerformanceMonitoring.mock.calls[0][0];
    act(() => {
      emit(sampleMetrics);
    });

    expect(onMetrics).toHaveBeenCalledWith(sampleMetrics);
  });

  it('cleans up monitoring on unmount', () => {
    const { unmount } = renderHook(() => usePerformanceMonitoring(jest.fn()));
    unmount();

    expect(mockCleanup).toHaveBeenCalled();
  });

  it('cleans up the previous monitor when a new one is mounted', () => {
    const first = renderHook(() => usePerformanceMonitoring(jest.fn()));
    const second = renderHook(() => usePerformanceMonitoring(jest.fn()));

    expect(first.result.current).toBeDefined();
    expect(second.result.current).toBeDefined();

    // Mounting the second monitor cleans up the first setup.
    expect(mockCleanup).toHaveBeenCalledTimes(1);
    expect(mockSetupPerformanceMonitoring).toHaveBeenCalledTimes(2);
  });

  it('resetPerformanceMonitoring tears down the active monitor', () => {
    renderHook(() => usePerformanceMonitoring(jest.fn()));

    act(() => {
      resetPerformanceMonitoring();
    });

    expect(mockCleanup).toHaveBeenCalled();
  });

  it('always reports through the latest callback reference', () => {
    const firstCallback = jest.fn();
    const secondCallback = jest.fn();
    const { rerender } = renderHook(
      ({ cb }) => usePerformanceMonitoring(cb),
      { initialProps: { cb: firstCallback } },
    );

    rerender({ cb: secondCallback });

    const emit = mockSetupPerformanceMonitoring.mock.calls[0][0];
    act(() => {
      emit(sampleMetrics);
    });

    expect(firstCallback).not.toHaveBeenCalled();
    expect(secondCallback).toHaveBeenCalledWith(sampleMetrics);
  });
});
