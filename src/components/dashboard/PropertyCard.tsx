'use client';

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
    >
      <div className="relative h-40 overflow-hidden">
        <img
          src={property.image}
          alt={property.name}
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
            <p className="text-xs text-muted-foreground">Tokens Held</p>
            <p className="font-semibold font-mono text-sm">
              {property.tokens.toLocaleString()}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">ROI</p>
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

          <Button onClick={handlePurchase} className="w-full">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Purchase Tokens
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
