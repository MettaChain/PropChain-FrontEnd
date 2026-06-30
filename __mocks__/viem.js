const asBigInt = (value) =>
  typeof value === 'bigint' ? value : BigInt(value);

const formatUnitsValue = (value, decimals = 18) => {
  const unitDecimals = Number(decimals);
  const raw = asBigInt(value);
  const sign = raw < 0n ? '-' : '';
  const abs = raw < 0n ? -raw : raw;
  const base = 10n ** BigInt(unitDecimals);
  const whole = abs / base;
  const fraction = abs % base;

  if (unitDecimals === 0 || fraction === 0n) {
    return `${sign}${whole}`;
  }

  const fractionText = fraction
    .toString()
    .padStart(unitDecimals, '0')
    .replace(/0+$/, '');

  return `${sign}${whole}.${fractionText}`;
};

const parseUnitsValue = (value, decimals = 18) => {
  const unitDecimals = Number(decimals);
  const text = String(value).trim();
  const sign = text.startsWith('-') ? -1n : 1n;
  const unsigned = text.replace(/^[+-]/, '');
  const [whole = '0', fraction = ''] = unsigned.split('.');
  const paddedFraction = fraction
    .padEnd(unitDecimals, '0')
    .slice(0, unitDecimals);
  const normalized = `${whole || '0'}${paddedFraction || ''}`;
  const parsed = BigInt(normalized || '0');

  return sign * parsed;
};

const isAddressValue = (value) =>
  typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value);

module.exports = {
  createPublicClient: jest.fn((config = {}) => ({
    ...config,
    getBalance: jest.fn(),
    getBlockNumber: jest.fn(),
    readContract: jest.fn(),
    waitForTransactionReceipt: jest.fn(),
  })),
  fallback: jest.fn((transports) => ({ type: 'fallback', transports })),
  formatEther: jest.fn((value) => formatUnitsValue(value, 18)),
  formatUnits: jest.fn(formatUnitsValue),
  getAddress: jest.fn((value) => {
    if (!isAddressValue(value)) {
      throw new Error('Invalid address');
    }

    return value;
  }),
  http: jest.fn((url) => ({ type: 'http', url })),
  isAddress: jest.fn(isAddressValue),
  isHex: jest.fn(
    (value) => typeof value === 'string' && /^0x([a-fA-F0-9]{2})*$/.test(value),
  ),
  parseEther: jest.fn((value) => parseUnitsValue(value, 18)),
  parseUnits: jest.fn(parseUnitsValue),
  recoverMessageAddress: jest.fn(() => Promise.resolve('0x123')),
};
