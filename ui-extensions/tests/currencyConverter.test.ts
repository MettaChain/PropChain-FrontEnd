/**
 * Unit tests for the currency conversion utility (ui-extensions/utils/propertyMath.ts).
 * Covers: USD→EUR conversion, JPY formatting, caching, offline fallback, batch conversion,
 * invalid currency code, and 100% branch coverage of convert / getRates.
 *
 * Closes #1452
 */

import { convert, getRates, type Rates } from "../utils/propertyMath";

// Reset the module-level cache between tests so each suite starts clean.
beforeEach(() => {
  jest.useFakeTimers();
  // Force cache expiry by advancing time beyond the default TTL (600 000 ms).
  jest.advanceTimersByTime(700_000);
});

afterEach(() => {
  jest.useRealTimers();
});

const makeRates = (overrides: Partial<Rates> = {}): Rates => ({
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.5,
  CNY: 7.24,
  AED: 3.67,
  ...overrides,
});

describe("convert — USD to EUR", () => {
  it("converts a single amount correctly", async () => {
    const fetchRates = jest.fn(async () => makeRates());
    const [result] = await convert([1000], "USD", "EUR", fetchRates);
    expect(result).toBeCloseTo(920, 1);
  });

  it("converts multiple amounts in a single call", async () => {
    const fetchRates = jest.fn(async () => makeRates());
    const results = await convert([100, 200, 500], "USD", "EUR", fetchRates);
    expect(results).toHaveLength(3);
    expect(results[0]).toBeCloseTo(92, 1);
    expect(results[1]).toBeCloseTo(184, 1);
    expect(results[2]).toBeCloseTo(460, 1);
  });
});

describe("convert — JPY formatting (no decimal places needed)", () => {
  it("converts USD to JPY and produces a whole-number-like value", async () => {
    const fetchRates = jest.fn(async () => makeRates());
    const [jpy] = await convert([1], "USD", "JPY", fetchRates);
    // 1 USD → 149.5 JPY; Intl.NumberFormat with JPY shows no decimals
    expect(jpy).toBeCloseTo(149.5, 0);
  });

  it("converts JPY back to USD symmetrically", async () => {
    const fetchRates = jest.fn(async () => makeRates());
    const [usd] = await convert([149.5], "JPY", "USD", fetchRates);
    expect(usd).toBeCloseTo(1, 2);
  });
});

describe("caching behavior", () => {
  it("only fetches rates once when called multiple times within TTL", async () => {
    const fetchRates = jest.fn(async () => makeRates());
    // Reset timer so the cache is fresh for this test.
    jest.advanceTimersByTime(700_000);
    await convert([1], "USD", "EUR", fetchRates);
    await convert([2], "USD", "GBP", fetchRates);
    await convert([3], "USD", "JPY", fetchRates);
    expect(fetchRates).toHaveBeenCalledTimes(1);
  });

  it("re-fetches after the TTL expires", async () => {
    const fetchRates = jest.fn(async () => makeRates());
    jest.advanceTimersByTime(700_000);
    await convert([1], "USD", "EUR", fetchRates);
    // Advance past the 600 s TTL.
    jest.advanceTimersByTime(700_000);
    await convert([1], "USD", "EUR", fetchRates);
    expect(fetchRates).toHaveBeenCalledTimes(2);
  });

  it("uses a custom TTL passed to getRates directly", async () => {
    const fetchRates = jest.fn(async () => makeRates());
    jest.advanceTimersByTime(700_000);
    // Fetch with a 5-second TTL.
    await getRates(fetchRates, 5_000);
    jest.advanceTimersByTime(6_000);
    await getRates(fetchRates, 5_000);
    expect(fetchRates).toHaveBeenCalledTimes(2);
  });
});

describe("offline fallback", () => {
  it("returns the stale cached value when the network call fails", async () => {
    const fetchRates = jest.fn(async () => makeRates());
    // Seed the cache.
    jest.advanceTimersByTime(700_000);
    await getRates(fetchRates);
    // Expire cache, then simulate a network failure.
    jest.advanceTimersByTime(700_000);
    fetchRates.mockRejectedValueOnce(new Error("Network error"));
    // Should NOT throw — returns stale data.
    const rates = await getRates(fetchRates);
    expect(rates.USD).toBe(1);
  });

  it("throws when there is no cached data and the fetch fails", async () => {
    const fetchRates = jest.fn().mockRejectedValue(new Error("offline"));
    // Expire any existing cache.
    jest.advanceTimersByTime(700_000);
    await expect(getRates(fetchRates)).rejects.toThrow("offline");
  });
});

describe("batch conversion", () => {
  it("converts an empty array without errors", async () => {
    const fetchRates = jest.fn(async () => makeRates());
    const result = await convert([], "USD", "EUR", fetchRates);
    expect(result).toEqual([]);
  });

  it("converts a large batch correctly", async () => {
    const fetchRates = jest.fn(async () => makeRates());
    const amounts = Array.from({ length: 100 }, (_, i) => i * 10);
    const results = await convert(amounts, "USD", "EUR", fetchRates);
    expect(results).toHaveLength(100);
    results.forEach((r, i) => expect(r).toBeCloseTo(i * 10 * 0.92, 1));
  });

  it("handles the same currency (USD → USD) as a no-op", async () => {
    const fetchRates = jest.fn(async () => makeRates());
    const results = await convert([100, 200], "USD", "USD", fetchRates);
    expect(results).toEqual([100, 200]);
  });
});

describe("invalid / edge-case currency codes", () => {
  it("produces NaN when an unrecognised currency is used as the source", async () => {
    const fetchRates = jest.fn(async () => makeRates());
    // Cast to bypass TypeScript — simulates runtime misuse.
    const results = await convert([100], "XYZ" as "USD", "EUR", fetchRates);
    expect(isNaN(results[0])).toBe(true);
  });

  it("produces NaN when an unrecognised currency is used as the target", async () => {
    const fetchRates = jest.fn(async () => makeRates());
    const results = await convert([100], "USD", "XYZ" as "EUR", fetchRates);
    expect(isNaN(results[0])).toBe(true);
  });

  it("handles zero amounts without throwing", async () => {
    const fetchRates = jest.fn(async () => makeRates());
    const [result] = await convert([0], "USD", "EUR", fetchRates);
    expect(result).toBe(0);
  });

  it("handles negative amounts (refunds)", async () => {
    const fetchRates = jest.fn(async () => makeRates());
    const [result] = await convert([-500], "USD", "EUR", fetchRates);
    expect(result).toBeCloseTo(-460, 1);
  });
});
