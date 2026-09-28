import { render, screen } from '@testing-library/react';
import { AppHeader } from '@/components/layout/AppHeader';

/**
 * Issue #1094 — the shared header.
 *
 * The interesting assertions are the accessibility ones. The twenty inlined
 * copies this replaces mostly rendered `<h1>PropChain</h1>`, so a page ended up
 * with two level-1 headings, and any page that also mounted a header-rendering
 * component ended up with two `banner` landmarks. Both are pinned here so they
 * cannot come back.
 */
describe('AppHeader', () => {
  it('renders exactly one banner landmark', () => {
    render(<AppHeader />);
    expect(screen.getAllByRole('banner')).toHaveLength(1);
  });

  it('does not render the brand as a heading', () => {
    render(<AppHeader />);

    expect(screen.getByText('PropChain')).toBeInTheDocument();
    // The page owns the only <h1>; the brand must not compete with it.
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('links the brand to the home page by default', () => {
    render(<AppHeader />);
    const link = screen.getByRole('link');

    expect(link).toHaveAttribute('href', '/');
    expect(link).toHaveTextContent('PropChain');
  });

  it('renders the brand as plain text when brandHref is null', () => {
    render(<AppHeader brandHref={null} />);

    expect(screen.getByText('PropChain')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders a labelled back link when backHref is given', () => {
    render(<AppHeader backHref="/dashboard" backLabel="Back to dashboard" />);

    const back = screen.getByRole('link', { name: 'Back to dashboard' });
    expect(back).toHaveAttribute('href', '/dashboard');
  });

  it('still names the back link when no visible label is supplied', () => {
    render(<AppHeader backHref="/properties" />);

    expect(screen.getByRole('link', { name: 'Go back' })).toHaveAttribute(
      'href',
      '/properties',
    );
  });

  it('renders leading and action slots', () => {
    render(
      <AppHeader
        leading={<button type="button">Open sidebar</button>}
        actions={<button type="button">Connect wallet</button>}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Open sidebar' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Connect wallet' }),
    ).toBeInTheDocument();
  });

  it('applies sticky positioning only when asked', () => {
    const { container: plain } = render(<AppHeader />);
    expect(plain.querySelector('header')).not.toHaveClass('sticky');

    const { container: stuck } = render(<AppHeader sticky />);
    expect(stuck.querySelector('header')).toHaveClass('sticky', 'top-0');
  });

  it('can render without claiming the banner landmark', () => {
    render(<AppHeader as="div" />);

    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.getByText('PropChain')).toBeInTheDocument();
  });

  it('allows the container width to be overridden', () => {
    const { container } = render(<AppHeader containerClassName="max-w-4xl" />);

    expect(container.querySelector('.max-w-4xl')).toBeInTheDocument();
  });

  it('matches the rendered structure', () => {
    const { container } = render(
      <AppHeader
        sticky
        backHref="/dashboard"
        backLabel="Back to dashboard"
        actions={<span>wallet</span>}
      />,
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});
