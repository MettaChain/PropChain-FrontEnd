'use client';

/**
 * CreateReferralLinkModal - Modal for creating new referral links
 */

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useReferralStore } from '@/store/referralStore';
import { referralService } from '@/lib/referralService';
import { createWalletAddress } from '@/types/referral';

export interface CreateReferralLinkModalProps {
  onClose: () => void;
}

export default function CreateReferralLinkModal({
  onClose,
}: CreateReferralLinkModalProps) {
  const { address } = useAccount();
  const [customName, setCustomName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addReferralLink, setNotification } = useReferralStore();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await referralService.createReferralLink({
        referrerId: createWalletAddress(address),
        customName: customName || undefined,
      });

      addReferralLink({
        code: response.code,
        referrerId: createWalletAddress(address),
        url: response.url,
        shortUrl: response.shortUrl,
        createdAt: Date.now(),
        isActive: true,
        customName: customName || undefined,
      });

      setNotification('Referral link created successfully!', 'success');
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create referral link';
      setError(message);
      setNotification(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">
          Create Referral Link
        </h2>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Link Name (Optional)
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g., Social Media Campaign"
              maxLength={50}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-500">
              Give your link a descriptive name to track different campaigns
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
