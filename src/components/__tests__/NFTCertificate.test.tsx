import React from 'react';
import { render, screen } from '@testing-library/react';
import { NFTCertificateCard } from '@/components/NFTCertificate';
import type { NFTCertificate } from '@/types/certificate';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

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
});
