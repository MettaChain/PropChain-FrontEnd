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
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, CalendarIcon, FileSpreadsheet, FileText, AlertCircle, ArrowUpDown, TrendingUp, PieChart, BarChart3, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/EmptyState';
import { History } from 'lucide-react';
import { TransactionDetailsModal } from '@/components/TransactionDetailsModal';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';
import { TableSkeleton } from '@/components/ui/LoadingSkeletons';

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
  const [propertyFilter, setPropertyFilter] = useState<string>('');
  const [amountRange, setAmountRange] = useState<[number, number]>([0, 1000000]);
  const [gasPriceRange, setGasPriceRange] = useState<[number, number]>([0, 100]);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [showDateRange, setShowDateRange] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'timestamp' | 'value' | 'gasUsed'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'analytics'>('list');

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    if (typeFilter !== 'all') {
      filtered = getTransactionsByType(typeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(tx => tx.status === statusFilter);
    }

    if (propertyFilter) {
      filtered = filtered.filter(tx => tx.propertyId?.toLowerCase().includes(propertyFilter.toLowerCase()));
    }

    if (amountRange[0] > 0 || amountRange[1] < 1000000) {
      filtered = filtered.filter(tx => {
        const value = parseFloat(tx.value || '0');
        return value >= amountRange[0] && value <= amountRange[1];
      });
    }

    if (gasPriceRange[0] > 0 || gasPriceRange[1] < 100) {
      filtered = filtered.filter(tx => {
        const gasPrice = parseFloat(tx.gasPrice || '0');
        return gasPrice >= gasPriceRange[0] && gasPrice <= gasPriceRange[1];
      });
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

    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'timestamp') {
        comparison = a.timestamp - b.timestamp;
      } else if (sortBy === 'value') {
        comparison = parseFloat(a.value || '0') - parseFloat(b.value || '0');
      } else if (sortBy === 'gasUsed') {
        comparison = parseFloat(a.gasUsed || '0') - parseFloat(b.gasUsed || '0');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [transactions, typeFilter, statusFilter, searchTerm, dateRange, getTransactionsByType, propertyFilter, amountRange, gasPriceRange, sortBy, sortOrder]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const handleSort = (field: 'timestamp' | 'value' | 'gasUsed') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  const analyticsData = useMemo(() => {
    const statusCounts = filteredTransactions.reduce((acc, tx) => {
      acc[tx.status] = (acc[tx.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const typeCounts = filteredTransactions.reduce((acc, tx) => {
      acc[tx.type] = (acc[tx.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dailyVolume = filteredTransactions.reduce((acc, tx) => {
      const date = format(new Date(tx.timestamp), 'yyyy-MM-dd');
      acc[date] = (acc[date] || 0) + parseFloat(tx.value || '0');
      return acc;
    }, {} as Record<string, number>);

    const statusChartData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
    const typeChartData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
    const volumeChartData = Object.entries(dailyVolume)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);

    return { statusChartData, typeChartData, volumeChartData };
  }, [filteredTransactions]);

  const chartConfig = {
    confirmed: { label: 'Confirmed', color: '#22c55e' },
    pending: { label: 'Pending', color: '#eab308' },
    processing: { label: 'Processing', color: '#3b82f6' },
    failed: { label: 'Failed', color: '#ef4444' },
    cancelled: { label: 'Cancelled', color: '#6b7280' },
    purchase: { label: 'Purchase', color: '#3b82f6' },
    transfer: { label: 'Transfer', color: '#8b5cf6' },
    management: { label: 'Management', color: '#f97316' },
    other: { label: 'Other', color: '#6b7280' },
  };

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

  const rowsToRender = isLoading ? [] : paginatedTransactions;

  return (
    <Card className="w-full" data-testid="transaction-list">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            {t('transactions.transactionHistory')}
            <Badge variant="secondary">{isLoading ? '…' : filteredTransactions.length}</Badge>
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'list' | 'analytics')} className="w-auto">
              <TabsList>
                <TabsTrigger value="list">List</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="sm" onClick={() => setShowDateRange(!showDateRange)}>
              <CalendarIcon className="h-4 w-4 mr-2" />
              {t('transactions.dateRange')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
              <Search className="h-4 w-4 mr-2" />
              Filters
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

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'list' | 'analytics')} className="w-full">
          <TabsContent value="list" className="space-y-4">
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

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'timestamp' | 'value' | 'gasUsed')}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="timestamp">Time</SelectItem>
                  <SelectItem value="value">Value</SelectItem>
                  <SelectItem value="gasUsed">Gas Used</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="w-full sm:w-auto"
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                {sortOrder === 'asc' ? 'Asc' : 'Desc'}
              </Button>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="p-4 border rounded-lg bg-muted/10 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Property ID</label>
                  <Input
                    placeholder="Filter by property ID"
                    value={propertyFilter}
                    onChange={(e) => setPropertyFilter(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount Range: {amountRange[0]} - {amountRange[1]}</label>
                  <Slider
                    value={amountRange}
                    onValueChange={(v) => setAmountRange(v as [number, number])}
                    max={1000000}
                    step={1000}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Gas Price Range (Gwei): {gasPriceRange[0]} - {gasPriceRange[1]}</label>
                  <Slider
                    value={gasPriceRange}
                    onValueChange={(v) => setGasPriceRange(v as [number, number])}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPropertyFilter('');
                    setAmountRange([0, 1000000]);
                    setGasPriceRange([0, 100]);
                  }}
                >
                  Clear Advanced Filters
                </Button>
              </div>
            )}

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
        {isLoading ? (
          <TableSkeleton rows={8} columns={6} showHeader={true} />
        ) : (
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
                {rowsToRender.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="p-0">
                      <EmptyState
                        title={searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                          ? 'No transactions match your filters'
                          : 'No transactions found'}
                        description={searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                          ? 'Try adjusting your search or filters to see more results.'
                          : 'Your transaction history will appear here once you start using the platform.'}
                        icon={History}
                        className="py-12"
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  rowsToRender.map((tx) => (
                    <TableRow key={tx.id}>
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
        )}

            {/* Transaction Table */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('timestamp')}>
                        <div className="flex items-center gap-1">
                          {t('transactions.time')}
                          {sortBy === 'timestamp' && <ArrowUpDown className="h-3 w-3" />}
                        </div>
                      </TableHead>
                      <TableHead>{t('transactions.hash')}</TableHead>
                      <TableHead>{t('transactions.type')}</TableHead>
                      <TableHead>{t('transactions.status')}</TableHead>
                      <TableHead className="hidden md:table-cell cursor-pointer hover:bg-muted/50" onClick={() => handleSort('value')}>
                        <div className="flex items-center gap-1">
                          {t('transactions.value')}
                          {sortBy === 'value' && <ArrowUpDown className="h-3 w-3" />}
                        </div>
                      </TableHead>
                      <TableHead className="hidden md:table-cell">{t('transactions.from')}</TableHead>
                      <TableHead className="hidden md:table-cell">{t('transactions.to')}</TableHead>
                      <TableHead className="hidden lg:table-cell cursor-pointer hover:bg-muted/50" onClick={() => handleSort('gasUsed')}>
                        <div className="flex items-center gap-1">
                          Gas
                          {sortBy === 'gasUsed' && <ArrowUpDown className="h-3 w-3" />}
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : rowsToRender.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="p-0">
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
                        <TableRow key={tx.id} data-testid="transaction-item" className="hover:bg-muted/50">
                          <TableCell className="text-xs text-muted-foreground">
                            {format(new Date(tx.timestamp), 'MMM dd, HH:mm')}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {tx.hash.slice(0, 8)}…{tx.hash.slice(-6)}
                          </TableCell>
                          <TableCell className="capitalize">{tx.type}</TableCell>
                          <TableCell className="capitalize">
                            <Badge variant={tx.status === 'confirmed' ? 'default' : tx.status === 'failed' ? 'destructive' : 'secondary'}>
                              {tx.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell font-mono text-xs">
                            {tx.value || '0'}
                          </TableCell>
                          <TableCell className="hidden md:table-cell font-mono text-xs">
                            {tx.from.slice(0, 8)}…{tx.from.slice(-6)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell font-mono text-xs">
                            {tx.to ? `${tx.to.slice(0, 8)}…${tx.to.slice(-6)}` : '-'}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell font-mono text-xs">
                            {tx.gasUsed || '0'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(tx)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Pagination */}
            {!isLoading && filteredTransactions.length > 0 && totalPages > 1 && (
              <div className="flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                      const pageNum = i + 1;
                      const showEllipsisBefore = i > 0 && pageNum > 2;
                      const showEllipsisAfter = i < 4 && pageNum < totalPages - 1;
                      
                      if (showEllipsisBefore) {
                        return (
                          <PaginationItem key={`ellipsis-before-${i}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      
                      if (showEllipsisAfter && i === 3) {
                        return (
                          <PaginationItem key={`ellipsis-after-${i}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setCurrentPage(pageNum)}
                            isActive={currentPage === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}

            {!isLoading && filteredTransactions.length > 0 && (
              <div className="pt-4 border-t">
                <div className="flex flex-col sm:flex-row justify-between gap-2 text-sm text-muted-foreground">
                  <span>{t('transactions.totalTransactions')}: {filteredTransactions.length}</span>
                  <span>
                    {t('transactions.confirmed')}: {filteredTransactions.filter(tx => tx.status === 'confirmed').length} |
                    {t('transactions.failed')}: {filteredTransactions.filter(tx => tx.status === 'failed').length}
                  </span>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {!isLoading && filteredTransactions.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <PieChart className="h-5 w-5" />
                      Transaction Status Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={analyticsData.statusChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {analyticsData.statusChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={chartConfig[entry.name as keyof typeof chartConfig]?.color || '#8884d8'} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <ChartLegend content={<ChartLegendContent />} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Type Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BarChart3 className="h-5 w-5" />
                      Transaction Type Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.typeChartData}>
                          <XAxis dataKey="name" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="value" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Volume Over Time */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="h-5 w-5" />
                      Transaction Volume Over Time (Last 30 Days)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsData.volumeChartData}>
                          <XAxis dataKey="date" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <EmptyState
                title="No Data Available"
                description="Load transactions to view analytics"
                icon={BarChart3}
              />
            )}
          </TabsContent>
        </Tabs>

        <TransactionDetailsModal
          transaction={selectedTransaction}
          open={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedTransaction(null);
          }}
        />
      </CardContent>
    </Card>
  );
};