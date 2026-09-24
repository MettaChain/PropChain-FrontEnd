'use client';

import React, { useEffect, useState } from "react";
import { useGasPriceStore } from "@/store/gasPriceStore";
import { useGasPrice } from "@/hooks/useGasPrice";

export const GasPriceBanner: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  useGasPrice();
  const { gasPrice, gasPriceThreshold } = useGasPriceStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || gasPrice === null || gasPrice <= gasPriceThreshold) {
    return null;
  }

  return (
    <div className="bg-yellow-100 text-yellow-900 text-center p-2 border-b border-yellow-300">
      High gas price warning: The current gas price is {gasPrice} Gwei, which is
      above your threshold of {gasPriceThreshold} Gwei.
    </div>
  );
};
