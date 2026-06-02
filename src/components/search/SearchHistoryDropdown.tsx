'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { Clock, TrendingUp, X, Trash2, Search } from 'lucide-react';

interface SearchHistoryDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (query: string) => void;
  searchTerm: string;
}

// Mock trending searches for demonstration
const TRENDING_SEARCHES = [
  'New York apartments',
  'Miami beachfront',
  'Los Angeles condos',
  'Chicago downtown',
  'Austin luxury homes',
];

export const SearchHistoryDropdown: React.FC<SearchHistoryDropdownProps> = ({
  isOpen,
  onClose,
  onSelect,
  searchTerm,
}) => {
  const {
    searchHistory,
    removeFromHistory,
    clearHistory,
    getRecentSearches,
    formatTimestamp,
  } = useSearchHistory();

  const recentSearches = getRecentSearches(5);
  const filteredTrending = TRENDING_SEARCHES.filter(search =>
    search.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (query: string) => {
    onSelect(query);
    onClose();
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeFromHistory(id);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearHistory();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
      <div className="p-4" onKeyDown={handleKeyDown}>
        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Clock className="w-4 h-4" />
                Recent Searches
              </div>
              {searchHistory.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-6 px-2 text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
            <div className="space-y-1">
              {recentSearches.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center justify-between p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  onClick={() => handleSelect(item.query)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {item.query}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {formatTimestamp(item.timestamp)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleRemove(e, item.id)}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trending Searches */}
        <div>
          <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <TrendingUp className="w-4 h-4" />
            Trending Searches
          </div>
          <div className="space-y-1">
            {filteredTrending.length > 0 ? (
              filteredTrending.map((search, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  onClick={() => handleSelect(search)}
                >
                  <TrendingUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {search}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400 p-2">
                No trending searches match your query
              </div>
            )}
          </div>
        </div>

        {/* No Results State */}
        {recentSearches.length === 0 && filteredTrending.length === 0 && (
          <div className="text-center py-8">
            <Search className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No recent or trending searches
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Start searching to see your history here
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
