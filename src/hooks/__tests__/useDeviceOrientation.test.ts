import { renderHook, act } from '@testing-library/react';
import { useDeviceOrientation } from '../useDeviceOrientation';

jest.mock('@/utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockDeviceOrientationEvent = {
  requestPermission: jest.fn(),
};

describe('useDeviceOrientation', () => {
  let originalDeviceOrientationEvent: typeof DeviceOrientationEvent | undefined;

  beforeEach(() => {
    jest.restoreAllMocks();
    originalDeviceOrientationEvent = global.DeviceOrientationEvent as any;
  });

  afterEach(() => {
    if (originalDeviceOrientationEvent !== undefined) {
      (global as any).DeviceOrientationEvent = originalDeviceOrientationEvent;
    } else {
      delete (global as any).DeviceOrientationEvent;
    }
  });

  it('returns initial null orientation values', () => {
    (global as any).DeviceOrientationEvent = undefined;

    const { result } = renderHook(() => useDeviceOrientation());

    expect(result.current.orientation.alpha).toBeNull();
    expect(result.current.orientation.beta).toBeNull();
    expect(result.current.orientation.gamma).toBeNull();
    expect(result.current.orientation.absolute).toBe(false);
  });

  it('sets isSupported true when DeviceOrientationEvent exists', () => {
    (global as any).DeviceOrientationEvent = function () {};

    const { result } = renderHook(() => useDeviceOrientation());

    expect(result.current.isSupported).toBe(true);
  });

  it('sets isSupported false when DeviceOrientationEvent undefined', () => {
    (global as any).DeviceOrientationEvent = undefined;

    const { result } = renderHook(() => useDeviceOrientation());

    expect(result.current.isSupported).toBe(false);
  });

  it('sets hasPermission true on non-iOS devices', () => {
    (global as any).DeviceOrientationEvent = function () {};

    const { result } = renderHook(() => useDeviceOrientation());

    expect(result.current.hasPermission).toBe(true);
  });

  it('returns error message when not supported', () => {
    (global as any).DeviceOrientationEvent = undefined;

    const { result } = renderHook(() => useDeviceOrientation());

    expect(result.current.error).toBe(
      'Device orientation is not supported on this device',
    );
  });

  it('requestPermission returns true when granted (iOS)', async () => {
    mockDeviceOrientationEvent.requestPermission.mockResolvedValue('granted');

    (global as any).DeviceOrientationEvent = Object.assign(
      function () {},
      { requestPermission: mockDeviceOrientationEvent.requestPermission },
    );

    const { result } = renderHook(() => useDeviceOrientation());

    let granted: boolean;
    await act(async () => {
      granted = await result.current.requestPermission();
    });

    expect(granted!).toBe(true);
    expect(result.current.hasPermission).toBe(true);
  });

  it('requestPermission returns false when denied (iOS)', async () => {
    mockDeviceOrientationEvent.requestPermission.mockResolvedValue('denied');

    (global as any).DeviceOrientationEvent = Object.assign(
      function () {},
      { requestPermission: mockDeviceOrientationEvent.requestPermission },
    );

    const { result } = renderHook(() => useDeviceOrientation());

    let granted: boolean;
    await act(async () => {
      granted = await result.current.requestPermission();
    });

    expect(granted!).toBe(false);
    expect(result.current.error).toBe(
      'Permission denied for device orientation',
    );
  });

  it('requestPermission returns true on non-iOS (no permission needed)', async () => {
    (global as any).DeviceOrientationEvent = function () {};

    const { result } = renderHook(() => useDeviceOrientation());

    let granted: boolean;
    await act(async () => {
      granted = await result.current.requestPermission();
    });

    expect(granted!).toBe(true);
    expect(result.current.hasPermission).toBe(true);
  });

  it('handles permission request error', async () => {
    mockDeviceOrientationEvent.requestPermission.mockRejectedValue(
      new Error('permission error'),
    );

    (global as any).DeviceOrientationEvent = Object.assign(
      function () {},
      { requestPermission: mockDeviceOrientationEvent.requestPermission },
    );

    const { result } = renderHook(() => useDeviceOrientation());

    let granted: boolean;
    await act(async () => {
      granted = await result.current.requestPermission();
    });

    expect(granted!).toBe(false);
    expect(result.current.error).toBe(
      'Failed to request device orientation permission',
    );
  });

  it('adds deviceorientation event listener when supported', () => {
    const addSpy = jest.spyOn(window, 'addEventListener');
    (global as any).DeviceOrientationEvent = function () {};

    renderHook(() => useDeviceOrientation());

    expect(addSpy).toHaveBeenCalledWith(
      'deviceorientation',
      expect.any(Function),
    );
  });

  it('updates orientation on deviceorientation event', () => {
    (global as any).DeviceOrientationEvent = function () {};

    const { result } = renderHook(() => useDeviceOrientation());

    const event = {
      alpha: 45,
      beta: 30,
      gamma: 15,
      absolute: true,
    } as DeviceOrientationEvent;

    act(() => {
      window.dispatchEvent(
        new CustomEvent('deviceorientation', { detail: event }),
      );
    });

    act(() => {
      const handler = (window.addEventListener as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'deviceorientation',
      )?.[1];
      if (handler) handler(event);
    });

    expect(result.current.orientation.alpha).toBe(45);
    expect(result.current.orientation.beta).toBe(30);
    expect(result.current.orientation.gamma).toBe(15);
    expect(result.current.orientation.absolute).toBe(true);
  });

  it('removes event listener on unmount', () => {
    const removeSpy = jest.spyOn(window, 'removeEventListener');
    (global as any).DeviceOrientationEvent = function () {};

    const { unmount } = renderHook(() => useDeviceOrientation());

    unmount();

    expect(removeSpy).toHaveBeenCalledWith(
      'deviceorientation',
      expect.any(Function),
    );
  });
});
