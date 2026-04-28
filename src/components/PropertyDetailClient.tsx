'use client';

import React from 'react';
import { WalletConnector } from '@/components/WalletConnector';
import { PriceAlertBell } from '@/components/PriceAlertBell';

interface PropertyDetailClientProps {
  propertyId: string;
}

export const PropertyDetailClient: React.FC<PropertyDetailClientProps> = ({ propertyId }) => {
  return (
    <div className="flex items-center gap-2">
      <PriceAlertBell />
      <WalletConnector />
    </div>
  );
};
