import { bestFormat, checkContrast, parseSearchQuery, placeholderUrl } from "../utils/searchA11yUtils";
import { clearRecommendationCache, recommend } from "../lib/recommendationService";

describe("search query parser", () => {
  it("parses operators, quotes and free text", () => {
    const r = parseSearchQuery('price:>=100000 type:apartment location:"New York" sea view');
    expect(r.filters).toEqual([
      { field: "price", op: ">=", value: 100000 },
      { field: "type", op: ":", value: "apartment" },
      { field: "location", op: ":", value: "New York" },
    ]);
    expect(r.text).toBe("sea view");
    expect(parseSearchQuery('location:"').filters).toEqual([{ field: "location", op: ":", value: '"' }]);
  });
});

describe("image + contrast helpers", () => {
  it("builds placeholders and picks formats", () => {
    expect(placeholderUrl("/a.jpg")).toBe("/a.jpg?w=10&q=10");
    expect(bestFormat(false, true)).toBe("webp");
  });
  it("checks WCAG contrast in hex, rgb and hsl", () => {
    expect(checkContrast("#000", "#fff").ratio).toBe(21);
    expect(checkContrast("rgb(119,119,119)", "hsl(0, 0%, 100%)").AA).toBe(false);
    expect(checkContrast("#777777", "#ffffff").suggestion).toBe("#000000");
  });
});

describe("recommendations", () => {
  const candidates = [
    { id: "1", type: "apartment", location: "NYC", popularity: 1 },
    { id: "2", type: "villa", location: "LA", popularity: 9 },
    { id: "3", type: "apartment", location: "LA", popularity: 5 },
  ];
  beforeEach(clearRecommendationCache);
  it("ranks by behavior and excludes owned", () => {
    const r = recommend("u1", candidates, [{ kind: "favorite", propertyType: "apartment", location: "NYC", at: 0 }], ["3"]);
    expect(r.map((x) => x.id)).toEqual(["1", "2"]);
  });
  it("falls back to popularity on cold start", () => {
    expect(recommend("u2", candidates, [], [], 1)[0]).toMatchObject({ id: "2", reason: "popular" });
  });
});
