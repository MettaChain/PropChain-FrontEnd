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

    // The message the input points at with `aria-describedby` is the one that
    // explains the error.
    const describedBy = tokenAmountInput.getAttribute('aria-describedby') ?? '';
    const messageId = describedBy.split(' ').pop() ?? '';
    expect(document.getElementById(messageId)).toHaveTextContent(/at least 1/i);
  });

  it('names the form after its heading and describes it', () => {
    render(
      <PurchaseTokenForm
        propertyId="prop-1"
        propertyName="Sunset Villa"
        onSubmit={jest.fn()}
      />
    );

    const form = screen.getByRole('form', { name: /purchase tokens/i });
    expect(form).toHaveAccessibleDescription(/purchase tokens for sunset villa/i);
  });

  it('marks the fields that have to be filled in as required', () => {
    render(
      <PurchaseTokenForm
        propertyId="prop-1"
        propertyName="Sunset Villa"
        onSubmit={jest.fn()}
      />
    );

    expect(screen.getByLabelText(/token amount/i)).toBeRequired();
    expect(screen.getByLabelText(/max price per token/i)).toBeRequired();
    expect(screen.getByRole('checkbox', { name: /i agree to the terms/i })).toBeRequired();
  });

  it('collects the errors of a refused submission in an error summary', async () => {
    render(
      <PurchaseTokenForm
        propertyId="prop-1"
        propertyName="Sunset Villa"
        onSubmit={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /submit purchase request/i }));

    const summary = await screen.findByRole('alert', { name: /there is a problem/i });
    expect(summary).toHaveTextContent(/there is a problem/i);
    expect(summary).toHaveTextContent(/token amount/i);
    expect(summary).toHaveTextContent(/at least 1/i);
  });

  it('moves the focus to the error summary when a submission is refused', async () => {
    render(
      <PurchaseTokenForm
        propertyId="prop-1"
        propertyName="Sunset Villa"
        onSubmit={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /submit purchase request/i }));

    const summary = await screen.findByRole('alert', { name: /there is a problem/i });
    await waitFor(() => {
      expect(summary).toHaveFocus();
    });
  });

  it('moves the focus to the field an error summary entry points at', async () => {
    render(
      <PurchaseTokenForm
        propertyId="prop-1"
        propertyName="Sunset Villa"
        onSubmit={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /submit purchase request/i }));

    const summary = await screen.findByRole('alert', { name: /there is a problem/i });
    fireEvent.click(screen.getByRole('button', { name: /token amount: token amount must be at least 1/i }));

    // `setFocus` moves the focus in the next tick.
    await waitFor(() => {
      expect(screen.getByLabelText(/token amount/i)).toHaveFocus();
    });
    expect(summary).toBeInTheDocument();
  });
});
