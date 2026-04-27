'use client';

import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, TrendingUp, TrendingDown, Building2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTransaction } from "@/hooks/useTransaction";
import { GasEstimator } from "@/components/GasEstimator";
import { useState } from "react";

interface Property {
  id: string;
  name: string;
  location: string;
  type: string;
  value: number;
  tokens: number;
  roi: number;
  monthlyIncome: number;
  image: string;
}

interface PropertyCardProps {
  property: Property;
  index: number;
}

export const PropertyCard = ({ property, index }: PropertyCardProps) => {
  const { addTransactionToQueue } = useTransaction();
  const [showGasEstimator, setShowGasEstimator] = useState(false);
  const isPositiveROI = property.roi >= 0;

  const handlePurchase = () => {
    // Simulate a transaction hash for demo purposes
    const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    
    addTransactionToQueue({
      hash: mockTxHash,
      type: 'purchase',
      description: `Purchase tokens for ${property.name}`,
      propertyId: property.id,
      value: (property.value * 0.1).toString(), // 10% purchase for demo
      requiredConfirmations: 2,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 * index }}
      className="glass-card rounded-xl overflow-hidden hover:border-primary/30 transition-all duration-300 group"
      data-testid="property-card"
    >
      <div className="relative h-40 overflow-hidden">
        <Image
          src={property.image}
          alt={property.name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-secondary/80 text-xs font-medium backdrop-blur-sm">
            <Building2 className="w-3 h-3 mr-1.5" />
            {property.type}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
            {property.name}
          </h4>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
            <MapPin className="w-3.5 h-3.5" />
            {property.location}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Value</p>
            <p className="font-semibold font-mono text-sm">
              ${property.value.toLocaleString()}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
              Tokens Held
              <span className="text-xs text-blue-500 cursor-help" title="Digital assets representing fractional ownership of property">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </p>
            <div className="flex items-center gap-2">
              <p className="font-semibold font-mono text-sm">
                {property.tokens.toLocaleString()}
              </p>
              <button
                onClick={() => navigator.clipboard.writeText(property.tokens.toString())}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                title="Copy token amount"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
              ROI
              <span className="text-xs text-blue-500 cursor-help" title="Return on Investment - earnings generated as a percentage of investment">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </p>
            <div className={`flex items-center gap-1 font-semibold font-mono text-sm ${
              isPositiveROI ? "text-success" : "text-destructive"
            }`}>
              {isPositiveROI ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {isPositiveROI ? "+" : ""}{property.roi}%
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Monthly Income</p>
            <p className="font-semibold font-mono text-sm text-primary">
              ${property.monthlyIncome.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            onClick={() => setShowGasEstimator(!showGasEstimator)}
            variant="outline"
            size="sm"
            className="w-full"
          >
            Estimate Gas
          </Button>
          
          {showGasEstimator && (
            <GasEstimator
              to="0x742d35Cc6634C0532925a3b844Bc454e4438f44e" // Sample contract address
              value={(property.value * 0.1).toString()}
              enabled={true}
            />
          )}

          <div className="flex gap-2">
            <Button 
              onClick={() => {
                const shareUrl = `${window.location.origin}/properties/${property.id}`;
                if (navigator.share) {
                  navigator.share({
                    title: property.name,
                    text: `Check out this property: ${property.name} in ${property.location}`,
                    url: shareUrl
                  });
                } else {
                  navigator.clipboard.writeText(shareUrl);
                }
              }}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a3 3 0 10-4.732 2.684m4.732-2.684a3 3 0 00-4.732-2.684M3 12a3 3 0 104.732 2.684M3 12a3 3 0 014.732-2.684" />
              </svg>
              Share
            </Button>
            <Button onClick={handlePurchase} className="flex-1">
              <ShoppingCart className="w-4 h-4 mr-1" />
              Purchase
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
