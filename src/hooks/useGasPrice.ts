'use client';

import { useEffect } from "react";
import { useGasPriceStore } from "@/store/gasPriceStore";

const GAS_PRICE_API =
  "https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=YourApiKeyToken";

export const useGasPrice = () => {
  const { setGasPrice } = useGasPriceStore();

  useEffect(() => {
    const fetchGasPrice = async () => {
      try {
        const response = await fetch(GAS_PRICE_API);
        const data = await response.json();
        const price = parseInt(data.result.ProposeGasPrice, 10);
        setGasPrice(price);
      } catch (error) {
        console.error("Error fetching gas price:", error);
      }
    };

    fetchGasPrice();
    const interval = setInterval(fetchGasPrice, 15000); // Fetch every 15 seconds

    return () => clearInterval(interval);
  }, [setGasPrice]);
};
