import { logger } from "@/utils/logger";
import { createPublicClient, http, estimateContractGas } from "viem";
import { mainnet } from "viem/chains";

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

export interface SimulationResult {
  gasEstimate: bigint;
  tenderlyResponse: any;
  error?: string;
}

export async function simulateTransaction(txRequest: {
  from: string;
  to: string;
  value?: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
}): Promise<SimulationResult> {
  try {
    const gasEstimate = await estimateContractGas(publicClient, {
      account: txRequest.from as `0x${string}`,
      to: txRequest.to as `0x${string}`,
      data: (txRequest.data as `0x${string}`) || "0x",
      value: txRequest.value ? BigInt(txRequest.value) : undefined,
    });

    const simResponse = await fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(txRequest),
    });

    if (!simResponse.ok) {
      const errorBody = await simResponse.text();
      logger.error("Tenderly API simulation failed", {
        status: simResponse.status,
        error: errorBody,
      });
      return {
        gasEstimate,
        tenderlyResponse: null,
        error: `Simulation failed: ${errorBody}`,
      };
    }

    const tenderlyResponse = await simResponse.json();
    logger.info("Transaction simulated successfully via Tenderly", {
      tenderlyId: tenderlyResponse.simulation.id,
    });

    return { gasEstimate, tenderlyResponse };
  } catch (error: any) {
    logger.error("Error during transaction simulation:", error);

    let gasEstimate: bigint = BigInt(0);
    try {
      gasEstimate = await estimateContractGas(publicClient, {
        account: txRequest.from as `0x${string}`,
        to: txRequest.to as `0x${string}`,
        data: (txRequest.data as `0x${string}`) || "0x",
        value: txRequest.value ? BigInt(txRequest.value) : undefined,
      });
    } catch (gasError) {
      logger.error("Could not even estimate gas:", gasError);
    }

    return {
      gasEstimate,
      tenderlyResponse: null,
      error: error.message || "An unknown error occurred during simulation.",
    };
  }
}
