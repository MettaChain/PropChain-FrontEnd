'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  FileSignature, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Download,
  Filter,
  Eye,
  Calendar,
  Hash,
  Activity
} from 'lucide-react';
import { transactionAudit, type AuditTrailEntry, type AuditTrailStats } from '@/utils/audit/transactionAudit';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatEther } from 'ethers';
import { toast } from 'sonner';

interface TransactionAuditTrailProps {
  className?: string;
}

export const TransactionAuditTrail: React.FC<TransactionAuditTrailProps> = ({ className }) => {
  const [entries, setEntries] = useState<AuditTrailEntry[]>([]);
  const [stats, setStats] = useState<AuditTrailStats | null>(null);
  const [filteredEntries, setFilteredEntries] = useState<AuditTrailEntry[]>([]);
  const [filters, setFilters] = useState({
    riskLevel: 'all',
    status: 'all',
    signer: '',
    startDate: '',
    endDate: '',
  });
  const [showDetails, setShowDetails] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [entries, filters]);

  const loadData = () => {
    const allEntries = transactionAudit.getAllEntries();
    const statistics = transactionAudit.getStatistics();
    setEntries(allEntries);
    setStats(statistics);
  };

  const applyFilters = () => {
    let filtered = [...entries];

    if (filters.riskLevel !== 'all') {
      filtered = filtered.filter(entry => entry.riskLevel === filters.riskLevel);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(entry => entry.status === filters.status);
    }

    if (filters.signer) {
      filtered = filtered.filter(entry => 
        entry.signer.toLowerCase().includes(filters.signer.toLowerCase())
      );
    }

    if (filters.startDate) {
      const startTime = new Date(filters.startDate).getTime();
      filtered = filtered.filter(entry => entry.timestamp >= startTime);
    }

    if (filters.endDate) {
      const endTime = new Date(filters.endDate).getTime();
      filtered = filtered.filter(entry => entry.timestamp <= endTime);
    }

    setFilteredEntries(filtered);
  };

  const exportAuditTrail = () => {
    try {
      const exportData = transactionAudit.exportToJSON();
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transaction-audit-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Audit trail exported successfully');
    } catch (error) {
      toast.error('Failed to export audit trail');
    }
  };

  const clearAuditTrail = () => {
    if (confirm('Are you sure you want to clear the entire audit trail? This action cannot be undone.')) {
      transactionAudit.clearTrail();
      loadData();
      toast.success('Audit trail cleared');
    }
  };

  const getRiskLevelColor = (level: AuditTrailEntry['riskLevel']) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: AuditTrailEntry['status']) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatValue = (value: string) => {
    return parseFloat(formatEther(value || '0')).toFixed(6);
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.verifiedTransactions} verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatValue(stats.totalValueTransferred)} ETH</div>
            <p className="text-xs text-muted-foreground">
              Avg: {formatValue(stats.averageTransactionValue)} ETH
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.highRiskTransactions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.failedVerifications} failed verifications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Recipients</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueRecipients}</div>
            <p className="text-xs text-muted-foreground">
              Most active: {formatAddress(stats.mostActiveSigner)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Audit Trail
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportAuditTrail}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={clearAuditTrail}>
                <XCircle className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="risk-filter">Risk Level</Label>
              <Select value={filters.riskLevel} onValueChange={(value) => setFilters(prev => ({ ...prev, riskLevel: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="signer-filter">Signer</Label>
              <Input
                id="signer-filter"
                placeholder="Address or ENS..."
                value={filters.signer}
                onChange={(e) => setFilters(prev => ({ ...prev, signer: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions ({filteredEntries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No transactions found matching the current filters.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEntries.map((entry) => (
                <Card key={entry.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getRiskLevelColor(entry.riskLevel)}>
                            {entry.riskLevel.toUpperCase()}
                          </Badge>
                          <Badge className={getStatusColor(entry.status)}>
                            {entry.status.toUpperCase()}
                          </Badge>
                          {entry.verified && (
                            <Badge variant="outline" className="text-green-600 dark:text-green-400">
                              <FileSignature className="h-3 w-3 mr-1" />
                              EIP-712 Verified
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Value:</span>
                            <span className="font-medium">{formatValue(entry.value)} ETH</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-600 dark:text-gray-400">To:</span>
                            <span className="font-mono">{formatAddress(entry.to)}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Signer:</span>
                            <span className="font-mono">{formatAddress(entry.signer)}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Time:</span>
                            <span>{formatDate(entry.timestamp)}</span>
                          </div>
                          {entry.transactionHash && (
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Hash:</span>
                              <span className="font-mono">{formatAddress(entry.transactionHash)}</span>
                            </div>
                          )}
                        </div>

                        {entry.warnings.length > 0 && (
                          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-2">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                              <div className="space-y-1">
                                {entry.warnings.map((warning, index) => (
                                  <p key={index} className="text-xs text-yellow-700 dark:text-yellow-300">
                                    • {warning}
                                  </p>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDetails(showDetails === entry.id ? null : entry.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>

                    {showDetails === entry.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Tabs defaultValue="details" className="w-full">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="details">Details</TabsTrigger>
                            <TabsTrigger value="signature">Signature</TabsTrigger>
                            <TabsTrigger value="domain">Domain</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="details" className="space-y-2">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Chain ID:</span>
                                <p className="font-medium">{entry.chainId}</p>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Gas Used:</span>
                                <p className="font-medium">{entry.gasUsed || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Gas Price:</span>
                                <p className="font-medium">{entry.gasPrice ? formatValue(entry.gasPrice) + ' ETH' : 'N/A'}</p>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Block:</span>
                                <p className="font-medium">{entry.blockNumber || 'Pending'}</p>
                              </div>
                            </div>
                            {entry.data && entry.data !== '0x' && (
                              <div>
                                <span className="text-gray-600 dark:text-gray-400 text-sm">Data:</span>
                                <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded font-mono text-xs break-all">
                                  {entry.data}
                                </div>
                              </div>
                            )}
                          </TabsContent>
                          
                          <TabsContent value="signature" className="space-y-2">
                            <div className="text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Signature:</span>
                              <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded font-mono text-xs break-all">
                                {entry.signature}
                              </div>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="domain" className="space-y-2">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Domain Name:</span>
                                <p className="font-medium">{entry.domain.name}</p>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Version:</span>
                                <p className="font-medium">{entry.domain.version}</p>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Verifying Contract:</span>
                                <p className="font-mono text-xs">{formatAddress(entry.domain.verifyingContract)}</p>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Chain ID:</span>
                                <p className="font-medium">{entry.domain.chainId}</p>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
