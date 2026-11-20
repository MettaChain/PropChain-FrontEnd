/**
 * Property token liquidity pool data (#1435).
 *
 * Aggregates pools from multiple DEX sources, tagged with the source name, and
 * caches the result for a short TTL. A failing source is skipped rather than
 * failing the whole read.
 */

export interface PoolData {
  address: string;
  symbol: string;
  tvlUsd: number;
  volume24hUsd: number;
  feeTier: number;
  apy: number;
  dex: string;
}

export interface PoolSource {
  name: string;
  fetchPools(): Promise<Omit<PoolData, 'dex'>[]>;
}

export interface LiquidityPoolServiceOptions {
  ttlMs?: number;
  now?: () => number;
}

export interface LiquidityPoolService {
  /** Aggregated pools, served from cache while it is fresh. */
  getPools(): Promise<PoolData[]>;
  /** Single pool by address, or null when no source knows it. */
  getPool(address: string): Promise<PoolData | null>;
  /** Drop the cache so the next read refetches every source. */
  clear(): void;
}

export function createLiquidityPoolService(
  sources: PoolSource[],
  options: LiquidityPoolServiceOptions = {},
): LiquidityPoolService {
  const ttlMs = options.ttlMs ?? 60_000;
  const now = options.now ?? (() => Date.now());

  let cache: { at: number; pools: PoolData[] } | null = null;

  const fetchAll = async (): Promise<PoolData[]> => {
    const results = await Promise.allSettled(sources.map((source) => source.fetchPools()));
    const pools: PoolData[] = [];

    results.forEach((result, index) => {
      if (result.status !== 'fulfilled') return;
      const dex = sources[index].name;
      pools.push(...result.value.map((pool) => ({ ...pool, dex })));
    });

    cache = { at: now(), pools };
    return pools;
  };

  return {
    async getPools() {
      if (cache && now() - cache.at < ttlMs) {
        return cache.pools;
      }
      return fetchAll();
    },
    async getPool(address) {
      const pools = await this.getPools();
      const target = address.toLowerCase();
      return pools.find((pool) => pool.address.toLowerCase() === target) ?? null;
    },
    clear() {
      cache = null;
    },
  };
}
