"use client";
import { logger } from '@/utils/logger';

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Check } from "lucide-react";

interface PendingDistributionsProps {
  pending: number;
  count: number;
  onClaimAll: () => void;
}

const PendingDistributions = ({ pending, count, onClaimAll }: PendingDistributionsProps) => {
  const [isClaiming, setIsClaiming] = useState(false);

  const handleClaimAll = async () => {
    setIsClaiming(true);
    try {
      // TODO: Implement claim functionality
      // await claimDistributions();
      onClaimAll();
    } catch (error) {
      logger.error("Failed to claim distributions:", error);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <Card className={count > 0 ? "border-warning" : ""}>
      <CardHeader>
        <CardTitle className="text-lg">Pending Distributions</CardTitle>
        <CardDescription>Ready to claim</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          {count > 0 && (
            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-1" />
          )}
          <div className="flex-1">
            <div className="text-3xl font-bold text-primary">
              ${pending.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {count} distribution{count !== 1 ? "s" : ""} awaiting claim
            </p>
          </div>
        </div>

        {count > 0 && (
          <Button
            onClick={handleClaimAll}
            disabled={isClaiming}
            className="w-full"
            size="lg"
          >
            {isClaiming ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Claiming...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Claim All ({count})
              </>
            )}
          </Button>
        )}

        {count === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">No pending distributions</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingDistributions;
