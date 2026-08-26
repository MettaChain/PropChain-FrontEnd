import { renderHook, act } from '@testing-library/react';
import { useGestures } from '../useGestures';

const createMockElement = () => {
  const listeners: Record<string, Function> = {};
  return {
    addEventListener: jest.fn((event: string, handler: Function) => {
      listeners[event] = handler;
    }),
    removeEventListener: jest.fn((event: string, handler: Function) => {
      delete listeners[event];
    }),
    listeners,
    fire: (event: string, data: any) => {
      listeners[event]?.(data);
    },
  };
};

const createTouch = (clientX: number, clientY: number): Touch =>
  ({ clientX, clientY, identifier: 0, target: null } as unknown as Touch);

const createTouchEvent = (
  type: string,
  touches: Touch[],
): TouchEvent =>
  ({
    type,
    touches,
    changedTouches: touches,
    targetTouches: touches,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
  }) as unknown as TouchEvent;

describe('useGestures', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(Date, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('returns a ref object', () => {
    const { result } = renderHook(() =>
      useGestures({ onSwipeLeft: jest.fn() }),
    );
    expect(result.current).toHaveProperty('current');
  });

  it('calls onSwipeLeft when swipe moves left beyond threshold', () => {
    const onSwipeLeft = jest.fn();
    const { result } = renderHook(() =>
      useGestures({ onSwipeLeft }, { threshold: 50 }),
    );

    const element = createMockElement();
    (result.current as any).current = element;

    act(() => {
      result.current.current = element;
    });

    const reRender = renderHook(() =>
      useGestures({ onSwipeLeft }, { threshold: 50 }),
    );

    const el = createMockElement();
    (reRender.result.current as any).current = el;

    reRender.rerender();

    el.fire(
      'touchstart',
      createTouchEvent('touchstart', [createTouch(200, 200)]),
    );
    el.fire(
      'touchmove',
      createTouchEvent('touchmove', [createTouch(100, 200)]),
    );
    el.fire(
      'touchend',
      createTouchEvent('touchend', [createTouch(100, 200)]),
    );

    expect(onSwipeLeft).toHaveBeenCalled();
  });

  it('calls onSwipeRight when swipe moves right beyond threshold', () => {
    const onSwipeRight = jest.fn();
    const el = createMockElement();

    const { result } = renderHook(() =>
      useGestures({ onSwipeRight }, { threshold: 50 }),
    );

    (result.current as any).current = el;
    result.rerender();

    el.fire(
      'touchstart',
      createTouchEvent('touchstart', [createTouch(100, 200)]),
    );
    el.fire(
      'touchmove',
      createTouchEvent('touchmove', [createTouch(200, 200)]),
    );
    el.fire(
      'touchend',
      createTouchEvent('touchend', [createTouch(200, 200)]),
    );

    expect(onSwipeRight).toHaveBeenCalled();
  });

  it('calls onSwipeUp when swipe moves up beyond threshold', () => {
    const onSwipeUp = jest.fn();
    const el = createMockElement();

    const { result } = renderHook(() =>
      useGestures({ onSwipeUp }, { threshold: 50 }),
    );

    (result.current as any).current = el;
    result.rerender();

    el.fire(
      'touchstart',
      createTouchEvent('touchstart', [createTouch(200, 200)]),
    );
    el.fire(
      'touchmove',
      createTouchEvent('touchmove', [createTouch(200, 100)]),
    );
    el.fire(
      'touchend',
      createTouchEvent('touchend', [createTouch(200, 100)]),
    );

    expect(onSwipeUp).toHaveBeenCalled();
  });

  it('calls onSwipeDown when swipe moves down beyond threshold', () => {
    const onSwipeDown = jest.fn();
    const el = createMockElement();

    const { result } = renderHook(() =>
      useGestures({ onSwipeDown }, { threshold: 50 }),
    );

    (result.current as any).current = el;
    result.rerender();

    el.fire(
      'touchstart',
      createTouchEvent('touchstart', [createTouch(200, 100)]),
    );
    el.fire(
      'touchmove',
      createTouchEvent('touchmove', [createTouch(200, 200)]),
    );
    el.fire(
      'touchend',
      createTouchEvent('touchend', [createTouch(200, 200)]),
    );

    expect(onSwipeDown).toHaveBeenCalled();
  });

  it('does not fire swipe when movement is below threshold', () => {
    const onSwipeLeft = jest.fn();
    const onSwipeRight = jest.fn();
    const onSwipeUp = jest.fn();
    const onSwipeDown = jest.fn();
    const el = createMockElement();

    const { result } = renderHook(() =>
      useGestures(
        { onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown },
        { threshold: 50 },
      ),
    );

    (result.current as any).current = el;
    result.rerender();

    el.fire(
      'touchstart',
      createTouchEvent('touchstart', [createTouch(200, 200)]),
    );
    el.fire(
      'touchmove',
      createTouchEvent('touchmove', [createTouch(210, 210)]),
    );
    el.fire(
      'touchend',
      createTouchEvent('touchend', [createTouch(210, 210)]),
    );

    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
    expect(onSwipeUp).not.toHaveBeenCalled();
    expect(onSwipeDown).not.toHaveBeenCalled();
  });

  it('calls onDoubleTap on rapid double taps', () => {
    const onDoubleTap = jest.fn();
    const el = createMockElement();

    const { result } = renderHook(() =>
      useGestures({ onDoubleTap }, { doubleTapDelay: 300 }),
    );

    (result.current as any).current = el;
    result.rerender();

    el.fire(
      'touchstart',
      createTouchEvent('touchstart', [createTouch(200, 200)]),
    );
    el.fire(
      'touchend',
      createTouchEvent('touchend', [createTouch(200, 200)]),
    );

    (Date.now as jest.Mock).mockReturnValue(1100);

    el.fire(
      'touchstart',
      createTouchEvent('touchstart', [createTouch(200, 200)]),
    );
    el.fire(
      'touchend',
      createTouchEvent('touchend', [createTouch(200, 200)]),
    );

    expect(onDoubleTap).toHaveBeenCalled();
  });

  it('does not call onDoubleTap for single tap', () => {
    const onDoubleTap = jest.fn();
    const el = createMockElement();

    const { result } = renderHook(() =>
      useGestures({ onDoubleTap }, { doubleTapDelay: 300 }),
    );

    (result.current as any).current = el;
    result.rerender();

    el.fire(
      'touchstart',
      createTouchEvent('touchstart', [createTouch(200, 200)]),
    );
    el.fire(
      'touchend',
      createTouchEvent('touchend', [createTouch(200, 200)]),
    );

    expect(onDoubleTap).not.toHaveBeenCalled();
  });

  it('calls onLongPress after holding for longPressDelay', () => {
    const onLongPress = jest.fn();
    const el = createMockElement();

    const { result } = renderHook(() =>
      useGestures({ onLongPress }, { longPressDelay: 500 }),
    );

    (result.current as any).current = el;
    result.rerender();

    el.fire(
      'touchstart',
      createTouchEvent('touchstart', [createTouch(200, 200)]),
    );

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(onLongPress).toHaveBeenCalled();
  });

  it('calls onPinch with scale factor for two-finger gesture', () => {
    const onPinch = jest.fn();
    const el = createMockElement();

    const { result } = renderHook(() =>
      useGestures({ onPinch }, { threshold: 50 }),
    );

    (result.current as any).current = el;
    result.rerender();

    const touch1 = createTouch(100, 100);
    const touch2 = createTouch(200, 200);
    Object.defineProperty(touch1, 'identifier', { value: 0 });
    Object.defineProperty(touch2, 'identifier', { value: 1 });

    el.fire(
      'touchstart',
      createTouchEvent('touchstart', [touch1, touch2]),
    );

    const spreadTouch1 = createTouch(80, 80);
    const spreadTouch2 = createTouch(220, 220);
    Object.defineProperty(spreadTouch1, 'identifier', { value: 0 });
    Object.defineProperty(spreadTouch2, 'identifier', { value: 1 });

    el.fire(
      'touchmove',
      createTouchEvent('touchmove', [spreadTouch1, spreadTouch2]),
    );

    expect(onPinch).toHaveBeenCalled();
    const scale = onPinch.mock.calls[0][0];
    expect(typeof scale).toBe('number');
    expect(scale).toBeGreaterThan(0);
  });

  it('cleans up event listeners on unmount', () => {
    const el = createMockElement();

    const { result, unmount } = renderHook(() =>
      useGestures({ onSwipeLeft: jest.fn() }),
    );

    (result.current as any).current = el;
    result.rerender();

    unmount();

    expect(el.removeEventListener).toHaveBeenCalledWith(
      'touchstart',
      expect.any(Function),
    );
    expect(el.removeEventListener).toHaveBeenCalledWith(
      'touchmove',
      expect.any(Function),
    );
    expect(el.removeEventListener).toHaveBeenCalledWith(
      'touchend',
      expect.any(Function),
    );
  });
});
