import React from 'react';
import { render, screen } from '@testing-library/react';
import { DiversificationChart, computeAllocationPercents } from '../DiversificationChart';

describe('computeAllocationPercents', () => {
  it('normalizes values to percentages that sum to 100', () => {
    expect(computeAllocationPercents([45, 30, 15, 10])).toEqual([45, 30, 15, 10]);
    expect(computeAllocationPercents([50, 25, 15, 10])).toEqual([50, 25, 15, 10]);
  });

  it('handles equal weights', () => {
    expect(computeAllocationPercents([1, 1, 1, 1])).toEqual([25, 25, 25, 25]);
  });

  it('returns all zeros for a zero-total input', () => {
    expect(computeAllocationPercents([0, 0, 0])).toEqual([0, 0, 0]);
  });

  it('returns an empty array for an empty input', () => {
    expect(computeAllocationPercents([])).toEqual([]);
  });
});

describe('DiversificationChart', () => {
  it('renders the diversification card with both allocation breakdowns', () => {
    render(<DiversificationChart />);

    expect(screen.getByText('Portfolio Diversification')).toBeInTheDocument();
    expect(screen.getByText('Asset allocation breakdown')).toBeInTheDocument();
    expect(screen.getByText('By Property Type')).toBeInTheDocument();
    expect(screen.getByText('By Geography')).toBeInTheDocument();
  });

  it('renders the property type allocation legend (fixture sums to 100)', () => {
    render(<DiversificationChart />);

    expect(screen.getByText('Residential')).toBeInTheDocument();
    expect(screen.getByText('Commercial')).toBeInTheDocument();
    expect(screen.getByText('Industrial')).toBeInTheDocument();
    expect(screen.getByText('Mixed-Use')).toBeInTheDocument();
  });

  it('renders the geographic allocation legend (fixture sums to 100)', () => {
    render(<DiversificationChart />);

    expect(screen.getByText('North America')).toBeInTheDocument();
    expect(screen.getByText('Europe')).toBeInTheDocument();
    expect(screen.getByText('Asia Pacific')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('derives allocation percentages that sum to 100 for both fixtures', () => {
    const propertyTypeValues = [45, 30, 15, 10];
    const geographicValues = [50, 25, 15, 10];

    expect(computeAllocationPercents(propertyTypeValues).reduce((a, b) => a + b, 0)).toBe(100);
    expect(computeAllocationPercents(geographicValues).reduce((a, b) => a + b, 0)).toBe(100);
  });
});
