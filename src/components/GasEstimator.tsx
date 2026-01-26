'use client';

import React, { useState, useEffect } from 'react';
import { useEstimateGas, useGasPrice } from 'wagmi';
import { formatEther } from 'viem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface GasEstimatorProps {
  to?: string;
  value?: string;
  data?: string;
  enabled?: boolean;
}

export const GasEstimator: React.FC<GasEstimatorProps> = ({
  to,
  value,
  data,
  enabled = true,
}) => {
  const [estimatedGas, setEstimatedGas] = useState<string | null>(null);
  const [estimatedCost, setEstimatedCost] = useState<string | null>(null);

  const { data: gasPrice } = useGasPrice();
  const { data: gasEstimate } = useEstimateGas({
    to: to as `0x${string}`,
    value: value ? BigInt(value) : undefined,
    data: data as `0x${string}`,
  });

  useEffect(() => {
    if (gasEstimate && gasPrice) {
      const gasCost = gasEstimate * gasPrice;
      setEstimatedGas(gasEstimate.toString());
      setEstimatedCost(formatEther(gasCost));
    }
  }, [gasEstimate, gasPrice]);

  if (!enabled || !to) {
    return null;
  }

  const isLoading = !gasEstimate || !gasPrice;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Gas Estimation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Estimating gas...</span>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Gas Limit:</span>
              <Badge variant="secondary">{estimatedGas || 'N/A'}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Estimated Cost:</span>
              <Badge variant="secondary">
                {estimatedCost ? `${parseFloat(estimatedCost).toFixed(6)} ETH` : 'N/A'}
              </Badge>
            </div>
            {gasPrice && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Gas Price:</span>
                <Badge variant="outline">
                  {formatEther(gasPrice)} ETH
                </Badge>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};