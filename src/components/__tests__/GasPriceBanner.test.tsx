import React from 'react';
import { readFileSync } from 'fs';
import { join } from 'path';
import { render, screen } from '@testing-library/react';
import { GasPriceBanner } from '@/components/GasPriceBanner';
import { useGasPriceStore } from '@/store/gasPriceStore';

describe('GasPriceBanner', () => {
  beforeEach(() => {
    useGasPriceStore.setState({ gasPrice: null, gasPriceThreshold: 20 });
  });

  it("declares 'use client' so it never executes store reads during SSR", () => {
    const source = readFileSync(
      join(__dirname, '..', 'GasPriceBanner.tsx'),
      'utf8'
    );
    expect(source.split('\n')[0].trim()).toBe("'use client';");
  });

  it('renders nothing until gas data exists', () => {
    const { container } = render(<GasPriceBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the warning when price exceeds the threshold', () => {
    useGasPriceStore.setState({ gasPrice: 35, gasPriceThreshold: 20 });
    render(<GasPriceBanner />);
    expect(screen.getByText(/High gas price warning/)).toBeInTheDocument();
  });

  it('stays hidden when price is at or below the threshold', () => {
    useGasPriceStore.setState({ gasPrice: 10, gasPriceThreshold: 20 });
    const { container } = render(<GasPriceBanner />);
    expect(container).toBeEmptyDOMElement();
  });
});
