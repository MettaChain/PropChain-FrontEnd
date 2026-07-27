/**
 * @jest-environment jsdom
 *
 * #503: ChainAware must hand the same `props` object reference to its
 * children function on consecutive renders whenever the chain/wallet state
 * has not changed, so consumer-side memoization can take effect.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { ChainAware } from '@/components/ChainAwareProps';

jest.mock('@/providers/ChainAwareProvider', () => ({
  useChain: jest.fn(),
}));

jest.mock('@/store/walletStore', () => ({
  useWalletStore: jest.fn(),
}));

import { useChain } from '@/providers/ChainAwareProvider';
import { useWalletStore } from '@/store/walletStore';

const mockUseChain = useChain as jest.Mock;
const mockUseWalletStore = useWalletStore as jest.Mock;

describe('ChainAware (#503)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseChain.mockReturnValue({
      currentChain: 1,
      chainConfig: {
        name: 'Ethereum',
        symbol: 'ETH',
        color: '#627eea',
      },
    });
    mockUseWalletStore.mockReturnValue({
      isConnected: true,
      address: '0xabc',
      balance: '1.0',
    });
  });

  it('returns a stable props reference across renders when inputs are unchanged', () => {
    const received: unknown[] = [];
    const collectProps = (props: unknown) => {
      received.push(props);
      return null;
    };

    const { rerender } = render(<ChainAware>{collectProps}</ChainAware>);
    rerender(<ChainAware>{collectProps}</ChainAware>);

    expect(received).toHaveLength(2);
    expect(received[0]).toBe(received[1]);
  });

  it('returns a fresh props reference when chain or wallet fields change', () => {
    const received: unknown[] = [];
    const collectProps = (props: unknown) => {
      received.push(props);
      return null;
    };

    const { rerender } = render(<ChainAware>{collectProps}</ChainAware>);

    mockUseChain.mockReturnValue({
      currentChain: 137,
      chainConfig: { name: 'Polygon', symbol: 'MATIC', color: '#8247e5' },
    });
    rerender(<ChainAware>{collectProps}</ChainAware>);

    expect(received).toHaveLength(2);
    expect(received[0]).not.toBe(received[1]);
    expect((received[1] as { chainId: number }).chainId).toBe(137);
    expect((received[1] as { chainName: string }).chainName).toBe('Polygon');
  });

  it('renders the fallback when not connected and no props are evaluated', () => {
    mockUseWalletStore.mockReturnValue({
      isConnected: false,
      address: null,
      balance: null,
    });

    const collectProps = jest.fn(() => null);
    const { container } = render(
      <ChainAware fallback={<span data-testid="fb">fb</span>}>
        {collectProps}
      </ChainAware>
    );

    expect(container.querySelector('[data-testid="fb"]')).not.toBeNull();
    // The children render-prop should not be invoked on the fallback branch.
    expect(collectProps).not.toHaveBeenCalled();
  });
});
