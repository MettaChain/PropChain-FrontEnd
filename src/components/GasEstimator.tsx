'use client';

import React, { useState, useEffect } from 'react';
import { useEstimateGas, useGasPrice } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, ExternalLink, Zap, Clock, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GasEstimatorProps {
  to?: string;
  value?: string;
  data?: string;
  enabled?: boolean;
}

type GasSpeed = 'slow' | 'standard' | 'fast';

const ETH_PRICE_USD = 2500; // Mock ETH price

export const GasEstimator: React.FC<GasEstimatorProps> = ({
  to,
  value,
  data,
  enabled = true,
}) => {
  const [selectedSpeed, setSelectedSpeed] = useState<GasSpeed>('standard');
  const [estimatedGas, setEstimatedGas] = useState<bigint | null>(null);
  
  const { data: baseGasPrice, isLoading: isGasPriceLoading } = useGasPrice();
  const { data: gasEstimate, isLoading: isGasEstimateLoading } = useEstimateGas({
    to: to as `0x${string}`,
    value: value ? BigInt(value) : undefined,
    data: data as `0x${string}`,
  });

  useEffect(() => {
    if (gasEstimate) {
      setEstimatedGas(gasEstimate);
    }
  }, [gasEstimate]);

  if (!enabled || !to) {
    return null;
  }

  const isLoading = isGasPriceLoading || isGasEstimateLoading;

  // Calculate speed-adjusted gas price
  const getAdjustedGasPrice = () => {
    if (!baseGasPrice) return null;
    switch (selectedSpeed) {
      case 'slow': return (baseGasPrice * 90n) / 100n;
      case 'fast': return (baseGasPrice * 125n) / 100n;
      default: return baseGasPrice;
    }
  };

  const adjustedGasPrice = getAdjustedGasPrice();
  const totalCostWei = estimatedGas && adjustedGasPrice ? estimatedGas * adjustedGasPrice : null;
  const totalCostEth = totalCostWei ? formatUnits(totalCostWei, 18) : null;
  const totalCostUsd = totalCostEth ? (parseFloat(totalCostEth) * ETH_PRICE_USD).toFixed(2) : null;
  
  const isHighGas = adjustedGasPrice ? adjustedGasPrice > parseUnits('100', 9) : false;

  return (
    <Card className="w-full border-blue-100 dark:border-blue-900 shadow-lg">
      <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Gauge className="h-4 w-4 text-blue-500" />
            Gas Fee Estimator
          </CardTitle>
          <a 
            href="https://etherscan.io/gastracker" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline flex items-center gap-1"
          >
            Gas Tracker <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-6 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="text-sm text-muted-foreground animate-pulse">Calculating optimal gas...</span>
          </div>
        ) : (
          <>
            {/* Speed Selector */}
            <div className="grid grid-cols-3 gap-2">
              {(['slow', 'standard', 'fast'] as GasSpeed[]).map((speed) => (
                <Button
                  key={speed}
                  variant={selectedSpeed === speed ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    "flex flex-col h-auto py-2 gap-1 capitalize",
                    selectedSpeed === speed && speed === 'fast' && "bg-orange-500 hover:bg-orange-600",
                    selectedSpeed === speed && speed === 'slow' && "bg-green-600 hover:bg-green-700"
                  )}
                  onClick={() => setSelectedSpeed(speed)}
                >
                  {speed === 'slow' && <Clock className="h-3 w-3" />}
                  {speed === 'standard' && <Gauge className="h-3 w-3" />}
                  {speed === 'fast' && <Zap className="h-3 w-3" />}
                  <span className="text-[10px]">{speed}</span>
                </Button>
              ))}
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground font-medium">Estimated Cost</span>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    ${totalCostUsd || '0.00'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {totalCostEth ? parseFloat(totalCostEth).toFixed(6) : '0'} ETH
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-200 dark:bg-gray-700" />

              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Gas Price</span>
                <span className="font-mono">
                  {adjustedGasPrice ? formatUnits(adjustedGasPrice, 9).split('.')[0] : '0'} Gwei
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Gas Limit</span>
                <span className="font-mono">{estimatedGas?.toString() || '0'}</span>
              </div>
            </div>

            {isHighGas && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 dark:text-amber-200">
                  <p className="font-bold">Unusually High Gas</p>
                  <p>Network is currently congested. You might want to wait for lower fees.</p>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
