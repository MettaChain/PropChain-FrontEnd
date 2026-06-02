"use client";

import React, { useEffect, useState } from 'react';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';
import { PhishingProtection } from '@/utils/security/phishingProtection';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const DomainWarningBanner = () => {
  const [warning, setWarning] = useState<{
    show: boolean;
    type: 'phishing' | 'unofficial';
    message: string;
    riskScore: number;
  }>({
    show: false,
    type: 'unofficial',
    message: '',
    riskScore: 0,
  });

  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const checkDomain = async () => {
      if (typeof window === 'undefined') return;

      const url = window.location.href;
      const domain = window.location.hostname;
      const result = PhishingProtection.detectPhishing(url);

      if (result.isPhishing) {
        setWarning({
          show: true,
          type: 'phishing',
          message: 'This domain is flagged as a known phishing site. Your funds may be at risk.',
          riskScore: result.riskScore,
        });
        // Auto-report phishing domains
        PhishingProtection.reportSuspiciousDomain(domain, 'Known phishing domain');
      } else if (result.warnings.includes('Unofficial domain detected')) {
        setWarning({
          show: true,
          type: 'unofficial',
          message: 'You are accessing PropChain from an unofficial domain. Please ensure you are on propchain.io.',
          riskScore: result.riskScore,
        });
        // Report unofficial domains for investigation
        PhishingProtection.reportSuspiciousDomain(domain, 'Unofficial domain');
      }
    };

    checkDomain();
  }, []);

  if (!warning.show || isDismissed) return null;

  const isPhishing = warning.type === 'phishing';

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-[100] p-4 animate-in fade-in slide-in-from-top-4 duration-500",
      isPhishing ? "bg-red-600/10 backdrop-blur-md" : "bg-yellow-600/10 backdrop-blur-md"
    )}>
      <div className="max-w-5xl mx-auto">
        <Alert variant={isPhishing ? "destructive" : "default"} className={cn(
          "border-2 shadow-2xl",
          isPhishing ? "border-red-500 bg-red-50 dark:bg-red-950/50" : "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/50"
        )}>
          {isPhishing ? (
            <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          )}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-8">
            <div>
              <AlertTitle className={cn(
                "text-lg font-bold",
                isPhishing ? "text-red-800 dark:text-red-200" : "text-yellow-800 dark:text-yellow-200"
              )}>
                {isPhishing ? "Security Alert: Phishing Detected" : "Security Warning: Unofficial Domain"}
              </AlertTitle>
              <AlertDescription className={cn(
                "mt-1 font-medium",
                isPhishing ? "text-red-700 dark:text-red-300" : "text-yellow-700 dark:text-yellow-300"
              )}>
                {warning.message}
              </AlertDescription>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = 'https://propchain.io'}
                className={cn(
                  "font-bold transition-all hover:scale-105",
                  isPhishing 
                    ? "border-red-600 text-red-600 hover:bg-red-600 hover:text-white" 
                    : "border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white"
                )}
              >
                Go to Official Site
              </Button>
              {!isPhishing && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsDismissed(true)}
                  className="text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200/50 dark:hover:bg-yellow-800/50"
                >
                  Ignore
                </Button>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8 opacity-70 hover:opacity-100"
            onClick={() => setIsDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      </div>
    </div>
  );
};
