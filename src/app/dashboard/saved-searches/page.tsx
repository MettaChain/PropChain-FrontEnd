'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { SavedSearchCard } from '@/components/SavedSearchCard';
import { WalletConnector } from '@/components/WalletConnector';
import { useSavedSearchStore } from '@/store/savedSearchStore';
import { useWalletStore } from '@/store/walletStore';
import { SavedSearch, NotificationFrequency } from '@/types/property';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Filter, Settings, Bell, Mail, Bookmark } from 'lucide-react';

function SavedSearchesContent() {
  const { address } = useWalletStore();
  const { 
    searches, 
    isLoading, 
    error, 
    loadSearches, 
    removeSearch 
  } = useSavedSearchStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState<NotificationFrequency | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'frequency'>('created');

  useEffect(() => {
    if (address) {
      loadSearches(address);
    }
  }, [address, loadSearches]);

  const filteredAndSortedSearches = searches
    .filter(search => {
      const matchesSearch = search.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFrequency = frequencyFilter === 'all' || search.notificationFrequency === frequencyFilter;
      return matchesSearch && matchesFrequency;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'frequency':
          return a.notificationFrequency.localeCompare(b.notificationFrequency);
        default:
          return 0;
      }
    });

  const handleDeleteSearch = async (searchId: string) => {
    if (!address) return;
    
    try {
      await removeSearch(searchId, address);
      toast.success('Search deleted successfully');
    } catch (error) {
      toast.error('Failed to delete search');
      console.error('Delete search error:', error);
    }
  };

  if (!address) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">PC</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  PropChain
                </h1>
              </Link>
              <WalletConnector />
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-20">
            <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Please connect your wallet to manage your saved property searches.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PC</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                PropChain
              </h1>
            </Link>
            <WalletConnector />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Saved Searches
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your saved property searches and notification preferences.
          </p>
        </div>

        {/* Filters and Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search saved searches..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Frequency Filter */}
              <Select
                value={frequencyFilter}
                onValueChange={(value: NotificationFrequency | 'all') => setFrequencyFilter(value)}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Frequencies</SelectItem>
                  <SelectItem value="instant">Instant</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select
                value={sortBy}
                onValueChange={(value: 'name' | 'created' | 'frequency') => setSortBy(value)}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created">Date Created</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="frequency">Frequency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Searches</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {searches.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Alerts</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {searches.filter(s => s.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Email Enabled</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {searches.filter(s => s.emailNotifications).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-red-200 dark:border-red-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <Settings className="w-5 h-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded" />
                    <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-5/6" />
                    <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-4/6" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredAndSortedSearches.length === 0 && (
          <Card>
            <CardContent className="text-center py-20">
              <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {searches.length === 0 ? 'No Saved Searches Yet' : 'No Matching Searches'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                {searches.length === 0 
                  ? 'Start searching for properties and save your searches to get notified about new listings.'
                  : 'Try adjusting your filters to find your saved searches.'
                }
              </p>
              {searches.length === 0 && (
                <Link href="/properties">
                  <Button>Browse Properties</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {/* Saved Searches Grid */}
        {!isLoading && filteredAndSortedSearches.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedSearches.map((search) => (
              <SavedSearchCard
                key={search.id}
                search={search}
                onDelete={() => handleDeleteSearch(search.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SavedSearchesPage() {
  return (
    <SavedSearchesContent />
  );
}
