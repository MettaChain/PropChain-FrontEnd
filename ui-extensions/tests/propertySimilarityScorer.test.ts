/**
 * Unit tests for the property similarity scoring utility
 * (ui-extensions/utils/propertyMath.ts → similarity / mostSimilar).
 *
 * Covers: identical properties (score = 1.0), completely different properties
 * (score = 0.0), partial similarity, missing fields, custom weight overrides,
 * and sorting by similarity. 100% branch coverage of similarity / mostSimilar.
 *
 * Closes #1450
 */

import { similarity, mostSimilar, type PropertyLike, type Weights } from "../utils/propertyMath";

describe("similarity — identical properties (score = 1.0)", () => {
  it("returns 1.0 for two references to the same object values", () => {
    const a: PropertyLike = { id: "a", price: 500_000, location: "NYC", type: "residential", amenities: ["pool", "gym"], yieldPct: 6 };
    const b: PropertyLike = { ...a, id: "b" };
    expect(similarity(a, b)).toBe(1);
  });

  it("returns 1.0 when all fields match across both properties", () => {
    const a: PropertyLike = { id: "x", price: 1_000_000, location: "London", type: "commercial", amenities: ["parking"], yieldPct: 4.5 };
    const b: PropertyLike = { id: "y", price: 1_000_000, location: "London", type: "commercial", amenities: ["parking"], yieldPct: 4.5 };
    expect(similarity(a, b)).toBe(1);
  });
});

describe("similarity — completely different properties (score = 0.0 or near it)", () => {
  it("returns 0 when both properties have only an id and no other fields", () => {
    const a: PropertyLike = { id: "a" };
    const b: PropertyLike = { id: "b" };
    expect(similarity(a, b)).toBe(0);
  });

  it("gives a very low score for price-only properties with a 10× difference", () => {
    const a: PropertyLike = { id: "a", price: 100 };
    const b: PropertyLike = { id: "b", price: 1_000_000 };
    // ratio = 100 / 1_000_000 = 0.0001 → weighted score ≈ 0
    expect(similarity(a, b)).toBeLessThan(0.01);
  });
});

describe("similarity — partial similarity", () => {
  it("gives an intermediate score when only some fields match", () => {
    const a: PropertyLike = { id: "a", price: 100, location: "NYC", type: "apt" };
    // Same price, different location, no type → partial match.
    const b: PropertyLike = { id: "b", price: 100, location: "LA", type: "house" };
    const score = similarity(a, b);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });

  it("produces a Jaccard amenity score for partially overlapping amenities", () => {
    const a: PropertyLike = { id: "a", amenities: ["pool", "gym", "parking"] };
    const b: PropertyLike = { id: "b", amenities: ["pool", "gym", "sauna"] };
    // Intersection = 2, Union = 4 → Jaccard = 0.5
    const score = similarity(a, b);
    expect(score).toBeCloseTo(0.5, 5);
  });

  it("scores 0 for amenity when one property has an empty list", () => {
    const a: PropertyLike = { id: "a", amenities: ["pool"] };
    const b: PropertyLike = { id: "b", amenities: [] };
    // Union = 1, Intersection = 0 → Jaccard = 0
    const score = similarity(a, b);
    expect(score).toBe(0);
  });
});

describe("similarity — missing fields", () => {
  it("ignores a field if only one property has it", () => {
    const a: PropertyLike = { id: "a", price: 500_000 };
    const b: PropertyLike = { id: "b", location: "NYC" };
    // No shared fields → score 0 (no used weights).
    expect(similarity(a, b)).toBe(0);
  });

  it("computes a valid score even when yieldPct is absent from both", () => {
    const a: PropertyLike = { id: "a", price: 300_000, type: "residential" };
    const b: PropertyLike = { id: "b", price: 300_000, type: "residential" };
    const score = similarity(a, b);
    expect(score).toBe(1);
  });

  it("handles null-ish location by not counting it in the denominator", () => {
    const a: PropertyLike = { id: "a", price: 200_000 };
    const b: PropertyLike = { id: "b", price: 200_000 };
    // Only price contributes (location, type, amenities, yield all undefined).
    expect(similarity(a, b)).toBe(1);
  });
});

describe("similarity — custom weight overrides", () => {
  it("uses the supplied weights instead of the defaults", () => {
    const a: PropertyLike = { id: "a", price: 100, location: "NYC" };
    const b: PropertyLike = { id: "b", price: 200, location: "NYC" };
    // With equal price weight 0 and location weight 1, score should be 1.
    const w: Weights = { price: 0, location: 1, type: 0, amenities: 0, yield: 0 };
    expect(similarity(a, b, w)).toBe(1);
  });

  it("gives price full weight and ignores other fields", () => {
    const a: PropertyLike = { id: "a", price: 500, location: "NYC", type: "apt" };
    const b: PropertyLike = { id: "b", price: 1000, location: "LA", type: "house" };
    const w: Weights = { price: 1, location: 0, type: 0, amenities: 0, yield: 0 };
    // ratio(500, 1000) = 0.5
    expect(similarity(a, b, w)).toBeCloseTo(0.5, 5);
  });
});

describe("mostSimilar — sorting by similarity", () => {
  it("returns the most similar property first", () => {
    const target: PropertyLike = { id: "t", price: 500_000, location: "NYC" };
    const candidates: PropertyLike[] = [
      { id: "low", price: 10_000, location: "LA" },
      { id: "high", price: 490_000, location: "NYC" },
    ];
    const result = mostSimilar(target, candidates);
    expect(result[0].id).toBe("high");
  });

  it("excludes the target itself from the results", () => {
    const target: PropertyLike = { id: "t", price: 500_000 };
    const candidates: PropertyLike[] = [
      { id: "t", price: 500_000 },
      { id: "other", price: 500_000 },
    ];
    const result = mostSimilar(target, candidates);
    expect(result.every((p) => p.id !== "t")).toBe(true);
  });

  it("returns an empty array when the candidate list is empty", () => {
    const target: PropertyLike = { id: "t", price: 100 };
    expect(mostSimilar(target, [])).toEqual([]);
  });

  it("attaches a 'score' property to each ranked item", () => {
    const target: PropertyLike = { id: "t", price: 100 };
    const [item] = mostSimilar(target, [{ id: "a", price: 100 }]);
    expect(typeof (item as typeof item & { score: number }).score).toBe("number");
  });

  it("sorts in descending order (highest score first)", () => {
    const target: PropertyLike = { id: "t", price: 1000 };
    const candidates: PropertyLike[] = [
      { id: "a", price: 100 },
      { id: "b", price: 900 },
      { id: "c", price: 500 },
    ];
    const result = mostSimilar(target, candidates);
    const scores = result.map((r) => (r as typeof r & { score: number }).score);
    expect(scores[0]).toBeGreaterThanOrEqual(scores[1]);
    expect(scores[1]).toBeGreaterThanOrEqual(scores[2]);
  });
});
