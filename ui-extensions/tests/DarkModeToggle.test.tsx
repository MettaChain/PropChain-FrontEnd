import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DarkModeToggle from '../components/DarkModeToggle';

describe('DarkModeToggle', () => {
  it('cycles through light, dark, and system modes using keyboard activation', async () => {
    const user = userEvent.setup();
    render(<DarkModeToggle initialMode="light" />);

    const toggle = screen.getByRole('button', { name: /current mode: light/i });
    expect(screen.getByText('Current mode: light')).toBeInTheDocument();

    await user.tab();
    expect(toggle).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByText('Current mode: dark')).toBeInTheDocument();

    await user.keyboard(' ');
    expect(screen.getByText('Current mode: system')).toBeInTheDocument();
  });
});
