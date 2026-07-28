import { logger } from "@/utils/logger";

export interface SimulationResult {
  gasEstimate: bigint;
  tenderlyResponse: any;
  error?: string;
}

export const simulateTransaction = async (
  txRequest: any,
): Promise<SimulationResult> => {
  logger.info("Simulating transaction via internal API", { to: txRequest.to });
  try {
    const response = await fetch("/api/simulate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(txRequest),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error("Simulation API call failed", {
        status: response.status,
        error: errorBody,
      });
      throw new Error(`Simulation failed: ${errorBody}`);
    }

    const result = await response.json();
    logger.info("Simulation successful", {
      tenderlyTxHash: result.transaction.hash,
    });

    return {
      gasEstimate: BigInt(result.transaction.gas),
      tenderlyResponse: result,
    };
  } catch (error) {
    logger.error("Error in simulateTransaction:", error);
    return {
      gasEstimate: BigInt(0),
      tenderlyResponse: null,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};
