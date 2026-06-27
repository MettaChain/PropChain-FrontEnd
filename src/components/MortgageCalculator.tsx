'use client';
import { logger } from '@/utils/logger';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useI18nFormatting } from '@/utils/i18nFormatting';
import { 
  TrendingUp, 
  BarChart4, 
  Info,
  Share2
} from 'lucide-react';

interface CalculatorResults {
  totalReturn: number;
  annualReturn: number;
  roi: number;
  breakEvenMonths: number;
  irr: number;
}

export interface MortgageCalculatorProps {
  propertyPrice?: number;
  defaultYield?: number;
}

export const MortgageCalculator: React.FC<MortgageCalculatorProps> = ({ 
  propertyPrice = 1000, 
  defaultYield = 8 
}) => {
  const { t, i18n } = useTranslation('common');
  const { formatCurrency, formatNumber } = useI18nFormatting();
  const isRtl = i18n.dir() === 'rtl';

  const [investment, setInvestment] = useState(propertyPrice);
  const [yieldRate, setYieldRate] = useState(defaultYield);
  const [holdingPeriod, setHoldingPeriod] = useState(5);
  const [appreciation, setAppreciation] = useState(3);
  const [results, setResults] = useState<CalculatorResults>({
    totalReturn: 0,
    annualReturn: 0,
    roi: 0,
    breakEvenMonths: 0,
    irr: 0
  });

  const calculate = useCallback(() => {
    const annualRentalIncome = investment * (yieldRate / 100);
    const totalRentalIncome = annualRentalIncome * holdingPeriod;
    const finalValue = investment * Math.pow(1 + appreciation / 100, holdingPeriod);
    const capitalGains = finalValue - investment;
    const totalReturn = totalRentalIncome + capitalGains;
    const roi = (totalReturn / investment) * 100;
    const annualReturn = totalReturn / holdingPeriod;
    const breakEvenMonths = annualRentalIncome > 0 
      ? Math.ceil((investment / annualRentalIncome) * 12) 
      : 0;
    const irr = (Math.pow((investment + totalReturn) / investment, 1 / holdingPeriod) - 1) * 100;

    setResults({
      totalReturn,
      annualReturn,
      roi,
      breakEvenMonths,
      irr
    });
  }, [investment, yieldRate, holdingPeriod, appreciation]);

  useEffect(() => {
    calculate();
  }, [calculate]);

  const handleShare = () => {
    const yearsLabel = t('mortgageCalculator.yearsDuration', { count: holdingPeriod });
    const text = t('mortgageCalculator.shareText', {
      amount: formatCurrency(results.totalReturn),
      years: yearsLabel,
    });

    if (navigator.share) {
      navigator.share({
        title: t('mortgageCalculator.shareTitle'),
        text,
        url: window.location.href,
      }).catch((err) => logger.error('Mortgage calculation error:', err));
    } else {
      navigator.clipboard.writeText(text);
      alert(t('mortgageCalculator.copiedToClipboard'));
    }
  };

  return (
    <Card className="w-full bg-white dark:bg-gray-800 border-none shadow-xl" dir={i18n.dir()}>
      <CardHeader>
        <div className={`flex justify-between items-start ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div>
            <CardTitle className={`text-2xl font-bold flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <BarChart4 className="text-blue-600 w-6 h-6" />
              {t('mortgageCalculator.title')}
            </CardTitle>
            <CardDescription>{t('mortgageCalculator.description')}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleShare} className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Share2 className="w-4 h-4" />
            {t('mortgageCalculator.share')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className={`flex justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Label htmlFor="investment">{t('mortgageCalculator.investmentAmount')}</Label>
                <span className="font-bold text-blue-600">{formatCurrency(investment)}</span>
              </div>
              <Input
                id="investment"
                type="number"
                value={investment}
                onChange={(e) => setInvestment(Number(e.target.value))}
                className="bg-gray-50 dark:bg-gray-700"
              />
            </div>

            <div className="space-y-4">
              <div className={`flex justify-between text-sm ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Label>{t('mortgageCalculator.expectedAnnualYield')}</Label>
                <span className="font-bold text-blue-600">{formatNumber(yieldRate)}%</span>
              </div>
              <Slider
                value={[yieldRate]}
                min={0}
                max={20}
                step={0.1}
                onValueChange={(v) => setYieldRate(v[0])}
              />
            </div>

            <div className="space-y-4">
              <div className={`flex justify-between text-sm ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Label>{t('mortgageCalculator.holdingPeriod')}</Label>
                <span className="font-bold text-blue-600">
                  {t('mortgageCalculator.holdingPeriodValue', { count: holdingPeriod })}
                </span>
              </div>
              <Slider
                value={[holdingPeriod]}
                min={1}
                max={30}
                step={1}
                onValueChange={(v) => setHoldingPeriod(v[0])}
              />
            </div>

            <div className="space-y-4">
              <div className={`flex justify-between text-sm ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Label>{t('mortgageCalculator.annualAppreciation')}</Label>
                <span className="font-bold text-blue-600">{formatNumber(appreciation)}%</span>
              </div>
              <Slider
                value={[appreciation]}
                min={-5}
                max={15}
                step={0.5}
                onValueChange={(v) => setAppreciation(v[0])}
              />
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-6 flex flex-col justify-between border border-blue-100 dark:border-blue-800">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t('mortgageCalculator.projectedRoi')}</p>
                <p className="text-2xl font-bold text-green-600">+{formatNumber(results.roi, { maximumFractionDigits: 1 })}%</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t('mortgageCalculator.annualReturn')}</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(results.annualReturn)}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t('mortgageCalculator.irrEstimate')}</p>
                <p className="text-2xl font-bold text-indigo-600">{formatNumber(results.irr, { maximumFractionDigits: 1 })}%</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t('mortgageCalculator.breakEven')}</p>
                <p className="text-2xl font-bold text-orange-600">
                  {t('mortgageCalculator.breakEvenMonths', { count: results.breakEvenMonths })}
                </p>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-blue-100 dark:border-blue-800">
              <div className={`flex justify-between items-center mb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <span className="text-gray-700 dark:text-gray-300 font-medium">{t('mortgageCalculator.totalProjectedValue')}</span>
                <span className="text-2xl font-extrabold text-blue-600">
                  {formatCurrency(investment + results.totalReturn)}
                </span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2.5 mb-4 overflow-hidden">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(investment / (investment + results.totalReturn)) * 100}%` }}></div>
              </div>
              <div className={`flex gap-4 text-xs ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
                  <span className="text-gray-600 dark:text-gray-400">{t('mortgageCalculator.principal')}</span>
                </div>
                <div className={`flex items-center gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <div className="w-3 h-3 bg-blue-200 dark:bg-blue-800 rounded-sm"></div>
                  <span className="text-gray-600 dark:text-gray-400">{t('mortgageCalculator.yieldAndAppreciation')}</span>
                </div>
              </div>
            </div>

            <div className={`mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-100 dark:border-yellow-800 text-xs text-yellow-800 dark:text-yellow-200 flex gap-2 ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
              <Info className="w-4 h-4 shrink-0" />
              <p>{t('mortgageCalculator.disclaimer')}</p>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <TrendingUp className="text-blue-600 w-5 h-5" />
            {t('mortgageCalculator.comparisonTitle')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-100 dark:border-gray-700 rounded-xl">
              <p className="font-bold text-sm mb-2">{t('mortgageCalculator.liquidity')}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('mortgageCalculator.liquidityDescription')}</p>
            </div>
            <div className="p-4 border border-gray-100 dark:border-gray-700 rounded-xl">
              <p className="font-bold text-sm mb-2">{t('mortgageCalculator.minimumInvestment')}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('mortgageCalculator.minimumInvestmentDescription')}</p>
            </div>
            <div className="p-4 border border-gray-100 dark:border-gray-700 rounded-xl">
              <p className="font-bold text-sm mb-2">{t('mortgageCalculator.management')}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('mortgageCalculator.managementDescription')}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
