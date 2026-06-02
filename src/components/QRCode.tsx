'use client';

import React from 'react';

interface QRCodeProps {
  url: string;
  size?: number;
  className?: string;
}

export const QRCode: React.FC<QRCodeProps> = ({ url, size = 150, className = '' }) => {
  // Simple QR code placeholder - in a real implementation, you'd use a QR code library
  // For now, we'll create a simple placeholder that shows the URL
  return (
    <div 
      className={`qr-code ${className}`}
      data-url={url}
      style={{ width: size, height: size }}
    >
      <div className="border-2 border-gray-300 p-2 rounded-lg bg-white">
        <div className="text-xs text-center break-all font-mono">
          {url}
        </div>
        <div className="text-xs text-center mt-1 text-gray-500">
          [QR Code Placeholder]
        </div>
      </div>
    </div>
  );
};
