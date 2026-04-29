import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

export const EmptyState = ({
  title,
  description,
  icon: Icon,
  action,
  className,
}: EmptyStateProps) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-16 px-4 text-center",
      className
    )}>
      <div className="relative mb-6">
        {/* Background Decorative Circles */}
        <div className="absolute inset-0 -m-4 bg-blue-50 dark:bg-blue-900/20 rounded-full blur-2xl opacity-50" />
        <div className="relative flex items-center justify-center w-24 h-24 rounded-2xl bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700">
          {Icon ? (
            <Icon className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          ) : (
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          )}
        </div>
      </div>

      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>

      {action && (
        action.href ? (
          <Link href={action.href}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-xl text-lg font-semibold transition-all hover:shadow-lg active:scale-95">
              {action.label}
            </Button>
          </Link>
        ) : (
          <Button 
            onClick={action.onClick}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-xl text-lg font-semibold transition-all hover:shadow-lg active:scale-95"
          >
            {action.label}
          </Button>
        )
      )}
    </div>
  );
};
