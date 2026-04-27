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
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { propertyService } from '@/lib/propertyService';
import type { Property } from '@/types/property';
import { formatPrice, formatROI } from '@/utils/searchUtils';
import { ArrowLeft, ExternalLink } from 'lucide-react';

const getBestIndexes = (values: number[], direction: 'high' | 'low') => {
  if (values.length === 0) return [];
  const normalized = values.filter((value) => typeof value === 'number');
  if (normalized.length === 0) return values.map(() => false);

  const target = direction === 'high' ? Math.max(...normalized) : Math.min(...normalized);
  return values.map((value) => value === target);
};

export default function ComparePage() {
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const selectedIds = useMemo(() => {
    const rawIds = searchParams?.get('ids') ?? '';
    return rawIds
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, 3);
  }, [searchParams]);

  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const results = await Promise.all(
          selectedIds.map((id) => propertyService.getPropertyById(id, { strategy: 'stale-while-revalidate' }))
        );

        setProperties(results.filter((property): property is Property => !!property));
      } catch (err) {
        setError('Unable to load comparison data.');
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedIds.length === 0) {
      setProperties([]);
      setIsLoading(false);
      return;
    }

    fetchProperties();
  }, [selectedIds]);

  const numericHighlights = useMemo(() => {
    const totalValues = properties.map((property) => property.price.total);
    const perToken = properties.map((property) => property.price.perToken);
    const roiValues = properties.map((property) => property.metrics.roi);
    const annualReturn = properties.map((property) => property.metrics.annualReturn);
    const appreciationRate = properties.map((property) => property.metrics.appreciationRate);
    const transactionVolume = properties.map((property) => property.metrics.transactionVolume);
    const bedrooms = properties.map((property) => property.details.bedrooms ?? 0);
    const bathrooms = properties.map((property) => property.details.bathrooms ?? 0);
    const squareFeet = properties.map((property) => property.details.squareFeet);
    const availableTokens = properties.map((property) => property.tokenInfo.available);

    return {
      totalValue: getBestIndexes(totalValues, 'low'),
      perToken: getBestIndexes(perToken, 'low'),
      roi: getBestIndexes(roiValues, 'high'),
      annualReturn: getBestIndexes(annualReturn, 'high'),
      appreciationRate: getBestIndexes(appreciationRate, 'high'),
      transactionVolume: getBestIndexes(transactionVolume, 'high'),
      bedrooms: getBestIndexes(bedrooms, 'high'),
      bathrooms: getBestIndexes(bathrooms, 'high'),
      squareFeet: getBestIndexes(squareFeet, 'high'),
      availableTokens: getBestIndexes(availableTokens, 'high'),
    };
  }, [properties]);

  const rows = useMemo(
    () =>
      properties.length > 0
        ? [
            {
              label: 'Location',
              values: properties.map((property) => `${property.location.city}, ${property.location.state}`),
            },
            {
              label: 'Blockchain',
              values: properties.map((property) => property.blockchain),
            },
            {
              label: 'Total Value',
              values: properties.map((property) => formatPrice(property.price.total)),
              highlight: numericHighlights.totalValue,
            },
            {
              label: 'Price per Token',
              values: properties.map((property) => formatPrice(property.price.perToken)),
              highlight: numericHighlights.perToken,
            },
            {
              label: 'ROI',
              values: properties.map((property) => formatROI(property.metrics.roi)),
              highlight: numericHighlights.roi,
            },
            {
              label: 'Annual Return',
              values: properties.map((property) => formatPrice(property.metrics.annualReturn)),
              highlight: numericHighlights.annualReturn,
            },
            {
              label: 'Appreciation Rate',
              values: properties.map((property) => `${property.metrics.appreciationRate}%`),
              highlight: numericHighlights.appreciationRate,
            },
            {
              label: 'Transaction Volume',
              values: properties.map((property) => formatPrice(property.metrics.transactionVolume)),
              highlight: numericHighlights.transactionVolume,
            },
            {
              label: 'Bedrooms',
              values: properties.map((property) => String(property.details.bedrooms ?? '—')),
              highlight: numericHighlights.bedrooms,
            },
            {
              label: 'Bathrooms',
              values: properties.map((property) => String(property.details.bathrooms ?? '—')),
              highlight: numericHighlights.bathrooms,
            },
            {
              label: 'Square Feet',
              values: properties.map((property) => property.details.squareFeet.toLocaleString()),
              highlight: numericHighlights.squareFeet,
            },
            {
              label: 'Available Tokens',
              values: properties.map((property) => property.tokenInfo.available.toLocaleString()),
              highlight: numericHighlights.availableTokens,
            },
          ]
        : [] ,
    [properties, numericHighlights]
  );

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-blue-600 font-semibold uppercase">Comparison</p>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Property Comparison</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-2xl">
              Compare up to 3 selected properties across key investment metrics and share your results via URL.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/properties"
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Select More Properties
            </Link>
            {selectedIds.length > 0 && (
              <a
                href={`/compare?ids=${selectedIds.join(',')}`}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
              >
                <ExternalLink className="w-4 h-4" />
                Share this Link
              </a>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-3xl border border-dashed border-blue-200 bg-white p-10 text-center text-gray-600 shadow-sm dark:bg-gray-900 dark:text-gray-300">
            Loading selected properties...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-700 shadow-sm">
            <p className="font-semibold">{error}</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-10 text-center text-gray-600 shadow-sm dark:bg-gray-900 dark:text-gray-300">
            <p className="text-lg font-semibold">No properties selected for comparison.</p>
            <p className="mt-2">Choose properties from the listing page and use the compare checkbox to start a new comparison.</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-950/60">
                    <tr>
                      <th className="border-b border-gray-200 px-4 py-4 text-sm font-semibold text-gray-600 dark:border-gray-800 dark:text-gray-300">Metric</th>
                      {properties.map((property) => (
                        <th key={property.id} className="border-b border-gray-200 px-4 py-4 text-left text-sm font-semibold text-gray-900 dark:border-gray-800 dark:text-white">
                          <div className="flex items-center gap-3">
                            <div className="relative h-20 w-28 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                              <Image src={property.images[0]} alt={property.name} fill className="object-cover" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">{property.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{property.location.city}, {property.location.state}</p>
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.label} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                        <td className="whitespace-nowrap px-4 py-4 font-medium text-gray-700 dark:text-gray-300">{row.label}</td>
                        {row.values.map((value, index) => {
                          const isBest = row.highlight?.[index];
                          return (
                            <td
                              key={`${row.label}-${index}`}
                              className={`px-4 py-4 ${isBest ? 'rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' : 'text-gray-700 dark:text-gray-300'}`}
                            >
                              {value}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
