'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
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

export const MortgageCalculator: React.FC<{ propertyPrice?: number, defaultYield?: number }> = ({ 
  propertyPrice = 1000, 
  defaultYield = 8 
}) => {
  const [investment, setInvestment] = useState(propertyPrice);
  const [yieldRate, setYieldRate] = useState(defaultYield);
  const [holdingPeriod, setHoldingPeriod] = useState(5); // years
  const [appreciation, setAppreciation] = useState(3); // % per year
  const [results, setResults] = useState<CalculatorResults>({
    totalReturn: 0,
    annualReturn: 0,
    roi: 0,
    breakEvenMonths: 0,
    irr: 0
  });

  useEffect(() => {
    calculate();
  }, [investment, yieldRate, holdingPeriod, appreciation]);

  const calculate = () => {
    // Basic calculation for tokenized real estate economics
    const annualRentalIncome = investment * (yieldRate / 100);
    const totalRentalIncome = annualRentalIncome * holdingPeriod;
    
    // Compounded appreciation
    const finalValue = investment * Math.pow(1 + appreciation / 100, holdingPeriod);
    const capitalGains = finalValue - investment;
    
    const totalReturn = totalRentalIncome + capitalGains;
    const roi = (totalReturn / investment) * 100;
    const annualReturn = totalReturn / holdingPeriod;
    
    // Simplified break-even (months)
    const breakEvenMonths = annualRentalIncome > 0 
      ? Math.ceil((investment / annualRentalIncome) * 12) 
      : 0;
      
    // Simplified IRR (Internal Rate of Return)
    // Formula: (Total Return / Investment)^(1/years) - 1
    const irr = (Math.pow((investment + totalReturn) / investment, 1 / holdingPeriod) - 1) * 100;

    setResults({
      totalReturn,
      annualReturn,
      roi,
      breakEvenMonths,
      irr
    });
  };

  const handleShare = () => {
    const text = `Check out my projected returns on PropChain: $${results.totalReturn.toFixed(2)} total return over ${holdingPeriod} years!`;
    if (navigator.share) {
      navigator.share({
        title: 'PropChain Investment Projection',
        text,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text);
      alert('Result copied to clipboard!');
    }
  };

  return (
    <Card className="w-full bg-white dark:bg-gray-800 border-none shadow-xl">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <BarChart4 className="text-blue-600 w-6 h-6" />
              Investment Calculator
            </CardTitle>
            <CardDescription>Estimate your potential returns from tokenized real estate</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleShare} className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Inputs */}
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="investment">Investment Amount ($)</Label>
                <span className="font-bold text-blue-600">${investment.toLocaleString()}</span>
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
              <div className="flex justify-between text-sm">
                <Label>Expected Annual Yield (%)</Label>
                <span className="font-bold text-blue-600">{yieldRate}%</span>
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
              <div className="flex justify-between text-sm">
                <Label>Holding Period (Years)</Label>
                <span className="font-bold text-blue-600">{holdingPeriod} Years</span>
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
              <div className="flex justify-between text-sm">
                <Label>Annual Appreciation (%)</Label>
                <span className="font-bold text-blue-600">{appreciation}%</span>
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

          {/* Outputs */}
          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-6 flex flex-col justify-between border border-blue-100 dark:border-blue-800">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Projected ROI</p>
                <p className="text-2xl font-bold text-green-600">+{results.roi.toFixed(1)}%</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Annual Return</p>
                <p className="text-2xl font-bold text-blue-600">${results.annualReturn.toFixed(0)}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">IRR (Est.)</p>
                <p className="text-2xl font-bold text-indigo-600">{results.irr.toFixed(1)}%</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Break-even</p>
                <p className="text-2xl font-bold text-orange-600">{results.breakEvenMonths} mo</p>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-blue-100 dark:border-blue-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700 dark:text-gray-300 font-medium">Total Projected Value</span>
                <span className="text-2xl font-extrabold text-blue-600">${(investment + results.totalReturn).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2.5 mb-4 overflow-hidden">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(investment / (investment + results.totalReturn)) * 100}%` }}></div>
              </div>
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
                  <span className="text-gray-600 dark:text-gray-400">Principal</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-200 dark:bg-blue-800 rounded-sm"></div>
                  <span className="text-gray-600 dark:text-gray-400">Yield + Appreciation</span>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-100 dark:border-yellow-800 text-xs text-yellow-800 dark:text-yellow-200 flex gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <p>This is a simplified projection. Actual returns may vary based on market conditions, property occupancy, and platform fees.</p>
            </div>
          </div>
        </div>

        {/* Comparison Section */}
        <div className="mt-12">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="text-blue-600 w-5 h-5" />
            PropChain vs. Traditional Real Estate
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-100 dark:border-gray-700 rounded-xl">
              <p className="font-bold text-sm mb-2">Liquidity</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">PropChain tokens can be sold 24/7 on the secondary market. Traditional real estate takes months to sell.</p>
            </div>
            <div className="p-4 border border-gray-100 dark:border-gray-700 rounded-xl">
              <p className="font-bold text-sm mb-2">Minimum Investment</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Start with as little as $50. Traditional real estate requires large down payments ($20k+).</p>
            </div>
            <div className="p-4 border border-gray-100 dark:border-gray-700 rounded-xl">
              <p className="font-bold text-sm mb-2">Management</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">PropChain handles all property management. Traditional requires being a landlord or hiring expensive managers.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
