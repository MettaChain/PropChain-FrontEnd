import React from 'react';
import { render, screen } from '@testing-library/react';
import { KycStatusBadge } from '../KycStatusBadge';

describe('KycStatusBadge', () => {
  it('renders the KYC required label for unverified status', () => {
    render(<KycStatusBadge status="unverified" thresholdEth={10} />);

    expect(screen.getByText('KYC required')).toBeInTheDocument();
  });

  it('renders the KYC pending label for pending status', () => {
    render(<KycStatusBadge status="pending" thresholdEth={10} />);

    expect(screen.getByText('KYC pending')).toBeInTheDocument();
  });

  it('renders the KYC verified label for verified status', () => {
    render(<KycStatusBadge status="verified" thresholdEth={10} />);

    expect(screen.getByText('KYC verified')).toBeInTheDocument();
  });

  it('renders the review needed label for rejected status', () => {
    render(<KycStatusBadge status="rejected" thresholdEth={10} />);

    expect(screen.getByText('KYC review needed')).toBeInTheDocument();
  });

  it('annotates the threshold in the title attribute', () => {
    render(<KycStatusBadge status="unverified" thresholdEth={25} />);

    expect(
      screen.getByTitle('High-value transactions above 25 ETH require KYC review')
    ).toBeInTheDocument();
  });

  it('uses a different title when already verified', () => {
    render(<KycStatusBadge status="verified" thresholdEth={25} />);

    expect(
      screen.getByTitle('High-value transactions above 25 ETH are allowed')
    ).toBeInTheDocument();
  });

  it('renders the compact variant without the full label', () => {
    const { rerender } = render(
      <KycStatusBadge status="verified" thresholdEth={10} compact />
    );

    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.queryByText('KYC verified')).not.toBeInTheDocument();

    rerender(
      <KycStatusBadge status="unverified" thresholdEth={10} compact />
    );

    expect(screen.getByText('KYC')).toBeInTheDocument();
    expect(screen.queryByText('KYC required')).not.toBeInTheDocument();
  });
});
