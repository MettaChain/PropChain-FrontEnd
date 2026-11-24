import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef, useState } from 'react';

import FocusTrap from '../components/FocusTrap';
import { getFocusableElements, useFocusTrap } from '../hooks/useFocusTrap';

function pressTab(options: { shiftKey?: boolean } = {}) {
  const event = new KeyboardEvent('keydown', {
    key: 'Tab',
    bubbles: true,
    cancelable: true,
    shiftKey: options.shiftKey ?? false,
  });
  act(() => {
    document.dispatchEvent(event);
  });
  return event;
}

describe('getFocusableElements', () => {
  it('skips hidden, disabled and tabindex=-1 elements', () => {
    const { container } = render(
      <div>
        <button type="button">enabled</button>
        <button type="button" disabled>
          disabled
        </button>
        <button type="button" hidden>
          hidden attribute
        </button>
        <div aria-hidden="true">
          <button type="button">aria hidden</button>
        </div>
        <button type="button" tabIndex={-1}>
          removed from order
        </button>
        <a href="#target">link</a>
      </div>,
    );

    const labels = getFocusableElements(container).map((element) => element.textContent);
    expect(labels).toEqual(['enabled', 'link']);
  });

  it('returns an empty list for a missing container', () => {
    expect(getFocusableElements(null)).toEqual([]);
  });
});

describe('FocusTrap', () => {
  it('focuses the first focusable child by default', () => {
    render(
      <FocusTrap aria-label="Details">
        <button type="button">first</button>
        <button type="button">second</button>
      </FocusTrap>,
    );

    expect(screen.getByRole('dialog', { name: 'Details' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'first' })).toHaveFocus();
  });

  it('focuses the configured initial focus element instead of the first one', async () => {
    const user = userEvent.setup();

    function Harness() {
      const triggerRef = useRef<HTMLButtonElement>(null);
      const [open, setOpen] = useState(false);
      return (
        <div>
          <button ref={triggerRef} type="button" onClick={() => setOpen(true)}>
            preferred
          </button>
          {open && (
            <FocusTrap aria-label="Picker" initialFocus={triggerRef.current}>
              <button type="button">first</button>
              <button type="button">second</button>
            </FocusTrap>
          )}
        </div>
      );
    }

    render(<Harness />);
    const preferred = screen.getByRole('button', { name: 'preferred' });
    await user.click(preferred);

    expect(preferred).toHaveFocus();
    expect(screen.getByRole('button', { name: 'first' })).not.toHaveFocus();
  });

  it('wraps focus from the last element to the first on Tab', () => {
    render(
      <FocusTrap aria-label="Wrapping">
        <button type="button">first</button>
        <button type="button">last</button>
      </FocusTrap>,
    );

    const last = screen.getByRole('button', { name: 'last' });
    last.focus();
    const event = pressTab();

    expect(event.defaultPrevented).toBe(true);
    expect(screen.getByRole('button', { name: 'first' })).toHaveFocus();
  });

  it('wraps focus from the first element to the last on Shift+Tab', () => {
    render(
      <FocusTrap aria-label="Wrapping back">
        <button type="button">first</button>
        <button type="button">last</button>
      </FocusTrap>,
    );

    const first = screen.getByRole('button', { name: 'first' });
    first.focus();
    const event = pressTab({ shiftKey: true });

    expect(event.defaultPrevented).toBe(true);
    expect(screen.getByRole('button', { name: 'last' })).toHaveFocus();
  });

  it('picks up focusable elements added after mount', () => {
    const { rerender } = render(
      <FocusTrap aria-label="Growing">
        <button type="button">one</button>
        <button type="button">two</button>
      </FocusTrap>,
    );

    const two = screen.getByRole('button', { name: 'two' });
    two.focus();
    // With two as the last element Tab is trapped.
    expect(pressTab().defaultPrevented).toBe(true);

    rerender(
      <FocusTrap aria-label="Growing">
        <button type="button">one</button>
        <button type="button">two</button>
        <button type="button">three</button>
      </FocusTrap>,
    );

    two.focus();
    // `two` is no longer last, so the trap must let sequential focus advance.
    expect(pressTab().defaultPrevented).toBe(false);
    expect(two).toHaveFocus();
  });

  it('restores focus to the trigger element on close', async () => {
    const user = userEvent.setup();

    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open dialog
          </button>
          {open && (
            <FocusTrap aria-label="Restore" onEscape={() => setOpen(false)}>
              <button type="button">inside</button>
            </FocusTrap>
          )}
        </>
      );
    }

    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Open dialog' });

    await user.click(trigger);
    expect(screen.getByRole('button', { name: 'inside' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('traps focus in the innermost modal when modals are nested', async () => {
    const user = userEvent.setup();

    function Harness() {
      const [innerOpen, setInnerOpen] = useState(false);
      return (
        <FocusTrap aria-label="Outer">
          <button type="button" onClick={() => setInnerOpen(true)}>
            Open inner
          </button>
          {innerOpen && (
            <FocusTrap aria-label="Inner">
              <button type="button">inner first</button>
              <button type="button">inner last</button>
            </FocusTrap>
          )}
        </FocusTrap>
      );
    }

    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Open inner' }));

    // The inner modal takes focus on mount.
    expect(screen.getByRole('button', { name: 'inner first' })).toHaveFocus();

    screen.getByRole('button', { name: 'inner last' }).focus();
    expect(pressTab().defaultPrevented).toBe(true);
    // Wrapped inside the inner modal, not back into the outer one.
    expect(screen.getByRole('button', { name: 'inner first' })).toHaveFocus();
  });

  it('keeps focus on the dialog when it has nothing focusable', () => {
    render(
      <FocusTrap aria-label="Empty">
        <p>Only text here</p>
      </FocusTrap>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Empty' });
    expect(dialog).toHaveAttribute('tabindex', '-1');
    expect(dialog).toHaveFocus();

    pressTab();
    expect(dialog).toHaveFocus();
  });

  it('does not trap while inactive', () => {
    function Harness() {
      const { ref } = useFocusTrap<HTMLDivElement>({ active: false });
      return (
        <div ref={ref} data-testid="inactive">
          <button type="button">only</button>
        </div>
      );
    }

    render(<Harness />);
    const only = screen.getByRole('button', { name: 'only' });
    only.focus();

    expect(pressTab().defaultPrevented).toBe(false);
    expect(only).toHaveFocus();
  });

  it('stops listening after unmount', () => {
    const { unmount } = render(
      <FocusTrap aria-label="Temporary">
        <button type="button">only</button>
      </FocusTrap>,
    );

    const only = screen.getByRole('button', { name: 'only' });
    only.focus();
    unmount();

    expect(pressTab().defaultPrevented).toBe(false);
  });

  it('renders children without a dialog wrapper when inactive', () => {
    render(
      <FocusTrap active={false} aria-label="Hidden trap">
        <button type="button">plain</button>
      </FocusTrap>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'plain' })).toBeInTheDocument();
  });

  it('calls onEscape only for the owning trap', async () => {
    const user = userEvent.setup();
    const outerEscape = jest.fn();

    function Harness() {
      const [innerOpen, setInnerOpen] = useState(false);
      return (
        <FocusTrap aria-label="Outer" onEscape={outerEscape}>
          <button type="button" onClick={() => setInnerOpen(true)}>
            Open inner
          </button>
          {innerOpen && (
            <FocusTrap aria-label="Inner" onEscape={() => setInnerOpen(false)}>
              <button type="button">inner</button>
            </FocusTrap>
          )}
        </FocusTrap>
      );
    }

    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Open inner' }));
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog', { name: 'Inner' })).not.toBeInTheDocument();
    expect(outerEscape).not.toHaveBeenCalled();
  });
});

describe('fireEvent integration', () => {
  it('honours Tab sent through fireEvent as well', () => {
    render(
      <FocusTrap aria-label="Fire event">
        <button type="button">alpha</button>
        <button type="button">omega</button>
      </FocusTrap>,
    );

    const omega = screen.getByRole('button', { name: 'omega' });
    omega.focus();
    fireEvent.keyDown(document, { key: 'Tab' });

    expect(screen.getByRole('button', { name: 'alpha' })).toHaveFocus();
  });
});
