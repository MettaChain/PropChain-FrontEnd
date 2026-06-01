import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ROICalculator from '@/components/ROICalculator';

describe('ROICalculator', () => {
  it('renders the heading', () => {
    render(<ROICalculator />);
    expect(screen.getByText('ROI Calculator')).toBeInTheDocument();
  });

  it('renders the Investment input with default value of 10000', () => {
    render(<ROICalculator />);
    const input = screen.getByLabelText(/investment \(usd\)/i) as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('10000');
  });

  it('renders the Holding Period input with default value of 12', () => {
    render(<ROICalculator />);
    const input = screen.getByLabelText(/holding period \(months\)/i) as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('12');
  });

  it('displays Total Return, Annual Yield, and Break-even labels', () => {
    render(<ROICalculator />);
    expect(screen.getByText('Total Return')).toBeInTheDocument();
    expect(screen.getByText('Annual Yield')).toBeInTheDocument();
    expect(screen.getByText('Break-even')).toBeInTheDocument();
  });

  it('shows the S&P 500 comparison line', () => {
    render(<ROICalculator />);
    expect(screen.getByText(/s&p 500 equivalent return/i)).toBeInTheDocument();
  });

  it('recalculates when the investment amount changes', () => {
    render(<ROICalculator />);
    const amountInput = screen.getByLabelText(/investment \(usd\)/i);

    // Default: $10,000 at 8% for 12 months ≈ $830.00
    const initialReturn = screen.getByText(/\$\d+\.\d{2}/, { selector: '.text-green-700' });
    const initialValue = initialReturn.textContent;

    fireEvent.change(amountInput, { target: { value: '20000' } });

    const updatedReturn = screen.getByText(/\$\d+\.\d{2}/, { selector: '.text-green-700' });
    expect(updatedReturn.textContent).not.toBe(initialValue);
  });

  it('recalculates when the holding period changes', () => {
    render(<ROICalculator />);
    const monthsInput = screen.getByLabelText(/holding period \(months\)/i);

    const initialReturn = screen.getByText(/\$\d+\.\d{2}/, { selector: '.text-green-700' });
    const initialValue = initialReturn.textContent;

    fireEvent.change(monthsInput, { target: { value: '24' } });

    const updatedReturn = screen.getByText(/\$\d+\.\d{2}/, { selector: '.text-green-700' });
    expect(updatedReturn.textContent).not.toBe(initialValue);
  });

  it('displays annual yield as 8.0% by default', () => {
    render(<ROICalculator />);
    expect(screen.getByText('8.0%')).toBeInTheDocument();
  });

  it('does not call console.log at any point during render or interaction', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    render(<ROICalculator />);

    const amountInput = screen.getByLabelText(/investment \(usd\)/i);
    fireEvent.change(amountInput, { target: { value: '5000' } });

    const monthsInput = screen.getByLabelText(/holding period \(months\)/i);
    fireEvent.change(monthsInput, { target: { value: '6' } });

    expect(consoleSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
    warnSpy.mockRestore();
  });
});
