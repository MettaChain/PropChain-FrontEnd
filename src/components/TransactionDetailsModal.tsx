'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Transaction } from '@/store/transactionStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Copy, ExternalLink, Download, X } from 'lucide-react';
import { CopyButton } from '@/components/ui/CopyButton';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

interface TransactionDetailsModalProps {
  transaction: Transaction | null;
  open: boolean;
  onClose: () => void;
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  transaction,
  open,
  onClose,
}) => {
  const { t } = useTranslation('common');

  if (!transaction) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'processing':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'failed':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'cancelled':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'transfer':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'management':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const downloadPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.text('Transaction Receipt', 14, 20);
      
      // Transaction details
      doc.setFontSize(12);
      const details = [
        ['Transaction Hash', transaction.hash],
        ['Type', transaction.type],
        ['Status', transaction.status],
        ['Date', format(new Date(transaction.timestamp), 'yyyy-MM-dd HH:mm:ss')],
        ['From', transaction.from],
        ['To', transaction.to || 'N/A'],
        ['Value', transaction.value || '0'],
        ['Gas Used', transaction.gasUsed || '0'],
        ['Gas Price', transaction.gasPrice || '0'],
        ['Chain ID', transaction.chainId.toString()],
        ['Confirmations', `${transaction.confirmations}/${transaction.requiredConfirmations}`],
        ['Property ID', transaction.propertyId || 'N/A'],
        ['Description', transaction.description || 'N/A'],
      ];

      if (transaction.error) {
        details.push(['Error', transaction.error]);
      }

      autoTable(doc, {
        startY: 30,
        head: [['Field', 'Value']],
        body: details,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });

      doc.save(`transaction-receipt-${transaction.hash.slice(0, 8)}.pdf`);
      toast.success('Transaction receipt downloaded successfully');
    } catch (error) {
      logger.error('Error downloading PDF', error);
      toast.error('Failed to download transaction receipt');
    }
  };

  const openExplorer = () => {
    const explorerUrl = `https://etherscan.io/tx/${transaction.hash}`;
    window.open(explorerUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              {t('transactions.transactionDetails')}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Type Badges */}
          <div className="flex flex-wrap gap-3">
            <Badge className={getStatusColor(transaction.status)}>
              {t(`transactions.${transaction.status}`)}
            </Badge>
            <Badge className={getTypeColor(transaction.type)}>
              {t(`transactions.${transaction.type}`)}
            </Badge>
            <Badge variant="outline">
              Chain ID: {transaction.chainId}
            </Badge>
          </div>

          {/* Transaction Hash */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              {t('transactions.hash')}
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono break-all">
                {transaction.hash}
              </code>
              <CopyButton text={transaction.hash} />
              <Button variant="outline" size="icon" onClick={openExplorer}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Transaction Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t('transactions.from')}
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono break-all">
                    {transaction.from}
                  </code>
                  <CopyButton text={transaction.from} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t('transactions.to')}
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono break-all">
                    {transaction.to || 'N/A'}
                  </code>
                  {transaction.to && <CopyButton text={transaction.to} />}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t('transactions.value')}
                </label>
                <div className="bg-muted px-3 py-2 rounded text-sm font-mono">
                  {transaction.value || '0'}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t('transactions.timestamp')}
                </label>
                <div className="bg-muted px-3 py-2 rounded text-sm">
                  {format(new Date(transaction.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t('transactions.gasUsed')}
                </label>
                <div className="bg-muted px-3 py-2 rounded text-sm font-mono">
                  {transaction.gasUsed || '0'}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t('transactions.gasPrice')}
                </label>
                <div className="bg-muted px-3 py-2 rounded text-sm font-mono">
                  {transaction.gasPrice || '0'}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {t('transactions.confirmations')}
              </label>
              <div className="bg-muted px-3 py-2 rounded text-sm">
                {transaction.confirmations} / {transaction.requiredConfirmations}
              </div>
            </div>

            {transaction.propertyId && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t('transactions.propertyId')}
                </label>
                <div className="bg-muted px-3 py-2 rounded text-sm font-mono">
                  {transaction.propertyId}
                </div>
              </div>
            )}

            {transaction.description && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t('transactions.description')}
                </label>
                <div className="bg-muted px-3 py-2 rounded text-sm">
                  {transaction.description}
                </div>
              </div>
            )}

            {transaction.error && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-destructive">
                  {t('transactions.error')}
                </label>
                <div className="bg-destructive/10 border border-destructive/20 px-3 py-2 rounded text-sm text-destructive">
                  {transaction.error}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={downloadPDF} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              {t('transactions.downloadReceipt')}
            </Button>
            <Button variant="outline" onClick={openExplorer} className="flex-1">
              <ExternalLink className="h-4 w-4 mr-2" />
              {t('transactions.viewExplorer')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
