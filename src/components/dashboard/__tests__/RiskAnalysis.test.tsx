import React from 'react';
import { render, screen } from '@testing-library/react';
import { RiskAnalysis, getRiskLevel } from '../RiskAnalysis';

describe('getRiskLevel', () => {
  it('derives Low for scores below 30', () => {
    expect(getRiskLevel(0)).toEqual({ level: 'Low', color: 'text-success', bgColor: 'bg-success/10' });
    expect(getRiskLevel(29)).toEqual({ level: 'Low', color: 'text-success', bgColor: 'bg-success/10' });
  });

  it('derives Medium for scores from 30 to 59', () => {
    expect(getRiskLevel(30)).toEqual({ level: 'Medium', color: 'text-warning', bgColor: 'bg-warning/10' });
    expect(getRiskLevel(59)).toEqual({ level: 'Medium', color: 'text-warning', bgColor: 'bg-warning/10' });
  });

  it('derives High for scores 60 and above', () => {
    expect(getRiskLevel(60)).toEqual({ level: 'High', color: 'text-destructive', bgColor: 'bg-destructive/10' });
    expect(getRiskLevel(100)).toEqual({ level: 'High', color: 'text-destructive', bgColor: 'bg-destructive/10' });
  });
});

describe('RiskAnalysis', () => {
  it('renders the risk analysis card', () => {
    render(<RiskAnalysis />);

    expect(screen.getByText('Risk Analysis')).toBeInTheDocument();
    expect(screen.getByText('Portfolio risk metrics and concentration')).toBeInTheDocument();
  });

  it('renders the overall risk score with the derived level (32 -> Medium)', () => {
    render(<RiskAnalysis />);

    expect(screen.getByText('32/100')).toBeInTheDocument();
    expect(screen.getByText('Medium Risk')).toBeInTheDocument();
  });

  it('renders each risk metric with its derived percentage', () => {
    render(<RiskAnalysis />);

    expect(screen.getByText('Portfolio Volatility')).toBeInTheDocument();
    expect(screen.getByText('12.4%')).toBeInTheDocument();
    expect(screen.getByText('Concentration Risk')).toBeInTheDocument();
    expect(screen.getByText('34.2%')).toBeInTheDocument();
    expect(screen.getByText('Liquidity Risk')).toBeInTheDocument();
    expect(screen.getByText('18.5%')).toBeInTheDocument();
    expect(screen.getByText('Market Correlation')).toBeInTheDocument();
    expect(screen.getByText('45.8%')).toBeInTheDocument();
  });

  it('renders the concentration breakdown and alert', () => {
    render(<RiskAnalysis />);

    expect(screen.getByText('Top Holdings Concentration')).toBeInTheDocument();
    expect(screen.getByText('Manhattan Luxury')).toBeInTheDocument();
    expect(screen.getByText('28%')).toBeInTheDocument();
    expect(screen.getByText('Concentration Alert')).toBeInTheDocument();
    expect(screen.getByText(/Top 2 properties represent 50% of your portfolio/)).toBeInTheDocument();
  });
});
