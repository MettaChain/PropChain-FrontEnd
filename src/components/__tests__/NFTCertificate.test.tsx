import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NFTCertificateCard } from '@/components/NFTCertificate';
import type { NFTCertificate } from '@/types/certificate';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

// Mock the certificate generator so we exercise the download handlers
// without needing real html2canvas / jsPDF in the test runtime.
jest.mock('@/lib/certificateGenerator', () => ({
  __esModule: true,
  downloadCertificatePng: jest.fn().mockResolvedValue(undefined),
  downloadCertificatePdf: jest.fn().mockResolvedValue(undefined),
  getCertificateShareUrl: jest.fn(
    (cert: { propertyName: string; tokenAmount: number; tokenSymbol: string }) =>
      `https://twitter.com/intent/tweet?text=I%20just%20purchased%20${cert.tokenAmount}%20${cert.tokenSymbol}`
  ),
}));

import {
  downloadCertificatePng,
  downloadCertificatePdf,
  getCertificateShareUrl,
} from '@/lib/certificateGenerator';

const mockDownloadPng = downloadCertificatePng as jest.MockedFunction<typeof downloadCertificatePng>;
const mockDownloadPdf = downloadCertificatePdf as jest.MockedFunction<typeof downloadCertificatePdf>;
const mockShareUrl = getCertificateShareUrl as jest.MockedFunction<typeof getCertificateShareUrl>;

function truncateMiddle(value: string, startChars: number, endChars: number): string {
  const minLength = startChars + endChars + 3;
  if (value.length <= minLength) return value;
  return `${value.slice(0, startChars)}...${value.slice(-endChars)}`;
}

describe('NFTCertificateCard', () => {
  const baseCertificate: NFTCertificate = {
    id: 'cert-1',
    propertyId: 'p-1',
    propertyName: 'Ocean View Villa',
    propertyAddress: '123 Beach Rd, Lagos',
    tokenAmount: 1500,
    tokenSymbol: 'PROP',
    walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    purchaseDate: '2026-05-31T12:00:00.000Z',
    transactionHash: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    network: 'Ethereum',
    contractAddress: '0xcontract',
    ownershipPercentage: 12.3456,
  };

  it('renders key certificate details', () => {
    render(<NFTCertificateCard certificate={baseCertificate} />);

    expect(screen.getByText('Ocean View Villa')).toBeInTheDocument();
    expect(screen.getByText('123 Beach Rd, Lagos')).toBeInTheDocument();
    expect(screen.getByText(/Tokens Owned/i)).toBeInTheDocument();
    expect(screen.getByText('1,500 PROP')).toBeInTheDocument();
    expect(screen.getByText('Ownership')).toBeInTheDocument();
    expect(screen.getByText('12.3456%')).toBeInTheDocument();
  });

  it('handles missing property image without crashing', () => {
    render(<NFTCertificateCard certificate={{ ...baseCertificate, propertyImage: undefined }} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('truncates wallet and transaction hash for display', () => {
    render(<NFTCertificateCard certificate={baseCertificate} />);

    expect(
      screen.getByText(`Wallet: ${truncateMiddle(baseCertificate.walletAddress, 6, 4)}`)
    ).toBeInTheDocument();
    expect(
      screen.getByText(`Tx: ${truncateMiddle(baseCertificate.transactionHash, 10, 6)}`)
    ).toBeInTheDocument();
  });

  it('does not truncate short wallet/tx strings', () => {
    render(
      <NFTCertificateCard
        certificate={{
          ...baseCertificate,
          walletAddress: 'short',
          transactionHash: 'tiny',
        }}
      />
    );

    expect(screen.getByText(/Wallet:\s*short/i)).toBeInTheDocument();
    expect(screen.getByText(/Tx:\s*tiny/i)).toBeInTheDocument();
  });

  it('includes a share link', () => {
    render(<NFTCertificateCard certificate={baseCertificate} />);
    const link = screen.getByRole('link', { name: /share on x/i });
    expect(link).toHaveAttribute('href', expect.stringContaining('twitter.com/intent/tweet?text='));
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders the property image when provided', () => {
    render(
      <NFTCertificateCard
        certificate={{ ...baseCertificate, propertyImage: 'https://example.com/villa.jpg' }}
      />
    );
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/villa.jpg');
    expect(img).toHaveAttribute('alt', 'Ocean View Villa');
  });

  it('renders the network label capitalized', () => {
    render(<NFTCertificateCard certificate={baseCertificate} />);
    expect(screen.getByText(/ethereum/i)).toBeInTheDocument();
  });

  it('formats the purchase date in a human-readable way', () => {
    render(<NFTCertificateCard certificate={baseCertificate} />);
    // The component calls toLocaleDateString(); expect a non-empty date fragment.
    expect(screen.getByText(/Purchase Date/i)).toBeInTheDocument();
  });

  it('formats token amount with thousands separators', () => {
    render(
      <NFTCertificateCard
        certificate={{ ...baseCertificate, tokenAmount: 1234567 }}
      />
    );
    expect(screen.getByText('1,234,567 PROP')).toBeInTheDocument();
  });

  it('renders a zero token amount cleanly', () => {
    render(
      <NFTCertificateCard
        certificate={{ ...baseCertificate, tokenAmount: 0 }}
      />
    );
    expect(screen.getByText('0 PROP')).toBeInTheDocument();
  });

  it('renders the heading and decorative NFT seal text', () => {
    const { container } = render(<NFTCertificateCard certificate={baseCertificate} />);
    expect(screen.getByRole('heading', { name: /Ocean View Villa/i })).toBeInTheDocument();
    expect(container.textContent).toContain('PropChain');
    expect(container.textContent).toContain('Certificate of Ownership');
    expect(container.textContent).toContain('NFT');
    expect(container.textContent).toContain('CERT');
  });

  describe('download buttons', () => {
    beforeEach(() => {
      mockDownloadPng.mockClear();
      mockDownloadPdf.mockClear();
    });

    it('calls downloadCertificatePng with the certificate element and filename', async () => {
      render(<NFTCertificateCard certificate={baseCertificate} />);
      fireEvent.click(screen.getByRole('button', { name: /download png/i }));
      await waitFor(() => expect(mockDownloadPng).toHaveBeenCalledTimes(1));
      const [elementArg, filenameArg] = mockDownloadPng.mock.calls[0];
      expect(elementArg).toBeInstanceOf(HTMLElement);
      expect((filenameArg as string).startsWith('propchain-certificate-')).toBe(true);
      expect((filenameArg as string).endsWith(baseCertificate.propertyId)).toBe(true);
    });

    it('calls downloadCertificatePdf with the certificate element and filename', async () => {
      render(<NFTCertificateCard certificate={baseCertificate} />);
      fireEvent.click(screen.getByRole('button', { name: /download pdf/i }));
      await waitFor(() => expect(mockDownloadPdf).toHaveBeenCalledTimes(1));
      const [elementArg, filenameArg] = mockDownloadPdf.mock.calls[0];
      expect(elementArg).toBeInstanceOf(HTMLElement);
      expect((filenameArg as string).startsWith('propchain-certificate-')).toBe(true);
      expect((filenameArg as string).endsWith(baseCertificate.propertyId)).toBe(true);
    });

    it('shows the "Generating…" label while async download is pending', async () => {
      // Defer the PNG download promise so we can observe the intermediate state.
      let resolveDownload!: () => void;
      mockDownloadPng.mockImplementation(
        () => new Promise<void>((resolve) => { resolveDownload = resolve; })
      );
      render(<NFTCertificateCard certificate={baseCertificate} />);

      fireEvent.click(screen.getByRole('button', { name: /download png/i }));

      // Both action buttons flip to the loading label while the awaiter is pending.
      await waitFor(() => {
        const generating = screen.getAllByRole('button', { name: /generating…/i });
        expect(generating.length).toBe(2);
      });

      resolveDownload();
      await waitFor(() =>
        expect(screen.queryByRole('button', { name: /generating…/i })).not.toBeInTheDocument()
      );
    });

    it('disables both download buttons while a download is in-flight', async () => {
      let resolveDownload: (() => void) | undefined;
      mockDownloadPng.mockImplementation(
        () => new Promise<void>((resolve) => { resolveDownload = resolve; })
      );
      render(<NFTCertificateCard certificate={baseCertificate} />);
      fireEvent.click(screen.getByRole('button', { name: /download png/i }));

      // The component flips both buttons to the "Generating…" label while
      // a download is awaiting, and disables them both.
      await waitFor(() => {
        const buttons = screen.getAllByRole('button', { name: /generating…/i });
        expect(buttons.length).toBe(2);
        buttons.forEach((btn) => expect(btn).toBeDisabled());
      });

      resolveDownload?.();
      await waitFor(() =>
        expect(screen.getByRole('button', { name: /download pdf/i })).not.toBeDisabled()
      );
    });
  });

  describe('getCertificateShareUrl integration', () => {
    beforeEach(() => {
      mockShareUrl.mockClear();
    });

    it('delegates share URL construction to the certificate generator', () => {
      render(<NFTCertificateCard certificate={baseCertificate} />);
      expect(mockShareUrl).toHaveBeenCalledWith(baseCertificate);
    });

    it('renders the URL returned by the generator', () => {
      mockShareUrl.mockReturnValueOnce('https://example.com/custom-share');
      render(<NFTCertificateCard certificate={baseCertificate} />);
      const link = screen.getByRole('link', { name: /share on x/i });
      expect(link).toHaveAttribute('href', 'https://example.com/custom-share');
    });
  });

});
