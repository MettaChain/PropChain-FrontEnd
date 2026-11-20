import { convert, mostSimilar, parseDateRange, propertyRoi, similarity } from "../utils/propertyMath";

describe("property math", () => {
  it("scores similarity between 0 and 1", () => {
    const a = { id: "a", price: 100, location: "NYC", type: "apt", amenities: ["pool"], yieldPct: 5 };
    expect(similarity(a, { ...a, id: "b" })).toBe(1);
    expect(similarity(a, { id: "c", price: 50 })).toBe(0.5);
    const list = mostSimilar(a, [{ id: "x", price: 10 }, { id: "y", price: 90, location: "NYC" }]);
    expect(list[0].id).toBe("y");
  });

  it("parses date ranges", () => {
    const now = new Date("2026-06-15T00:00:00Z");
    expect(parseDateRange("7d", now).start?.toISOString()).toBe("2026-06-08T00:00:00.000Z");
    expect(parseDateRange("1y", now).start?.toISOString()).toBe("2025-06-15T00:00:00.000Z");
    expect(parseDateRange("all", now).start).toBeNull();
    expect(parseDateRange("2026-01-01..2026-02-01").start?.getUTCMonth()).toBe(0);
    expect(() => parseDateRange("abc")).toThrow();
  });

  it("converts currencies with cached rates", async () => {
    const fetchRates = jest.fn(async () => ({ USD: 1, EUR: 0.9, GBP: 0.8, JPY: 150, CNY: 7, AED: 3.67 }));
    expect(await convert([100, 200], "USD", "EUR", fetchRates)).toEqual([90, 180]);
    await convert([1], "EUR", "GBP", fetchRates);
    expect(fetchRates).toHaveBeenCalledTimes(1);
  });

  it("calculates ROI", () => {
    const r = propertyRoi(100_000, [5_000, 5_000], 110_000, 2);
    expect(r.roi).toBe(20);
    expect(r.cashOnCash).toBe(5);
    expect(r.annualized).toBeCloseTo(9.54, 1);
  });
});
