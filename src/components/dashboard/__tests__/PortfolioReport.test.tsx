import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PortfolioReport } from '../PortfolioReport';

const mockSave = jest.fn();

jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    setFillColor: jest.fn(),
    rect: jest.fn(),
    setTextColor: jest.fn(),
    setFontSize: jest.fn(),
    text: jest.fn(),
    addPage: jest.fn(),
    setPage: jest.fn(),
    save: mockSave,
    internal: { getNumberOfPages: jest.fn(() => 1) },
    lastAutoTable: { finalY: 105 },
  }));
});

jest.mock('jspdf-autotable', () => jest.fn());

describe('PortfolioReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the report card with controls', () => {
    render(<PortfolioReport />);

    expect(screen.getByText('Export Reports')).toBeInTheDocument();
    expect(screen.getByText('Report Type')).toBeInTheDocument();
    expect(screen.getByText('Year')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate pdf/i })).toBeInTheDocument();
  });

  it('renders all report type cards', () => {
    render(<PortfolioReport />);

    expect(screen.getByText('Full Report')).toBeInTheDocument();
    expect(screen.getByText('Tax Summary')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText('Transactions')).toBeInTheDocument();
  });

  it('selects a report type when its card is clicked', () => {
    render(<PortfolioReport />);

    expect(screen.getByText('Full Portfolio Report')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Tax Summary'));

    expect(screen.getByText('Tax Summary Only')).toBeInTheDocument();
  });

  it('generates a PDF and shows the downloaded state', async () => {
    jest.useFakeTimers();
    render(<PortfolioReport />);

    fireEvent.click(screen.getByRole('button', { name: /generate pdf/i }));

    expect(screen.getByText('Generating...')).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    expect(mockSave).toHaveBeenCalledWith('mettachain-portfolio-report-2024.pdf');
    expect(screen.getByText('Downloaded!')).toBeInTheDocument();

    jest.useRealTimers();
  });
});
