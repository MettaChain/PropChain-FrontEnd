'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  isDetail?: boolean;
}

const pageVariants = {
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

const pageTransition = {
  type: 'tween' as const,
  ease: 'anticipate' as const,
  duration: 0.4,
};

const detailPageVariants = {
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

const detailPageTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
};

const modalVariants = {
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

const modalTransition = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 25,
};

export const PageTransition: React.FC<PageTransitionProps> = ({ 
  children, 
  className = '',
  isDetail = false 
}) => {
  const variants = isDetail ? detailPageVariants : pageVariants;
  const transition = isDetail ? detailPageTransition : pageTransition;

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
};

export const ModalTransition: React.FC<PageTransitionProps> = ({ children, className = '' }) => {
  return (
    <motion.div
      className={className}
      initial="initial"
      animate="in"
      exit="out"
      variants={modalVariants}
      transition={modalTransition}
    >
      {children}
    </motion.div>
  );
};

// Stagger animation for property grids
export const StaggerContainer: React.FC<PageTransitionProps> = ({ children, className = '' }) => {
  const containerVariants = {
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

  return (
    <motion.div
      className={className}
      initial="initial"
      animate="in"
      exit="out"
      variants={containerVariants}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem: React.FC<PageTransitionProps> = ({ children, className = '' }) => {
  const itemVariants = {
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

  return (
    <motion.div
      className={className}
      variants={itemVariants}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
    >
      {children}
    </motion.div>
  );
};

// Skeleton to content transition
export const SkeletonToContent: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ isLoading, children, className = '' }) => {
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="skeleton"
          className={className}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-48 w-full" />
        </motion.div>
      ) : (
        <motion.div
          key="content"
          className={className}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ 
            type: 'spring',
            stiffness: 400,
            damping: 25,
            duration: 0.3
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
