import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/utils/logger";

const TENDERLY_API_KEY = process.env.TENDERLY_API_KEY;
const TENDERLY_PROJECT_SLUG = process.env.TENDERLY_PROJECT_SLUG;
const TENDERLY_USER = process.env.TENDERLY_USER;

if (!TENDERLY_API_KEY || !TENDERLY_PROJECT_SLUG || !TENDERLY_USER) {
  logger.warn(
    "Tenderly environment variables are not set. Simulation API will not work.",
  );
}

export async function POST(req: NextRequest) {
  if (!TENDERLY_API_KEY || !TENDERLY_PROJECT_SLUG || !TENDERLY_USER) {
    return NextResponse.json(
      { error: "Tenderly not configured" },
      { status: 500 },
    );
  }

  try {
    const txRequest = await req.json();
    logger.info("Received simulation request", {
      to: txRequest.to,
      value: txRequest.value,
    });

    const tenderlyApiUrl = `https://api.tenderly.co/api/v1/account/${TENDERLY_USER}/project/${TENDERLY_PROJECT_SLUG}/simulate`;

    const simResponse = await fetch(tenderlyApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenderly-Access-Key": TENDERLY_API_KEY,
      },
      body: JSON.stringify({
        network_id: "1",
        from: txRequest.from,
        to: txRequest.to,
        input: txRequest.data || "0x",
        gas: txRequest.gasLimit ? parseInt(txRequest.gasLimit, 16) : 100000,
        gas_price: txRequest.gasPrice
          ? parseInt(txRequest.gasPrice, 16).toString()
          : "0",
        value: txRequest.value ? parseInt(txRequest.value, 16).toString() : "0",
        save: true,
        save_if_fails: true,
      }),
    });

    if (!simResponse.ok) {
      const errorBody = await simResponse.text();
      logger.error("Tenderly simulation failed", {
        status: simResponse.status,
        error: errorBody,
      });
      return NextResponse.json(
        { error: "Tenderly simulation failed", details: errorBody },
        { status: simResponse.status },
      );
    }

    const simData = await simResponse.json();
    logger.info("Tenderly simulation successful", {
      transactionHash: simData.transaction.hash,
    });

    return NextResponse.json(simData);
  } catch (error) {
    logger.error("Error in /api/simulate:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
