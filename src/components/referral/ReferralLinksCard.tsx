'use client';

/**
 * ReferralLinksCard - Displays user's referral links with sharing options
 */

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useReferralLinks } from '@/store/referralStore';
import { referralService } from '@/lib/referralService';
import { createWalletAddress } from '@/types/referral';
import CopyButton from './CopyButton';
import ShareButton from './ShareButton';
import CreateReferralLinkModal from './CreateReferralLinkModal';

export interface ReferralLinksCardProps {
  maxLinksToShow?: number;
}

export default function ReferralLinksCard({
  maxLinksToShow = 3,
}: ReferralLinksCardProps) {
  const { address } = useAccount();
  const referralLinks = useReferralLinks();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [loadingShortUrl, setLoadingShortUrl] = useState<string | null>(null);

  const handleCopy = useCallback(
    (code: string, url: string) => {
      navigator.clipboard.writeText(url);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    },
    []
  );

  const handleShare = async (code: string, url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join PropChain - Earn Referral Rewards!',
          text: 'Invest in real estate through blockchain. Use my referral link and earn rewards!',
          url: url,
        });
      } catch (error) {
        // User cancelled share
      }
    }
  };

  const displayLinks = referralLinks.slice(0, maxLinksToShow);
  const hasMoreLinks = referralLinks.length > maxLinksToShow;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center text-xl font-semibold text-slate-900">
          <span className="mr-2">🔗</span>
          Your Referral Links
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700"
        >
          + Create Link
        </button>
      </div>

      {displayLinks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-slate-600">No referral links created yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Create your first link
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {displayLinks.map((link) => (
            <div
              key={link.code}
              className="flex flex-col items-start justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center"
            >
              <div className="mb-3 w-full flex-1 sm:mb-0">
                {link.customName && (
                  <p className="text-sm font-medium text-slate-700">
                    {link.customName}
                  </p>
                )}
                <p className="mt-1 break-all text-xs text-slate-600">
                  {link.url}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Code: <span className="font-mono font-semibold">{link.code}</span>
                </p>
              </div>
              <div className="flex w-full gap-2 sm:w-auto">
                <CopyButton
                  text={link.url}
                  onCopy={() => handleCopy(link.code, link.url)}
                  isCopied={copiedCode === link.code}
                />
                <ShareButton url={link.url} onShare={() => handleShare(link.code, link.url)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMoreLinks && (
        <div className="mt-4 text-center">
          <a
            href="/referral/links"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View all {referralLinks.length} links →
          </a>
        </div>
      )}

      {/* Create Link Modal */}
      {showCreateModal && (
        <CreateReferralLinkModal
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
