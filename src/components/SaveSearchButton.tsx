'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSavedSearchStore } from '@/store/savedSearchStore';
import { useWalletStore } from '@/store/walletStore';
import { propertyService } from '@/lib/propertyService';
import { SearchFilters, SortOption, NotificationFrequency, NOTIFICATION_FREQUENCY_LABELS } from '@/types/property';
import { toast } from 'sonner';
import { Bookmark, Bell, Mail } from 'lucide-react';

interface SaveSearchButtonProps {
  filters: SearchFilters;
  sortBy: SortOption;
  className?: string;
}

export const SaveSearchButton: React.FC<SaveSearchButtonProps> = ({
  filters,
  sortBy,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [notificationFrequency, setNotificationFrequency] = useState<NotificationFrequency>('daily');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  
  const { addSearch } = useSavedSearchStore();
  const { address } = useWalletStore();

  const handleSaveSearch = async () => {
    if (!address) {
      toast.error('Please connect your wallet to save searches');
      return;
    }

    if (!searchName.trim()) {
      toast.error('Please enter a name for your search');
      return;
    }

    setIsLoading(true);
    try {
      const savedSearch = await propertyService.saveSearch(
        address,
        searchName.trim(),
        filters,
        sortBy,
        notificationFrequency,
        emailNotifications,
        inAppNotifications
      );

      addSearch(savedSearch);
      toast.success('Search saved successfully!');
      
      // Reset form
      setSearchName('');
      setNotificationFrequency('daily');
      setEmailNotifications(true);
      setInAppNotifications(true);
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to save search. Please try again.');
      console.error('Save search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSuggestedName = () => {
    const parts: string[] = [];
    
    if (filters.query) parts.push(filters.query);
    if (filters.location) parts.push(filters.location);
    if (filters.propertyTypes.length > 0) {
      parts.push(filters.propertyTypes.join(', '));
    }
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000000) {
      parts.push(`$${filters.priceRange[0].toLocaleString()}-$${filters.priceRange[1].toLocaleString()}`);
    }
    
    const suggested = parts.length > 0 ? parts.join(' ') : 'Property Search';
    setSearchName(suggested);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-2 ${className}`}
          onClick={() => generateSuggestedName()}
        >
          <Bookmark className="w-4 h-4" />
          Save Search
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save This Search</DialogTitle>
          <DialogDescription>
            Save your current search criteria to get notified when new matching properties are listed.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Search Name */}
          <div className="space-y-2">
            <Label htmlFor="search-name">Search Name</Label>
            <Input
              id="search-name"
              placeholder="e.g., NYC Apartments under $500k"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Notification Frequency */}
          <div className="space-y-2">
            <Label htmlFor="frequency">Notification Frequency</Label>
            <Select
              value={notificationFrequency}
              onValueChange={(value: NotificationFrequency) => setNotificationFrequency(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(NOTIFICATION_FREQUENCY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notification Settings */}
          <div className="space-y-3">
            <Label>Notification Methods</Label>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <Label htmlFor="in-app" className="text-sm">In-app notifications</Label>
              </div>
              <Switch
                id="in-app"
                checked={inAppNotifications}
                onCheckedChange={setInAppNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <Label htmlFor="email" className="text-sm">Email notifications</Label>
              </div>
              <Switch
                id="email"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
          </div>

          {/* Search Summary */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p className="text-sm font-medium mb-1">Search Summary:</p>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              {filters.query && <p>• Query: {filters.query}</p>}
              {filters.location && <p>• Location: {filters.location}</p>}
              {filters.propertyTypes.length > 0 && (
                <p>• Types: {filters.propertyTypes.join(', ')}</p>
              )}
              <p>• Price: ${filters.priceRange[0].toLocaleString()} - ${filters.priceRange[1].toLocaleString()}</p>
              <p>• Sort: {sortBy}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveSearch}
            disabled={isLoading || !address || !searchName.trim()}
            className="flex-1"
          >
            {isLoading ? 'Saving...' : 'Save Search'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
