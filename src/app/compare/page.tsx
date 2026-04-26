'use client';

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
