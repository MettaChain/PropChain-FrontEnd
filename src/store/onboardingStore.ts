import { createBaseStore, type BaseState, type BaseActions } from './base';

export interface OnboardingState extends BaseState {
  isActive: boolean;
  currentStep: number;
  hasCompletedOnboarding: boolean;
}

export interface OnboardingActions extends BaseActions {
  startOnboarding: () => void;
  stopOnboarding: () => void;
  nextStep: () => void;
  prevStep: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const initialState: OnboardingState = {
  isActive: false,
  currentStep: 0,
  hasCompletedOnboarding: false,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

export const useOnboardingStore = createBaseStore<OnboardingState, OnboardingActions>(
  initialState,
  (set, get) => ({
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),
    setLastUpdated: (timestamp) => set({ lastUpdated: timestamp }),
    reset: () => set(initialState),

    startOnboarding: () => {
      if (!get().hasCompletedOnboarding) {
        set({ isActive: true, currentStep: 0 });
      }
    },
    stopOnboarding: () => set({ isActive: false }),
    nextStep: () => set((state: OnboardingState) => ({ currentStep: state.currentStep + 1 })),
    prevStep: () => set((state: OnboardingState) => ({ currentStep: Math.max(0, state.currentStep - 1) })),
    completeOnboarding: () => set({ isActive: false, hasCompletedOnboarding: true, currentStep: 0 }),
    resetOnboarding: () => set({ hasCompletedOnboarding: false, currentStep: 0 }),
  }),
  {
    persist: true,
    name: 'propchain-onboarding',
  }
);
