'use client';

import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, Clock, ExternalLink } from "lucide-react";

interface Transaction {
  id: string;
  type: "buy" | "sell" | "income";
  property: string;
  amount: number;
  tokens?: number;
  date: string;
  status: "completed" | "pending";
  txHash: string;
}

const transactions: Transaction[] = [
  {
    id: "1",
    type: "income",
    property: "Manhattan Tower Suite",
    amount: 3280,
    date: "2024-01-20",
    status: "completed",
    txHash: "0x1a2b...3c4d",
  },
  {
    id: "2",
    type: "buy",
    property: "Tech Hub Office Complex",
    amount: 45000,
    tokens: 90,
    date: "2024-01-18",
    status: "completed",
    txHash: "0x5e6f...7g8h",
  },
  {
    id: "3",
    type: "sell",
    property: "Downtown Luxury Lofts",
    amount: 12500,
    tokens: 25,
    date: "2024-01-15",
    status: "completed",
    txHash: "0x9i0j...1k2l",
  },
  {
    id: "4",
    type: "income",
    property: "Sunset Beach Villa",
    amount: 2450,
    date: "2024-01-12",
    status: "pending",
    txHash: "0x3m4n...5o6p",
  },
  {
    id: "5",
    type: "buy",
    property: "Mixed-Use Development",
    amount: 27500,
    tokens: 55,
    date: "2024-01-10",
    status: "completed",
    txHash: "0x7q8r...9s0t",
  },
];

const TransactionRow = ({ transaction, index }: { transaction: Transaction; index: number }) => {
  const getTypeIcon = () => {
    switch (transaction.type) {
      case "buy":
        return <ArrowDownLeft className="w-4 h-4" />;
      case "sell":
        return <ArrowUpRight className="w-4 h-4" />;
      case "income":
        return <ArrowDownLeft className="w-4 h-4" />;
    }
  };

  const getTypeColor = () => {
    switch (transaction.type) {
      case "buy":
        return "bg-accent/10 text-accent";
      case "sell":
        return "bg-warning/10 text-warning";
      case "income":
        return "bg-success/10 text-success";
    }
  };

  const getTypeLabel = () => {
    switch (transaction.type) {
      case "buy":
        return "Purchase";
      case "sell":
        return "Sale";
      case "income":
        return "Rental Income";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="flex items-center justify-between py-4 border-b border-border/50 last:border-0 hover:bg-secondary/30 -mx-4 px-4 transition-colors"
    >
      <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-lg ${getTypeColor()}`}>
          {getTypeIcon()}
        </div>
        <div>
          <p className="font-medium text-sm">{transaction.property}</p>
          <p className="text-xs text-muted-foreground">{getTypeLabel()}</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className={`font-semibold font-mono text-sm ${
            transaction.type === "sell" ? "text-warning" : 
            transaction.type === "income" ? "text-success" : "text-foreground"
          }`}>
            {transaction.type === "sell" ? "-" : "+"}${transaction.amount.toLocaleString()}
          </p>
          {transaction.tokens && (
            <p className="text-xs text-muted-foreground">{transaction.tokens} tokens</p>
          )}
        </div>

        <div className="text-right min-w-[100px]">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {new Date(transaction.date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </div>
          <span className={`text-xs ${
            transaction.status === "completed" ? "text-success" : "text-warning"
          }`}>
            {transaction.status === "completed" ? "✓ Completed" : "⏳ Pending"}
          </span>
        </div>

        <button className="p-2 text-muted-foreground hover:text-primary transition-colors">
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export const RecentTransactions = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="glass-card rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <p className="text-sm text-muted-foreground mt-1">Latest transactions and income</p>
        </div>
        <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
          View All →
        </button>
      </div>

      <div>
        {transactions.map((transaction, index) => (
          <TransactionRow key={transaction.id} transaction={transaction} index={index} />
        ))}
      </div>
    </motion.div>
  );
};
