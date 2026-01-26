"use client";

import { useState } from "react";
// import { Header } from "@/components/dashboard/Header";
// import { Sidebar } from "@/components/dashboard/Sidebar";
import { PortfolioOverview } from "@/components/dashboard/PortfolioOverview";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { DiversificationChart } from "@/components/dashboard/DiversificationChart";
import { PropertiesList } from "@/components/dashboard/PropertiesList";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { IncomeTracker } from "@/components/dashboard/IncomeTracker";

import { RiskAnalysis } from "@/components/dashboard/RiskAnalysis";
import { PortfolioReport } from "@/components/dashboard/PortfolioReport";
import { DataRefreshWrapper } from "@/components/dashboard/DataRefreshWrapper";
import { WalletConnector } from "@/components/WalletConnector";
import { TransactionQueue } from "@/components/TransactionQueue";
import { TransactionHistory } from "@/components/TransactionHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("dashboard");

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeItem={activeItem}
        onItemClick={(item) => {
          setActiveItem(item);
          setSidebarOpen(false);
        }}
      /> */}

      <div className="flex-1 flex flex-col min-w-0">
        {/* <Header onMenuToggle={() => setSidebarOpen(true)} /> */}
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
          <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">PC</span>
                  </div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    PropChain
                  </h1>
                </div>
                <WalletConnector />
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 overflow-auto">
            {/* Welcome section */}
            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-bold">
                Welcome back, <span className="text-[#155DFC]">John</span>
              </h2>
              <p className="text-muted-foreground">
                Here's an overview of your real estate token portfolio
              </p>
            </div>

            {/* KPI Overview */}
            {/* <PortfolioOverview /> */}

             {/* Data Refresh Wrapper for KPIs */}
          <DataRefreshWrapper lastUpdated={new Date(Date.now() - 120000)}>
            <PortfolioOverview />
          </DataRefreshWrapper>

            {/* Charts row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <PerformanceChart />
              </div>
              <div className="xl:col-span-1">
                <DiversificationChart />
              </div>
            </div>

            {/* Income Tracker */}
            <IncomeTracker />

             {/* Risk Analysis */}
          <RiskAnalysis />

          {/* Export Reports */}
          <PortfolioReport />

            {/* Properties */}
            <PropertiesList />

            {/* Transaction Management */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Transaction Management</h3>
              <Tabs defaultValue="queue" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="queue">Transaction Queue</TabsTrigger>
                  <TabsTrigger value="history">Transaction History</TabsTrigger>
                </TabsList>
                <TabsContent value="queue">
                  <TransactionQueue />
                </TabsContent>
                <TabsContent value="history">
                  <TransactionHistory />
                </TabsContent>
              </Tabs>
            </div>

            {/* Transactions */}
            <RecentTransactions />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Index;
