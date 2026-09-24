'use client';

import { useEffect } from "react";
import { useGasPriceStore } from "@/store/gasPriceStore";
import { logger } from "@/utils/logger";

const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;
const GAS_PRICE_API = `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${ETHERSCAN_API_KEY ?? ""}`;

export const useGasPrice = () => {
  const { setGasPrice } = useGasPriceStore();

  useEffect(() => {
    if (!ETHERSCAN_API_KEY) {
      logger.warn("NEXT_PUBLIC_ETHERSCAN_API_KEY is not set; skipping gas price polling");
      return;
    }

    const fetchGasPrice = async () => {
      try {
        const response = await fetch(GAS_PRICE_API);
        const data = await response.json();
        const price = parseInt(data.result.ProposeGasPrice, 10);
        if (Number.isFinite(price)) {
          setGasPrice(price);
        } else {
          logger.warn("Gas price API returned a non-numeric value; keeping previous estimate");
        }
      } catch (error) {
        logger.warn("Failed to fetch gas price, keeping previous estimate", { error });
      }
    };

    fetchGasPrice();
    const interval = setInterval(fetchGasPrice, 15000); // Fetch every 15 seconds

    return () => clearInterval(interval);
  }, [setGasPrice]);
};
