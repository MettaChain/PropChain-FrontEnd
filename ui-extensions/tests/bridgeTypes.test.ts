import * as bridgeTypes from '../types/bridge';
import * as barrel from '../types';
import {
  BridgeConfirmationStatus,
  BridgeStatus,
  type BridgeChainConfig,
  type BridgeConfirmation,
  type BridgeTransaction,
  type ValidatorSet,
} from '../types';

const ethereum: BridgeChainConfig = {
  chainId: 'ethereum',
  name: 'Ethereum',
  bridgeAddress: '0x52908400098527886E0F7030069857D2E4169EE7',
  nativeSymbol: 'ETH',
  nativeDecimals: 18,
  blockTimeSeconds: 12,
  explorerUrl: 'https://etherscan.io',
  enabled: true,
  minTransferAmount: '0.01',
  maxTransferAmount: '100',
};

const validatorSet: ValidatorSet = {
  id: 'vs-7',
  chainId: 'ethereum',
  validators: [
    '0x1111111111111111111111111111111111111111',
    '0x2222222222222222222222222222222222222222',
    '0x3333333333333333333333333333333333333333',
  ],
  threshold: 2,
  activatedAt: '2026-10-01T00:00:00.000Z',
};

const confirmation: BridgeConfirmation = {
  validator: validatorSet.validators[0],
  status: BridgeConfirmationStatus.Confirmed,
  signature: '0xdeadbeef',
  transactionHash: '0xabc123',
  observedAt: '2026-11-05T10:15:00.000Z',
};

const transaction: BridgeTransaction = {
  id: 'bridge-1',
  status: BridgeStatus.Confirming,
  sourceChainId: 'ethereum',
  destinationChainId: 'stellar',
  tokenSymbol: 'USDC',
  amount: '1250000000',
  sender: '0x4444444444444444444444444444444444444444',
  recipient: 'GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYZOJIN3CHFNBOCQK4GQ3TV6Y4Y3',
  sourceTransactionHash: '0xabc123',
  confirmations: [confirmation],
  requiredConfirmations: validatorSet.threshold,
  initiatedAt: '2026-11-05T10:14:00.000Z',
  fee: '1500000',
};

describe('bridge types', () => {
  it('models a transaction with chain config, confirmations and validator set', () => {
    expect(transaction.sourceChainId).toBe(ethereum.chainId);
    expect(transaction.confirmations).toHaveLength(1);
    expect(transaction.requiredConfirmations).toBe(validatorSet.threshold);
    expect(transaction.amount).toBe('1250000000');
  });

  it('keeps token amounts as decimal strings', () => {
    // 1.25e9 base units would stay exact as a string but is representable here;
    // the type exists so values above MAX_SAFE_INTEGER are not lost.
    expect(typeof transaction.amount).toBe('string');
    expect(typeof transaction.fee).toBe('string');
    expect(Number(transaction.amount)).toBe(1_250_000_000);
  });

  it('defines the bridge and confirmation status enums', () => {
    expect(Object.values(BridgeStatus)).toEqual([
      'pending',
      'confirming',
      'bridging',
      'completed',
      'failed',
      'refunded',
    ]);
    expect(Object.values(BridgeConfirmationStatus)).toEqual([
      'pending',
      'confirmed',
      'rejected',
    ]);
  });

  it('separates terminal states from in-flight states', () => {
    const inFlight: string[] = [
      BridgeStatus.Pending,
      BridgeStatus.Confirming,
      BridgeStatus.Bridging,
    ];
    const terminal: string[] = [
      BridgeStatus.Completed,
      BridgeStatus.Failed,
      BridgeStatus.Refunded,
    ];

    expect(inFlight.some((status) => terminal.includes(status))).toBe(false);
    expect(terminal).toHaveLength(3);
  });

  it('exports every type from the types barrel', () => {
    expect(barrel.BridgeStatus).toBe(BridgeStatus);
    expect(barrel.BridgeConfirmationStatus).toBe(BridgeConfirmationStatus);
  });

  it('contains no runtime behaviour beyond the enums', () => {
    expect(Object.keys(bridgeTypes).sort()).toEqual([
      'BridgeConfirmationStatus',
      'BridgeStatus',
    ]);
    for (const value of Object.values(bridgeTypes)) {
      expect(typeof value).not.toBe('function');
    }
  });
});
