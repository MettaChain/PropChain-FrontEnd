import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SetPriceAlertModal } from '../SetPriceAlertModal';
import type { Property } from '@/types/property';

// Mock next/image to avoid hostname validation against next.config.js images
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

const mockProperty: Property = {
  id: 'prop-1',
  name: 'Sunset Villa',
  description: 'Beautiful residential property with great views',
  location: {
    address: '123 Main St',
    city: 'Los Angeles',
    state: 'California',
    country: 'USA',
    zipCode: '90001',
    coordinates: { lat: 34.05, lng: -118.25 },
  },
  price: {
    total: 500,
    perToken: 50,
    currency: 'USD',
  },
  propertyType: 'residential',
  blockchain: 'ethereum',
  tokenInfo: {
    totalSupply: 1000,
    available: 500,
    sold: 500,
    contractAddress: '0x1234',
    tokenSymbol: 'PROP',
  },
  metrics: {
    roi: 8.5,
    annualReturn: 42500,
    transactionVolume: 1000000,
    appreciationRate: 5.2,
  },
  details: {
    bedrooms: 4,
    bathrooms: 3,
    squareFeet: 2500,
    yearBuilt: 2020,
    amenities: ['pool', 'garden'],
  },
  images: ['https://example.com/image1.jpg'],
  listedDate: '2024-01-01',
  status: 'active',
  featured: true,
  verified: true,
};

type SetPriceAlertModalProps = React.ComponentProps<typeof SetPriceAlertModal>;

interface SetupProps {
  isOpen?: boolean;
  existingAlert?: SetPriceAlertModalProps['existingAlert'];
  onSetAlert?: SetPriceAlertModalProps['onSetAlert'];
}

const defaultOnSetAlert = jest.fn().mockResolvedValue(undefined);

const renderModal = ({
  isOpen = true,
  existingAlert,
  onSetAlert = defaultOnSetAlert,
}: SetupProps = {}) => {
  const onOpenChange = jest.fn();
  const utils = render(
    <SetPriceAlertModal
      property={mockProperty}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      onSetAlert={onSetAlert}
      existingAlert={existingAlert}
    />
  );
  return { ...utils, onOpenChange };
};

describe('SetPriceAlertModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the modal content when open', () => {
    renderModal();

    expect(screen.getByText('Set Price Alert')).toBeInTheDocument();
    expect(screen.getByText(/Get notified when the token price for/)).toBeInTheDocument();
    expect(screen.getByText('Sunset Villa')).toBeInTheDocument();
  });

  it('should pre-fill options with the property price and show a Set Alert button', () => {
    renderModal();

    expect(screen.getByLabelText('Target Price (USD)')).toHaveValue(50);
    expect(screen.getByRole('button', { name: /set alert/i })).toBeInTheDocument();
  });

  it('should call onSetAlert with the selected type, target price and email flag on submit', async () => {
    const onSetAlert = jest.fn().mockResolvedValue(undefined);
    const { onOpenChange } = renderModal({ onSetAlert });

    // Change target price to a valid value
    const priceInput = screen.getByLabelText('Target Price (USD)');
    fireEvent.change(priceInput, { target: { value: '60' } });
    expect(priceInput).toHaveValue(60);

    // Toggle the email notification checkbox
    const emailCheckbox = screen.getByRole('checkbox', {
      name: /send me an email when the alert triggers/i,
    });
    expect(emailCheckbox).not.toBeChecked();
    await userEvent.click(emailCheckbox);
    expect(emailCheckbox).toBeChecked();

    // Submit
    const submitButton = screen.getByRole('button', { name: /set alert/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(onSetAlert).toHaveBeenCalledWith('below', 60, true);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('should keep the submit button disabled for an invalid (empty/zero) target price', () => {
    renderModal();

    const submitButton = screen.getByRole('button', { name: /set alert/i });

    // Default target price is valid (50), so the button should be enabled
    expect(submitButton).toBeEnabled();

    // Set an empty price => parses to 0, disables the submit button
    const priceInput = screen.getByLabelText('Target Price (USD)');
    fireEvent.change(priceInput, { target: { value: '' } });

    // State resolves to 0, which makes the submit button invalid/disabled
    expect(submitButton).toBeDisabled();
    expect(screen.getByRole('button', { name: /set alert/i })).toBeDisabled();
  });

  it('should switch the alert type via the radio group', async () => {
    renderModal();

    const aboveOption = screen.getByText('Above');
    const changeOption = screen.getByText('Changes');

    await userEvent.click(aboveOption);
    expect(screen.getByText('Set Price Alert')).toBeInTheDocument();

    // Selecting "Changes" should still render; no inputs should be lost
    await userEvent.click(changeOption);
    expect(screen.getByLabelText('Target Price (USD)')).toBeInTheDocument();
  });

  it('should close the modal when the Cancel button is clicked', async () => {
    const { onOpenChange } = renderModal();

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should reflect an existing alert by pre-filling values and showing an Update button', () => {
    renderModal({
      existingAlert: { alertType: 'above', targetPrice: 75, isActive: true },
    });

    expect(screen.getByLabelText('Target Price (USD)')).toHaveValue(75);
    expect(screen.getByRole('button', { name: /update alert/i })).toBeInTheDocument();
  });

  it('should not render a submit button when closed', () => {
    renderModal({ isOpen: false });

    expect(screen.queryByText('Sunset Villa')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /set alert/i })).not.toBeInTheDocument();
  });
});