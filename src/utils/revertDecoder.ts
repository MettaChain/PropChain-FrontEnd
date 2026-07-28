import { decodeErrorResult } from "viem";
import {
  REFERRAL_REWARDS_ABI,
  ERC20_ABI,
  REFERRAL_REGISTRY_ABI,
} from "@/config/referralContracts";

const allAbis = [
  ...REFERRAL_REWARDS_ABI,
  ...ERC20_ABI,
  ...REFERRAL_REGISTRY_ABI,
];

export const decodeRevertReason = (errorBytes: `0x${string}`) => {
  try {
    const error = decodeErrorResult({
      abi: allAbis,
      data: errorBytes,
    });

    return error.errorName;
  } catch (e) {
    return `Unknown revert: ${errorBytes}`;
  }
};
