const { keccak_256 } = require('@noble/hashes/sha3');

const formatUnitsValue = (value, decimals) => String(Number(value) / Math.pow(10, decimals));
const parseUnitsValue = (value, decimals) => BigInt(Math.floor(Number(value) * Math.pow(10, decimals)));
const isAddressValue = (addr) => /^0x[a-fA-F0-9]{40}$/.test(addr);

function toChecksummedAddress(address) {
  const addr = address.toLowerCase().replace('0x', '');
  const hash = Buffer.from(keccak_256(new TextEncoder().encode(addr))).toString('hex');
  let result = '0x';
  for (let i = 0; i < 40; i++) {
    const nibble = parseInt(hash[i], 16);
    const char = addr[i];
    result += nibble >= 8 ? char.toUpperCase() : char;
  }
  return result;
}

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
    const checksummed = toChecksummedAddress(value);
    if (value !== checksummed && value.toLowerCase() !== value && value.toUpperCase() !== value) {
      throw new Error('Invalid address checksum');
    }
    return checksummed;
  }),
  http: jest.fn((url) => ({ type: 'http', url })),
  isAddress: jest.fn(isAddressValue),
  isHex: jest.fn(
    (value) => typeof value === 'string' && /^0x([a-fA-F0-9]{2})*$/.test(value),
  ),
  parseEther: jest.fn((value) => parseUnitsValue(value, 18)),
  parseUnits: jest.fn(parseUnitsValue),
  recoverMessageAddress: jest.fn(() => Promise.resolve('0x123')),
  defineChain: jest.fn((chain) => chain),
  // Used by src/lib/cacheManager.ts to hash queue payloads. Kept deterministic
  // (a counter-free FNV-1a) rather than pulling a real SHA-256 into the jsdom
  // environment: the tests only assert that identical payloads hash the same and
  // differing payloads do not collide, never a specific digest.
  toBytes: jest.fn((value) => new TextEncoder().encode(String(value))),
  sha256: jest.fn((bytes) => {
    const view = Array.from(bytes);
    let hash = 0x811c9dc5;
    for (const byte of view) {
      hash ^= byte;
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return `0x${hash.toString(16).padStart(8, '0').repeat(8)}`;
  }),
};
