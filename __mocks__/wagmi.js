module.exports = {
  useEstimateGas: jest.fn(() => ({ data: '0x123' })),
  useGasPrice: jest.fn(() => ({ data: '20000000000' })),
  WagmiProvider: ({ children }) => children,
  http: jest.fn(() => ({})),
  createConfig: jest.fn(() => ({})),
  injected: jest.fn(() => ({})),
};