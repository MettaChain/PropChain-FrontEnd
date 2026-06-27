import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '../Sidebar';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

// Mock next/link
jest.mock('next/link', () => {
  const Link = ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  );
  Link.displayName = 'Link';
  return Link;
});

const defaultProps = {
  isOpen: false,
  isCollapsed: false,
  onClose: jest.fn(),
  onToggleCollapse: jest.fn(),
};

describe('Sidebar', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders navigation links', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Properties').length).toBeGreaterThan(0);
  });

  it('highlights the active route', () => {
    render(<Sidebar {...defaultProps} />);
    const activeLinks = screen.getAllByRole('link', { name: /dashboard/i });
    const activeLink = activeLinks.find((el) => el.getAttribute('aria-current') === 'page');
    expect(activeLink).toBeTruthy();
  });

  it('shows mobile drawer when isOpen is true', () => {
    render(<Sidebar {...defaultProps} isOpen={true} />);
    // The mobile overlay should be present
    const overlay = document.querySelector('[aria-hidden="true"]');
    expect(overlay).toBeTruthy();
  });

  it('calls onClose when overlay is clicked', () => {
    const onClose = jest.fn();
    render(<Sidebar {...defaultProps} isOpen={true} onClose={onClose} />);
    const overlay = document.querySelector('[aria-hidden="true"]') as HTMLElement;
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleCollapse when collapse button is clicked on desktop', () => {
    const onToggleCollapse = jest.fn();
    render(<Sidebar {...defaultProps} onToggleCollapse={onToggleCollapse} />);
    const collapseBtn = screen.getByRole('button', { name: /collapse sidebar/i });
    fireEvent.click(collapseBtn);
    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it('hides labels when collapsed', () => {
    render(<Sidebar {...defaultProps} isCollapsed={true} />);
    // Desktop sidebar should not show text labels (they're hidden via conditional render)
    // The desktop aside is hidden on mobile, so we check the desktop aside
    const desktopAside = document.querySelector('aside.hidden.lg\\:flex');
    expect(desktopAside).toBeTruthy();
    // Labels should not be in the desktop sidebar when collapsed
    const labelsInDesktop = desktopAside?.querySelectorAll('span');
    expect(labelsInDesktop?.length).toBe(0);
  });
});
