"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { ChainSpecific, GasEstimation } from "@/components/ChainAwareProps";

export function ChainFeatures() {
  const { t } = useTranslation("common");

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t("chains.chainSpecificFeatures")}
      </h3>
      <ChainSpecific chainId={1}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600" />
            <span className="text-sm font-medium">
              {t("chains.ethereum")}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t("chains.ethereumDescription")}
          </p>
          <GasEstimation />
        </div>
      </ChainSpecific>

      <ChainSpecific chainId={137}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-600" />
            <span className="text-sm font-medium">
              {t("chains.polygon")}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t("chains.polygonDescription")}
          </p>
          <GasEstimation />
        </div>
      </ChainSpecific>

      <ChainSpecific chainId={56}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-sm font-medium">
              {t("chains.bsc")}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t("chains.bscDescription")}
          </p>
          <GasEstimation />
        </div>
      </ChainSpecific>
    </div>
  );
}
