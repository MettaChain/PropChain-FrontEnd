'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { InvestmentCalculatorWidget } from '@/components/widget/InvestmentCalculatorWidget';

export default function InvestmentCalculatorEmbedPage() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div style={{ minHeight: '400px' }} />;
  }

  const theme = {
    primaryColor: searchParams.get('primaryColor') || '#2563eb',
    secondaryColor: searchParams.get('secondaryColor') || '#1e40af',
    backgroundColor: searchParams.get('backgroundColor') || '#ffffff',
    textColor: searchParams.get('textColor') || '#111827',
    logoUrl: searchParams.get('logo') || undefined,
    brandName: searchParams.get('brandName') || 'PropChain',
  };

  const defaultInvestment = Number(searchParams.get('investment')) || 1000;
  const defaultYield = Number(searchParams.get('yield')) || 8;
  const ctaUrl = searchParams.get('ctaUrl') || 'https://propchain.io/properties';
  const ctaText = searchParams.get('ctaText') || 'Invest on PropChain';
  const propertyId = searchParams.get('propertyId') || undefined;
  const compact = searchParams.get('compact') === 'true';

  return (
    <div style={{ minHeight: '100vh', padding: compact ? '8px' : '16px' }}>
      <InvestmentCalculatorWidget
        theme={theme}
        defaultInvestment={defaultInvestment}
        defaultYield={defaultYield}
        ctaUrl={ctaUrl}
        ctaText={ctaText}
        propertyId={propertyId}
        compact={compact}
      />
    </div>
  );
}
