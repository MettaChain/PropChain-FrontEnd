import { getWalletErrorMessage } from '../errorHandling';

describe('getWalletErrorMessage', () => {
  it('maps user rejection code 4001', () => {
    expect(getWalletErrorMessage({ code: 4001 })).toBe('User rejected the request');
  });

  it('maps internal json-rpc error -32603', () => {
    expect(getWalletErrorMessage({ code: -32603 })).toBe(
      'Internal node error: the transaction failed on the node. It may have been reverted.'
    );
  });

  it('maps INSUFFICIENT_FUNDS message', () => {
    expect(getWalletErrorMessage({ message: 'INSUFFICIENT_FUNDS' })).toContain('Insufficient funds');
    expect(getWalletErrorMessage('insufficient funds to pay for gas')).toContain('Insufficient funds');
  });

  it('maps UNPREDICTABLE_GAS_LIMIT message', () => {
    expect(getWalletErrorMessage({ message: 'UNPREDICTABLE_GAS_LIMIT' })).toContain('Transaction likely to revert');
  });

  it('maps NETWORK_ERROR code or message', () => {
    expect(getWalletErrorMessage({ code: 'NETWORK_ERROR' })).toContain('Network error');
    expect(getWalletErrorMessage('Network Error: failed')).toContain('Network error');
  });
});
