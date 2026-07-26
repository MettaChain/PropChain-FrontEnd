import React, { useEffect, useState, useRef, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingShell = () => (
  <div className="flex h-64 w-full items-center justify-center bg-gray-50/50 rounded-xl border border-dashed">
    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
  </div>
);

export const LazyChart: React.FC<{ children: ReactNode }> = ({ children }) => {
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
      { rootMargin: '200px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full min-h-[256px]">
      {isVisible ? children : <LoadingShell />}
    </div>
  );
};
