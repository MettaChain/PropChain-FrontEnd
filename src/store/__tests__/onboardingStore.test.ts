import { act, renderHook } from '@testing-library/react';
import { useOnboardingStore } from '../onboardingStore';

describe('onboardingStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useOnboardingStore.getState().reset();
  });

  it('starts in the inactive initial state', () => {
    const { result } = renderHook(() => useOnboardingStore());
    expect(result.current.isActive).toBe(false);
    expect(result.current.currentStep).toBe(0);
    expect(result.current.hasCompletedOnboarding).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('starts onboarding from step zero', () => {
    const { result } = renderHook(() => useOnboardingStore());

    act(() => {
      result.current.startOnboarding();
    });

    expect(result.current.isActive).toBe(true);
    expect(result.current.currentStep).toBe(0);
  });

  it('does not restart onboarding once completed', () => {
    const { result } = renderHook(() => useOnboardingStore());

    act(() => {
      result.current.completeOnboarding();
    });

    expect(result.current.hasCompletedOnboarding).toBe(true);

    act(() => {
      result.current.startOnboarding();
    });

    expect(result.current.isActive).toBe(false);
  });

  it('stops onboarding', () => {
    const { result } = renderHook(() => useOnboardingStore());

    act(() => {
      result.current.startOnboarding();
      result.current.stopOnboarding();
    });

    expect(result.current.isActive).toBe(false);
  });

  it('advances to the next step', () => {
    const { result } = renderHook(() => useOnboardingStore());

    act(() => {
      result.current.nextStep();
      result.current.nextStep();
    });

    expect(result.current.currentStep).toBe(2);
  });

  it('never goes below step zero when going back', () => {
    const { result } = renderHook(() => useOnboardingStore());

    act(() => {
      result.current.prevStep();
      result.current.prevStep();
    });

    expect(result.current.currentStep).toBe(0);
  });

  it('completes onboarding and resets the step', () => {
    const { result } = renderHook(() => useOnboardingStore());

    act(() => {
      result.current.startOnboarding();
      result.current.nextStep();
      result.current.completeOnboarding();
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.hasCompletedOnboarding).toBe(true);
    expect(result.current.currentStep).toBe(0);
  });

  it('resetOnboarding clears the completed flag', () => {
    const { result } = renderHook(() => useOnboardingStore());

    act(() => {
      result.current.completeOnboarding();
      result.current.resetOnboarding();
    });

    expect(result.current.hasCompletedOnboarding).toBe(false);
    expect(result.current.currentStep).toBe(0);
  });

  it('reset restores the initial state', () => {
    const { result } = renderHook(() => useOnboardingStore());

    act(() => {
      result.current.startOnboarding();
      result.current.nextStep();
      result.current.setError('boom');
      result.current.reset();
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.currentStep).toBe(0);
    expect(result.current.hasCompletedOnboarding).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('persists completed progress across store instances', () => {
    const { result } = renderHook(() => useOnboardingStore());

    act(() => {
      result.current.completeOnboarding();
    });

    const { result: result2 } = renderHook(() => useOnboardingStore());
    expect(result2.current.hasCompletedOnboarding).toBe(true);
  });
});
