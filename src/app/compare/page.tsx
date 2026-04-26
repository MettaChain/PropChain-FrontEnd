'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Share2, Download } from 'lucide-react';
import { propertyService } from '@/lib/propertyService';

interface ComparisonMetric {
  label: string;
  key: keyof Property | string;
  format: (value: any, property?: Property) => string;
  higherIsBetter?: boolean;
}

const comparisonMetrics: ComparisonMetric[] = [
  {
    label: 'Property Name',
    key: 'name',
    format: (value) => value,
  },
  {
    label: 'Location',
    key: 'location',
    format: (value: Property['location']) => `${value.city}, ${value.state}`,
  },
  {
    label: 'Property Type',
    key: 'propertyType',
    format: (value) => PROPERTY_TYPE_LABELS[value as keyof typeof PROPERTY_TYPE_LABELS],
  },
  {
    label: 'Blockchain',
    key: 'blockchain',
    format: (value) => BLOCKCHAIN_LABELS[value as keyof typeof BLOCKCHAIN_LABELS],
  },
  {
    label: 'Total Price',
    key: 'price.total',
    format: (value) => formatPrice(value),
    higherIsBetter: false, // Lower price might be better
  },
  {
    label: 'Price per Token',
    key: 'price.perToken',
    format: (value) => formatPrice(value),
    higherIsBetter: false,
  },
  {
    label: 'ROI',
    key: 'metrics.roi',
    format: (value) => formatROI(value),
    higherIsBetter: true,
  },
  {
    label: 'Annual Return',
    key: 'metrics.annualReturn',
    format: (value) => formatPrice(value),
    higherIsBetter: true,
  },
  {
    label: 'Bedrooms',
    key: 'details.bedrooms',
    format: (value) => value || 'N/A',
    higherIsBetter: true,
  },
  {
    label: 'Bathrooms',
    key: 'details.bathrooms',
    format: (value) => value || 'N/A',
    higherIsBetter: true,
  },
  {
    label: 'Square Feet',
    key: 'details.squareFeet',
    format: (value) => value.toLocaleString(),
    higherIsBetter: true,
  },
  {
    label: 'Available Tokens',
    key: 'tokenInfo.available',
    format: (value) => value.toLocaleString(),
    higherIsBetter: true,
  },
];

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function getBestValue(properties: Property[], metric: ComparisonMetric): number | null {
  if (!metric.higherIsBetter) return null;

  const values = properties.map(p => getNestedValue(p, metric.key));
  const numericValues = values.filter(v => typeof v === 'number' && !isNaN(v));

  if (numericValues.length === 0) return null;

  if (metric.higherIsBetter) {
    return Math.max(...numericValues);
  } else {
    return Math.min(...numericValues);
  }
}

export default function ComparePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedProperties, clearProperties } = useComparisonStore();
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    const loadProperties = async () => {
      const propertyIds = searchParams.get('ids')?.split(',') || [];

      if (propertyIds.length > 0) {
        // Fetch properties by IDs
        const fetchedProperties: Property[] = [];
        for (const id of propertyIds.slice(0, 3)) { // Max 3
          const property = await propertyService.getPropertyById(id);
          if (property) {
            fetchedProperties.push(property);
          }
        }
        setProperties(fetchedProperties);
      } else {
        // Use selected properties from store
        setProperties(selectedProperties);
      }
    };

    loadProperties();
  }, [searchParams, selectedProperties]);

  const handleShare = () => {
    const propertyIds = properties.map(p => p.id).join(',');
    const url = `${window.location.origin}/compare?ids=${propertyIds}`;
    navigator.clipboard.writeText(url);
    // You could show a toast notification here
  };

  const handleExport = () => {
    // Simple CSV export
    const headers = comparisonMetrics.map(m => m.label);
    const rows = properties.map(property =>
      comparisonMetrics.map(metric =>
        `"${getNestedValue(property, metric.key)}"`
      )
    );

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'property-comparison.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (properties.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              No Properties to Compare
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Select properties to compare by checking the comparison box on property cards.
            </p>
            <Link
              href="/"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Browse Properties
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Properties
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Property Comparison
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Metric
                  </th>
                  {properties.map((property, index) => (
                    <th key={property.id} className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <img
                          src={property.images[0]}
                          alt={property.name}
                          className="w-16 h-12 object-cover rounded mb-2"
                        />
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                          {property.name}
                        </h3>
                        <div
                          className="text-xs px-2 py-1 rounded text-white"
                          style={{ backgroundColor: getBlockchainColor(property.blockchain) }}
                        >
                          {BLOCKCHAIN_LABELS[property.blockchain]}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {comparisonMetrics.map((metric, metricIndex) => {
                  const bestValue = getBestValue(properties, metric);
                  return (
                    <tr key={metric.key} className={metricIndex % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {metric.label}
                      </td>
                      {properties.map((property) => {
                        const value = getNestedValue(property, metric.key);
                        const isBest = bestValue !== null && value === bestValue && metric.higherIsBetter;
                        return (
                          <td key={property.id} className="px-6 py-4 text-center">
                            <span className={`text-sm ${isBest ? 'font-bold text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                              {metric.format(value, property)}
                            </span>
                            {isBest && (
                              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                                Best
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={clearProperties}
            className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Clear Comparison
          </button>
          <Link
            href="/"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Browse More Properties
          </Link>
        </div>
      </div>
    </div>
  );
}</content>
<parameter name="filePath">/home/semicolon/Documents/Drip/PropChain-FrontEnd/src/app/compare/page.tsx