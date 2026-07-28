import React from "react";
import { useGasPriceStore } from "@/store/gasPriceStore";

export const GasPriceBanner: React.FC = () => {
  const { gasPrice, gasPriceThreshold } = useGasPriceStore();

  if (gasPrice === null || gasPrice <= gasPriceThreshold) {
    return null;
  }

  return (
    <div className="bg-yellow-500 text-white text-center p-2">
      High gas price warning: The current gas price is {gasPrice} Gwei, which is
      above your threshold of {gasPriceThreshold} Gwei.
    </div>
  );
};
