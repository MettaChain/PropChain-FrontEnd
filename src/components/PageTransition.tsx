'use client';

import React, { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence, type Variants, type Transition } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  isDetail?: boolean;
}

// ============================================================================
// Static animation variants (defined once outside components to avoid recreation)
// ============================================================================

const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 0.95,
  },
};

const pageTransition: Transition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.4,
};

const detailPageVariants: Variants = {
  initial: {
    opacity: 0,
    x: 100,
    scale: 0.9,
  },
  in: {
    opacity: 1,
    x: 0,
    scale: 1,
  },
  out: {
    opacity: 0,
    x: -100,
    scale: 0.9,
  },
};

const detailPageTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

const modalVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.8,
  },
  in: {
    opacity: 1,
    scale: 1,
  },
  out: {
    opacity: 0,
    scale: 0.8,
  },
};

const modalTransition: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
};

const containerVariants: Variants = {
  initial: { opacity: 0 },
  in: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
  out: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

const itemVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.8,
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 0.8,
  },
};

const itemTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 20,
};

const skeletonTransition: Transition = { duration: 0.2 };

const contentEnterTransition: Transition = { 
  type: 'spring',
  stiffness: 400,
  damping: 25,
  duration: 0.3,
};

// Opacity-only, near-instant variants used when the user has asked the OS to
// reduce motion (WCAG 2.3.3). Transforms and springs are dropped so content
// fades in/out without vestibular-sensitive users being exposed to movement.
const reducedMotionVariants: Variants = {
  initial: { opacity: 0 },
  in: { opacity: 1 },
  out: { opacity: 0 },
};

const reducedMotionTransition: Transition = { duration: 0.001 };

/**
 * Respects the user's `prefers-reduced-motion` OS setting. Mirrors the
 * media-query hook used by RouteTransition so every exported motion component
 * in this module can swap to the opacity-only reduced-motion variants.
 */
function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}

// ============================================================================
// Page Transition
// ============================================================================

export const PageTransition = memo<PageTransitionProps>(({ 
  children, 
  className = '',
  isDetail = false 
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const variants = prefersReducedMotion
    ? reducedMotionVariants
    : isDetail
      ? detailPageVariants
      : pageVariants;
  const transition = prefersReducedMotion
    ? reducedMotionTransition
    : isDetail
      ? detailPageTransition
      : pageTransition;

  return (
    <motion.div
      className={className}
      initial="initial"
      animate="in"
      exit="out"
      variants={variants}
      transition={transition}
    >
      {children}
    </motion.div>
  );
});

export const ModalTransition = memo<PageTransitionProps>(({ children, className = '' }) => {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <motion.div
      className={className}
      initial="initial"
      animate="in"
      exit="out"
      variants={prefersReducedMotion ? reducedMotionVariants : modalVariants}
      transition={prefersReducedMotion ? reducedMotionTransition : modalTransition}
    >
      {children}
    </motion.div>
  );
});

// Stagger animation for property grids
export const StaggerContainer = memo<PageTransitionProps>(({ children, className = '' }) => {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <motion.div
      className={className}
      initial="initial"
      animate="in"
      exit="out"
      variants={prefersReducedMotion ? reducedMotionVariants : containerVariants}
      transition={prefersReducedMotion ? reducedMotionTransition : undefined}
    >
      {children}
    </motion.div>
  );
});

export const StaggerItem = memo<PageTransitionProps>(({ children, className = '' }) => {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <motion.div
      className={className}
      variants={prefersReducedMotion ? reducedMotionVariants : itemVariants}
      transition={prefersReducedMotion ? reducedMotionTransition : itemTransition}
    >
      {children}
    </motion.div>
  );
});

// Skeleton to content transition
export const SkeletonToContent = memo<{
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
}>(({ isLoading, children, className = '' }) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const contentInitial = prefersReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.95 };
  const contentAnimate = prefersReducedMotion
    ? { opacity: 1 }
    : { opacity: 1, scale: 1 };
  const contentExit = prefersReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.95 };
  const contentTransition = prefersReducedMotion
    ? reducedMotionTransition
    : contentEnterTransition;

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="skeleton"
          className={className}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={skeletonTransition}
        >
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-48 w-full" />
        </motion.div>
      ) : (
        <motion.div
          key="content"
          className={className}
          initial={contentInitial}
          animate={contentAnimate}
          exit={contentExit}
          transition={contentTransition}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
});
