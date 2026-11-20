import { computeTrend, projectStaking, selectProposals, triggeredAlerts, type Proposal } from "../hooks/useMarketHooks";

describe("market hooks helpers", () => {
  it("computes valuation trend", () => {
    expect(computeTrend([{ date: "a", value: 100 }, { date: "b", value: 120 }])).toEqual({ direction: "up", changePct: 20 });
    expect(computeTrend([{ date: "a", value: 100 }]).direction).toBe("stable");
  });

  it("projects staking rewards with compounding", () => {
    const r = projectStaking(1000, 12, 365, "monthly");
    expect(r.schedule).toHaveLength(12);
    expect(r.effectiveApy).toBeCloseTo(12.68, 1);
    expect(projectStaking(0, 10, 365, "daily").total).toBe(0);
  });

  it("filters and sorts proposals", () => {
    const list: Proposal[] = [
      { id: "1", status: "active", createdAt: 1, endsAt: 9, votes: 5 },
      { id: "2", status: "active", createdAt: 2, endsAt: 3, votes: 1 },
      { id: "3", status: "failed", createdAt: 3, endsAt: 4, votes: 9 },
    ];
    expect(selectProposals(list, "active", "ending").map((p) => p.id)).toEqual(["2", "1"]);
    expect(selectProposals(list, "all", "votes", 1, 1).map((p) => p.id)).toEqual(["3"]);
  });

  it("returns triggered alerts", () => {
    const alerts = [{ id: "a", propertyId: "p1", threshold: 100 }, { id: "b", propertyId: "p2", threshold: 500 }];
    expect(triggeredAlerts(alerts, { p1: 150, p2: 200 }).map((a) => a.id)).toEqual(["a"]);
  });
});
