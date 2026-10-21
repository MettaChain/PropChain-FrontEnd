import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PurchaseTokenForm } from '@/components/forms/PurchaseTokenForm';

const renderForm = (onSubmit = jest.fn()) => {
  render(
    <PurchaseTokenForm
      propertyId="prop-1"
      propertyName="Sunset Villa"
      onSubmit={onSubmit}
    />
  );
  return onSubmit;
};

const submit = () => {
  fireEvent.click(screen.getByRole('button', { name: /submit purchase request/i }));
};

const fillValidForm = () => {
  fireEvent.change(screen.getByLabelText(/token amount/i), { target: { value: '5' } });
  fireEvent.change(screen.getByLabelText(/max price per token/i), { target: { value: '250' } });
  fireEvent.click(screen.getByRole('checkbox', { name: /i agree to the terms/i }));
};

describe('PurchaseTokenForm', () => {
  describe('rendering', () => {
    it('renders the heading and the introduction of the property', () => {
      renderForm();

      expect(screen.getByRole('heading', { name: /purchase tokens/i })).toBeInTheDocument();
      expect(
        screen.getByText(/purchase tokens for sunset villa/i)
      ).toBeInTheDocument();
    });

    it('renders every field with its label and its hint', () => {
      renderForm();

      expect(screen.getByLabelText(/token amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/max price per token/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/purchase type/i)).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /i agree to the terms/i })).toBeInTheDocument();

      expect(
        screen.getByText(/number of property tokens you want to purchase/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/limits the price for each token to protect against slippage/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/choose whether to buy immediately or submit a bid/i)
      ).toBeInTheDocument();
    });

    it('renders the purchase type options', () => {
      renderForm();

      const select = screen.getByLabelText(/purchase type/i) as HTMLSelectElement;
      expect(
        Array.from(select.options).map((option) => option.value)
      ).toEqual(['market', 'bid']);
    });

    it('starts with the market order and the terms not accepted', () => {
      renderForm();

      expect(screen.getByLabelText(/purchase type/i)).toHaveValue('market');
      expect(screen.getByRole('checkbox', { name: /i agree to the terms/i })).not.toBeChecked();
    });
  });

  describe('validation', () => {
    it('does not submit an empty form and explains every invalid field', async () => {
      const onSubmit = renderForm();

      submit();

      expect(onSubmit).not.toHaveBeenCalled();

      const summary = await screen.findByRole('alert', { name: /there is a problem/i });
      expect(summary).toHaveTextContent(/token amount must be at least 1/i);
      expect(summary).toHaveTextContent(/max price per token must be greater than zero/i);
      expect(summary).toHaveTextContent(/you must agree to the terms before purchasing/i);
    });

    it('marks the invalid fields and points at the message that explains them', async () => {
      renderForm();

      submit();

      await waitFor(() => {
        expect(screen.getByLabelText(/token amount/i)).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByLabelText(/max price per token/i)).toHaveAttribute(
          'aria-invalid',
          'true'
        );
      });

      const tokenAmount = screen.getByLabelText(/token amount/i);
      const messageId = (tokenAmount.getAttribute('aria-describedby') ?? '').split(' ').pop();
      expect(document.getElementById(messageId ?? '')).toHaveTextContent(
        /token amount must be at least 1/i
      );
    });

    it('refuses a token amount that is not a whole number', async () => {
      const onSubmit = renderForm();

      fireEvent.change(screen.getByLabelText(/token amount/i), { target: { value: '1.5' } });
      fireEvent.change(screen.getByLabelText(/max price per token/i), { target: { value: '250' } });
      fireEvent.click(screen.getByRole('checkbox', { name: /i agree to the terms/i }));
      submit();

      const summary = await screen.findByRole('alert', { name: /there is a problem/i });
      expect(summary).toHaveTextContent(/token amount must be a whole number/i);
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('refuses a token amount above the maximum', async () => {
      const onSubmit = renderForm();

      fireEvent.change(screen.getByLabelText(/token amount/i), { target: { value: '100001' } });
      fireEvent.change(screen.getByLabelText(/max price per token/i), { target: { value: '250' } });
      fireEvent.click(screen.getByRole('checkbox', { name: /i agree to the terms/i }));
      submit();

      const summary = await screen.findByRole('alert', { name: /there is a problem/i });
      expect(summary).toHaveTextContent(/token amount cannot exceed 100,000/i);
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('refuses a max price of zero', async () => {
      const onSubmit = renderForm();

      fireEvent.change(screen.getByLabelText(/token amount/i), { target: { value: '5' } });
      fireEvent.change(screen.getByLabelText(/max price per token/i), { target: { value: '0' } });
      fireEvent.click(screen.getByRole('checkbox', { name: /i agree to the terms/i }));
      submit();

      const summary = await screen.findByRole('alert', { name: /there is a problem/i });
      expect(summary).toHaveTextContent(/max price per token must be greater than zero/i);
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('refuses the form while the terms are not accepted', async () => {
      const onSubmit = renderForm();

      fireEvent.change(screen.getByLabelText(/token amount/i), { target: { value: '5' } });
      fireEvent.change(screen.getByLabelText(/max price per token/i), { target: { value: '250' } });
      submit();

      const summary = await screen.findByRole('alert', { name: /there is a problem/i });
      expect(summary).toHaveTextContent(/you must agree to the terms before purchasing/i);
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('removes the error of a field once it is corrected', async () => {
      renderForm();

      submit();
      await screen.findByRole('alert', { name: /there is a problem/i });

      fireEvent.change(screen.getByLabelText(/token amount/i), { target: { value: '5' } });

      await waitFor(() => {
        expect(screen.getByLabelText(/token amount/i)).toHaveAttribute('aria-invalid', 'false');
      });
    });
  });

  describe('submission', () => {
    it('submits the values of a valid form', async () => {
      const onSubmit = renderForm();

      fillValidForm();
      submit();

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });
      expect(onSubmit).toHaveBeenCalledWith({
        propertyId: 'prop-1',
        tokenAmount: 5,
        maxPricePerToken: 250,
        purchaseType: 'market',
        agreeToTerms: true,
      });
    });

    it('submits a bid order', async () => {
      const onSubmit = renderForm();

      fillValidForm();
      fireEvent.change(screen.getByLabelText(/purchase type/i), { target: { value: 'bid' } });
      submit();

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ purchaseType: 'bid' })
      );
    });

    it('removes the error summary once the form is submitted', async () => {
      const onSubmit = renderForm();

      submit();
      await screen.findByRole('alert', { name: /there is a problem/i });

      fillValidForm();
      submit();

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });
      expect(screen.queryByRole('alert', { name: /there is a problem/i })).not.toBeInTheDocument();
    });
  });
});
