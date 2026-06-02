import { ethers } from 'ethers';

/**
 * Formats a blockchain address for display: 0x1234...5678
 */
export const formatAddress = (address: string): string => {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Formats a value in wei to a string in ETH with fixed precision
 */
export const formatEth = (wei: string | undefined): string => {
  if (!wei) return '0.000000';
  try {
    return parseFloat(ethers.formatEther(wei)).toFixed(6);
  } catch (error) {
    return '0.000000';
  }
};

/**
 * Returns the Tailwind text color class based on the security risk level
 */
export const getRiskLevelColor = (riskLevel: string): string => {
  switch (riskLevel) {
    case 'critical': return 'text-red-600 dark:text-red-400';
    case 'high': return 'text-orange-600 dark:text-orange-400';
    case 'medium': return 'text-yellow-600 dark:text-yellow-400';
    case 'low': return 'text-green-600 dark:text-green-400';
    default: return 'text-gray-600 dark:text-gray-400';
  }
};

/**
 * Returns the Tailwind background and border color classes based on the security risk level
 */
export const getRiskLevelBg = (riskLevel: string): string => {
  switch (riskLevel) {
    case 'critical': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    case 'high': return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
    case 'medium': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    case 'low': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    default: return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
  }
};

/**
 * Maps a step name to a progress percentage
 */
export const getProgressForStep = (step: 'validation' | 'signing' | 'broadcast'): number => {
  switch (step) {
    case 'validation': return 25;
    case 'signing': return 50;
    case 'broadcast': return 75;
    default: return 0;
  }
};
