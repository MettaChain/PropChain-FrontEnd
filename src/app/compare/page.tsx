'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Share2, Download, Clock, Trash2, FileText } from 'lucide-react';
import { propertyService } from '@/lib/propertyService';
import { useComparisonHistoryStore } from '@/store/comparisonHistoryStore';
import { useComparisonStore } from '@/store/comparisonStore';
import type { Property } from '@/types/property';
import { formatPrice, formatROI } from '@/utils/searchUtils';

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
    label: 'Total Price',
    key: 'price.total',
    format: (value) => formatPrice(value),
    higherIsBetter: false,
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

  return metric.higherIsBetter ? Math.max(...numericValues) : Math.min(...numericValues);
}

export default function ComparePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedProperties, clearProperties } = useComparisonStore();
  const { addComparison, history, removeComparison, clearHistory } = useComparisonHistoryStore();
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    const loadProperties = async () => {
      const propertyIds = searchParams.get('ids')?.split(',') || [];

      if (propertyIds.length > 0) {
        const fetchedProperties: Property[] = [];
        for (const id of propertyIds.slice(0, 3)) {
          const property = await propertyService.getPropertyById(id);
          if (property) {
            fetchedProperties.push(property);
          }
        }
        setProperties(fetchedProperties);
        addComparison(propertyIds.slice(0, 3));
      } else {
        setProperties(selectedProperties);
      }
    };

    loadProperties();
  }, [searchParams, selectedProperties, addComparison]);

  const handleShare = () => {
    const propertyIds = properties.map(p => p.id).join(',');
    const url = `${window.location.origin}/compare?ids=${propertyIds}`;
    navigator.clipboard.writeText(url);
  };

  const handleExport = () => {
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

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Property Comparison</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            h1 { color: #333; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>Property Comparison Report</h1>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                ${properties.map(p => `<th>${p.name}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${comparisonMetrics.map(metric => `
                <tr>
                  <td>${metric.label}</td>
                  ${properties.map(p => `<td>${metric.format(getNestedValue(p, metric.key), p)}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
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
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4" />
              Export PDF
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
                  {properties.map((property) => (
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
                        const isBest = bestValue !== null && value === bestValue;
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

        {/* Recent Comparisons History */}
        {history.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Recent Comparisons
              </h2>
              <button
                onClick={clearHistory}
                className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {history.map((comp) => (
                <div
                  key={comp.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>{formatTimestamp(comp.timestamp)}</span>
                    </div>
                    <button
                      onClick={() => removeComparison(comp.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete comparison"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2 mb-3">
                    {comp.propertyIds.map((id) => (
                      <div
                        key={id}
                        className="text-sm bg-gray-100 dark:bg-gray-700 rounded px-2 py-1"
                      >
                        Property #{id}
                      </div>
                    ))}
                  </div>
                  <Link
                    href={comp.shareUrl}
                    className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    View Comparison
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
