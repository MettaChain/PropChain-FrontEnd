import { addToCompare, aggregatePortfolio, compareMetrics, DEFAULT_PREFS, estimateGas, isNotificationOn } from "../hooks/usePortfolioHooks";

describe("portfolio hooks helpers", () => {
  it("aggregates holdings across chains", () => {
    const r = aggregatePortfolio([
      { chainId: 1, asset: "PROP", value: 300, cost: 200 },
      { chainId: 137, asset: "PROP", value: 100, cost: 100 },
      { chainId: 1, asset: "USDC", value: 100, cost: 100 },
    ]);
    expect(r.total).toBe(500);
    expect(r.pnl).toBe(100);
    expect(r.allocation.PROP).toBe(80);
  });

  it("caps comparison at 5 and computes diffs", () => {
    let list = [] as { id: string; price: number; yieldPct: number }[];
    for (let i = 0; i < 7; i++) list = addToCompare(list, { id: `${i}`, price: 100 + i, yieldPct: 5 });
    expect(list).toHaveLength(5);
    expect(compareMetrics(list)[2].priceDiff).toBe(2);
  });

  it("respects master switch", () => {
    expect(isNotificationOn(DEFAULT_PREFS, "email", "transactions")).toBe(true);
    expect(isNotificationOn({ ...DEFAULT_PREFS, enabled: false }, "email", "transactions")).toBe(false);
  });

  it("estimates gas tiers", () => {
    const g = estimateGas("transfer", 10, 2000);
    expect(g.standard.eth).toBeCloseTo(0.00021);
    expect(g.fast.usd).toBeGreaterThan(g.slow.usd);
  });
});
