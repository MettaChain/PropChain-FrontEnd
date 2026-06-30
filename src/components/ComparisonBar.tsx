'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Copy, ArrowRight, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCompareStore } from '@/store/compareStore';
import { useSafeTimeout } from '@/hooks/useSafeTimeout';

const MAX_COMPARE = 3;

export const ComparisonBar = () => {
  const { t } = useTranslation('common');
  const selectedIds = useCompareStore((state) => state.selectedIds);
  const removeProperty = useCompareStore((state) => state.removeProperty);
  const clearCompare = useCompareStore((state) => state.clearCompare);
  const [shareUrl, setShareUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const { setTimeoutSafe } = useSafeTimeout();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/compare?ids=${selectedIds.join(',')}`;
    setShareUrl(url);
  }, [selectedIds]);

  const handleCopy = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeoutSafe(() => setCopySuccess(false), 2000);
    } catch {
      setCopySuccess(false);
    }
  };

  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 pointer-events-none sm:left-6 sm:right-6">
      <div className="mx-auto max-w-6xl rounded-3xl border border-blue-200/70 bg-white/95 shadow-2xl shadow-blue-900/10 backdrop-blur-sm p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pointer-events-auto">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <div className="rounded-2xl bg-blue-50 dark:bg-blue-900/10 px-4 py-3 text-sm text-blue-700 dark:text-blue-200 font-semibold">
            {t('comparison.title', { count: selectedIds.length, max: MAX_COMPARE })}
          </div>

          {/* <488 fix: each chip wrapped as <li> for screen-reader list semantics (#488) */}
          <ul
            role="list"
            aria-label={`Selected properties for comparison, ${selectedIds.length} ${selectedIds.length === 1 ? 'item' : 'items'}`}
            className="flex flex-wrap gap-2 list-none p-0 m-0"
          >
            {selectedIds.map((id) => (
              <li key={id} className="list-none">
                <button
                  type="button"
                  onClick={() => removeProperty(id)}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:border-red-300 hover:bg-red-50 transition-colors"
                  title={t('comparison.removeFromComparison')}
                  aria-label={`Remove property ${id} from comparison`}
                >
                  <span>#{id}</span>
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </li>
              <button
                key={id}
                type="button"
                onClick={() => removeProperty(id)}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:border-red-300 hover:bg-red-50 transition-colors"
                aria-label={`${t('comparison.removeFromComparison')}: #${id}`}
              >
                <span className="sr-only">{t('comparison.selected')}: </span>
                <span>#{id}</span>
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            title={t('comparison.shareComparison')}
          >
            <Copy className="w-4 h-4" />
            {copySuccess ? t('comparison.linkCopied') : t('comparison.copyComparisonLink')}
          </button>

          <Link
            href={`/compare?ids=${selectedIds.join(',')}`}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            {t('comparison.compareNow')}
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            type="button"
            onClick={clearCompare}
            className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('comparison.clear')}
          </button>
        </div>
      </div>
    </div>
  );
};
