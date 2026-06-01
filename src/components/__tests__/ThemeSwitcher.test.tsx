import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

const mockSetTheme = jest.fn();
let mockResolvedTheme = 'light';

jest.mock('next-themes', () => ({
  useTheme: () => ({
    resolvedTheme: mockResolvedTheme,
    setTheme: mockSetTheme,
  }),
}));

// Simulate mounted state so the component renders the button (not the placeholder)
jest.mock('react', () => {
  const actual = jest.requireActual<typeof React>('react');
  return {
    ...actual,
    useState: (initial: unknown) => {
      // Force isMounted to true so we skip the placeholder div
      if (initial === false) return [true, jest.fn()];
      return actual.useState(initial);
    },
  };
});

describe('ThemeSwitcher', () => {
  beforeEach(() => {
    mockResolvedTheme = 'light';
    mockSetTheme.mockClear();
  });

  it('renders a button with aria-label in light mode', () => {
    render(<ThemeSwitcher />);
    const btn = screen.getByRole('button');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-label', 'Switch to dark mode');
  });

  it('renders a button with aria-label in dark mode', () => {
    mockResolvedTheme = 'dark';
    render(<ThemeSwitcher />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Switch to light mode');
  });

  it('calls setTheme with "dark" when in light mode', () => {
    render(<ThemeSwitcher />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('calls setTheme with "light" when in dark mode', () => {
    mockResolvedTheme = 'dark';
    render(<ThemeSwitcher />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('shows text label when size is "sm" (default)', () => {
    render(<ThemeSwitcher size="sm" />);
    expect(screen.getByText('Dark')).toBeInTheDocument();
  });

  it('hides text label when size is "icon"', () => {
    render(<ThemeSwitcher size="icon" />);
    expect(screen.queryByText('Dark')).not.toBeInTheDocument();
    expect(screen.queryByText('Light')).not.toBeInTheDocument();
  });

  it('has data-testid="theme-switcher"', () => {
    render(<ThemeSwitcher />);
    expect(screen.getByTestId('theme-switcher')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<ThemeSwitcher className="custom-class" />);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });
});
