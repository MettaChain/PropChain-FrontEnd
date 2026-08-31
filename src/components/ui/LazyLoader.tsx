"use client";

import React, { Suspense, type ComponentType, type LazyExoticComponent } from "react";
import { cn } from "@/lib/utils";

interface LazyLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export function LazyLoader({
  children,
  fallback,
  className,
}: LazyLoaderProps) {
  const defaultFallback = (
    <div
      className={cn(
        "flex items-center justify-center min-h-[200px]",
        className
      )}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );

  return <Suspense fallback={fallback || defaultFallback}>{children}</Suspense>;
}

export function lazyLoad<P extends object>(
  factory: () => Promise<{ default: ComponentType<P> }>,
  options?: {
    fallback?: React.ReactNode;
    className?: string;
  }
) {
  const LazyComponent = React.lazy(factory);

  function LazyWrapper(props: P) {
    return (
      <LazyLoader fallback={options?.fallback} className={options?.className}>
        <LazyComponent {...props} />
      </LazyLoader>
    );
  }

  LazyWrapper.displayName = `LazyLoad(${factory.toString().slice(0, 50)})`;

  return LazyWrapper;
}

export function preloadComponent<P extends object>(
  lazyComponent: LazyExoticComponent<ComponentType<P>>
) {
  if ("status" in lazyComponent && lazyComponent.status === "unloaded") {
    lazyComponent();
  }
}

export function createLazyLoader<T extends Record<string, ComponentType<any>>>(
  loaders: { [K in keyof T]: () => Promise<{ default: T[K] }> }
) {
  const cache = new Map<keyof T, LazyExoticComponent<T[keyof T]>>();

  return function getLazyComponent<K extends keyof T>(key: K): LazyExoticComponent<T[K]> {
    if (!cache.has(key)) {
      cache.set(key, React.lazy(loaders[key]));
    }
    return cache.get(key) as LazyExoticComponent<T[K]>;
  };
}
