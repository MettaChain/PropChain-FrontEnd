/**
 * Batch purchase contract configuration.
 *
 * The batch purchase contract accepts the list of property token contracts,
 * quantities, per-item minimum amounts (derived from the user's slippage
 * tolerance), and a deadline, and is payable with the quoted total.
 *
 * The deployed address is read from NEXT_PUBLIC_BATCH_PURCHASE_ADDRESS and
 * validated before use. When it is unset or malformed, checkout fails closed
 * with an explicit configuration error instead of submitting anywhere.
 */

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

/**
 * ABI for the batch purchase entry point.
 *
 * `minAmounts` are the slippage-protected minimum amounts in wei: the
 * frontend computes them from the quoted per-token price and the user's
 * slippage tolerance, and the contract must reject the purchase if any
 * property token would be received below its minimum.
 */
export const BATCH_PURCHASE_ABI = [
  {
    type: "function" as const,
    name: "batchPurchase",
    stateMutability: "payable" as const,
    inputs: [
      { name: "propertyTokens", type: "address[]" },
      { name: "quantities", type: "uint256[]" },
      { name: "minAmounts", type: "uint256[]" },
      { name: "deadline", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

/**
 * Resolve the configured batch purchase contract address.
 *
 * Returns null when the address is missing or malformed so callers can fail
 * closed. A single network-agnostic variable is used for now; the config
 * should move to a per-chain map once deployments exist on more than one
 * network.
 */
export const getBatchPurchaseContractAddress = (): `0x${string}` | null => {
  const address = process.env.NEXT_PUBLIC_BATCH_PURCHASE_ADDRESS;
  if (!address || !ADDRESS_PATTERN.test(address)) {
    return null;
  }
  return address as `0x${string}`;
};
