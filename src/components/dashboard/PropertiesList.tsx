'use client';

import { motion } from "framer-motion";
import { PropertyCard } from "./PropertyCard";

const properties = [
  {
    id: "1",
    name: "Manhattan Tower Suite",
    location: "New York, NY",
    type: "Commercial",
    value: 524000,
    tokens: 1048,
    roi: 14.2,
    monthlyIncome: 3280,
    image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "2",
    name: "Sunset Beach Villa",
    location: "Miami, FL",
    type: "Residential",
    value: 389000,
    tokens: 778,
    roi: 11.8,
    monthlyIncome: 2450,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "3",
    name: "Tech Hub Office Complex",
    location: "San Francisco, CA",
    type: "Commercial",
    value: 892000,
    tokens: 1784,
    roi: 9.5,
    monthlyIncome: 5620,
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "4",
    name: "Industrial Logistics Park",
    location: "Dallas, TX",
    type: "Industrial",
    value: 456000,
    tokens: 912,
    roi: 8.3,
    monthlyIncome: 2890,
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "5",
    name: "Downtown Luxury Lofts",
    location: "Chicago, IL",
    type: "Residential",
    value: 312000,
    tokens: 624,
    roi: -2.1,
    monthlyIncome: 1980,
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "6",
    name: "Mixed-Use Development",
    location: "Austin, TX",
    type: "Mixed-Use",
    value: 274520,
    tokens: 549,
    roi: 16.7,
    monthlyIncome: 2020,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80",
  },
];

export const PropertiesList = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Your Properties</h3>
          <p className="text-sm text-muted-foreground mt-1">Tokenized real estate holdings</p>
        </div>
        <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
          View All →
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {properties.map((property, index) => (
          <PropertyCard key={property.id} property={property} index={index} />
        ))}
      </div>
    </motion.div>
  );
};
