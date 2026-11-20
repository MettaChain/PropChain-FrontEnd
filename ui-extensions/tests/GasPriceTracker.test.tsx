import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import GasPriceTracker from '../components/GasPriceTracker';

const feeHistoryResponse = {
  baseFeePerGas: ['0x6fc23ac00', '0x6fc23ac00'],
  reward: [['0x12a05f200', '0x2540be400', '0x4a817c800']],
};
const fetchMock = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();

describe('GasPriceTracker', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ jsonrpc: '2.0', id: 1, result: feeHistoryResponse }),
    } as Response);
  });

  afterEach(() => {
    fetchMock.mockReset();
  });

  it('shows gas tiers, supports chain and unit selection, and alerts at the configured threshold', async () => {
    render(<GasPriceTracker />);

    expect(await screen.findByText('35.00 Gwei')).toBeInTheDocument();
    expect(screen.getByText('40.00 Gwei')).toBeInTheDocument();
    expect(screen.getByText('50.00 Gwei')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /24 hours/i })).toBeInTheDocument();
    expect(screen.getByText(/Updated/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Display unit'), {
      target: { value: 'USD' },
    });
    expect(screen.getByText('$2.5200')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Alert above (Gwei)'), {
      target: { value: '39' },
    });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Standard gas price is 40.00 Gwei',
    );

    fireEvent.change(screen.getByLabelText('Select chain'), {
      target: { value: '137' },
    });
    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith(
        'https://polygon-bor-rpc.publicnode.com',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  it('falls back to eth_gasPrice when fee history is unavailable', async () => {
    fetchMock.mockImplementation(async (_input, init) => {
      const request = JSON.parse(String(init?.body)) as {
        method: string;
      };
      return {
        ok: true,
        status: 200,
        json: async () =>
          request.method === 'eth_feeHistory'
            ? { jsonrpc: '2.0', id: 1, error: { message: 'Method not supported' } }
            : { jsonrpc: '2.0', id: 1, result: '0x6fc23ac00' },
      } as Response;
    });

    render(<GasPriceTracker />);

    expect(await screen.findByText('27.00 Gwei')).toBeInTheDocument();
    expect(screen.getByText('30.00 Gwei')).toBeInTheDocument();
    expect(screen.getByText('37.50 Gwei')).toBeInTheDocument();
  });
});
