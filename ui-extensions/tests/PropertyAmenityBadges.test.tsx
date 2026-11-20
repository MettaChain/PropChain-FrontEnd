import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AmenityType, type PropertyAmenity } from '../types/amenity';
import { PropertyAmenityBadges } from '../components/PropertyAmenityBadges';

const amenities: PropertyAmenity[] = [
  { type: AmenityType.Pool, prevalencePercent: 45 },
  { type: AmenityType.Parking, prevalencePercent: 10 },
  { type: AmenityType.Garden, prevalencePercent: 9.9 },
  { type: AmenityType.Gym, prevalencePercent: 80 },
];

describe('PropertyAmenityBadges', () => {
  it('renders icon badges with the full amenity name in a tooltip', async () => {
    const user = userEvent.setup();
    render(<PropertyAmenityBadges amenities={amenities} />);

    const poolBadge = screen.getByRole('button', { name: AmenityType.Pool });
    expect(poolBadge.querySelector('svg')).toBeInTheDocument();

    await user.hover(poolBadge);
    expect(await screen.findByRole('tooltip')).toHaveTextContent(AmenityType.Pool);
  });

  it('hides amenities below 10 percent until uncommon amenities are requested', () => {
    render(<PropertyAmenityBadges amenities={amenities} />);

    expect(screen.getByText(AmenityType.Parking)).toBeInTheDocument();
    expect(screen.queryByText(AmenityType.Garden)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Show uncommon amenities' }));
    expect(screen.getByText(AmenityType.Garden)).toBeInTheDocument();
  });

  it('limits displayed badges and reports the remaining count', () => {
    render(<PropertyAmenityBadges amenities={amenities} maxDisplayCount={2} />);

    expect(screen.getByText(AmenityType.Pool)).toBeInTheDocument();
    expect(screen.getByText(AmenityType.Parking)).toBeInTheDocument();
    expect(screen.getByText('+1 more')).toBeInTheDocument();
    expect(screen.queryByText(AmenityType.Gym)).not.toBeInTheDocument();
  });
});
