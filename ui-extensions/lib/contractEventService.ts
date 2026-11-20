/**
 * Smart contract event listening and dispatch (#1430).
 *
 * The service watches one or many contract addresses through a viem-style
 * client and fans every log out to registered handlers. The client is injected
 * so the service can be unit tested without an RPC connection.
 */
import type { Abi, Address } from 'viem';

export interface ContractEventLog {
  address: Address;
  eventName?: string;
  args?: Record<string, unknown>;
  blockNumber?: bigint;
  transactionHash?: `0x${string}`;
}

export type ContractEventHandler = (log: ContractEventLog) => void | Promise<void>;

export interface ContractEventFilter {
  eventName?: string;
}

export interface WatchContractEventParams {
  address: Address | Address[];
  abi: Abi;
  eventName?: string;
  onLogs: (logs: ContractEventLog[]) => void;
  onError?: (error: Error) => void;
}

/** Minimal viem public-client surface the service depends on. */
export interface ContractEventClient {
  watchContractEvent(params: WatchContractEventParams): () => void;
}

export interface ContractEventServiceOptions {
  client: ContractEventClient;
  abi: Abi;
  addresses: Address[];
  filter?: ContractEventFilter;
  reconnectDelayMs?: number;
  maxReconnects?: number;
  schedule?: (callback: () => void, delayMs: number) => unknown;
}

export interface ContractEventService {
  /** Register a handler and get an unsubscribe function back. */
  on(handler: ContractEventHandler): () => void;
  start(): void;
  stop(): void;
  isRunning(): boolean;
  reconnectAttempts(): number;
}

export function createContractEventService(
  options: ContractEventServiceOptions,
): ContractEventService {
  const handlers = new Set<ContractEventHandler>();
  const reconnectDelayMs = options.reconnectDelayMs ?? 1_000;
  const maxReconnects = options.maxReconnects ?? 5;
  const schedule =
    options.schedule ?? ((callback: () => void, delayMs: number) => setTimeout(callback, delayMs));

  let unwatch: (() => void) | undefined;
  let running = false;
  let attempts = 0;

  const dispatch = (logs: ContractEventLog[]) => {
    for (const log of logs) {
      if (options.filter?.eventName && log.eventName !== options.filter.eventName) {
        continue;
      }
      for (const handler of handlers) {
        try {
          void handler(log);
        } catch {
          // A failing handler must not stop delivery to the others.
        }
      }
    }
  };

  const watch = () => {
    unwatch = options.client.watchContractEvent({
      address: options.addresses.length === 1 ? options.addresses[0] : options.addresses,
      abi: options.abi,
      eventName: options.filter?.eventName,
      onLogs: (logs) => {
        attempts = 0;
        dispatch(logs);
      },
      onError: () => {
        if (!running || attempts >= maxReconnects) {
          return;
        }
        attempts += 1;
        schedule(watch, reconnectDelayMs);
      },
    });
  };

  return {
    on(handler) {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
    start() {
      if (running) return;
      running = true;
      attempts = 0;
      watch();
    },
    stop() {
      running = false;
      unwatch?.();
      unwatch = undefined;
    },
    isRunning: () => running,
    reconnectAttempts: () => attempts,
  };
}
