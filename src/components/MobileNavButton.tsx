import Link from 'next/link';
import React from 'react';

interface MobileNavButtonProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

export function MobileNavButton({
  href,
  icon,
  label,
  active = false,
}: MobileNavButtonProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`
        flex min-h-[44px] min-w-[44px]
        items-center justify-center
        rounded-lg
        transition-colors
        touch-manipulation
        ${active
          ? 'text-blue-600'
          : 'text-gray-500 hover:text-gray-900'}
      `}
    >
      {icon}
    </Link>
  );
}