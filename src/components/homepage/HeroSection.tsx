"use client";

import React from "react";
import { useTranslation } from "react-i18next";

export function HeroSection() {
  const { t } = useTranslation("common");

  return (
    <div className="text-center mb-12">
      <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        {t("app.tagline")}
      </h2>
      <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
        {t("app.subtitle")}
      </p>
      <a
        href="/properties"
        data-tour="browse-properties"
        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {t("navigation.browseProperties")}
      </a>
    </div>
  );
}
