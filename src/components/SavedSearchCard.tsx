'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SavedSearch, SearchFilters, NOTIFICATION_FREQUENCY_LABELS, PROPERTY_TYPE_LABELS } from '@/types/property';
import { formatDistanceToNow } from 'date-fns';
import { 
  Search, 
  Bell, 
  Mail, 
  Trash2, 
  ExternalLink, 
  Settings,
  Home,
  DollarSign,
  MapPin,
  Calendar
} from 'lucide-react';

interface SavedSearchCardProps {
  search: SavedSearch;
  onDelete: () => void;
}

export const SavedSearchCard: React.FC<SavedSearchCardProps> = ({ search, onDelete }) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleDelete = async () => {
    setIsUpdating(true);
    try {
      onDelete();
      setIsDeleteDialogOpen(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const generateSearchUrl = () => {
    const params = new URLSearchParams();
    
    if (search.filters.query) params.set('query', search.filters.query);
    if (search.filters.location) params.set('location', search.filters.location);
    if (search.filters.priceRange[0] > 0) params.set('minPrice', search.filters.priceRange[0].toString());
    if (search.filters.priceRange[1] < 10000000) params.set('maxPrice', search.filters.priceRange[1].toString());
    if (search.filters.propertyTypes.length > 0) params.set('types', search.filters.propertyTypes.join(','));
    if (search.filters.roiMin > 0) params.set('minRoi', search.filters.roiMin.toString());
    if (search.filters.roiMax < 100) params.set('maxRoi', search.filters.roiMax.toString());
    params.set('sort', search.sortBy);
    
    return `/properties?${params.toString()}`;
  };

  const formatFilters = () => {
    const parts: string[] = [];
    
    if (search.filters.query) parts.push(`"${search.filters.query}"`);
    if (search.filters.location) parts.push(search.filters.location);
    if (search.filters.propertyTypes.length > 0) {
      const types = search.filters.propertyTypes.map(type => PROPERTY_TYPE_LABELS[type]).join(', ');
      parts.push(types);
    }
    if (search.filters.priceRange[0] > 0 || search.filters.priceRange[1] < 10000000) {
      const min = search.filters.priceRange[0] > 0 ? `$${search.filters.priceRange[0].toLocaleString()}` : 'Any';
      const max = search.filters.priceRange[1] < 10000000 ? `$${search.filters.priceRange[1].toLocaleString()}` : 'Any';
      parts.push(`${min} - ${max}`);
    }
    
    return parts.length > 0 ? parts.join(' • ') : 'All properties';
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate" title={search.name}>
              {search.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <Calendar className="w-3 h-3" />
              {formatDistanceToNow(new Date(search.createdAt), { addSuffix: true })}
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-1">
            {search.isActive ? (
              <Badge variant="default" className="text-xs">
                Active
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                Inactive
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search Summary */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Search className="w-4 h-4" />
            <span className="truncate">{formatFilters()}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Sort: {search.sortBy.replace('-', ' → ')}</span>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span>Frequency</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {NOTIFICATION_FREQUENCY_LABELS[search.notificationFrequency]}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>Email</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={search.emailNotifications}
                disabled
                size="sm"
              />
              <span className="text-xs text-gray-500">
                {search.emailNotifications ? 'On' : 'Off'}
              </span>
            </div>
          </div>
        </div>

        {/* Last Notified */}
        {search.lastNotified && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Last notified: {formatDistanceToNow(new Date(search.lastNotified), { addSuffix: true })}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Link href={generateSearchUrl()} className="flex-1">
            <Button variant="outline" size="sm" className="w-full gap-1">
              <ExternalLink className="w-3 h-3" />
              View
            </Button>
          </Link>
          
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-600 hover:text-red-700 hover:border-red-300"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </DialogTrigger>
            
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Saved Search</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete "{search.name}"? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Deleting...' : 'Delete'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};
