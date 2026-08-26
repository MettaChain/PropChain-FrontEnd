module.exports = {
  generatePrivateKey: jest.fn(() => '0x0000000000000000000000000000000000000000000000000000000000000001'),
  privateKeyToAccount: jest.fn((key) => ({
    address: '0x0000000000000000000000000000000000000000',
    privateKey: key,
  })),
};
