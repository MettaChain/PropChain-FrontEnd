'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useDeveloperStore } from '@/store/developerStore';
import { DeveloperBadge } from '@/components/DeveloperBadge';
import type { VerificationStatus } from '@/types/developer';

const STATUS_OPTIONS: VerificationStatus[] = ['verified', 'pending', 'unverified', 'rejected'];

export default function AdminVerificationsPage() {
  const { developers, updateVerificationStatus } = useDeveloperStore();
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({});

  function handleStatusChange(id: string, status: VerificationStatus) {
    updateVerificationStatus(id, status, status === 'rejected' ? rejectionReason[id] : undefined);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Developer Verification Admin
          </h1>
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
            ← Dashboard
          </Link>
        </div>

        {developers.length === 0 && (
          <p className="text-gray-500 text-sm">No developers registered yet.</p>
        )}

        <div className="space-y-4">
          {developers.map((dev) => (
            <div
              key={dev.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/developers/${dev.id}`}
                      className="font-semibold text-gray-900 dark:text-white hover:text-blue-600"
                    >
                      {dev.name}
                    </Link>
                    <DeveloperBadge status={dev.verificationStatus} compact />
                  </div>
                  {dev.company && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{dev.company}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">
                    {dev.walletAddress.slice(0, 10)}…{dev.walletAddress.slice(-6)}
                  </p>
                </div>

                {/* Status selector */}
                <select
                  value={dev.verificationStatus}
                  onChange={(e) => handleStatusChange(dev.id, e.target.value as VerificationStatus)}
                  className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rejection reason input */}
              {dev.verificationStatus === 'rejected' && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Rejection reason…"
                    value={rejectionReason[dev.id] ?? dev.rejectionReason ?? ''}
                    onChange={(e) =>
                      setRejectionReason((prev) => ({ ...prev, [dev.id]: e.target.value }))
                    }
                    className="flex-1 text-sm border border-red-300 dark:border-red-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={() => handleStatusChange(dev.id, 'rejected')}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg"
                  >
                    Save
                  </button>
                </div>
              )}

              <div className="text-xs text-gray-400">
                {dev.propertyIds.length} properties · Registered{' '}
                {new Date(dev.createdAt).toLocaleDateString()}
                {dev.verifiedAt && ` · Verified ${new Date(dev.verifiedAt).toLocaleDateString()}`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
