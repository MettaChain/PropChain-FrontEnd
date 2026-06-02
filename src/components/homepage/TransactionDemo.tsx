"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { TransactionButton, GasEstimation } from "@/components/ChainAwareProps";

interface TransactionDemoProps {
  chainName?: string;
  onTransaction?: () => Promise<void>;
}

export function TransactionDemo({ chainName, onTransaction }: TransactionDemoProps) {
  const { t } = useTranslation("common");

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t("transactions.sampleTransaction")}
      </h3>
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {t("transactions.executeTransaction")} {chainName}
        </p>
        <TransactionButton onTransaction={onTransaction || (() => Promise.resolve())}>
          {t("transactions.executeTransaction")}
        </TransactionButton>
        <GasEstimation gasLimit="50000" />
      </div>
    </div>
  );
}
