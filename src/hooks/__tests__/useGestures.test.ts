import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useGestures } from '../useGestures';

type GestureHandlers = {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
};

const Harness = ({ handlers, options }: { handlers: GestureHandlers; options?: Record<string, unknown> }) => {
  const ref = useGestures(handlers, options);
  return <div ref={ref as React.Ref<HTMLDivElement>} data-testid="gesture-area" />;
};

const touch = (clientX: number, clientY: number) => ({ clientX, clientY });

describe('useGestures', () => {
  it('fires onSwipeLeft when a left swipe crosses the threshold', () => {
    const handlers = { onSwipeLeft: jest.fn() };
    render(<Harness handlers={handlers} />);
    const el = screen.getByTestId('gesture-area');

    act(() => {
      fireEvent.touchStart(el, { touches: [touch(100, 100)] });
      fireEvent.touchMove(el, { touches: [touch(20, 100)] });
      fireEvent.touchEnd(el, { touches: [] });
    });

    expect(handlers.onSwipeLeft).toHaveBeenCalledTimes(1);
  });

  it('fires onSwipeRight when a right swipe crosses the threshold', () => {
    const handlers = { onSwipeRight: jest.fn() };
    render(<Harness handlers={handlers} />);
    const el = screen.getByTestId('gesture-area');

    act(() => {
      fireEvent.touchStart(el, { touches: [touch(20, 100)] });
      fireEvent.touchMove(el, { touches: [touch(120, 100)] });
      fireEvent.touchEnd(el, { touches: [] });
    });

    expect(handlers.onSwipeRight).toHaveBeenCalledTimes(1);
  });

  it('fires onSwipeUp for an upward swipe', () => {
    const handlers = { onSwipeUp: jest.fn() };
    render(<Harness handlers={handlers} />);
    const el = screen.getByTestId('gesture-area');

    act(() => {
      fireEvent.touchStart(el, { touches: [touch(100, 150)] });
      fireEvent.touchMove(el, { touches: [touch(100, 40)] });
      fireEvent.touchEnd(el, { touches: [] });
    });

    expect(handlers.onSwipeUp).toHaveBeenCalledTimes(1);
  });

  it('fires onSwipeDown for a downward swipe', () => {
    const handlers = { onSwipeDown: jest.fn() };
    render(<Harness handlers={handlers} />);
    const el = screen.getByTestId('gesture-area');

    act(() => {
      fireEvent.touchStart(el, { touches: [touch(100, 40)] });
      fireEvent.touchMove(el, { touches: [touch(100, 150)] });
      fireEvent.touchEnd(el, { touches: [] });
    });

    expect(handlers.onSwipeDown).toHaveBeenCalledTimes(1);
  });

  it('does not fire a swipe for movement below the threshold', () => {
    const handlers = { onSwipeLeft: jest.fn(), onDoubleTap: jest.fn() };
    render(<Harness handlers={handlers} />);
    const el = screen.getByTestId('gesture-area');

    act(() => {
      fireEvent.touchStart(el, { touches: [touch(100, 100)] });
      fireEvent.touchMove(el, { touches: [touch(110, 100)] });
      fireEvent.touchEnd(el, { touches: [] });
    });

    expect(handlers.onSwipeLeft).not.toHaveBeenCalled();
  });

  it('fires onDoubleTap for two quick taps', () => {
    const handlers = { onDoubleTap: jest.fn() };
    render(<Harness handlers={handlers} />);
    const el = screen.getByTestId('gesture-area');

    act(() => {
      // Tap 1
      fireEvent.touchStart(el, { touches: [touch(50, 50)] });
      fireEvent.touchEnd(el, { touches: [] });
      // Tap 2 within the double-tap window
      fireEvent.touchStart(el, { touches: [touch(50, 50)] });
      fireEvent.touchEnd(el, { touches: [] });
    });

    expect(handlers.onDoubleTap).toHaveBeenCalledTimes(1);
  });

  it('fires onLongPress after the long-press delay', () => {
    jest.useFakeTimers();
    const handlers = { onLongPress: jest.fn() };
    render(<Harness handlers={handlers} />);
    const el = screen.getByTestId('gesture-area');

    act(() => {
      fireEvent.touchStart(el, { touches: [touch(50, 50)] });
    });
    expect(handlers.onLongPress).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(handlers.onLongPress).toHaveBeenCalledTimes(1);

    act(() => {
      fireEvent.touchEnd(el, { touches: [] });
    });
    jest.useRealTimers();
  });

  it('fires onPinch with the scale ratio for two-finger gestures', () => {
    const handlers = { onPinch: jest.fn() };
    render(<Harness handlers={handlers} />);
    const el = screen.getByTestId('gesture-area');

    act(() => {
      fireEvent.touchStart(el, {
        touches: [touch(0, 0), touch(100, 0)],
      });
      fireEvent.touchMove(el, {
        touches: [touch(0, 0), touch(200, 0)],
      });
      fireEvent.touchEnd(el, { touches: [] });
    });

    expect(handlers.onPinch).toHaveBeenCalledWith(2);
  });

  it('removes touch listeners on unmount', () => {
    const handlers = { onSwipeLeft: jest.fn() };
    const { unmount } = render(<Harness handlers={handlers} />);
    const el = screen.getByTestId('gesture-area');

    const removeSpy = jest.spyOn(el, 'removeEventListener');
    unmount();

    expect(removeSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('touchmove', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
  });
});
