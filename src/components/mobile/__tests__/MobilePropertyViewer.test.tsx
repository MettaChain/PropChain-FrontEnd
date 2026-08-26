import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobilePropertyViewer } from '../MobilePropertyViewer';
import type { MobileProperty } from '@/types/mobileProperty';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; sizes?: string }) => (
    <img {...props} src={props.src} alt={props.alt} />
  ),
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: string }) => (
    <span {...props}>{children}</span>
  ),
}));

jest.mock('lucide-react', () => {
  const React = require('react');
  return {
    X: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-x" {...props} />,
    Heart: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-heart" {...props} />,
    Share2: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-share" {...props} />,
    Phone: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-phone" {...props} />,
    MapPin: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-mappin" {...props} />,
    Camera: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-camera" {...props} />,
    ChevronLeft: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-chevron-left" {...props} />,
    ChevronRight: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-chevron-right" {...props} />,
    ZoomIn: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-zoom-in" {...props} />,
    ZoomOut: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-zoom-out" {...props} />,
    Info: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-info" {...props} />,
  };
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

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
  images: ['/img1.jpg', '/img2.jpg', '/img3.jpg'],
  description: 'A luxury penthouse',
  bedrooms: 3,
  bathrooms: 2,
  sqft: 2000,
  yearBuilt: 2020,
};

describe('MobilePropertyViewer', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    render(<MobilePropertyViewer property={mockProperty} isOpen={false} onClose={onClose} />);
    expect(screen.queryByText('Luxury Penthouse')).not.toBeInTheDocument();
  });

  it('renders property name when isOpen is true', () => {
    render(<MobilePropertyViewer property={mockProperty} isOpen={true} onClose={onClose} />);
    expect(screen.getByText('Luxury Penthouse')).toBeInTheDocument();
  });

  it('renders location', () => {
    render(<MobilePropertyViewer property={mockProperty} isOpen={true} onClose={onClose} />);
    expect(screen.getByText('New York, NY')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<MobilePropertyViewer property={mockProperty} isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText(/close/i));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders property image', () => {
    render(<MobilePropertyViewer property={mockProperty} isOpen={true} onClose={onClose} />);
    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThan(0);
  });

  it('renders contact button', () => {
    render(<MobilePropertyViewer property={mockProperty} isOpen={true} onClose={onClose} />);
    expect(screen.getByText(/Contact/i)).toBeInTheDocument();
  });
});
