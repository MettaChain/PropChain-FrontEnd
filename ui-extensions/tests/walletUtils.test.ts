import { buildTypedData, createWalletMachine, estimatePropertyTax, validatePropertyMetadata, walletTransition } from "../utils/walletUtils";

const domain = { name: "PropChain", version: "1", chainId: 1, verifyingContract: "0x0000000000000000000000000000000000000001" as const };

describe("wallet utils", () => {
  it("estimates property tax with exemptions", () => {
    const r = estimatePropertyTax(300_000, "US-TX", ["homestead"]);
    expect(r.annual).toBe(4950);
    expect(r.monthly).toBe(412.5);
    expect(() => estimatePropertyTax(1, "XX")).toThrow();
  });

  it("runs wallet transitions", () => {
    const seen: string[] = [];
    const m = createWalletMachine((s) => seen.push(s.status));
    m.send({ type: "CONNECT" });
    m.send({ type: "FAIL", error: "rejected" });
    m.send({ type: "RETRY" });
    m.send({ type: "SUCCESS", address: "0xabc" });
    expect(seen).toEqual(["connecting", "error", "reconnecting", "connected"]);
    expect(() => walletTransition({ status: "disconnected" }, { type: "RETRY" })).toThrow();
    expect(() => walletTransition({ status: "error", error: "x", attempt: 3 }, { type: "RETRY" })).toThrow();
  });

  it("builds and validates EIP-712 typed data", () => {
    const d = buildTypedData("vote", domain, { proposalId: 1n, support: 1 });
    expect(d.primaryType).toBe("Vote");
    expect(() => buildTypedData("permit", domain, { owner: "0x1" })).toThrow(/spender/);
  });

  it("validates property metadata", () => {
    expect(validatePropertyMetadata({ name: "A", type: "residential", price: 1, location: { city: "NYC", country: "US" } })).toEqual([]);
    const errors = validatePropertyMetadata({ name: "", type: "castle", price: -1, location: { city: "NYC" } });
    expect(errors.map((e) => e.path)).toEqual(expect.arrayContaining(["name", "type", "price", "location.country"]));
  });
});
