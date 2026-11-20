import * as React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('qrcode', () => ({
  __esModule: true,
  default: {
    toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,referral'),
  },
}));

import ReferralLinkGenerator from '../components/ReferralLinkGenerator';

describe('ReferralLinkGenerator', () => {
  beforeEach(() => {
    window.localStorage.clear();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
  });

  it('generates a custom referral link and tracks copied links', async () => {
    render(
      <ReferralLinkGenerator
        baseUrl="https://propchain.io/properties"
        initialShares={3}
        initialClicks={12}
      />,
    );

    fireEvent.change(screen.getByLabelText(/custom tracking code/i), {
      target: { value: 'summer 2026' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));

    expect(await screen.findByText(/summer-2026/)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Copy referral link' }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'https://propchain.io/properties?ref=summer-2026',
      );
    });
    expect(screen.getByRole('button', { name: 'Referral link copied' })).toHaveTextContent('Copied!');
    expect(screen.getByLabelText('Referral copy history')).toHaveTextContent('summer-2026');
  });

  it('renders social sharing controls and a QR code', async () => {
    render(<ReferralLinkGenerator baseUrl="https://propchain.io/properties" />);

    expect(screen.getByRole('button', { name: 'Twitter' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Telegram' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Email' })).toBeInTheDocument();
    expect(await screen.findByAltText('Referral link QR code')).toBeInTheDocument();
  });
});
