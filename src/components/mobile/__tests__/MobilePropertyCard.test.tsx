import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobilePropertyCard } from '../MobilePropertyCard';
import type { MobileProperty } from '@/types/mobileProperty';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; sizes?: string }) => (
    <img {...props} src={props.src} alt={props.alt} />
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: string }) => (
    <span {...props}>{children}</span>
  ),
}));

jest.mock('../MobilePropertyViewer', () => ({
  MobilePropertyViewer: ({ property, isOpen, onClose }: { property: MobileProperty; isOpen: boolean; onClose: () => void }) =>
    isOpen ? <div data-testid="mobile-viewer">{property.name}</div> : null,
}));

jest.mock('lucide-react', () => {
  const React = require('react');
  return {
    MapPin: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-mappin" {...props} />,
    TrendingUp: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-trending-up" {...props} />,
    TrendingDown: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-trending-down" {...props} />,
    Heart: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-heart" {...props} />,
    Share2: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-share" {...props} />,
    Eye: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-eye" {...props} />,
    Bed: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-bed" {...props} />,
    Bath: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-bath" {...props} />,
    Square: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-square" {...props} />,
    Calendar: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-calendar" {...props} />,
  };
});

jest.mock('@/utils/logger', () => ({
  logger: { debug: jest.fn() },
}));

const mockProperty: MobileProperty = {
  id: 'prop-1',
  name: 'Luxury Penthouse',
  location: 'New York, NY',
  type: 'Residential',
  value: 500000,
  tokens: 1000,
  roi: 12.5,
  monthlyIncome: 2500,
  images: ['/img1.jpg', '/img2.jpg'],
  description: 'A luxury penthouse',
  bedrooms: 3,
  bathrooms: 2,
  sqft: 2000,
  yearBuilt: 2020,
  amenities: ['Pool', 'Gym', 'Rooftop'],
};

const mockPropertyNegativeROI: MobileProperty = {
  ...mockProperty,
  id: 'prop-2',
  roi: -5.2,
};

describe('MobilePropertyCard', () => {
  it('renders property name and location', () => {
    render(<MobilePropertyCard property={mockProperty} index={0} />);
    expect(screen.getByText('Luxury Penthouse')).toBeInTheDocument();
    expect(screen.getByText('New York, NY')).toBeInTheDocument();
  });

  it('renders property type badge', () => {
    render(<MobilePropertyCard property={mockProperty} index={0} />);
    expect(screen.getByText('Residential')).toBeInTheDocument();
  });

  it('renders financial information', () => {
    render(<MobilePropertyCard property={mockProperty} index={0} />);
    expect(screen.getByText('$500,000')).toBeInTheDocument();
    expect(screen.getByText('$2,500')).toBeInTheDocument();
  });

  it('renders tokens information', () => {
    render(<MobilePropertyCard property={mockProperty} index={0} />);
    expect(screen.getByText('1,000')).toBeInTheDocument();
  });

  it('renders positive ROI badge', () => {
    render(<MobilePropertyCard property={mockProperty} index={0} />);
    expect(screen.getByText('+12.5%')).toBeInTheDocument();
  });

  it('renders negative ROI badge', () => {
    render(<MobilePropertyCard property={mockPropertyNegativeROI} index={0} />);
    expect(screen.getByText('-5.2%')).toBeInTheDocument();
  });

  it('renders bedroom and bathroom info', () => {
    render(<MobilePropertyCard property={mockProperty} index={0} />);
    expect(screen.getByTestId('bedrooms')).toHaveTextContent('3');
    expect(screen.getByTestId('bathrooms')).toHaveTextContent('2');
  });

  it('renders year built', () => {
    render(<MobilePropertyCard property={mockProperty} index={0} />);
    expect(screen.getByText('Built in 2020')).toBeInTheDocument();
  });

  it('renders amenities', () => {
    render(<MobilePropertyCard property={mockProperty} index={0} />);
    expect(screen.getByText('Pool')).toBeInTheDocument();
    expect(screen.getByText('Gym')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('renders image counter when multiple images', () => {
    render(<MobilePropertyCard property={mockProperty} index={0} />);
    expect(screen.getByTestId('image-counter')).toHaveTextContent('2');
  });

  it('toggles save state on heart button click', () => {
    render(<MobilePropertyCard property={mockProperty} index={0} />);
    const saveButton = screen.getByLabelText(/Save Luxury Penthouse/);
    fireEvent.click(saveButton);
    expect(screen.getByLabelText(/Remove Luxury Penthouse from saved/)).toBeInTheDocument();
  });

  it('opens MobilePropertyViewer on card click', () => {
    render(<MobilePropertyCard property={mockProperty} index={0} />);
    fireEvent.click(screen.getByText('Luxury Penthouse'));
    expect(screen.getByTestId('mobile-viewer')).toBeInTheDocument();
  });

  it('calls onView callback when card is clicked', () => {
    const onView = jest.fn();
    render(<MobilePropertyCard property={mockProperty} index={0} onView={onView} />);
    fireEvent.click(screen.getByText('Luxury Penthouse'));
    expect(onView).toHaveBeenCalledWith(mockProperty);
  });
});
