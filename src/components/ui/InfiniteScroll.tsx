"use client";

import * as React from "react";

interface UseInfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
}

interface UseInfiniteScrollResult {
  ref: React.RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  reset: () => void;
}

export function useInfiniteScroll({
  threshold = 0.1,
  rootMargin = "100px",
  enabled = true,
}: UseInfiniteScrollOptions = {}): UseInfiniteScrollResult {
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const loadMoreRef = React.useRef<(() => void) | null>(null);
  const ref = React.useRef<HTMLDivElement | null>(null);

  const loadMore = React.useCallback(() => {
    loadMoreRef.current?.();
  }, []);

  const reset = React.useCallback(() => {
    setIsLoading(false);
    setHasMore(true);
  }, []);

  React.useEffect(() => {
    if (!enabled || !ref.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
          setIsLoading(true);
          loadMoreRef.current?.();
        }
      },
      { threshold, rootMargin }
    );

    const currentRef = ref.current;
    observer.observe(currentRef);

    return () => {
      observer.unobserve(currentRef);
    };
  }, [enabled, isLoading, hasMore, threshold, rootMargin]);

  return {
    ref,
    isLoading,
    hasMore,
    loadMore,
    reset,
  };
}

interface InfiniteScrollProps<T> {
  items: T[];
  loadMore: () => Promise<{ items: T[]; hasMore: boolean }>;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  endComponent?: React.ReactNode;
  className?: string;
  listClassName?: string;
}

export function InfiniteScroll<T>({
  items,
  loadMore,
  renderItem,
  keyExtractor,
  loadingComponent,
  emptyComponent,
  endComponent,
  className,
  listClassName,
}: InfiniteScrollProps<T>) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  const loadingRef = React.useRef(false);

  const handleLoadMore = React.useCallback(async () => {
    if (loadingRef.current || !hasMore) return;

    loadingRef.current = true;
    setIsLoading(true);

    try {
      const result = await loadMore();
      setHasMore(result.hasMore);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [loadMore, hasMore]);

  React.useEffect(() => {
    if (!sentinelRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    observerRef.current.observe(sentinelRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [handleLoadMore]);

  if (items.length === 0 && !isLoading) {
    return emptyComponent ? <>{emptyComponent}</> : null;
  }

  return (
    <div className={className}>
      <div className={listClassName}>
        {items.map((item, index) => (
          <div key={keyExtractor(item, index)}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      <div ref={sentinelRef} className="h-4" />

      {isLoading && loadingComponent && <>{loadingComponent}</>}

      {!hasMore && endComponent && <>{endComponent}</>}
    </div>
  );
}
