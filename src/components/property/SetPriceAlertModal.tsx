'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/utils/searchUtils';
import { PRICE_ALERT_TYPE_LABELS, type PriceAlertType, type Property } from '@/types/property';
import { Bell, BellRing, TrendingUp, TrendingDown, AlertCircle, Check } from 'lucide-react';

interface SetPriceAlertModalProps {
  property: Property;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSetAlert: (alertType: PriceAlertType, targetPrice: number, emailNotification: boolean) => void;
  existingAlert?: {
    alertType: PriceAlertType;
    targetPrice: number;
    isActive: boolean;
  };
}

export const SetPriceAlertModal: React.FC<SetPriceAlertModalProps> = ({
  property,
  isOpen,
  onOpenChange,
  onSetAlert,
  existingAlert,
}) => {
  const [alertType, setAlertType] = useState<PriceAlertType>(existingAlert?.alertType || 'below');
  const [targetPrice, setTargetPrice] = useState<number>(existingAlert?.targetPrice || property.price.perToken);
  const [emailNotification, setEmailNotification] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSetAlert(alertType, targetPrice, emailNotification);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAlertTypeIcon = (type: PriceAlertType) => {
    switch (type) {
      case 'above':
        return <TrendingUp className="w-5 h-5" />;
      case 'below':
        return <TrendingDown className="w-5 h-5" />;
      case 'change':
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getRecommendedPrice = (type: PriceAlertType) => {
    const currentPrice = property.price.perToken;
    switch (type) {
      case 'above':
        return currentPrice * 1.1; // 10% above
      case 'below':
        return currentPrice * 0.9; // 10% below
      case 'change':
        return currentPrice * 0.05; // 5% change
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-blue-600" />
            Set Price Alert
          </DialogTitle>
          <DialogDescription>
            Get notified when the token price for {property.name} reaches your target.
          </DialogDescription>
        </DialogHeader>

        {/* Property Summary */}
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-4">
              {property.images[0] && (
                <div className="relative w-16 h-16 flex-shrink-0">
                  <Image
                    src={property.images[0]}
                    alt={property.name}
                    width={64}
                    height={64}
                    className="rounded-lg object-cover"
                  />
                </div>
              )}
              <div>
                <p className="font-medium text-sm">{property.name}</p>
                <p className="text-sm text-muted-foreground">
                  {property.location.city}, {property.location.state}
                </p>
                <p className="text-lg font-bold text-blue-600 mt-1">
                  {formatPrice(property.price.perToken)} / token
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Alert Type Selection */}
          <div className="space-y-3">
            <Label>Alert When Price Is</Label>
            <RadioGroup
              value={alertType}
              onValueChange={(value) => setAlertType(value as PriceAlertType)}
              className="grid grid-cols-3 gap-3"
            >
              <label
                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  alertType === 'above'
                    ? 'border-green-500 bg-green-50 dark:bg-green-950'
                    : 'border-border hover:border-green-300'
                }`}
              >
                <RadioGroupItem value="above" className="sr-only" />
                <TrendingUp className={`w-6 h-6 mb-2 ${alertType === 'above' ? 'text-green-600' : 'text-muted-foreground'}`} />
                <span className="text-sm font-medium">Above</span>
                <span className="text-xs text-muted-foreground mt-1">
                  {formatPrice(getRecommendedPrice('above'))}
                </span>
              </label>

              <label
                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  alertType === 'below'
                    ? 'border-red-500 bg-red-50 dark:bg-red-950'
                    : 'border-border hover:border-red-300'
                }`}
              >
                <RadioGroupItem value="below" className="sr-only" />
                <TrendingDown className={`w-6 h-6 mb-2 ${alertType === 'below' ? 'text-red-600' : 'text-muted-foreground'}`} />
                <span className="text-sm font-medium">Below</span>
                <span className="text-xs text-muted-foreground mt-1">
                  {formatPrice(getRecommendedPrice('below'))}
                </span>
              </label>

              <label
                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  alertType === 'change'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950'
                    : 'border-border hover:border-orange-300'
                }`}
              >
                <RadioGroupItem value="change" className="sr-only" />
                <AlertCircle className={`w-6 h-6 mb-2 ${alertType === 'change' ? 'text-orange-600' : 'text-muted-foreground'}`} />
                <span className="text-sm font-medium">Changes</span>
                <span className="text-xs text-muted-foreground mt-1">
                  ±{formatPrice(getRecommendedPrice('change'))}
                </span>
              </label>
            </RadioGroup>
          </div>

          {/* Target Price Input */}
          <div className="space-y-2">
            <Label htmlFor="targetPrice">Target Price (USD)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="targetPrice"
                type="number"
                step="0.01"
                min="0"
                value={targetPrice}
                onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
                className="pl-7"
                placeholder="Enter target price"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Current price: {formatPrice(property.price.perToken)}
            </p>
          </div>

          {/* Email Notification Toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="emailNotification"
              checked={emailNotification}
              onCheckedChange={(checked) => setEmailNotification(checked as boolean)}
            />
            <Label htmlFor="emailNotification" className="text-sm cursor-pointer">
              Send me an email when the alert triggers
            </Label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || targetPrice <= 0}
              className="flex-1"
            >
              {isSubmitting ? (
                <>Setting Alert...</>
              ) : existingAlert ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Update Alert
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Set Alert
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};