'use client';

import dynamic from 'next/dynamic';
import React, { ComponentType, useEffect, useRef, useState } from 'react';

export function withLazyChart<T extends object>(
  importFunc: () => Promise<{ default: ComponentType<T> }>,
  LoadingShell: React.FC = () => <div className="h-64 animate-pulse bg-gray-100 rounded-xl w-full" />
) {
  const DynamicComponent = dynamic(importFunc, {
    ssr: false,
    loading: LoadingShell,
  });

  return function LazyWrapper(props: T) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { rootMargin: '300px' }
      );

      if (ref.current) {
        observer.observe(ref.current);
      }

      return () => observer.disconnect();
    }, []);

    return (
      <div ref={ref} className="w-full">
        {isVisible ? <DynamicComponent {...props} /> : <LoadingShell />}
      </div>
    );
  };
}
