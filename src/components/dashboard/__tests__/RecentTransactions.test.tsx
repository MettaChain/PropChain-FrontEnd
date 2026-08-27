import React from 'react';
import { render, screen } from '@testing-library/react';
import { RecentTransactions } from '../RecentTransactions';

describe('RecentTransactions', () => {
  it('should render the dashboard transaction list heading and subtitle', () => {
    render(<RecentTransactions />);

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(
      screen.getByText('Latest transactions and income')
    ).toBeInTheDocument();
  });

  it('should render all populated transaction rows', () => {
    render(<RecentTransactions />);

    expect(
      screen.getByText('Manhattan Tower Suite')
    ).toBeInTheDocument();
    expect(screen.getByText('Tech Hub Office Complex')).toBeInTheDocument();
    expect(screen.getByText('Downtown Luxury Lofts')).toBeInTheDocument();
    expect(screen.getByText('Sunset Beach Villa')).toBeInTheDocument();
    expect(screen.getByText('Mixed-Use Development')).toBeInTheDocument();
  });

  it('should show the correct transaction type labels', () => {
    render(<RecentTransactions />);

    // Two income rows, two purchase rows and one sale row in the static list
    expect(screen.getAllByText('Rental Income')).toHaveLength(2);
    expect(screen.getAllByText('Purchase')).toHaveLength(2);
    expect(screen.getByText('Sale')).toBeInTheDocument();
  });

  it('should format amounts with a directional sign and thousands separators', () => {
    render(<RecentTransactions />);

    // Income and purchases are prefixed with "+", sales with "-"
    expect(screen.getByText('+$3,280')).toBeInTheDocument();
    expect(screen.getByText('+$45,000')).toBeInTheDocument();
    expect(screen.getByText('-$12,500')).toBeInTheDocument();
  });

  it('should render token counts for transactions that include them', () => {
    render(<RecentTransactions />);

    expect(screen.getByText('90 tokens')).toBeInTheDocument();
    expect(screen.getByText('25 tokens')).toBeInTheDocument();
    expect(screen.getByText('55 tokens')).toBeInTheDocument();
  });

  it('should render the completed/pending status for each transaction', () => {
    render(<RecentTransactions />);

    // Four completed rows and one pending row in the static list
    expect(screen.getAllByText('✓ Completed')).toHaveLength(4);
    expect(screen.getByText('⏳ Pending')).toBeInTheDocument();
  });

  it('should render a formatted date for each transaction row', () => {
    render(<RecentTransactions />);

    // Dates are rendered via toLocaleDateString (e.g. "Jan 20")
    expect(screen.getAllByText(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/).length).toBeGreaterThan(0);
  });
});