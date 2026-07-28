"use client";

import React, { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SLIPPAGE_PRESETS = [0.001, 0.005, 0.01]; // 0.1%, 0.5%, 1%

export const SlippageControl: React.FC = () => {
  const { slippageTolerance, setSlippageTolerance } = useCartStore();
  const [customSlippage, setCustomSlippage] = useState<string>(
    (slippageTolerance * 100).toString(),
  );

  const handlePresetClick = (preset: number) => {
    setSlippageTolerance(preset);
    setCustomSlippage((preset * 100).toString());
  };

  const handleCustomSlippageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    setCustomSlippage(value);
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue > 0) {
      setSlippageTolerance(numericValue / 100);
    }
  };

  return (
    <div className="space-y-4">
      <Label>Slippage Tolerance</Label>
      <div className="flex items-center space-x-2">
        {SLIPPAGE_PRESETS.map((preset) => (
          <Button
            key={preset}
            variant={slippageTolerance === preset ? "default" : "outline"}
            onClick={() => handlePresetClick(preset)}
          >
            {preset * 100}%
          </Button>
        ))}
        <Input
          type="number"
          step="0.1"
          min="0"
          value={customSlippage}
          onChange={handleCustomSlippageChange}
          className="w-24"
          placeholder="Custom"
        />
      </div>
    </div>
  );
};
