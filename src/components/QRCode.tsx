'use client';

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getDisplaySafeUrl, validateQRCodeUrl } from '@/utils/security/qrCodeSecurity';

interface QRCodeProps {
  url: string;
  size?: number;
  className?: string;
  allowedHosts?: readonly string[];
}

export const QRCode: React.FC<QRCodeProps> = ({
  url,
  size = 150,
  className = '',
  allowedHosts,
}) => {
  const { t } = useTranslation('common');

  const validation = useMemo(
    () => validateQRCodeUrl(url, allowedHosts),
    [url, allowedHosts],
  );

  const displayUrl = useMemo(
    () => (validation.isValid && validation.sanitizedUrl ? getDisplaySafeUrl(validation.sanitizedUrl) : ''),
    [validation],
  );

  if (!validation.isValid) {
    return (
      <div
        className={`qr-code qr-code--invalid ${className}`}
        data-testid="qr-code-invalid"
        style={{ width: size, minHeight: size }}
        role="alert"
        aria-label={t('qrCode.invalidUrl')}
      >
        <div className="border-2 border-red-300 p-2 rounded-lg bg-red-50 dark:bg-red-900/10">
          <p className="text-xs text-center text-red-700 dark:text-red-300">
            {t('qrCode.invalidUrl')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`qr-code ${className}`}
      data-testid="qr-code"
      data-url={validation.sanitizedUrl ?? undefined}
      style={{ width: size, height: size }}
      role="img"
      aria-label={t('qrCode.ariaLabel')}
    >
      <div className="border-2 border-gray-300 p-2 rounded-lg bg-white">
        <div className="text-xs text-center break-all font-mono">{displayUrl}</div>
        <div className="text-xs text-center mt-1 text-gray-500">
          {t('qrCode.placeholder')}
        </div>
        {validation.warnings.length > 0 && (
          <p className="text-xs text-center mt-1 text-amber-600" data-testid="qr-code-warning">
            {t('qrCode.securityWarning')}
          </p>
        )}
      </div>
    </div>
  );
};
