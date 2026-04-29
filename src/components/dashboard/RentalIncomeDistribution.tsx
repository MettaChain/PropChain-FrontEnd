"use client";
import { logger } from '@/utils/logger';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Calendar, History } from "lucide-react";
import DistributionHistory from "./RentalIncomeDistribution/DistributionHistory";
import PendingDistributions from "./RentalIncomeDistribution/PendingDistributions";
import DistributionCalendar from "./RentalIncomeDistribution/DistributionCalendar";
import CumulativeIncomeChart from "./RentalIncomeDistribution/CumulativeIncomeChart";

export interface Distribution {
  id: string;
  propertyId: string;
  propertyName: string;
  amount: number;
  timestamp: Date;
  claimed: boolean;
  claimHash?: string;
}

interface RentalIncomeDistributionProps {
  propertyId?: string;
  onClaimSuccess?: () => void;
}

const RentalIncomeDistribution = ({
  propertyId,
  onClaimSuccess,
}: RentalIncomeDistributionProps) => {
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("overview");

  useEffect(() => {
    loadDistributions();
  }, [propertyId]);

  const loadDistributions = async () => {
    try {
      setIsLoading(true);
      // TODO: Fetch distributions from backend/blockchain
      // const response = await fetch(`/api/distributions?propertyId=${propertyId}`);
      // const data = await response.json();
      // setDistributions(data);

      // Mock data for now
      setDistributions([
        {
          id: "1",
          propertyId: "prop-1",
          propertyName: "Downtown Loft",
          amount: 2500,
          timestamp: new Date("2025-04-01"),
          claimed: true,
          claimHash: "0x123...",
        },
        {
          id: "2",
          propertyId: "prop-1",
          propertyName: "Downtown Loft",
          amount: 2800,
          timestamp: new Date("2025-03-01"),
          claimed: true,
        },
        {
          id: "3",
          propertyId: "prop-1",
          propertyName: "Downtown Loft",
          amount: 3200,
          timestamp: new Date("2025-02-01"),
          claimed: false,
        },
        {
          id: "4",
          propertyId: "prop-2",
          propertyName: "Suburban House",
          amount: 1800,
          timestamp: new Date("2025-04-01"),
          claimed: true,
        },
      ]);
    } catch (error) {
      logger.error("Failed to load distributions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const pendingTotal = distributions
    .filter((d) => !d.claimed)
    .reduce((sum, d) => sum + d.amount, 0);

  const claimedTotal = distributions
    .filter((d) => d.claimed)
    .reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Rental Income Distributions
            </CardTitle>
            <CardDescription>
              View and manage your rental income distributions
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <PendingDistributions
            pending={pendingTotal}
            count={distributions.filter((d) => !d.claimed).length}
            onClaimAll={loadDistributions}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Claimed</CardTitle>
              <CardDescription>All-time claimed distributions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                ${claimedTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {distributions.filter((d) => d.claimed).length} transactions
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Calendar</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <CumulativeIncomeChart distributions={distributions} />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <DistributionHistory
              distributions={distributions}
              isLoading={isLoading}
              onRefresh={loadDistributions}
            />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <DistributionCalendar distributions={distributions} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default RentalIncomeDistribution;
