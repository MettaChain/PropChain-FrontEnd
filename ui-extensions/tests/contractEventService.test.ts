import type { Address } from 'viem';

import {
  createContractEventService,
  type ContractEventClient,
  type ContractEventLog,
  type WatchContractEventParams,
} from '../lib/contractEventService';

const abi = [] as const;
const addresses = ['0x0000000000000000000000000000000000000001'] as Address[];

function createMockClient() {
  let params: WatchContractEventParams | undefined;
  const unwatch = jest.fn();
  const watchContractEvent = jest.fn((next: WatchContractEventParams) => {
    params = next;
    return unwatch;
  });
  const client: ContractEventClient = { watchContractEvent };

  return {
    client,
    watchContractEvent,
    unwatch,
    emit: (logs: ContractEventLog[]) => params!.onLogs(logs),
    fail: () => params!.onError?.(new Error('rpc disconnected')),
    currentParams: () => params,
  };
}

const log = (eventName: string): ContractEventLog => ({
  address: addresses[0],
  eventName,
  args: { value: 1n },
  blockNumber: 10n,
});

describe('contract event service', () => {
  it('watches the configured address and dispatches logs to handlers', () => {
    const mock = createMockClient();
    const service = createContractEventService({ client: mock.client, abi, addresses });
    const handler = jest.fn();

    service.on(handler);
    service.start();
    mock.emit([log('Transfer')]);

    expect(mock.currentParams()?.address).toEqual(addresses[0]);
    expect(handler).toHaveBeenCalledWith(log('Transfer'));
    expect(service.isRunning()).toBe(true);
  });

  it('passes every address when watching multiple contracts', () => {
    const mock = createMockClient();
    const twoAddresses = [...addresses, '0x0000000000000000000000000000000000000002' as Address];
    const service = createContractEventService({ client: mock.client, abi, addresses: twoAddresses });

    service.start();

    expect(mock.currentParams()?.address).toEqual(twoAddresses);
  });

  it('filters logs by event name', () => {
    const mock = createMockClient();
    const service = createContractEventService({
      client: mock.client,
      abi,
      addresses,
      filter: { eventName: 'Transfer' },
    });
    const handler = jest.fn();

    service.on(handler);
    service.start();
    mock.emit([log('Transfer'), log('Approval')]);

    expect(mock.currentParams()?.eventName).toBe('Transfer');
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(log('Transfer'));
  });

  it('reconnects after an RPC disconnection', () => {
    const mock = createMockClient();
    const schedule = jest.fn();
    const service = createContractEventService({
      client: mock.client,
      abi,
      addresses,
      schedule,
      maxReconnects: 2,
    });

    service.start();
    mock.fail();

    expect(service.reconnectAttempts()).toBe(1);
    expect(schedule).toHaveBeenCalledTimes(1);

    (schedule.mock.calls[0][0] as () => void)();
    expect(mock.watchContractEvent).toHaveBeenCalledTimes(2);
  });

  it('stops reconnecting after the attempt limit', () => {
    const mock = createMockClient();
    const schedule = jest.fn();
    const service = createContractEventService({
      client: mock.client,
      abi,
      addresses,
      schedule,
      maxReconnects: 1,
    });

    service.start();
    mock.fail();
    (schedule.mock.calls[0][0] as () => void)();
    mock.fail();

    expect(schedule).toHaveBeenCalledTimes(1);
  });

  it('unwatches on stop and ignores later errors', () => {
    const mock = createMockClient();
    const schedule = jest.fn();
    const service = createContractEventService({ client: mock.client, abi, addresses, schedule });

    service.start();
    service.stop();
    mock.fail();

    expect(mock.unwatch).toHaveBeenCalled();
    expect(service.isRunning()).toBe(false);
    expect(schedule).not.toHaveBeenCalled();
  });

  it('isolates a handler that throws', () => {
    const mock = createMockClient();
    const service = createContractEventService({ client: mock.client, abi, addresses });
    const good = jest.fn();

    service.on(() => {
      throw new Error('boom');
    });
    service.on(good);
    service.start();
    mock.emit([log('Transfer')]);

    expect(good).toHaveBeenCalledTimes(1);
  });

  it('stops delivering after a handler unsubscribes', () => {
    const mock = createMockClient();
    const service = createContractEventService({ client: mock.client, abi, addresses });
    const handler = jest.fn();

    const unsubscribe = service.on(handler);
    service.start();
    unsubscribe();
    mock.emit([log('Transfer')]);

    expect(handler).not.toHaveBeenCalled();
  });
});
