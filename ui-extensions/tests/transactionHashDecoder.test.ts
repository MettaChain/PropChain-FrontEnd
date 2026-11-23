/**
 * Unit tests for the transaction revert-reason decoder utility
 * (ui-extensions/utils/formatters.ts → decodeRevert).
 *
 * Covers: successful revert reason decoding, unknown error signature,
 * null transaction hash, network errors, caching behaviour, and
 * 100% branch coverage of decodeRevert.
 *
 * Closes #1451
 */

import { encodeErrorResult, parseAbi } from "viem";
import { decodeRevert } from "../utils/formatters";

// The module-level cache inside formatters.ts persists across tests in the
// same Jest worker. We use unique tx hashes per test so entries never collide.
let txCounter = 0;
const nextHash = () => `0x${String(++txCounter).padStart(64, "0")}`;

const KNOWN_ABI = parseAbi(["error InsufficientBalance(uint256 needed)"]);
const OWNER_ABI = parseAbi(["error Unauthorised(address caller)"]);

// Helper: encode a known InsufficientBalance error.
function encodeInsufficient(needed: bigint) {
  return encodeErrorResult({ abi: KNOWN_ABI, errorName: "InsufficientBalance", args: [needed] }) as `0x${string}`;
}

describe("decodeRevert — successful decoding", () => {
  it("decodes a known single-arg error into a readable string", async () => {
    const hash = nextHash();
    const data = encodeInsufficient(42n);
    const result = await decodeRevert(hash, async () => data, KNOWN_ABI);
    expect(result).toBe("InsufficientBalance: 42");
  });

  it("decodes an error with an address argument", async () => {
    const hash = nextHash();
    const data = encodeErrorResult({
      abi: OWNER_ABI,
      errorName: "Unauthorised",
      args: ["0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF"],
    }) as `0x${string}`;
    const result = await decodeRevert(hash, async () => data, OWNER_ABI);
    expect(result).toMatch(/Unauthorised/);
  });

  it("decodes an error with no arguments (error name only)", async () => {
    const noArgAbi = parseAbi(["error NotFound()"]);
    const hash = nextHash();
    const data = encodeErrorResult({ abi: noArgAbi, errorName: "NotFound", args: [] }) as `0x${string}`;
    const result = await decodeRevert(hash, async () => data, noArgAbi);
    expect(result).toBe("NotFound");
  });
});

describe("decodeRevert — unknown error signature", () => {
  it("returns 'Unknown error' for an unrecognised 4-byte selector", async () => {
    const hash = nextHash();
    // 0xdeadbeef is not in KNOWN_ABI.
    const result = await decodeRevert(hash, async () => "0xdeadbeef", KNOWN_ABI);
    expect(result).toBe("Unknown error");
  });

  it("returns 'Unknown error' when no ABI is provided", async () => {
    const hash = nextHash();
    const data = encodeInsufficient(1n);
    const result = await decodeRevert(hash, async () => data);
    expect(result).toBe("Unknown error");
  });

  it("returns 'Unknown error' for empty hex data", async () => {
    const hash = nextHash();
    const result = await decodeRevert(hash, async () => "0x", KNOWN_ABI);
    expect(result).toBe("Unknown error");
  });
});

describe("decodeRevert — null transaction hash", () => {
  it("returns 'Unknown error' when getRevertData resolves to null", async () => {
    const hash = nextHash();
    const result = await decodeRevert(hash, async () => null, KNOWN_ABI);
    expect(result).toBe("Unknown error");
  });
});

describe("decodeRevert — network errors", () => {
  it("returns 'Unknown error' when getRevertData rejects", async () => {
    const hash = nextHash();
    const result = await decodeRevert(
      hash,
      async () => { throw new Error("Network timeout"); },
      KNOWN_ABI,
    );
    expect(result).toBe("Unknown error");
  });

  it("returns 'Unknown error' for a non-Error rejection", async () => {
    const hash = nextHash();
    const result = await decodeRevert(
      hash,
      async () => { throw "string rejection"; }, // eslint-disable-line no-throw-literal
      KNOWN_ABI,
    );
    expect(result).toBe("Unknown error");
  });
});

describe("decodeRevert — caching behaviour", () => {
  it("calls getRevertData only once for repeated lookups of the same hash", async () => {
    const hash = nextHash();
    const data = encodeInsufficient(99n);
    const getRevertData = jest.fn(async () => data);

    await decodeRevert(hash, getRevertData, KNOWN_ABI);
    await decodeRevert(hash, getRevertData, KNOWN_ABI);
    await decodeRevert(hash, getRevertData, KNOWN_ABI);

    expect(getRevertData).toHaveBeenCalledTimes(1);
  });

  it("returns the cached result without calling getRevertData again", async () => {
    const hash = nextHash();
    const data = encodeInsufficient(7n);
    const getRevertData = jest.fn(async () => data);

    const first = await decodeRevert(hash, getRevertData, KNOWN_ABI);
    // Replace the spy with a rejecting mock — cache should prevent it from being called.
    const failing = jest.fn(async () => { throw new Error("should not call"); });
    const second = await decodeRevert(hash, failing, KNOWN_ABI);

    expect(first).toBe("InsufficientBalance: 7");
    expect(second).toBe(first);
    expect(failing).not.toHaveBeenCalled();
  });

  it("caches 'Unknown error' results so network errors are not retried", async () => {
    const hash = nextHash();
    const failing = jest.fn(async () => { throw new Error("timeout"); });

    await decodeRevert(hash, failing, KNOWN_ABI);
    await decodeRevert(hash, failing, KNOWN_ABI);

    expect(failing).toHaveBeenCalledTimes(1);
  });

  it("stores different results for different hashes", async () => {
    const hashA = nextHash();
    const hashB = nextHash();
    const dataA = encodeInsufficient(1n);
    const dataB = encodeInsufficient(2n);

    const resultA = await decodeRevert(hashA, async () => dataA, KNOWN_ABI);
    const resultB = await decodeRevert(hashB, async () => dataB, KNOWN_ABI);

    expect(resultA).toBe("InsufficientBalance: 1");
    expect(resultB).toBe("InsufficientBalance: 2");
    expect(resultA).not.toBe(resultB);
  });
});
