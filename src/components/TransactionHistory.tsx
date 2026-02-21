'use client';

import React, { useState, useMemo } from 'react';
import { useTransactionStore } from '@/store/transactionStore';
import type { Transaction, TransactionType, TransactionStatus } from '@/store/transactionStore';
import { TransactionCard } from './TransactionCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Download } from 'lucide-react';
import { toast } from 'sonner';

const TRANSACTION_TYPES: TransactionType[] = ['purchase', 'transfer', 'management', 'other'];
const TRANSACTION_STATUSES: TransactionStatus[] = ['pending', 'processing', 'confirmed', 'failed', 'cancelled'];

const isTransactionType = (value: string): value is TransactionType =>
  TRANSACTION_TYPES.includes(value as TransactionType);

const isTransactionStatus = (value: string): value is TransactionStatus =>
  TRANSACTION_STATUSES.includes(value as TransactionStatus);

export const TransactionHistory: React.FC = () => {
  const { transactions, getTransactionsByType } = useTransactionStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all');

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    if (typeFilter !== 'all') {
      filtered = getTransactionsByType(typeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(tx => tx.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(tx =>
        tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.to?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [transactions, typeFilter, statusFilter, searchTerm, getTransactionsByType]);

  const handleExport = () => {
    // Implement export functionality
    toast.info('Export functionality not yet implemented');
  };

  const handleRetry = async (_transaction: Transaction) => {
    // Implement retry logic
    toast.info('Retry functionality not yet implemented');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Transaction History
            <Badge variant="secondary">{filteredTransactions.length}</Badge>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={typeFilter}
            onValueChange={(value) => {
              if (value === 'all' || isTransactionType(value)) {
                setTypeFilter(value);
              }
            }}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="purchase">Purchase</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
              <SelectItem value="management">Management</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              if (value === 'all' || isTransactionStatus(value)) {
                setStatusFilter(value);
              }
            }}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Transaction List */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'No transactions match your filters'
                : 'No transactions found'
              }
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                onRetry={transaction.status === 'failed' ? handleRetry : undefined}
              />
            ))
          )}
        </div>

        {/* Summary */}
        {filteredTransactions.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Total Transactions: {filteredTransactions.length}</span>
              <span>
                Confirmed: {filteredTransactions.filter(tx => tx.status === 'confirmed').length} |
                Failed: {filteredTransactions.filter(tx => tx.status === 'failed').length}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
