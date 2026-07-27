import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PurchaseTokenForm } from '@/components/forms/PurchaseTokenForm';

describe('PurchaseTokenForm accessibility', () => {
  it('associates form errors with the relevant input and marks the field invalid', async () => {
    render(
      <PurchaseTokenForm
        propertyId="prop-1"
        propertyName="Sunset Villa"
        onSubmit={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /submit purchase request/i }));

    const tokenAmountInput = screen.getByLabelText(/token amount/i);

    await waitFor(() => {
      expect(tokenAmountInput).toHaveAttribute('aria-invalid', 'true');
      expect(tokenAmountInput).toHaveAttribute('aria-describedby');
    });

    expect(screen.getByText(/at least 1/i)).toBeInTheDocument();
  });
});
