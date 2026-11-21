import { fireEvent, render, screen } from '@testing-library/react';
import DarkModeToggle from '../components/DarkModeToggle';

describe('DarkModeToggle', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: jest.fn().mockImplementation((media: string) => ({
        matches: false,
        media,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })),
    });
  });

  it('cycles through light, dark, and system modes with a keyboard-operable button', () => {
    render(<DarkModeToggle initialMode="light" />);

    const toggle = screen.getByRole('button', { name: /current mode: light/i });
    expect(screen.getByText('Current mode: light')).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.getByText('Current mode: dark')).toBeInTheDocument();

    fireEvent.keyDown(toggle, { key: 'Enter' });
    fireEvent.click(toggle);
    expect(screen.getByText('Current mode: system')).toBeInTheDocument();
  });
});
