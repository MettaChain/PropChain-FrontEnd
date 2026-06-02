"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { MultiChainBadge } from "@/components/ChainAwareProps";

interface WalletInfoProps {
  address?: string;
  balance?: string;
  chainName?: string;
  chainSymbol?: string;
}

export function WalletInfo({ address, balance, chainName, chainSymbol }: WalletInfoProps) {
  const { t } = useTranslation("common");

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t("wallet.walletInformation")}
      </h3>
      <div className="space-y-3">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("wallet.address")}
          </p>
          <p className="font-mono text-sm text-gray-900 dark:text-white">
            {address?.slice(0, 8)}...{address?.slice(-6)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("wallet.balance")}
          </p>
          <p className="font-semibold text-gray-900 dark:text-white">
            {balance} {chainSymbol}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("wallet.network")}
          </p>
          <MultiChainBadge>
            <span className="text-sm">{chainName}</span>
          </MultiChainBadge>
        </div>
      </div>
    </div>
  );
}
