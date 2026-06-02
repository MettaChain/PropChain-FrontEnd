'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface WidgetTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  logoUrl?: string;
  brandName: string;
}

interface CalculatorResults {
  totalReturn: number;
  annualReturn: number;
  roi: number;
  breakEvenMonths: number;
  irr: number;
  finalValue: number;
  totalRentalIncome: number;
  capitalGains: number;
}

interface InvestmentCalculatorWidgetProps {
  theme?: Partial<WidgetTheme>;
  defaultInvestment?: number;
  defaultYield?: number;
  ctaUrl?: string;
  ctaText?: string;
  propertyId?: string;
  compact?: boolean;
}

const DEFAULT_THEME: WidgetTheme = {
  primaryColor: '#2563eb',
  secondaryColor: '#1e40af',
  backgroundColor: '#ffffff',
  textColor: '#111827',
  brandName: 'PropChain',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function InvestmentCalculatorWidget({
  theme = {},
  defaultInvestment = 1000,
  defaultYield = 8,
  ctaUrl = 'https://propchain.io/properties',
  ctaText = 'Invest on PropChain',
  propertyId,
  compact = false,
}: InvestmentCalculatorWidgetProps) {
  const [investment, setInvestment] = useState(defaultInvestment);
  const [yieldRate, setYieldRate] = useState(defaultYield);
  const [holdingPeriod, setHoldingPeriod] = useState(5);
  const [appreciation, setAppreciation] = useState(3);
  const [results, setResults] = useState<CalculatorResults>({
    totalReturn: 0,
    annualReturn: 0,
    roi: 0,
    breakEvenMonths: 0,
    irr: 0,
    finalValue: 0,
    totalRentalIncome: 0,
    capitalGains: 0,
  });

  const mergedTheme: WidgetTheme = { ...DEFAULT_THEME, ...theme };

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
      irr,
      finalValue,
      totalRentalIncome,
      capitalGains,
    });
  }, [investment, yieldRate, holdingPeriod, appreciation]);

  useEffect(() => {
    calculate();
  }, [calculate]);

  const handleCtaClick = () => {
    const url = propertyId
      ? `${ctaUrl.replace(/\/properties$/, `/properties/${propertyId}`)}`
      : ctaUrl;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const sliderStyle: React.CSSProperties = {
    accentColor: mergedTheme.primaryColor,
  };

  if (compact) {
    return (
      <div
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          backgroundColor: mergedTheme.backgroundColor,
          color: mergedTheme.textColor,
          borderRadius: '12px',
          padding: '16px',
          maxWidth: '400px',
          margin: '0 auto',
        }}
      >
        {mergedTheme.logoUrl && (
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <img src={mergedTheme.logoUrl} alt={mergedTheme.brandName} style={{ maxHeight: '32px' }} />
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 'bold' }}>
            Investment Calculator
          </h3>
          <p style={{ margin: 0, fontSize: '12px', opacity: 0.7 }}>
            Project your returns
          </p>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
            Investment: {formatCurrency(investment)}
          </label>
          <input
            type="range"
            min="50"
            max="50000"
            step="50"
            value={investment}
            onChange={(e) => setInvestment(Number(e.target.value))}
            style={{ ...sliderStyle, width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
            Annual Yield: {yieldRate}%
          </label>
          <input
            type="range"
            min="0"
            max="20"
            step="0.5"
            value={yieldRate}
            onChange={(e) => setYieldRate(Number(e.target.value))}
            style={{ ...sliderStyle, width: '100%' }}
          />
        </div>

        <div
          style={{
            background: `${mergedTheme.primaryColor}10`,
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '12px',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: '12px', opacity: 0.7 }}>Projected Value ({holdingPeriod} yrs)</p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: mergedTheme.primaryColor }}>
              {formatCurrency(investment + results.totalReturn)}
            </p>
          </div>
        </div>

        <button
          onClick={handleCtaClick}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: mergedTheme.primaryColor,
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = mergedTheme.secondaryColor)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = mergedTheme.primaryColor)}
        >
          {ctaText}
        </button>

        <p style={{ margin: '8px 0 0', fontSize: '10px', opacity: 0.5, textAlign: 'center' }}>
          Powered by {mergedTheme.brandName}
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backgroundColor: mergedTheme.backgroundColor,
        color: mergedTheme.textColor,
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '600px',
        margin: '0 auto',
      }}
    >
      {mergedTheme.logoUrl && (
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <img src={mergedTheme.logoUrl} alt={mergedTheme.brandName} style={{ maxHeight: '40px' }} />
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: 'bold' }}>
          Investment Calculator
        </h2>
        <p style={{ margin: 0, fontSize: '14px', opacity: 0.7 }}>
          Estimate your potential returns from tokenized real estate
        </p>
      </div>

      <div style={{ display: 'grid', gap: '20px' }}>
        <div>
          <label style={{ fontSize: '14px', fontWeight: 500, display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Investment Amount</span>
            <span style={{ color: mergedTheme.primaryColor, fontWeight: 'bold' }}>
              {formatCurrency(investment)}
            </span>
          </label>
          <input
            type="number"
            value={investment}
            onChange={(e) => setInvestment(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: `1px solid ${mergedTheme.primaryColor}30`,
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: '14px', fontWeight: 500, display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Expected Annual Yield</span>
            <span style={{ color: mergedTheme.primaryColor, fontWeight: 'bold' }}>
              {yieldRate}%
            </span>
          </label>
          <input
            type="range"
            min="0"
            max="20"
            step="0.1"
            value={yieldRate}
            onChange={(e) => setYieldRate(Number(e.target.value))}
            style={{ ...sliderStyle, width: '100%' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '14px', fontWeight: 500, display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Holding Period</span>
            <span style={{ color: mergedTheme.primaryColor, fontWeight: 'bold' }}>
              {holdingPeriod} Years
            </span>
          </label>
          <input
            type="range"
            min="1"
            max="30"
            step="1"
            value={holdingPeriod}
            onChange={(e) => setHoldingPeriod(Number(e.target.value))}
            style={{ ...sliderStyle, width: '100%' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '14px', fontWeight: 500, display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Annual Appreciation</span>
            <span style={{ color: mergedTheme.primaryColor, fontWeight: 'bold' }}>
              {appreciation}%
            </span>
          </label>
          <input
            type="range"
            min="-5"
            max="15"
            step="0.5"
            value={appreciation}
            onChange={(e) => setAppreciation(Number(e.target.value))}
            style={{ ...sliderStyle, width: '100%' }}
          />
        </div>
      </div>

      <div
        style={{
          background: `${mergedTheme.primaryColor}10`,
          borderRadius: '12px',
          padding: '20px',
          marginTop: '24px',
          border: `1px solid ${mergedTheme.primaryColor}20`,
        }}
      >
        <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 'bold' }}>
          Projected Returns
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: mergedTheme.backgroundColor, borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: '11px', opacity: 0.7 }}>Projected ROI</p>
            <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>
              +{results.roi.toFixed(1)}%
            </p>
          </div>
          <div style={{ background: mergedTheme.backgroundColor, borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: '11px', opacity: 0.7 }}>Annual Return</p>
            <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: mergedTheme.primaryColor }}>
              {formatCurrency(results.annualReturn)}
            </p>
          </div>
          <div style={{ background: mergedTheme.backgroundColor, borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: '11px', opacity: 0.7 }}>IRR (Est.)</p>
            <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#6366f1' }}>
              {results.irr.toFixed(1)}%
            </p>
          </div>
          <div style={{ background: mergedTheme.backgroundColor, borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: '11px', opacity: 0.7 }}>Break-even</p>
            <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>
              {results.breakEvenMonths} mo
            </p>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${mergedTheme.primaryColor}20`, paddingTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>Total Projected Value</span>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: mergedTheme.primaryColor }}>
              {formatCurrency(investment + results.totalReturn)}
            </span>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: mergedTheme.primaryColor }}></div>
                <span>Principal</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: `${mergedTheme.primaryColor}30` }}></div>
                <span>Yield + Appreciation</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleCtaClick}
        style={{
          width: '100%',
          padding: '14px',
          backgroundColor: mergedTheme.primaryColor,
          color: '#ffffff',
          border: 'none',
          borderRadius: '10px',
          fontWeight: 'bold',
          fontSize: '16px',
          cursor: 'pointer',
          marginTop: '20px',
          transition: 'background-color 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = mergedTheme.secondaryColor)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = mergedTheme.primaryColor)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        {ctaText}
      </button>

      <p style={{ margin: '12px 0 0', fontSize: '11px', opacity: 0.5, textAlign: 'center' }}>
        Powered by {mergedTheme.brandName} · Returns are estimates only
      </p>
    </div>
  );
}
