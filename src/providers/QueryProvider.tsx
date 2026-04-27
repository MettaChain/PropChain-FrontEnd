"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Time in milliseconds that data remains fresh
            staleTime: 1000 * 60 * 5, // 5 minutes
            
            // Time in milliseconds that inactive queries will be garbage collected
            gcTime: 1000 * 60 * 10, // 10 minutes
            
            // Number of times a query will retry on failure
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors
              if (error && typeof error === 'object' && 'status' in error) {
                const status = (error as { status?: number }).status;
                if (status && status >= 400 && status < 500) {
                  return false;
                }
              }
              // Retry up to 3 times for other errors
              return failureCount < 3;
            },
            
            // Delay between retries (exponential backoff)
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            
            // Enable refetch on window focus
            refetchOnWindowFocus: false,
            
            // Enable refetch on reconnect
            refetchOnReconnect: true,
            
            // Enable refetch on mount if data is stale
            refetchOnMount: true,
          },
          mutations: {
            // Retry mutations once
            retry: 1,
            
            // Delay between mutation retries
            retryDelay: 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
