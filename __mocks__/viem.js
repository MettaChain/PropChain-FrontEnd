const mockReceipt = {
  status: 'success',
  blockNumber: BigInt(18000000),
  transactionHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
  blockHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
  contractAddress: null,
  cumulativeGasUsed: BigInt(100000),
  gasUsed: BigInt(50000),
  logs: [],
  logsBloom: '0x0000000000000000000000000000000000000000000000000000000000000000',
  from: '0x0000000000000000000000000000000000000000',
  to: '0x0000000000000000000000000000000000000000',
  effectiveGasPrice: BigInt(20000000000),
  type: 'eip1559',
};

const mockClient = {
  getTransactionReceipt: jest.fn().mockRejectedValue(new Error('receipt not found')),
  waitForTransactionReceipt: jest.fn().mockRejectedValue(new Error('timeout')),
};

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
  createPublicClient: jest.fn(() => mockClient),
  http: jest.fn(() => 'http://mock-transport'),
  fallback: jest.fn((transports) => transports[0]),
  isAddress: jest.fn((addr) => /^0x[a-fA-F0-9]{40}$/.test(addr)),
  getAddress: jest.fn((addr) => addr),
  isHex: jest.fn(() => true),
  formatEther: jest.fn((wei) => Number(wei) / 1e18),
  parseEther: jest.fn((eth) => BigInt(Math.floor(Number(eth) * 1e18))),
  parseUnits: jest.fn((val, decimals) => BigInt(Number(val) * Math.pow(10, decimals))),
};
