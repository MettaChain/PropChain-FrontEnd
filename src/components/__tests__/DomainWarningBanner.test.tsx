import { render, screen, fireEvent } from '@testing-library/react';
import { DomainWarningBanner } from '../DomainWarningBanner';

const mockDetectPhishing = jest.fn();
const mockReportSuspiciousDomain = jest.fn().mockResolvedValue(true);
const originalLocation = window.location;

jest.mock('@/utils/security/phishingProtection', () => ({
  PhishingProtection: {
    detectPhishing: (...args: unknown[]) => mockDetectPhishing(...args),
    reportSuspiciousDomain: (...args: unknown[]) => mockReportSuspiciousDomain(...args),
  },
}));

beforeAll(() => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...originalLocation },
    writable: true,
  });
});

afterAll(() => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: originalLocation,
    writable: true,
  });
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('DomainWarningBanner', () => {
  it('shows verified badge on official domain', () => {
    window.location.hostname = 'propchain.io';
    mockDetectPhishing.mockReturnValue({
      isPhishing: false,
      riskScore: 0,
      threats: [],
      warnings: [],
    });

    render(<DomainWarningBanner />);

    expect(screen.getByText('Verified Domain')).toBeInTheDocument();
    expect(screen.getByText(/connected to the official/)).toBeInTheDocument();
  });

  it('shows verified badge on subdomain of official domain', () => {
    window.location.hostname = 'app.propchain.io';
    mockDetectPhishing.mockReturnValue({
      isPhishing: false,
      riskScore: 0,
      threats: [],
      warnings: [],
    });

    render(<DomainWarningBanner />);

    expect(screen.getByText('Verified Domain')).toBeInTheDocument();
  });

  it('shows warning on unofficial domain', () => {
    window.location.hostname = 'suspicious-site.com';
    mockDetectPhishing.mockReturnValue({
      isPhishing: false,
      riskScore: 20,
      threats: [],
      warnings: ['Unofficial domain detected'],
    });

    render(<DomainWarningBanner />);

    expect(screen.getByText('Security Warning: Unofficial Domain')).toBeInTheDocument();
    expect(screen.getByText(/unofficial domain/)).toBeInTheDocument();
    expect(mockReportSuspiciousDomain).toHaveBeenCalledWith('suspicious-site.com', 'Unofficial domain');
  });

  it('shows phishing alert for phishing domains', () => {
    window.location.hostname = 'phishing-site.com';
    mockDetectPhishing.mockReturnValue({
      isPhishing: true,
      riskScore: 90,
      threats: ['Known phishing domain detected'],
      warnings: [],
    });

    render(<DomainWarningBanner />);

    expect(screen.getByText('Security Alert: Phishing Detected')).toBeInTheDocument();
    expect(screen.getByText(/phishing site/)).toBeInTheDocument();
    expect(mockReportSuspiciousDomain).toHaveBeenCalledWith('phishing-site.com', 'Known phishing domain');
  });

  it('renders nothing when no warning is triggered', () => {
    window.location.hostname = 'propchain.io';
    mockDetectPhishing.mockReturnValue({
      isPhishing: false,
      riskScore: 0,
      threats: [],
      warnings: [],
    });

    const { container } = render(<DomainWarningBanner />);
    expect(screen.getByText('Verified Domain')).toBeInTheDocument();
    expect(container.textContent).toContain('propchain.io');
  });

  it('can be dismissed via close button', () => {
    window.location.hostname = 'propchain.io';
    mockDetectPhishing.mockReturnValue({
      isPhishing: false,
      riskScore: 0,
      threats: [],
      warnings: [],
    });

    render(<DomainWarningBanner />);
    expect(screen.getByText('Verified Domain')).toBeInTheDocument();

    const buttons = screen.getAllByRole('button');
    const closeBtn = buttons.find(b => b.querySelector('svg.lucide-x'));
    expect(closeBtn).toBeTruthy();
    fireEvent.click(closeBtn!);

    expect(screen.queryByText('Verified Domain')).not.toBeInTheDocument();
  });

  it('can be dismissed via dismiss button', () => {
    window.location.hostname = 'app.propchain.io';
    mockDetectPhishing.mockReturnValue({
      isPhishing: false,
      riskScore: 0,
      threats: [],
      warnings: [],
    });

    render(<DomainWarningBanner />);
    expect(screen.getByText('Verified Domain')).toBeInTheDocument();

    const dismissButton = screen.getByText('Got it');
    fireEvent.click(dismissButton);

    expect(screen.queryByText('Verified Domain')).not.toBeInTheDocument();
  });

  it('shows Go to Official Site button only for phishing', () => {
    window.location.hostname = 'phishing-site.com';
    mockDetectPhishing.mockReturnValue({
      isPhishing: true,
      riskScore: 90,
      threats: ['Known phishing domain detected'],
      warnings: [],
    });

    render(<DomainWarningBanner />);
    expect(screen.getByText('Go to Official Site')).toBeInTheDocument();
  });

  it('does not show Go to Official Site for verified domains', () => {
    window.location.hostname = 'propchain.io';
    mockDetectPhishing.mockReturnValue({
      isPhishing: false,
      riskScore: 0,
      threats: [],
      warnings: [],
    });

    render(<DomainWarningBanner />);
    expect(screen.queryByText('Go to Official Site')).not.toBeInTheDocument();
  });
});
