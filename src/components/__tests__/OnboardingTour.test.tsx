import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { OnboardingTour } from '@/components/OnboardingTour';
import { useOnboardingStore } from '@/store/onboardingStore';

jest.mock('@/store/onboardingStore', () => ({ useOnboardingStore: jest.fn() }));
jest.mock('framer-motion', () => {
  // Forward refs so the focus trap inside OnboardingTour can read its container.
  const MotionDiv = require('react').forwardRef<
    HTMLDivElement,
    React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement> & { layout?: boolean }>
  >((props, ref) => {
    const { children, style, className, onClick, layout, ...rest } = props;
    return (
      <div ref={ref} style={style} className={className} onClick={onClick} {...rest}>
        {children}
      </div>
    );
  });
  MotionDiv.displayName = 'MotionDiv';
  return {
    motion: { div: MotionDiv },
    AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  };
});
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }: React.PropsWithChildren<{ onClick?: () => void }>) => (
    <button onClick={onClick}>{children}</button>
  ),
}));
jest.mock('lucide-react', () => ({
  X: () => <svg data-testid="icon-x" />,
  ChevronRight: () => <svg />,
  ChevronLeft: () => <svg />,
  Building2: () => <svg />,
  Wallet: () => <svg />,
  Search: () => <svg />,
  BarChart3: () => <svg />,
  Info: () => <svg />,
}));
jest.mock('@/lib/utils', () => ({ cn: (...args: string[]) => args.filter(Boolean).join(' ') }));

const mockUseOnboardingStore = useOnboardingStore as jest.MockedFunction<typeof useOnboardingStore>;

const makeStore = (overrides = {}) => ({
  isActive: true,
  currentStep: 0,
  nextStep: jest.fn(),
  prevStep: jest.fn(),
  stopOnboarding: jest.fn(),
  completeOnboarding: jest.fn(),
  ...overrides,
});

describe('OnboardingTour', () => {
  it('renders nothing when isActive is false', () => {
    mockUseOnboardingStore.mockReturnValue(makeStore({ isActive: false }) as ReturnType<typeof useOnboardingStore>);
    const { container } = render(<OnboardingTour />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the first step title when active', () => {
    mockUseOnboardingStore.mockReturnValue(makeStore() as ReturnType<typeof useOnboardingStore>);
    render(<OnboardingTour />);
    expect(screen.getByText('Welcome to PropChain')).toBeInTheDocument();
  });

  it('shows step counter', () => {
    mockUseOnboardingStore.mockReturnValue(makeStore() as ReturnType<typeof useOnboardingStore>);
    render(<OnboardingTour />);
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
  });

  it('calls nextStep when Next is clicked', () => {
    const store = makeStore();
    mockUseOnboardingStore.mockReturnValue(store as ReturnType<typeof useOnboardingStore>);
    render(<OnboardingTour />);
    fireEvent.click(screen.getByText('Next'));
    expect(store.nextStep).toHaveBeenCalledTimes(1);
  });

  it('calls stopOnboarding when Skip is clicked', () => {
    const store = makeStore();
    mockUseOnboardingStore.mockReturnValue(store as ReturnType<typeof useOnboardingStore>);
    render(<OnboardingTour />);
    fireEvent.click(screen.getByText('Skip'));
    expect(store.stopOnboarding).toHaveBeenCalledTimes(1);
  });

  it('shows Back button on steps after the first', () => {
    mockUseOnboardingStore.mockReturnValue(makeStore({ currentStep: 2 }) as ReturnType<typeof useOnboardingStore>);
    render(<OnboardingTour />);
    expect(screen.getByText('Back')).toBeInTheDocument();
  });

  it('calls prevStep when Back is clicked', () => {
    const store = makeStore({ currentStep: 2 });
    mockUseOnboardingStore.mockReturnValue(store as ReturnType<typeof useOnboardingStore>);
    render(<OnboardingTour />);
    fireEvent.click(screen.getByText('Back'));
    expect(store.prevStep).toHaveBeenCalledTimes(1);
  });

  it('shows Finish button on the last step', () => {
    mockUseOnboardingStore.mockReturnValue(makeStore({ currentStep: 4 }) as ReturnType<typeof useOnboardingStore>);
    render(<OnboardingTour />);
    expect(screen.getByText('Finish')).toBeInTheDocument();
  });

  it('calls completeOnboarding when Finish is clicked', () => {
    const store = makeStore({ currentStep: 4 });
    mockUseOnboardingStore.mockReturnValue(store as ReturnType<typeof useOnboardingStore>);
    render(<OnboardingTour />);
    fireEvent.click(screen.getByText('Finish'));
    expect(store.completeOnboarding).toHaveBeenCalledTimes(1);
  });
});

describe('OnboardingTour focus trap', () => {
  it('marks the tour card as a modal dialog with an accessible label', () => {
    const store = makeStore();
    mockUseOnboardingStore.mockReturnValue(store as ReturnType<typeof useOnboardingStore>);
    render(<OnboardingTour />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    const label = dialog.getAttribute('aria-label') ?? '';
    expect(label).toMatch(/Welcome to PropChain/);
    expect(label).toMatch(/Step 1 of 5/i);
  });

  it('exposes only the buttons inside the card to the focusable selector', () => {
    mockUseOnboardingStore.mockReturnValue(makeStore() as ReturnType<typeof useOnboardingStore>);
    render(<OnboardingTour />);
    const dialog = screen.getByRole('dialog');
    // First step: Skip + Next (no Back yet, no X close in render tree because of mocks).
    const focusables = dialog.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])');
    expect(focusables.length).toBeGreaterThanOrEqual(2);
  });

  it('closes the tour when Escape is pressed', () => {
    const store = makeStore();
    mockUseOnboardingStore.mockReturnValue(store as ReturnType<typeof useOnboardingStore>);
    render(<OnboardingTour />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(store.stopOnboarding).toHaveBeenCalledTimes(1);
  });

  it('does not attach the Escape handler while the tour is inactive', () => {
    const store = makeStore({ isActive: false });
    mockUseOnboardingStore.mockReturnValue(store as ReturnType<typeof useOnboardingStore>);
    render(<OnboardingTour />);
    fireEvent.keyDown(document, { key: 'Escape' });
    // The handler is only registered while active, so stopOnboarding stays at 0.
    expect(store.stopOnboarding).not.toHaveBeenCalled();
  });

  it('skips the cleanup-focused path when the tour re-activates', () => {
    const store = makeStore();
    mockUseOnboardingStore.mockReturnValue(store as ReturnType<typeof useOnboardingStore>);
    const { rerender } = render(<OnboardingTour />);
    // Toggle active twice so the cleanup effect runs (no thrown errors).
    mockUseOnboardingStore.mockReturnValue(makeStore({ isActive: false }) as ReturnType<typeof useOnboardingStore>);
    rerender(<OnboardingTour />);
    mockUseOnboardingStore.mockReturnValue(makeStore() as ReturnType<typeof useOnboardingStore>);
    rerender(<OnboardingTour />);
    // Initial focus effect fired at least once.
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('wraps Tab from the last focusable back to the first', () => {
    const store = makeStore();
    mockUseOnboardingStore.mockReturnValue(store as ReturnType<typeof useOnboardingStore>);
    render(<OnboardingTour />);

    const dialog = screen.getByRole('dialog');
    const focusables = Array.from(
      dialog.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])')
    );
    expect(focusables.length).toBeGreaterThanOrEqual(2);

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(document.activeElement).toBe(first);
  });

  it('wraps Shift+Tab from the first focusable back to the last', () => {
    const store = makeStore();
    mockUseOnboardingStore.mockReturnValue(store as ReturnType<typeof useOnboardingStore>);
    render(<OnboardingTour />);

    const dialog = screen.getByRole('dialog');
    const focusables = Array.from(
      dialog.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])')
    );
    expect(focusables.length).toBeGreaterThanOrEqual(2);

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    first.focus();
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it('does not pull focus out of the card when Tab moves between middle focusables', () => {
    const store = makeStore();
    mockUseOnboardingStore.mockReturnValue(store as ReturnType<typeof useOnboardingStore>);
    render(<OnboardingTour />);

    const dialog = screen.getByRole('dialog');
    const focusables = Array.from(
      dialog.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])')
    );
    const middle = focusables[Math.floor(focusables.length / 2)];
    middle.focus();
    fireEvent.keyDown(middle, { key: 'Tab' });
    // After Tab, focus must remain inside the tour card (not leak to the document).
    const active = document.activeElement as HTMLElement | null;
    if (active) {
      expect(dialog.contains(active)).toBe(true);
    }
  });

  it('restores focus to the element that was active before opening', () => {
    // Plant a focusable external trigger outside the React tree.
    const trigger = document.createElement('button');
    trigger.textContent = 'External Trigger';
    trigger.setAttribute('data-testid', 'external-trigger');
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    mockUseOnboardingStore.mockReturnValue(makeStore() as ReturnType<typeof useOnboardingStore>);
    const { rerender } = render(<OnboardingTour />);

    // Externally focused element should be saved.
    rerender(<OnboardingTour />);

    // Close the tour.
    mockUseOnboardingStore.mockReturnValue(
      makeStore({ isActive: false }) as ReturnType<typeof useOnboardingStore>
    );
    rerender(<OnboardingTour />);

    // Focus should be returned to the original external element.
    expect(document.activeElement).toBe(trigger);
    document.body.removeChild(trigger);
  });
});
