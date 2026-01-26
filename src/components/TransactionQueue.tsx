'use client';

import React, { useState } from 'react';
import { useTransactionStore, Transaction } from '@/store/transactionStore';
import { TransactionCard } from './TransactionCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Filter } from 'lucide-react';
import { toast } from 'sonner';

export const TransactionQueue: React.FC = () => {
  const {
    pendingTransactions,
    recentTransactions,
    isLoading,
    setLoading,
  } = useTransactionStore();

  const [activeTab, setActiveTab] = useState('pending');

  const handleRetry = async (transaction: Transaction) => {
    // Implement retry logic here
    toast.info('Retry functionality not yet implemented');
  };

  const handleCancel = async (transaction: Transaction) => {
    // Implement cancel logic here
    toast.info('Cancel functionality not yet implemented');
  };

  const handleRefresh = () => {
    setLoading(true);
    // Implement refresh logic here
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Transaction Queue
            <Badge variant="secondary">
              {pendingTransactions.length + recentTransactions.length}
            </Badge>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              Pending
              {pendingTransactions.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {pendingTransactions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center gap-2">
              Recent
              {recentTransactions.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {recentTransactions.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4 mt-4">
            {pendingTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No pending transactions
              </div>
            ) : (
              pendingTransactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  onRetry={handleRetry}
                  onCancel={handleCancel}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="recent" className="space-y-4 mt-4">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No recent transactions
              </div>
            ) : (
              recentTransactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  onRetry={transaction.status === 'failed' ? handleRetry : undefined}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};