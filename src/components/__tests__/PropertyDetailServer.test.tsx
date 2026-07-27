import { render, screen } from '@testing-library/react';
import { PropertyDetailServer } from '../PropertyDetailServer';
import { mockPropertyDetail } from '@/test/fixtures/propertyDetail';
import {
  formatPropertyLocation,
  formatTokenAvailability,
  getCalculatorDefaults,
  hasBedrooms,
  hasBathrooms,
} from '@/types/propertyDetail';

jest.mock('../property/ImageGallery', () => ({
  ImageGallery: ({ propertyName }: { propertyName: string }) => (
    <div data-testid="image-gallery">{propertyName}</div>
  ),
}));

jest.mock('../property/CurrencyToggle', () => ({
  CurrencyToggle: ({ ethAmount }: { ethAmount: number }) => (
    <span data-testid="currency-toggle">{ethAmount}</span>
  ),
}));

jest.mock('../MortgageCalculator', () => ({
  MortgageCalculator: ({
    propertyPrice,
    defaultYield,
  }: {
    propertyPrice?: number;
    defaultYield?: number;
  }) => (
    <div data-testid="mortgage-calculator">
      {propertyPrice}-{defaultYield}
    </div>
  ),
}));

describe('PropertyDetailServer', () => {
  it('renders property name and location', () => {
    render(<PropertyDetailServer property={mockPropertyDetail} />);

    expect(screen.getByRole('heading', { name: mockPropertyDetail.name })).toBeInTheDocument();
    expect(
      screen.getByText(formatPropertyLocation(mockPropertyDetail.location).fullAddress),
    ).toBeInTheDocument();
  });

  it('renders featured and verified badges when present', () => {
    render(<PropertyDetailServer property={mockPropertyDetail} />);

    expect(screen.getByText(/Featured/)).toBeInTheDocument();
    expect(screen.getByText(/Verified/)).toBeInTheDocument();
  });

  it('renders typed token availability', () => {
    render(<PropertyDetailServer property={mockPropertyDetail} />);

    expect(
      screen.getByText(formatTokenAvailability(mockPropertyDetail.tokenInfo).formattedAvailability),
    ).toBeInTheDocument();
  });

  it('passes typed calculator defaults to MortgageCalculator', () => {
    render(<PropertyDetailServer property={mockPropertyDetail} />);

    const defaults = getCalculatorDefaults(mockPropertyDetail);
    expect(screen.getByTestId('mortgage-calculator')).toHaveTextContent(
      `${defaults.propertyPrice}-${defaults.defaultYield}`,
    );
  });

  it('renders bedroom and bathroom counts using type guards', () => {
    expect(hasBedrooms(mockPropertyDetail.details)).toBe(true);
    expect(hasBathrooms(mockPropertyDetail.details)).toBe(true);

    render(<PropertyDetailServer property={mockPropertyDetail} />);

    // bedrooms and bathrooms are both 2 in the fixture, so multiple elements with "2" exist
    const countElements = screen.getAllByText(String(mockPropertyDetail.details.bedrooms));
    expect(countElements.length).toBeGreaterThanOrEqual(1);
    const bathroomElements = screen.getAllByText(String(mockPropertyDetail.details.bathrooms));
    expect(bathroomElements.length).toBeGreaterThanOrEqual(1);
  });

  it('omits bedroom section when bedrooms are not defined', () => {
    const propertyWithoutBedrooms = {
      ...mockPropertyDetail,
      details: {
        ...mockPropertyDetail.details,
        bedrooms: undefined,
      },
    };

    render(<PropertyDetailServer property={propertyWithoutBedrooms} />);

    expect(screen.queryByText('Bedrooms')).not.toBeInTheDocument();
  });
});

describe('propertyDetail type helpers', () => {
  it('formats location and token availability deterministically', () => {
    expect(formatPropertyLocation(mockPropertyDetail.location)).toEqual({
      fullAddress: '123 Main Street, New York, NY',
      cityState: 'New York, NY',
    });

    expect(formatTokenAvailability(mockPropertyDetail.tokenInfo)).toEqual({
      available: 500,
      totalSupply: 1000,
      formattedAvailability: '500 / 1,000',
    });
  });
});
