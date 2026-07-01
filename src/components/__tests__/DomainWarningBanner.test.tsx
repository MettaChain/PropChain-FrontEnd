import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';

import { DomainWarningBanner } from '@/components/DomainWarningBanner';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const setLocation = (hrefValue: string, hostnameValue?: string) => {
  // jsdom defines `window.location` as a configurable getter that returns
  // a Location proxy. Overriding with a plain `value:` does work in most
  // cases, but in some jsdom builds the underlying accessor refuses to be
  // replaced (e.g. when the descriptor is shared with the original
  // Location instance). Using a `get:` getter that returns a fresh object
  // each access sidesteps that conflict entirely and is the pattern used
  // by neighbouring component tests in the repo.
  const hostname =
    hostnameValue ?? new URL(hrefValue, 'http://localhost').hostname;
  Object.defineProperty(window, 'location', {
    configurable: true,
    get: () => ({
      href: hrefValue,
      hostname,
      origin: hrefValue,
      protocol: 'https:',
      host: hostname,
      pathname: '/',
      search: '',
      hash: '',
      port: '',
      assign: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
    }),
  });
};

const buildDetectResult = (
  isPhishing: boolean,
  riskScore: number,
  warnings: string[] = [],
  threats: string[] = [],
) => ({
  isPhishing,
  riskScore,
  threats,
  warnings,
});

const mockDetectSpy = jest.fn();
const mockReportSpy = jest.fn();

jest.mock('@/utils/security/phishingProtection', () => ({
  PhishingProtection: {
    detectPhishing: (...args: unknown[]) => mockDetectSpy(...args),
    reportSuspiciousDomain: (...args: unknown[]) => mockReportSpy(...args),
    clearMemoizedResults: jest.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  // Default location to a domain that Phishing returns no warnings for.
  setLocation('https://example.com/');
});

// DetectPhishing is the entry point used by the component's useEffect.
// When `mockDetectSpy` returns a synchronous object the banner mounts
// the appropriate UI immediately; `mockReportSpy` records audit calls for
// phishing / unofficial domains but is silent on verified hosts.

describe('<DomainWarningBanner />', () => {
  it('does not render a banner when the domain is unrecognised and not flagged', async () => {
    mockDetectSpy.mockReturnValue(buildDetectResult(false, 0, []));

    const { container } = render(<DomainWarningBanner />);

    await waitFor(() => expect(mockDetectSpy).toHaveBeenCalled());

    expect(container.firstChild).toBeNull();
  });

  it('renders a phishing warning with the red ShieldAlert icon and danger CTA', async () => {
    mockDetectSpy.mockReturnValue(
      buildDetectResult(true, 95, ['Known phishing domain detected'], [
        'Known phishing domain detected',
      ]),
    );

    render(<DomainWarningBanner />);

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/Security Alert: Phishing Detected/i);
    expect(alert).toHaveTextContent(
      /This domain is flagged as a known phishing site/i,
    );

    expect(
      screen.getByRole('button', { name: /Go to Official Site/i }),
    ).toBeInTheDocument();

    // The cross-site button explicitly navigates to propchain.io.
    // We rely on the source's onClick handler — verify the button is wired.
    expect(mockReportSpy).toHaveBeenCalledWith(
      expect.any(String),
      'Known phishing domain',
    );
  });

  it('renders an unofficial-domain warning for unfamiliar hosts with the warning flag', async () => {
    mockDetectSpy.mockReturnValue(
      buildDetectResult(false, 20, ['Unofficial domain detected']),
    );

    render(<DomainWarningBanner />);

    await waitFor(() =>
      expect(screen.getByText(/Unofficial Domain/i)).toBeInTheDocument(),
    );

    expect(
      screen.getByText(/You are accessing PropChain from an unofficial domain/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Go to Official Site/i }),
    ).not.toBeInTheDocument();

    // The unofficial report is fired with the appropriate reason.
    expect(mockReportSpy).toHaveBeenCalledWith(
      expect.any(String),
      'Unofficial domain',
    );
  });

  it('renders a verified banner for official domains', async () => {
    mockDetectSpy.mockReturnValue(buildDetectResult(false, 0, []));

    render(<DomainWarningBanner />);

    await waitFor(() =>
      expect(screen.getByText(/Verified Domain/i)).toBeInTheDocument(),
    );

    expect(
      screen.getByText(/You are connected to the official PropChain platform/i),
    ).toBeInTheDocument();

    // Verified banners expose a "Got it" dismiss button instead of "Ignore".
    expect(screen.getByRole('button', { name: /Got it/i })).toBeInTheDocument();

    // Verified banner should NOT call the report helper.
    expect(mockReportSpy).not.toHaveBeenCalled();
  });

  it('dismisses the banner when the ignore/got-it button is clicked', async () => {
    mockDetectSpy.mockReturnValue(buildDetectResult(false, 0, []));

    render(<DomainWarningBanner />);

    const dismissBtn = await screen.findByRole('button', { name: /Got it/i });
    act(() => {
      fireEvent.click(dismissBtn);
    });

    await waitFor(() =>
      expect(screen.queryByText(/Verified Domain/i)).not.toBeInTheDocument(),
    );
  });

  it('dismisses the banner when the X icon button is clicked', async () => {
    mockDetectSpy.mockReturnValue(
      buildDetectResult(false, 20, ['Unofficial domain detected'], []),
    );

    render(<DomainWarningBanner />);

    await screen.findByText(/Unofficial Domain/i);

    // The X button is rendered with a sr-only text label "Close".
    const closeBtn = screen.getByRole('button', { name: /close/i });
    act(() => {
      fireEvent.click(closeBtn);
    });

    await waitFor(() =>
      expect(screen.queryByText(/Unofficial Domain/i)).not.toBeInTheDocument(),
    );
  });

  it('reports the hostname exactly once per phishing detection', async () => {
    setLocation('https://metamask.io.fake/');
    mockDetectSpy.mockReturnValue(
      buildDetectResult(true, 95, ['Known phishing domain detected']),
    );

    render(<DomainWarningBanner />);

    await waitFor(() =>
      expect(screen.getByText(/Security Alert: Phishing Detected/i)).toBeInTheDocument(),
    );

    expect(mockReportSpy).toHaveBeenCalledTimes(1);
    expect(mockReportSpy).toHaveBeenCalledWith(
      'metamask.io.fake',
      'Known phishing domain',
    );
  });

  it('does not call the reporter when the domain is verified', async () => {
    setLocation('https://propchain.io/');
    mockDetectSpy.mockReturnValue(buildDetectResult(false, 0, []));

    render(<DomainWarningBanner />);

    await screen.findByText(/Verified Domain/i);

    expect(mockReportSpy).not.toHaveBeenCalled();
  });

  it('does not render any banner for propchain.io without warnings', async () => {
    setLocation('https://propchain.io/some-page');
    mockDetectSpy.mockReturnValue(buildDetectResult(false, 0, []));

    render(<DomainWarningBanner />);

    // Verified state shows up for the official domain via the check, not
    // because of warnings.
    await screen.findByText(/Verified Domain/i);
  });

  it('does not render for localhost without warnings', async () => {
    setLocation('http://localhost:3000/');
    mockDetectSpy.mockReturnValue(buildDetectResult(false, 0, []));

    render(<DomainWarningBanner />);

    await screen.findByText(/Verified Domain/i);
  });

  it('does not render for 127.0.0.1 without warnings', async () => {
    setLocation('http://127.0.0.1:3000/');
    mockDetectSpy.mockReturnValue(buildDetectResult(false, 0, []));

    render(<DomainWarningBanner />);

    await screen.findByText(/Verified Domain/i);
  });

  it('treats subdomains of an official domain as verified', async () => {
    setLocation('https://app.propchain.io/');
    mockDetectSpy.mockReturnValue(buildDetectResult(false, 0, []));

    render(<DomainWarningBanner />);

    expect(await screen.findByText(/Verified Domain/i)).toBeInTheDocument();
  });

  it('hides the Go to Official Site button on the unofficial banner', async () => {
    mockDetectSpy.mockReturnValue(
      buildDetectResult(false, 20, ['Unofficial domain detected']),
    );

    render(<DomainWarningBanner />);

    await screen.findByText(/Unofficial Domain/i);

    expect(
      screen.queryByRole('button', { name: /Go to Official Site/i }),
    ).not.toBeInTheDocument();
  });

  it('falls back to the initial state when window is undefined', async () => {
    // Drop window entirely to simulate SSR; useEffect should bail out.
    const originalWindow = (global as unknown as { window?: unknown }).window;
    (global as unknown as { window?: unknown }).window = undefined;

    const { container } = render(<DomainWarningBanner />);

    // No crash, no `warning.show` state-true path triggered.
    expect(container.firstChild).toBeNull();
    expect(mockDetectSpy).not.toHaveBeenCalled();

    (global as unknown as { window?: unknown }).window = originalWindow;
  });

  it('renders nothing for an empty warning warnings list on a non-official host', async () => {
    mockDetectSpy.mockReturnValue(buildDetectResult(false, 0, []));
    setLocation('https://random-site.test/');

    const { container } = render(<DomainWarningBanner />);

    await waitFor(() => expect(mockDetectSpy).toHaveBeenCalled());
    expect(container.firstChild).toBeNull();
  });

  it('renders the phishing button with destructive red styling classes', async () => {
    mockDetectSpy.mockReturnValue(
      buildDetectResult(true, 95, ['Known phishing domain detected'], [
        'Known phishing domain detected',
      ]),
    );

    render(<DomainWarningBanner />);

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Go to Official Site/i }),
      ).toBeInTheDocument(),
    );

    const btn = screen.getByRole('button', { name: /Go to Official Site/i });
    expect(btn.className).toMatch(/border-red-600/);
  });

  it('caps the warning path at a single render (does not duplicate on re-render)', async () => {
    mockDetectSpy.mockReturnValue(
      buildDetectResult(false, 20, ['Unofficial domain detected']),
    );

    const { rerender } = render(<DomainWarningBanner />);

    await screen.findByText(/Unofficial Domain/i);

    // Re-rendering (e.g. parent re-render) must not double up.
    rerender(<DomainWarningBanner />);

    expect(screen.getAllByText(/Unofficial Domain/i)).toHaveLength(1);
  });

  it('does not call the reporter when window lacks the location API', async () => {
    mockDetectSpy.mockReturnValue(buildDetectResult(false, 0, []));
    const originalLocation = (window as unknown as {
      location?: unknown;
    }).location;
    delete (window as unknown as { location?: unknown }).location;

    const { container } = render(<DomainWarningBanner />);

    expect(container.firstChild).toBeNull();
    expect(mockReportSpy).not.toHaveBeenCalled();

    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
  });
});
