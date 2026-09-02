import React from 'react';
import { render, screen } from '@testing-library/react';
import { VisualTestHarness } from './VisualTestHarness';


describe('VisualTestHarness', () => {
  it('renders children correctly', () => {
    render(
      <VisualTestHarness activeModal="NONE" breakpoint="DESKTOP" theme="light">
        <div data-testid="child-content">Main App Content</div>
      </VisualTestHarness>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('applies correct width classes based on breakpoint', () => {
    const { container } = render(
      <VisualTestHarness activeModal="NONE" breakpoint="MOBILE" theme="light" />
    );
    expect(container.firstChild).toHaveClass('w-[375px]');
  });

  it('applies dark mode classes when theme is dark', () => {
    const { container } = render(
      <VisualTestHarness activeModal="NONE" breakpoint="DESKTOP" theme="dark" />
    );
    expect(container.firstChild).toHaveClass('bg-gray-900', 'text-white', 'dark');
  });

  it('renders the WALLET modal when activeModal is WALLET', () => {
    render(
      <VisualTestHarness activeModal="WALLET" breakpoint="DESKTOP" theme="light" />
    );
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    expect(screen.getByText('MetaMask')).toBeInTheDocument();
  });

  it('renders the TRANSACTION modal when activeModal is TRANSACTION', () => {
    render(
      <VisualTestHarness activeModal="TRANSACTION" breakpoint="DESKTOP" theme="light" />
    );
    expect(screen.getByText('Confirm Transaction')).toBeInTheDocument();
    expect(screen.getByText('1,500 USDC')).toBeInTheDocument();
  });
});
