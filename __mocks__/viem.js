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