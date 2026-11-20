import { clusterMarkers, initialPaper, markerBounds, paperPnl, paperTrade, summarizeViolations } from "../hooks/useToolingHooks";

describe("tooling hooks helpers", () => {
  it("simulates paper trades", () => {
    let s = initialPaper();
    s = paperTrade(s, "p1", "buy", 10, 100);
    expect(s.cash).toBe(99_000);
    s = paperTrade(s, "p1", "sell", 4, 120);
    expect(s.holdings.p1.qty).toBe(6);
    expect(s.history).toHaveLength(2);
    expect(paperPnl(s, { p1: 150 })).toBe(300);
    expect(() => paperTrade(s, "p1", "sell", 100, 1)).toThrow();
  });

  it("computes bounds and clusters", () => {
    const m = [{ id: "a", lat: 1, lng: 1 }, { id: "b", lat: 1.01, lng: 1.01 }, { id: "c", lat: 40, lng: -70 }];
    expect(markerBounds(m)).toEqual({ south: 1, west: -70, north: 40, east: 1.01 });
    expect(clusterMarkers(m, 3)).toHaveLength(2);
    expect(markerBounds([])).toBeNull();
  });

  it("summarizes axe violations", () => {
    const r = summarizeViolations([{ id: "color-contrast", impact: "serious", help: "Increase contrast" }]);
    expect(r.passed).toBe(false);
    expect(r.bySeverity.serious).toBe(1);
    expect(summarizeViolations([]).passed).toBe(true);
  });
});
