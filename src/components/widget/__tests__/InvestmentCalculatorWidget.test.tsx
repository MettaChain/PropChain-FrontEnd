import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  InvestmentCalculatorSkeleton,
  InvestmentCalculatorWidget,
} from '../InvestmentCalculatorWidget';

describe('InvestmentCalculatorWidget', () => {
  it('renders the calculator', () => {
    render(<InvestmentCalculatorWidget />);

    expect(
      screen.getByRole('heading', { name: 'Investment Calculator' })
    ).toBeInTheDocument();
    expect(screen.getByText('Projected Returns')).toBeInTheDocument();
  });

  it('shows the projection of the default inputs', () => {
    render(<InvestmentCalculatorWidget />);

    // 1,000 invested at 8% for 5 years with 3% annual appreciation.
    expect(screen.getByText('+55.9%')).toBeInTheDocument();
    expect(screen.getByText('$112')).toBeInTheDocument();
    expect(screen.getByText('9.3%')).toBeInTheDocument();
    expect(screen.getByText('150 mo')).toBeInTheDocument();
    expect(screen.getByText('$1,559')).toBeInTheDocument();
  });

  it('recalculates the projection when the amount invested changes', () => {
    render(<InvestmentCalculatorWidget />);

    const amount = screen.getByRole('spinbutton');
    fireEvent.change(amount, { target: { value: '2000' } });

    expect(screen.getByText('$3,119')).toBeInTheDocument();
    expect(screen.queryByText('$1,559')).not.toBeInTheDocument();
  });

  it('recalculates the projection when the yield changes', () => {
    render(<InvestmentCalculatorWidget />);

    const [yieldInput] = screen.getAllByRole('slider');
    fireEvent.change(yieldInput, { target: { value: '12' } });

    // 1,000 invested at 12% for 5 years with 3% annual appreciation.
    expect(screen.getByText('+75.9%')).toBeInTheDocument();
  });

  it('never shows a broken figure when the amount invested is empty', () => {
    render(<InvestmentCalculatorWidget />);

    const amount = screen.getByRole('spinbutton');
    fireEvent.change(amount, { target: { value: '0' } });

    expect(screen.getByText('+0.0%')).toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Infinity/)).not.toBeInTheDocument();
  });

  it('opens the property page when the call to action is pressed', () => {
    const open = jest.spyOn(window, 'open').mockImplementation(() => null);

    render(<InvestmentCalculatorWidget propertyId="property-123" />);

    fireEvent.click(screen.getByRole('button', { name: 'Invest on PropChain' }));

    expect(open).toHaveBeenCalledWith(
      'https://propchain.io/properties/property-123',
      '_blank',
      'noopener,noreferrer'
    );

    open.mockRestore();
  });

  it('renders the compact variant', () => {
    render(<InvestmentCalculatorWidget compact />);

    expect(
      screen.getByRole('heading', { name: 'Investment Calculator' })
    ).toBeInTheDocument();
    expect(screen.getByText(/Projected Value \(5 yrs\)/)).toBeInTheDocument();
    expect(screen.queryByText('Projected Returns')).not.toBeInTheDocument();
  });
});

describe('InvestmentCalculatorWidget layout', () => {
  it('lets the metric cards shrink instead of pushing the numbers out of the widget', () => {
    render(<InvestmentCalculatorWidget />);

    const metric = screen.getByText('+55.9%').parentElement;
    const grid = metric?.parentElement;

    expect(grid?.style.gridTemplateColumns).toBe('repeat(2, minmax(0, 1fr))');
  });

  it('fills the width of the frame it is embedded in', () => {
    render(<InvestmentCalculatorWidget />);

    const root = screen
      .getByRole('heading', { name: 'Investment Calculator' })
      .parentElement?.parentElement;

    expect(root?.style.width).toBe('100%');
    expect(root?.style.boxSizing).toBe('border-box');
    expect(root?.style.maxWidth).toBe('600px');
  });

  it('wraps the label and the value of a field instead of squeezing them', () => {
    render(<InvestmentCalculatorWidget />);

    const label = screen.getByText('Investment Amount').parentElement;

    expect(label?.style.flexWrap).toBe('wrap');
  });

  it('lets a long total wrap instead of overflowing the frame', () => {
    render(<InvestmentCalculatorWidget defaultInvestment={50000} />);

    const total = screen.getByText('Total Projected Value').parentElement;

    expect(total?.style.flexWrap).toBe('wrap');
    expect(total?.style.gap).not.toBe('');
  });
});

describe('InvestmentCalculatorSkeleton', () => {
  it('announces that the calculator is loading', () => {
    render(<InvestmentCalculatorSkeleton />);

    const skeleton = screen.getByRole('status');

    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute(
      'aria-label',
      'Loading the investment calculator'
    );
  });

  it('takes the same space as the calculator it stands in for', () => {
    render(<InvestmentCalculatorSkeleton />);

    const skeleton = screen.getByRole('status');

    expect(skeleton.style.width).toBe('100%');
    expect(skeleton.style.maxWidth).toBe('600px');
    expect(skeleton.style.boxSizing).toBe('border-box');
  });

  it('does not render the calculator itself', () => {
    render(<InvestmentCalculatorSkeleton />);

    expect(
      screen.queryByRole('heading', { name: 'Investment Calculator' })
    ).not.toBeInTheDocument();
  });

  it('can be rendered in the compact variant', () => {
    render(<InvestmentCalculatorSkeleton compact />);

    expect(screen.getByRole('status').style.maxWidth).toBe('400px');
  });
});
