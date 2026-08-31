import { useEffect } from 'react';
import { useVisualTestingStore } from './visualTestingStore';
import { ModalType, Breakpoint } from './visualTestingTypes';

export function useVisualTestHarness(initialModal: ModalType = 'NONE', initialBreakpoint: Breakpoint = 'DESKTOP') {
  const { activeModal, breakpoint, theme, setTestConfig, reset } = useVisualTestingStore();

  useEffect(() => {
    setTestConfig({ modal: initialModal, breakpoint: initialBreakpoint });
    return () => reset();
  }, [initialModal, initialBreakpoint, setTestConfig, reset]);

  return {
    activeModal,
    breakpoint,
    theme,
    setTestConfig,
  };
}
