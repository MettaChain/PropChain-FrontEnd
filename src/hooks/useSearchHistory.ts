'use client';
import { logger } from '@/utils/logger';
import { STORAGE_KEYS } from '@/lib/storageKeys';

import { useState, useEffect } from 'react';
import { generateSecureId } from '@/utils/secureId';
import { safeLocalStorage } from '@/utils/safeLocalStorage';

interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: string;
  type: 'location' | 'property_type' | 'price_range' | 'general';
}

const SEARCH_HISTORY_KEY = STORAGE_KEYS.SEARCH_HISTORY.key;
const MAX_HISTORY_ITEMS = 10;

export const useSearchHistory = () => {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  // Load search history from localStorage on mount
  useEffect(() => {
    const saved = safeLocalStorage.getJSON<SearchHistoryItem[]>(SEARCH_HISTORY_KEY, []);
    if (Array.isArray(saved)) {
      setSearchHistory(saved);
    }
  }, []);

  const saveToHistory = (query: string, type: SearchHistoryItem['type'] = 'general') => {
    if (!query.trim()) return;

    const newItem: SearchHistoryItem = {
      id: generateSecureId('search'),
      query: query.trim(),
      timestamp: new Date().toISOString(),
      type,
    };

    setSearchHistory(prev => {
      // Remove existing item with same query
      const filtered = prev.filter(item => item.query.toLowerCase() !== query.toLowerCase());
      
      // Add new item at the beginning
      const updated = [newItem, ...filtered];
      
      // Keep only the last MAX_HISTORY_ITEMS
      const limited = updated.slice(0, MAX_HISTORY_ITEMS);
      
      // Save to localStorage
      safeLocalStorage.setJSON(SEARCH_HISTORY_KEY, limited);
      
      return limited;
    });
  };

  const removeFromHistory = (id: string) => {
    setSearchHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      safeLocalStorage.setJSON(SEARCH_HISTORY_KEY, updated);
      return updated;
    });
  };

  const clearHistory = () => {
    setSearchHistory([]);
    safeLocalStorage.remove(SEARCH_HISTORY_KEY);
  };

  const getRecentSearches = (limit: number = 5) => {
    return searchHistory.slice(0, limit);
  };

  const getSearchesByType = (type: SearchHistoryItem['type']) => {
    return searchHistory.filter(item => item.type === type);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return date.toLocaleDateString();
  };

  return {
    searchHistory,
    saveToHistory,
    removeFromHistory,
    clearHistory,
    getRecentSearches,
    getSearchesByType,
    formatTimestamp,
  };
};
