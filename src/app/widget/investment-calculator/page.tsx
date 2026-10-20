'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  InvestmentCalculatorSkeleton,
  InvestmentCalculatorWidget,
} from '@/components/widget/InvestmentCalculatorWidget';
import { withRouteErrorBoundary } from '@/components/error/withRouteErrorBoundary';

function InvestmentCalculatorEmbedPage() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Issue #1269 - the page used to show an empty box until the client had
  // mounted. The skeleton has the same shape as the widget, so the calculator
  // takes its place without the frame jumping around.
  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', padding: '16px' }}>
        <InvestmentCalculatorSkeleton />
      </div>
    );
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

export default withRouteErrorBoundary(InvestmentCalculatorEmbedPage, { routeName: 'widget/investment-calculator' });
