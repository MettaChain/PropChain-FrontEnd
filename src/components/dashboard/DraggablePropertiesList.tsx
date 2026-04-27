'use client';

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { GripVertical, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "./PropertyCard";

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

const defaultProperties: Property[] = [
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

export const DraggablePropertiesList = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [draggedItem, setDraggedItem] = useState<Property | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Load properties from localStorage or use default
  useEffect(() => {
    const savedOrder = localStorage.getItem('portfolioOrder');
    if (savedOrder) {
      try {
        const savedIds = JSON.parse(savedOrder);
        const orderedProperties = savedIds.map((id: string) => 
          defaultProperties.find(p => p.id === id)
        ).filter(Boolean);
        setProperties(orderedProperties.length > 0 ? orderedProperties : defaultProperties);
      } catch (error) {
        console.error('Error loading portfolio order:', error);
        setProperties(defaultProperties);
      }
    } else {
      setProperties(defaultProperties);
    }
  }, []);

  // Save order to localStorage whenever it changes
  useEffect(() => {
    if (properties.length > 0) {
      localStorage.setItem('portfolioOrder', JSON.stringify(properties.map(p => p.id)));
    }
  }, [properties]);

  const handleDragStart = (e: React.DragEvent, property: Property) => {
    setDraggedItem(property);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (!draggedItem) return;

    const draggedIndex = properties.findIndex(p => p.id === draggedItem.id);
    if (draggedIndex === dropIndex) return;

    const newProperties = [...properties];
    newProperties.splice(draggedIndex, 1);
    newProperties.splice(dropIndex, 0, draggedItem);
    
    setProperties(newProperties);
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const resetToDefault = () => {
    setProperties(defaultProperties);
    localStorage.removeItem('portfolioOrder');
  };

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const newProperties = [...properties];
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (index > 0) {
          [newProperties[index], newProperties[index - 1]] = 
          [newProperties[index - 1], newProperties[index]];
          setProperties(newProperties);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (index < properties.length - 1) {
          [newProperties[index], newProperties[index + 1]] = 
          [newProperties[index + 1], newProperties[index]];
          setProperties(newProperties);
        }
        break;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Your Properties</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Drag and drop to reorder your portfolio
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefault}
            className="text-xs"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset Order
          </Button>
          <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            View All →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {properties.map((property, index) => (
          <motion.div
            key={property.id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`relative group ${
              dragOverIndex === index ? 'scale-105' : ''
            }`}
          >
            {/* Drag Handle */}
            <div
              className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-move bg-white/90 dark:bg-gray-800/90 rounded-md p-1.5 shadow-md"
              draggable
              onDragStart={(e) => handleDragStart(e, property)}
              onDragEnd={handleDragEnd}
            >
              <GripVertical className="w-4 h-4 text-gray-500" />
            </div>

            {/* Draggable Property Card */}
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, property)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onKeyDown={(e) => handleKeyDown(e, index)}
              tabIndex={0}
              role="button"
              aria-label={`Property ${property.name}, press arrow keys to reorder`}
              className="cursor-move focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-xl"
            >
              <PropertyCard property={property} index={index} />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
