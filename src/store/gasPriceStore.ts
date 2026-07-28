import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GasPriceState {
  gasPrice: number | null;
  gasPriceThreshold: number;
  setGasPrice: (price: number) => void;
  setGasPriceThreshold: (threshold: number) => void;
}

export const useGasPriceStore = create<GasPriceState>()(
  persist(
    (set) => ({
      gasPrice: null,
      gasPriceThreshold: 20, // Default threshold
      setGasPrice: (price) => set({ gasPrice: price }),
      setGasPriceThreshold: (threshold) =>
        set({ gasPriceThreshold: threshold }),
    }),
    {
      name: "propchain-gas-price",
    },
  ),
);
