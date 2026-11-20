import { encodeErrorResult, parseAbi } from "viem";
import { decodeRevert, formatAddress, formatPrice, resolveEns, resolveEnsBatch } from "../utils/formatters";

const ADDR = "0x52908400098527886E0F7030069857D2E4169EE7";

describe("formatters", () => {
  it("formats prices per locale and abbreviates", () => {
    expect(formatPrice(1234.5)).toBe("$1,234.50");
    expect(formatPrice(1_200_000, "USD", "en-US", true)).toBe("$1.2M");
    expect(formatPrice(1000, "JPY", "en-US")).toBe("¥1,000");
    expect(formatPrice(-5)).toBe("-$5.00");
  });

  it("truncates addresses and validates them", () => {
    expect(formatAddress(ADDR)).toBe("0x5290...9EE7");
    expect(formatAddress(ADDR.toLowerCase(), 4, 2)).toBe("0x52...e7");
    expect(() => formatAddress("0x123")).toThrow();
  });

  it("resolves ENS with cache and batch", async () => {
    const client = { getEnsAddress: jest.fn(async () => ADDR), getEnsName: jest.fn(async () => "alice.eth") };
    expect(await resolveEns(client, "alice.eth")).toBe(ADDR);
    await resolveEns(client, "alice.eth");
    expect(client.getEnsAddress).toHaveBeenCalledTimes(1);
    expect(await resolveEnsBatch(client, [ADDR, ""])).toEqual(["alice.eth", null]);
  });

  it("decodes known revert reasons and handles unknown ones", async () => {
    const abi = parseAbi(["error InsufficientBalance(uint256 needed)"]);
    const data = encodeErrorResult({ abi, errorName: "InsufficientBalance", args: [5n] });
    expect(await decodeRevert("0xa", async () => data, abi)).toBe("InsufficientBalance: 5");
    expect(await decodeRevert("0xb", async () => "0xdeadbeef")).toBe("Unknown error");
  });
});
