import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const mockChangeLanguage = jest.fn();
let mockLanguage = 'en';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      language: mockLanguage,
      changeLanguage: mockChangeLanguage,
    },
  }),
}));

jest.mock('@/utils/structuredLogger', () => ({
  structuredLogger: { component: jest.fn() },
}));

// Stub Radix DropdownMenu to render children directly for testability
jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode; asChild?: boolean }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) => (
    <button onClick={onClick} className={className}>{children}</button>
  ),
}));

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    mockLanguage = 'en';
    mockChangeLanguage.mockClear();
    document.documentElement.lang = '';
    document.documentElement.dir = '';
  });

  it('renders the trigger button', () => {
    render(<LanguageSwitcher />);
    // The trigger is the Button component (data-slot="button"); menu items are plain buttons
    const trigger = document.querySelector('[data-slot="button"]');
    expect(trigger).toBeInTheDocument();
  });

  it('renders all language options', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Español')).toBeInTheDocument();
    expect(screen.getByText('Français')).toBeInTheDocument();
    expect(screen.getByText('Deutsch')).toBeInTheDocument();
    expect(screen.getByText('中文')).toBeInTheDocument();
    expect(screen.getByText('العربية')).toBeInTheDocument();
    expect(screen.getByText('עברית')).toBeInTheDocument();
  });

  it('calls changeLanguage when a language is selected', () => {
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: /español/i }));
    expect(mockChangeLanguage).toHaveBeenCalledWith('es');
  });

  it('sets html lang attribute on language change', () => {
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: /français/i }));
    expect(document.documentElement.lang).toBe('fr');
  });

  it('sets dir="rtl" for Arabic', () => {
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: /العربية/i }));
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('sets dir="rtl" for Hebrew', () => {
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: /עברית/i }));
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('sets dir="ltr" for non-RTL languages', () => {
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: /deutsch/i }));
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('uses structuredLogger instead of console.log', () => {
    const { structuredLogger } = jest.requireMock('@/utils/structuredLogger');
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: /español/i }));
    expect(structuredLogger.component).toHaveBeenCalledWith(
      'LanguageSwitcher',
      'changeLanguage',
      expect.objectContaining({ metadata: expect.objectContaining({ languageCode: 'es' }) }),
    );
  });
});
