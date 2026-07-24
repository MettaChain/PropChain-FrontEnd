"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface RouteLoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

const RouteLoadingContext = React.createContext<RouteLoadingContextType | undefined>(undefined);

export function useRouteLoading() {
  const context = React.useContext(RouteLoadingContext);
  if (!context) {
    throw new Error("useRouteLoading must be used within a RouteLoadingProvider");
  }
  return context;
}

export function RouteLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = React.useState(false);
  const pathname = usePathname();
  const prevPathname = React.useRef(pathname);

  React.useEffect(() => {
    if (prevPathname.current !== pathname) {
      setIsLoading(false);
      prevPathname.current = pathname;
    }
  }, [pathname]);

  const setLoading = React.useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  return (
    <RouteLoadingContext.Provider value={{ isLoading, setLoading }}>
      {children}
    </RouteLoadingContext.Provider>
  );
}

interface GlobalLoadingIndicatorProps {
  className?: string;
  variant?: "spinner" | "bar";
  position?: "top" | "bottom";
}

export function GlobalLoadingIndicator({
  className,
  variant = "bar",
  position = "top",
}: GlobalLoadingIndicatorProps) {
  const { isLoading } = useRouteLoading();

  if (!isLoading) return null;

  if (variant === "spinner") {
    return (
      <div
        className={cn(
          "fixed z-50 flex items-center justify-center",
          position === "top" ? "top-4" : "bottom-4",
          "left-1/2 -translate-x-1/2",
          className
        )}
      >
        <div className="bg-white dark:bg-gray-800 rounded-full shadow-lg p-3">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed left-0 right-0 z-50 h-1",
        position === "top" ? "top-0" : "bottom-0",
        className
      )}
    >
      <div className="h-full bg-blue-600 animate-pulse" />
    </div>
  );
}

interface PageLoadingProps {
  className?: string;
  text?: string;
}

export function PageLoading({ className, text = "Loading..." }: PageLoadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center min-h-[400px]",
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
      <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>
    </div>
  );
}

interface RouteChangeLoaderProps {
  className?: string;
}

export function RouteChangeLoader({ className }: RouteChangeLoaderProps) {
  const { isLoading } = useRouteLoading();

  if (!isLoading) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-40 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center",
        className
      )}
    >
      <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
    </div>
  );
}
