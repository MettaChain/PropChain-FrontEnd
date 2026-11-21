import {
  createLiquidityPoolService,
  type PoolSource,
} from '../lib/liquidityPoolService';

const uniswapPool = {
  address: '0xAbC0000000000000000000000000000000000001',
  symbol: 'PROP',
  tvlUsd: 1_000_000,
  volume24hUsd: 50_000,
  feeTier: 0.3,
  apy: 12.4,
};

const curvePool = {
  address: '0xDef0000000000000000000000000000000000002',
  symbol: 'PROP-USDC',
  tvlUsd: 500_000,
  volume24hUsd: 20_000,
  feeTier: 0.05,
  apy: 8.1,
};

function createSources() {
  const uniswap: PoolSource = { name: 'uniswap', fetchPools: jest.fn(async () => [uniswapPool]) };
  const curve: PoolSource = { name: 'curve', fetchPools: jest.fn(async () => [curvePool]) };
  return { uniswap, curve };
}

describe('liquidity pool service', () => {
  it('aggregates pools from multiple DEX sources', async () => {
    const sources = createSources();
    const service = createLiquidityPoolService([sources.uniswap, sources.curve]);

    const pools = await service.getPools();

    expect(pools).toEqual([
      { ...uniswapPool, dex: 'uniswap' },
      { ...curvePool, dex: 'curve' },
    ]);
  });

  it('caches results for the TTL window', async () => {
    const sources = createSources();
    let clock = 0;
    const service = createLiquidityPoolService([sources.uniswap], {
      ttlMs: 60_000,
      now: () => clock,
    });

    await service.getPools();
    clock = 30_000;
    await service.getPools();

    expect(sources.uniswap.fetchPools).toHaveBeenCalledTimes(1);
  });

  it('refetches once the cache expires', async () => {
    const sources = createSources();
    let clock = 0;
    const service = createLiquidityPoolService([sources.uniswap], {
      ttlMs: 60_000,
      now: () => clock,
    });

    await service.getPools();
    clock = 60_001;
    await service.getPools();

    expect(sources.uniswap.fetchPools).toHaveBeenCalledTimes(2);
  });

  it('skips a failing source instead of failing the read', async () => {
    const failing: PoolSource = {
      name: 'broken-dex',
      fetchPools: jest.fn(async () => {
        throw new Error('rpc down');
      }),
    };
    const sources = createSources();
    const service = createLiquidityPoolService([failing, sources.uniswap]);

    const pools = await service.getPools();

    expect(pools).toEqual([{ ...uniswapPool, dex: 'uniswap' }]);
  });

  it('finds a pool by address regardless of case', async () => {
    const sources = createSources();
    const service = createLiquidityPoolService([sources.uniswap]);

    expect(await service.getPool(uniswapPool.address.toLowerCase())).toEqual({
      ...uniswapPool,
      dex: 'uniswap',
    });
    expect(await service.getPool('0x0000000000000000000000000000000000000000')).toBeNull();
  });

  it('clears the cache on demand', async () => {
    const sources = createSources();
    const service = createLiquidityPoolService([sources.uniswap]);

    await service.getPools();
    service.clear();
    await service.getPools();

    expect(sources.uniswap.fetchPools).toHaveBeenCalledTimes(2);
  });
});
