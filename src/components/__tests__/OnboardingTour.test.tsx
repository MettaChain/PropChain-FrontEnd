import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { OnboardingTour } from '@/components/OnboardingTour';
import { useOnboardingStore } from '@/store/onboardingStore';

jest.mock('@/store/onboardingStore', () => ({ useOnboardingStore: jest.fn() }));
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, style, className, onClick, layout, ...rest }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement> & { layout?: boolean }>) => (
      <div style={style} className={className} onClick={onClick}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
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
