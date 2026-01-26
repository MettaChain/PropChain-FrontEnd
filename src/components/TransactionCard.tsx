'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  ExternalLink,
  RotateCcw,
  X,
} from 'lucide-react';
import { Transaction, TransactionStatus } from '@/store/transactionStore';
import { useChain } from '@/providers/ChainAwareProvider';

interface TransactionCardProps {
  transaction: Transaction;
  onRetry?: (transaction: Transaction) => void;
  onCancel?: (transaction: Transaction) => void;
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  processing: {
    icon: AlertCircle,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  confirmed: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  failed: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  cancelled: {
    icon: X,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
  },
};

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onRetry,
  onCancel,
}) => {
  const { getChainName, chainConfig } = useChain();
  const statusInfo = statusConfig[transaction.status];
  const StatusIcon = statusInfo.icon;

  const progress = transaction.requiredConfirmations
    ? (transaction.confirmations / transaction.requiredConfirmations) * 100
    : transaction.status === 'confirmed'
    ? 100
    : 0;

  const handleViewOnExplorer = () => {
    const explorerUrl = `${chainConfig.blockExplorer}/tx/${transaction.hash}`;
    window.open(explorerUrl, '_blank');
  };

  return (
    <Card className={`transition-all duration-200 ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
            <span className="font-medium capitalize">{transaction.type}</span>
            <Badge variant="outline" className="text-xs">
              {getChainName(transaction.chainId)}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(transaction.timestamp), { addSuffix: true })}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Transaction Hash:</span>
            <span className="font-mono text-xs">
              {transaction.hash.slice(0, 10)}...{transaction.hash.slice(-8)}
            </span>
          </div>

          {transaction.description && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Description:</span>
              <span className="text-right">{transaction.description}</span>
            </div>
          )}

          {transaction.value && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Value:</span>
              <span>{transaction.value} ETH</span>
            </div>
          )}

          {transaction.gasUsed && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gas Used:</span>
              <span>{transaction.gasUsed}</span>
            </div>
          )}
        </div>

        {(transaction.status === 'pending' || transaction.status === 'processing') && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Confirmations</span>
              <span>
                {transaction.confirmations}/{transaction.requiredConfirmations || 1}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {transaction.error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {transaction.error}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewOnExplorer}
            className="flex-1"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View
          </Button>

          {transaction.status === 'failed' && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRetry(transaction)}
              className="flex-1"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}

          {(transaction.status === 'pending' || transaction.status === 'processing') &&
            onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCancel(transaction)}
                className="flex-1"
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            )}
        </div>
      </CardContent>
    </Card>
  );
};