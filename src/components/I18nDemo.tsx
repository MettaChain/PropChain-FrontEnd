"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useI18nFormatting } from '@/utils/i18nFormatting';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Web3Tooltip } from '@/components/ui/Web3Tooltip';

export function I18nDemo() {
  const { t } = useTranslation('common');
  const { formatCurrency, formatNumber, formatPercentage, formatDate, locale } = useI18nFormatting();

  const sampleData = {
    propertyValue: 450000,
    monthlyIncome: 3200,
    roi: 8.4,
    purchaseDate: new Date('2024-01-15'),
    visitors: 1234,
  };

  return (
    <div className="space-y-6 p-6" role="region" aria-label={t('dashboard.portfolioOverview')}>
      <Card>
        <CardHeader>
          <CardTitle id="portfolio-heading">{t('dashboard.portfolioOverview')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4" aria-labelledby="portfolio-heading">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div tabIndex={0} aria-label={`${t('properties.propertyValue')}: ${formatCurrency(sampleData.propertyValue)}`}>
              <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-1">
                {t('properties.propertyValue')}
              </h4>
              <p className="text-2xl font-bold text-gray-900 dark:text-white" aria-live="polite">
                {formatCurrency(sampleData.propertyValue)}
              </p>
            </div>
            <div tabIndex={0} aria-label={`${t('properties.monthlyIncome')}: ${formatCurrency(sampleData.monthlyIncome)}`}>
              <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-1">
                {t('properties.monthlyIncome')}
              </h4>
              <p className="text-2xl font-bold text-gray-900 dark:text-white" aria-live="polite">
                {formatCurrency(sampleData.monthlyIncome)}
              </p>
            </div>
            <div tabIndex={0} aria-label={`${t('dashboard.annualYield')}: ${formatPercentage(sampleData.roi)}`}>
              <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-1">
                <Web3Tooltip term="yield">{t('dashboard.annualYield')}</Web3Tooltip>
              </h4>
              <p className="text-2xl font-bold text-gray-900 dark:text-white" aria-live="polite">
                {formatPercentage(sampleData.roi)}
              </p>
            </div>
            <div tabIndex={0} aria-label={`${t('transactions.date')}: ${formatDate(sampleData.purchaseDate)}`}>
              <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-1">
                {t('transactions.date')}
              </h4>
              <p className="text-2xl font-bold text-gray-900 dark:text-white" aria-live="polite">
                {formatDate(sampleData.purchaseDate)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle id="locale-heading">Localization Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2" aria-labelledby="locale-heading">
          <div className="flex justify-between" tabIndex={0} aria-label={`Current Locale: ${locale}`}>
            <span className="font-medium">Current Locale:</span>
            <span>{locale}</span>
          </div>
          <div className="flex justify-between" tabIndex={0} aria-label={`Text Direction: ${locale === 'ar' || locale === 'he' ? 'RTL' : 'LTR'}`}>
            <span className="font-medium">Text Direction:</span>
            <span>{locale === 'ar' || locale === 'he' ? 'RTL' : 'LTR'}</span>
          </div>
          <div className="flex justify-between" tabIndex={0} aria-label={`Formatted Number: ${formatNumber(sampleData.visitors)}`}>
            <span className="font-medium">Formatted Number (1,234):</span>
            <span>{formatNumber(sampleData.visitors)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle id="translation-heading">Translation Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2" aria-labelledby="translation-heading">
          <div className="flex justify-between" tabIndex={0}>
            <span className="font-medium">Common Actions:</span>
            <span>{t('common.save')} | {t('common.cancel')} | {t('common.search')}</span>
          </div>
          <div className="flex justify-between" tabIndex={0}>
            <span className="font-medium">Property Types:</span>
            <span>{t('properties.residential')} | {t('properties.commercial')} | {t('properties.industrial')}</span>
          </div>
          <div className="flex justify-between" tabIndex={0}>
            <span className="font-medium">Transaction Types:</span>
            <span>{t('transactions.purchase')} | {t('transactions.sale')} | {t('transactions.dividend')}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
