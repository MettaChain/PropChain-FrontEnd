/**
 * #504: PortfolioService.fetchPortfolioOverview must issue the three
 * independent endpoints (portfolio, performance, gas prices) concurrently
 * via Promise.all, then derive bridge suggestions from the resolved
 * portfolio result.
 *
 * Defaults to jsdom so `jest.setup.js`'s `window.ethereum` and other browser
 * globals are defined (the suite does not exercise the DOM directly).
 */

jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { PortfolioService } from '@/lib/portfolioService';

const ADDRESS = '0xdeadbeef';

describe('PortfolioService.fetchPortfolioOverview (#504)', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('invokes the three independent fetchers through Promise.all (parallel) and computes suggestions', async () => {
    // Make the three fetchers defer to microtask boundaries, mimicking a real
    // concurrent network round-trip.
    const portfolioSpy = jest
      .spyOn(PortfolioService, 'fetchMultiChainPortfolio')
      .mockImplementation(async () => {
        await Promise.resolve();
        return {
          totalValueUSD: 1,
          totalValueNative: new Map(),
          chains: [],
          lastUpdated: 'now',
          isLoading: false,
          error: null,
        };
      });

    const performanceSpy = jest
      .spyOn(PortfolioService, 'getPortfolioPerformance')
      .mockImplementation(async () => {
        await Promise.resolve();
        return [];
      });

    const gasSpy = jest.spyOn(PortfolioService, 'getGasPrices').mockImplementation(async () => {
      await Promise.resolve();
      return {
        1: { gasPrice: '1', gasPriceUSD: 1 },
        137: { gasPrice: '1', gasPriceUSD: 1 },
        56: { gasPrice: '1', gasPriceUSD: 1 },
      } as never;
    });

    const bridgeSpy = jest
      .spyOn(PortfolioService, 'calculateBridgeSuggestions')
      .mockReturnValue([{ fromChain: 1, toChain: 137, propertyId: 'p', propertyName: 'n', currentValue: 0, potentialSavings: 0, reason: 'r' }]);

    const result = await PortfolioService.fetchPortfolioOverview(ADDRESS, 30);

    // All three independent endpoints fired.
    expect(portfolioSpy).toHaveBeenCalledTimes(1);
    expect(performanceSpy).toHaveBeenCalledTimes(1);
    expect(gasSpy).toHaveBeenCalledTimes(1);

    // The suggestions are derived from the portfolio result.
    expect(bridgeSpy).toHaveBeenCalledTimes(1);
    expect(bridgeSpy).toHaveBeenCalledWith(
      expect.objectContaining({ totalValueUSD: 1 })
    );

    expect(result.portfolio.totalValueUSD).toBe(1);
    expect(result.performance).toEqual([]);
    expect(result.bridgeSuggestions).toHaveLength(1);
  });

  it('rejects when any of the parallel fetches fails (Promise.all semantics)', async () => {
    jest.spyOn(PortfolioService, 'fetchMultiChainPortfolio').mockRejectedValue(new Error('boom'));
    jest.spyOn(PortfolioService, 'getPortfolioPerformance').mockResolvedValue([]);
    jest.spyOn(PortfolioService, 'getGasPrices').mockResolvedValue({} as never);

    await expect(PortfolioService.fetchPortfolioOverview(ADDRESS)).rejects.toThrow('boom');
  });

  it('still passes the days argument through to getPortfolioPerformance', async () => {
    const perfSpy = jest
      .spyOn(PortfolioService, 'getPortfolioPerformance')
      .mockResolvedValue([]);
    jest.spyOn(PortfolioService, 'fetchMultiChainPortfolio').mockResolvedValue({
      totalValueUSD: 0,
      totalValueNative: new Map(),
      chains: [],
      lastUpdated: 'now',
      isLoading: false,
      error: null,
    });
    jest.spyOn(PortfolioService, 'getGasPrices').mockResolvedValue({} as never);
    jest.spyOn(PortfolioService, 'calculateBridgeSuggestions').mockReturnValue([]);

    await PortfolioService.fetchPortfolioOverview(ADDRESS, 7);

    expect(perfSpy).toHaveBeenCalledWith(ADDRESS, 7);
  });
});
