'use client';
import { logger } from '@/utils/logger';

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTransactionHistory } from '@/hooks/useTransactionQuery';
import type { Transaction, TransactionType, TransactionStatus } from '@/store/transactionStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, CalendarIcon, FileSpreadsheet, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/EmptyState';
import { History } from 'lucide-react';

const TRANSACTION_TYPES: TransactionType[] = ['purchase', 'transfer', 'management', 'other'];
const TRANSACTION_STATUSES: TransactionStatus[] = ['pending', 'processing', 'confirmed', 'failed', 'cancelled'];

const isTransactionType = (value: string): value is TransactionType =>
  TRANSACTION_TYPES.includes(value as TransactionType);

const isTransactionStatus = (value: string): value is TransactionStatus =>
  TRANSACTION_STATUSES.includes(value as TransactionStatus);

export const TransactionHistory: React.FC = () => {
  const { t } = useTranslation('common');
  const { transactions, getTransactionsByType, isLoading, error, refetch } = useTransactionHistory();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [showDateRange, setShowDateRange] = useState(false);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    if (typeFilter !== 'all') {
      filtered = getTransactionsByType(typeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(tx => tx.status === statusFilter);
    }

    if (dateRange.from) {
      filtered = filtered.filter(tx => tx.timestamp >= dateRange.from!.getTime());
    }

    if (dateRange.to) {
      filtered = filtered.filter(tx => tx.timestamp <= dateRange.to!.getTime());
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
  }, [transactions, typeFilter, statusFilter, searchTerm, dateRange, getTransactionsByType]);

  const calculateRealizedGainsLosses = (transaction: Transaction): number => {
    if (transaction.type === 'transfer' && transaction.value) {
      const value = parseFloat(transaction.value);
      return value * 0.1;
    }
    return 0;
  };

  const prepareExportData = () => {
    return filteredTransactions.map(tx => ({
      'Date': format(new Date(tx.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      'Transaction Hash': tx.hash,
      'Type': tx.type,
      'Status': tx.status,
      'From': tx.from,
      'To': tx.to || '',
      'Value': tx.value || '0',
      'Gas Used': tx.gasUsed || '0',
      'Gas Price': tx.gasPrice || '0',
      'Chain ID': tx.chainId,
      'Confirmations': tx.confirmations,
      'Description': tx.description || '',
      'Property ID': tx.propertyId || '',
      'Realized Gains/Losses': calculateRealizedGainsLosses(tx).toFixed(6),
      'Error': tx.error || '',
    }));
  };

  const exportToCSV = () => {
    try {
      const data = prepareExportData();
      const csvContent = [
        Object.keys(data[0] || {}).join(','),
        ...data.map(row =>
          Object.values(row).map(value => `"${value}"`).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const fileName = `transaction-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      saveAs(blob, fileName);
      toast.success('Transaction history exported to CSV successfully');
    } catch (error) {
      logger.error('Error exporting to CSV:', error);
      toast.error('Failed to export to CSV');
    }
  };

  const exportToExcel = () => {
    try {
      const data = prepareExportData();
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Transaction History');

      const colWidths = Object.keys(data[0] || {}).map(key => ({
        wch: Math.max(key.length, ...data.map(row => String((row as any)[key]).length))
      }));
      ws['!cols'] = colWidths;

      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const fileName = `transaction-history-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      saveAs(blob, fileName);
      toast.success('Transaction history exported to Excel successfully');
    } catch (error) {
      logger.error('Error exporting to Excel:', error);
      toast.error('Failed to export to Excel');
    }
  };

  const handleExport = (fmt: 'csv' | 'excel') => {
    if (filteredTransactions.length === 0) {
      toast.warning('No transactions to export');
      return;
    }
    if (fmt === 'csv') {
      exportToCSV();
    } else {
      exportToExcel();
    }
  };

  const rowsToRender = isLoading ? [] : filteredTransactions;

  return (
    <Card className="w-full" data-testid="transaction-list">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {t('transactions.transactionHistory')}
            <Badge variant="secondary">{isLoading ? '…' : filteredTransactions.length}</Badge>
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowDateRange(!showDateRange)}>
              <CalendarIcon className="h-4 w-4 mr-2" />
              {t('transactions.dateRange')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
              <FileText className="h-4 w-4 mr-2" />
              {t('transactions.exportCsv')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              {t('transactions.exportExcel')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div
            role="alert"
            className="flex items-center justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error || t('transactions.loadError')}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              {t('transactions.retry')}
            </Button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('transactions.searchPlaceholder')}
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
            <SelectTrigger className="w-full sm:w-40" data-testid="transaction-filter">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('transactions.allTypes')}</SelectItem>
              <SelectItem value="purchase">{t('transactions.purchase')}</SelectItem>
              <SelectItem value="transfer">{t('transactions.transfer')}</SelectItem>
              <SelectItem value="management">{t('transactions.management')}</SelectItem>
              <SelectItem value="other">{t('transactions.other')}</SelectItem>
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
            <SelectTrigger className="w-full sm:w-40" data-testid="transaction-status-filter">
              <SelectValue placeholder={t('transactions.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('transactions.allStatus')}</SelectItem>
              <SelectItem value="pending">{t('transactions.pending')}</SelectItem>
              <SelectItem value="processing">{t('transactions.processing')}</SelectItem>
              <SelectItem value="confirmed">{t('transactions.confirmed')}</SelectItem>
              <SelectItem value="failed">{t('transactions.failed')}</SelectItem>
              <SelectItem value="cancelled">{t('transactions.cancelled')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Filter */}
        {showDateRange && (
          <div className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg bg-muted/10">
            <div className="flex items-center gap-2 text-sm font-medium">
              {t('transactions.dateRange')}:
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? format(dateRange.from, 'PPP') : t('transactions.fromDate')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.to ? format(dateRange.to, 'PPP') : t('transactions.toDate')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDateRange({ from: undefined, to: undefined })}
            >
              {t('transactions.clear')}
            </Button>
          </div>
        )}

        {/* Transaction Table */}
        <div className="max-h-96 overflow-y-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hash</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">From</TableHead>
                <TableHead className="hidden md:table-cell">To</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : rowsToRender.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <EmptyState
                      title={searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                        ? t('transactions.noMatchFilters')
                        : t('transactions.noTransactions')}
                      description={searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                        ? t('transactions.adjustFilters')
                        : t('transactions.emptyDescription')}
                      icon={History}
                      className="py-12"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                rowsToRender.map((tx) => (
                  <TableRow key={tx.id} data-testid="transaction-item">
                    <TableCell className="font-mono text-xs">
                      {tx.hash.slice(0, 10)}…{tx.hash.slice(-8)}
                    </TableCell>
                    <TableCell className="capitalize">{tx.type}</TableCell>
                    <TableCell className="capitalize">{tx.status}</TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-xs">
                      {tx.from.slice(0, 10)}…{tx.from.slice(-8)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-xs">
                      {tx.to ? `${tx.to.slice(0, 10)}…${tx.to.slice(-8)}` : '-'}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {new Date(tx.timestamp).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!isLoading && filteredTransactions.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{t('transactions.totalTransactions')}: {filteredTransactions.length}</span>
              <span>
                {t('transactions.confirmed')}: {filteredTransactions.filter(tx => tx.status === 'confirmed').length} |
                {t('transactions.failed')}: {filteredTransactions.filter(tx => tx.status === 'failed').length}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};