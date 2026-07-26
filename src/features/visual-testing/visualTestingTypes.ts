export type ModalType = 'WALLET' | 'TRANSACTION' | 'NETWORK' | 'NONE';
export type Breakpoint = 'MOBILE' | 'TABLET' | 'DESKTOP';

export interface VisualTestHarnessProps {
  children?: React.ReactNode;
  activeModal: ModalType;
  breakpoint: Breakpoint;
  theme: 'light' | 'dark';
}
