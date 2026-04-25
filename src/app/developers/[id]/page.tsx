'use client';

import { use } from 'react';
import Link from 'next/link';
import { useDeveloperStore } from '@/store/developerStore';
import { DeveloperBadge } from '@/components/DeveloperBadge';
import { VERIFICATION_CRITERIA } from '@/types/developer';
import { ExternalLink, Building2 } from 'lucide-react';

export default function DeveloperProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { developers } = useDeveloperStore();
  const developer = developers.find((d) => d.id === id);

  if (!developer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-xl font-semibold">Developer not found</p>
          <Link href="/properties" className="text-blue-600 hover:underline text-sm">
            ← Back to properties
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link href="/properties" className="text-sm text-blue-600 hover:underline">
          ← Back to properties
        </Link>

        {/* Header card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Building2 className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{developer.name}</h1>
                {developer.company && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{developer.company}</p>
                )}
              </div>
            </div>
            <DeveloperBadge status={developer.verificationStatus} developerName={developer.name} />
          </div>

          {developer.description && (
            <p className="text-gray-700 dark:text-gray-300 text-sm">{developer.description}</p>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>
              <strong className="text-gray-900 dark:text-white">{developer.propertyIds.length}</strong> listed properties
            </span>
            {developer.verifiedAt && (
              <span>Verified {new Date(developer.verifiedAt).toLocaleDateString()}</span>
            )}
            {developer.website && (
              <a
                href={developer.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:underline"
              >
                Website <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Verification criteria */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Verification Criteria</h2>
          <ul className="space-y-3">
            {VERIFICATION_CRITERIA.map((c) => (
              <li key={c.title} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 w-4 h-4 rounded-full flex-shrink-0 ${
                    developer.verificationStatus === 'verified'
                      ? 'bg-emerald-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{c.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{c.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Portfolio */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Property Portfolio</h2>
          {developer.propertyIds.length === 0 ? (
            <p className="text-sm text-gray-500">No properties listed yet.</p>
          ) : (
            <ul className="space-y-2">
              {developer.propertyIds.map((pid) => (
                <li key={pid}>
                  <Link
                    href={`/properties/${pid}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {pid}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
