"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle2, Clock } from "lucide-react";
import type { Distribution } from "../RentalIncomeDistribution";

interface DistributionHistoryProps {
  distributions: Distribution[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

const DistributionHistory = ({
  distributions,
  isLoading = false,
  onRefresh,
}: DistributionHistoryProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Distribution History</CardTitle>
          <CardDescription>All rental income distributions</CardDescription>
        </div>
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {distributions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No distributions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-semibold">Property</th>
                    <th className="text-left py-3 px-2 font-semibold">Amount</th>
                    <th className="text-left py-3 px-2 font-semibold">Date</th>
                    <th className="text-left py-3 px-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {distributions.map((dist) => (
                    <tr key={dist.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-2">
                        <div className="font-medium">{dist.propertyName}</div>
                        <div className="text-xs text-muted-foreground">{dist.propertyId}</div>
                      </td>
                      <td className="py-3 px-2 font-bold text-primary">
                        ${dist.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-2 text-sm">
                        {new Date(dist.timestamp).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-2">
                        {dist.claimed ? (
                          <Badge variant="outline" className="bg-green-50">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Claimed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-50">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DistributionHistory;
