import { fireEvent, render, screen } from '@testing-library/react';
import PropertyImageCarousel from '../components/PropertyImageCarousel';

const images = [
  { src: '/property-one.jpg', alt: 'Front of the property' },
  { src: '/property-two.jpg', alt: 'Property living room' },
];

describe('PropertyImageCarousel', () => {
  it('navigates with buttons and arrow keys', () => {
    render(<PropertyImageCarousel images={images} />);

    const region = screen.getByRole('region', { name: 'Property image carousel' });
    expect(screen.getByRole('img', { name: 'Front of the property' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next image' }));
    expect(screen.getByRole('img', { name: 'Property living room' })).toBeInTheDocument();

    fireEvent.keyDown(region, { key: 'ArrowLeft' });
    expect(screen.getByRole('img', { name: 'Front of the property' })).toBeInTheDocument();
  });

  it('renders an accessible loading state', () => {
    render(<PropertyImageCarousel images={images} loading />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading property images');
    expect(screen.getByLabelText('Property image carousel loading')).toHaveAttribute('aria-busy', 'true');
  });
});
