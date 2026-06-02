"use client";

import React from "react";
import { useTranslation } from "react-i18next";

export function MultiChainFeatures() {
  const { t } = useTranslation("common");

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:col-span-2 lg:col-span-3">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t("chains.multiChainFeatures")}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-2xl mb-2">🔗</div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
            {t("wallet.multiWalletSupport")}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            MetaMask, WalletConnect, Coinbase
          </p>
        </div>
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-2xl mb-2">⚡</div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
            {t("wallet.networkSwitching")}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t("chains.seamlessChainSwitching")}
          </p>
        </div>
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-2xl mb-2">💾</div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
            {t("wallet.persistentState")}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t("chains.connectionSurvivesRefreshes")}
          </p>
        </div>
      </div>

      {/* Mobile Properties Link */}
      <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
        <div className="text-center">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            📱 {t("mobile.mobileFirstPropertyExperience")}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            {t("mobile.touchOptimizedPropertyViewing")}
          </p>
          <a
            href="/mobile-properties"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <span className="mr-2">📱</span>
            {t("navigation.viewMobileProperties")}
          </a>
        </div>
      </div>
    </div>
  );
}
