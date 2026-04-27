'use client';

import { useState, useEffect } from 'react';

interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: string;
  type: 'location' | 'property_type' | 'price_range' | 'general';
}

const SEARCH_HISTORY_KEY = 'propchain_search_history';
const MAX_HISTORY_ITEMS = 10;

export const useSearchHistory = () => {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  // Load search history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSearchHistory(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  }, []);

  const saveToHistory = (query: string, type: SearchHistoryItem['type'] = 'general') => {
    if (!query.trim()) return;

    const newItem: SearchHistoryItem = {
      id: `${Date.now()}-${Math.random()}`,
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
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(limited));
      } catch (error) {
        console.error('Error saving search history:', error);
      }
      
      return limited;
    });
  };

  const removeFromHistory = (id: string) => {
    setSearchHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error updating search history:', error);
      }
      return updated;
    });
  };

  const clearHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
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
