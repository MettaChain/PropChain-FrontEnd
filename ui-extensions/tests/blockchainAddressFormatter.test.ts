/**
 * Unit tests for the blockchain address truncation utility
 * (ui-extensions/utils/formatters.ts → formatAddress).
 *
 * Covers: standard truncation, custom prefix/suffix lengths, short address
 * (no truncation needed), invalid address input, checksum vs lowercase,
 * undefined/null input, and 100% branch coverage of formatAddress.
 *
 * Closes #1447
 */

import { formatAddress } from "../utils/formatters";

// A valid checksummed Ethereum address (42 chars including 0x prefix).
const CHECKSUM_ADDR = "0x52908400098527886E0F7030069857D2E4169EE7";
const LOWER_ADDR = CHECKSUM_ADDR.toLowerCase();

describe("formatAddress — standard truncation", () => {
  it("truncates to 0xABCD...WXYZ format with default prefix=6, suffix=4", () => {
    const result = formatAddress(CHECKSUM_ADDR);
    expect(result).toBe("0x5290...9EE7");
  });

  it("contains the first 6 chars of the address", () => {
    const result = formatAddress(CHECKSUM_ADDR);
    expect(result.startsWith("0x5290")).toBe(true);
  });

  it("contains the last 4 chars of the address", () => {
    const result = formatAddress(CHECKSUM_ADDR);
    expect(result.endsWith("9EE7")).toBe(true);
  });

  it("includes the ellipsis separator", () => {
    const result = formatAddress(CHECKSUM_ADDR);
    expect(result).toContain("...");
  });
});

describe("formatAddress — custom prefix/suffix lengths", () => {
  it("respects a custom prefix length of 4", () => {
    const result = formatAddress(LOWER_ADDR, 4, 2);
    expect(result).toBe("0x52...e7");
  });

  it("respects a custom suffix length of 6", () => {
    const result = formatAddress(CHECKSUM_ADDR, 6, 6);
    expect(result).toBe("0x5290...169EE7");
  });

  it("works with prefix=2 (just 0x) and suffix=4", () => {
    const result = formatAddress(CHECKSUM_ADDR, 2, 4);
    expect(result).toBe("0x...9EE7");
  });
});

describe("formatAddress — short address (no truncation needed)", () => {
  it("does not truncate when the address fits within prefix + suffix", () => {
    // A minimal valid address with prefix 6 + suffix 4 = 10 chars.
    // If address length ≤ 10 the function returns it as-is.
    // Note: a real address is always 42 chars; this tests the guard condition
    // by setting prefix + suffix >= address length.
    const result = formatAddress(CHECKSUM_ADDR, 42, 0);
    expect(result).toBe(CHECKSUM_ADDR);
  });
});

describe("formatAddress — invalid address input", () => {
  it("throws for an address that is too short", () => {
    expect(() => formatAddress("0x123")).toThrow();
  });

  it("throws for an address without 0x prefix", () => {
    expect(() => formatAddress("52908400098527886E0F7030069857D2E4169EE7")).toThrow();
  });

  it("throws for an empty string", () => {
    expect(() => formatAddress("")).toThrow();
  });

  it("throws for an address with non-hex characters", () => {
    expect(() => formatAddress("0xGGGG8400098527886E0F7030069857D2E4169EE7")).toThrow();
  });

  it("throws for a string that is 41 characters (one short)", () => {
    // 41 chars including 0x prefix → 39 hex chars → invalid
    expect(() => formatAddress("0x" + "a".repeat(39))).toThrow();
  });

  it("throws for a string that is 43 characters (one too many)", () => {
    expect(() => formatAddress("0x" + "a".repeat(41))).toThrow();
  });
});

describe("formatAddress — checksum vs lowercase", () => {
  it("preserves mixed-case checksum addresses", () => {
    const result = formatAddress(CHECKSUM_ADDR);
    expect(result).toBe("0x5290...9EE7");
  });

  it("preserves lowercase addresses without altering case", () => {
    const result = formatAddress(LOWER_ADDR, 4, 2);
    // 0x52...e7 — all lowercase
    expect(result).toMatch(/^0x[0-9a-f]+\.\.\.[0-9a-f]+$/);
  });

  it("treats checksum and lowercase of the same address consistently", () => {
    const upper = formatAddress(CHECKSUM_ADDR, 4, 4);
    const lower = formatAddress(LOWER_ADDR, 4, 4);
    // Same positions, different case.
    expect(upper.toLowerCase()).toBe(lower);
  });
});

describe("formatAddress — undefined/null input", () => {
  it("throws when called with null cast as string", () => {
    expect(() => formatAddress(null as unknown as string)).toThrow();
  });

  it("throws when called with undefined cast as string", () => {
    expect(() => formatAddress(undefined as unknown as string)).toThrow();
  });

  it("throws when called with a number cast as string", () => {
    expect(() => formatAddress(12345 as unknown as string)).toThrow();
  });
});
