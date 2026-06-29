'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
  /** Accessible label announced to screen readers. Defaults to "Loading". */
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'border-blue-600',
  className = '',
  label = 'Loading',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div
      role="status"
      aria-label={label}
      className={`
        ${sizeClasses[size]} 
        border-2 ${color} border-t-transparent 
        rounded-full animate-spin
        ${className}
      `}
    >
      {/* Visually hidden text for screen readers that don't support aria-label on div */}
      <span className="sr-only">{label}</span>
    </div>
  );
};

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'md',
  className = '',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center gap-3 ${className}`}
    >
      <LoadingSpinner size={size} label={message} />
      <span className="text-gray-600 dark:text-gray-400" aria-hidden="true">
        {message}
      </span>
    </div>
  );
};

interface FullPageLoadingProps {
  message?: string;
}

export const FullPageLoading: React.FC<FullPageLoadingProps> = ({
  message = 'Connecting to wallet...',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      className="fixed inset-0 bg-white dark:bg-gray-900 bg-opacity-90 flex items-center justify-center z-50"
    >
      <div className="text-center">
        <LoadingSpinner size="lg" label={message} />
        <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300" aria-hidden="true">
          {message}
        </p>
      </div>
    </div>
  );
};

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', lines = 1 }) => {
  const id = React.useId();
  return (
    <div role="status" aria-busy="true" aria-label="Loading content" className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={`${id}-skeleton-line-${index}`}
          className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
          style={{
            width: `${Math.random() * 40 + 60}%`,
          }}
        />
      ))}
      <span className="sr-only">Loading content</span>
    </div>
  );
};
