'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingStore } from '@/store/onboardingStore';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, ChevronLeft, Building2, Wallet, Search, BarChart3, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  title: string;
  description: string;
  target?: string;
  icon: React.ReactNode;
}

const steps: Step[] = [
  {
    id: 'welcome',
    title: 'Welcome to PropChain',
    description: 'Invest in real estate with the ease of crypto. Let us show you around!',
    icon: <Building2 className="w-6 h-6 text-blue-600" />,
  },
  {
    id: 'wallet',
    title: 'Connect Your Wallet',
    description: 'Connect your crypto wallet to start browsing and investing in properties.',
    target: '[data-tour="wallet-connector"]',
    icon: <Wallet className="w-6 h-6 text-blue-600" />,
  },
  {
    id: 'browse',
    title: 'Browse Properties',
    description: 'Explore high-yield real estate opportunities across multiple chains.',
    target: '[data-tour="browse-properties"]',
    icon: <Search className="w-6 h-6 text-blue-600" />,
  },
  {
    id: 'purchase',
    title: 'Purchase Tokens',
    description: 'Buy fractional tokens of real estate assets and start earning yield immediately.',
    target: '[data-tour="purchase-form"]',
    icon: <Building2 className="w-6 h-6 text-blue-600" />,
  },
  {
    id: 'portfolio',
    title: 'Track Your Portfolio',
    description: 'Monitor your investments, earnings, and yield in one place.',
    target: '[data-tour="portfolio-link"]',
    icon: <BarChart3 className="w-6 h-6 text-blue-600" />,
  },
];

export const OnboardingTour: React.FC = () => {
  const { 
    isActive, 
    currentStep, 
    nextStep, 
    prevStep, 
    stopOnboarding, 
    completeOnboarding 
  } = useOnboardingStore();

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];

  useEffect(() => {
    if (!isActive || !step.target) {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      const element = document.querySelector(step.target!);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setTargetRect(null);
      }
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [isActive, step]);

  if (!isActive) return null;

  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      {/* Backdrop with hole */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 pointer-events-auto"
            style={{
              clipPath: targetRect 
                ? `polygon(0% 0%, 0% 100%, ${targetRect.left}px 100%, ${targetRect.left}px ${targetRect.top}px, ${targetRect.right}px ${targetRect.top}px, ${targetRect.right}px ${targetRect.bottom}px, ${targetRect.left}px ${targetRect.bottom}px, ${targetRect.left}px 100%, 100% 100%, 100% 0%)`
                : 'none'
            }}
            onClick={stopOnboarding}
          />
        )}
      </AnimatePresence>

      {/* Tour Card */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={cn(
            "pointer-events-auto w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 m-4",
            targetRect ? "absolute" : "relative"
          )}
          style={targetRect ? {
            top: targetRect.bottom + 20 > window.innerHeight - 200 ? 'auto' : targetRect.bottom + 20,
            bottom: targetRect.bottom + 20 > window.innerHeight - 200 ? window.innerHeight - targetRect.top + 20 : 'auto',
            left: Math.max(20, Math.min(window.innerWidth - 380, targetRect.left + (targetRect.width / 2) - 192)),
          } : {}}
        >
          <button 
            onClick={stopOnboarding}
            className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
              {step.icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                {step.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {step.description}
          </p>

          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={stopOnboarding}
              className="text-gray-500"
            >
              Skip
            </Button>
            
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevStep}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
              )}
              
              <Button
                size="sm"
                onClick={isLastStep ? completeOnboarding : nextStep}
                className="gap-1 bg-blue-600 hover:bg-blue-700"
              >
                {isLastStep ? 'Finish' : 'Next'}
                {!isLastStep && <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 h-1 bg-gray-100 dark:bg-gray-800 w-full overflow-hidden rounded-b-2xl">
            <motion.div 
              className="h-full bg-blue-600"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};
