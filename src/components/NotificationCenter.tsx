'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PropertyAlert } from '@/types/property';
import { formatDistanceToNow } from 'date-fns';
import { 
  Bell, 
  BellRing, 
  Home, 
  ExternalLink, 
  Check, 
  X,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

interface NotificationCenterProps {
  alerts: PropertyAlert[];
  onMarkAsRead: (alertId: string) => void;
  onMarkAllAsRead: () => void;
  onClearAlert: (alertId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  alerts,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAlert,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = alerts.filter(alert => !alert.isRead).length;

  const handleMarkAsRead = (alertId: string) => {
    onMarkAsRead(alertId);
  };

  const handleClearAlert = (alertId: string) => {
    onClearAlert(alertId);
  };

  const getAlertIcon = (alert: PropertyAlert) => {
    if (alert.newPropertiesCount === 1) {
      return <Home className="w-4 h-4 text-blue-600" />;
    } else if (alert.newPropertiesCount > 5) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    }
    return <AlertCircle className="w-4 h-4 text-orange-600" />;
  };

  const getAlertMessage = (alert: PropertyAlert) => {
    if (alert.newPropertiesCount === 1) {
      return '1 new property matches your search';
    } else {
      return `${alert.newPropertiesCount} new properties match your search`;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          {unreadCount > 0 ? (
            <BellRing className="w-5 h-5" />
          ) : (
            <Bell className="w-5 h-5" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Property Alerts</span>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkAllAsRead}
                className="text-xs"
              >
                Mark all as read
              </Button>
            )}
          </SheetTitle>
          <SheetDescription>
            Get notified when new properties match your saved searches.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)] mt-6">
          {alerts.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No alerts yet
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Save property searches to receive notifications about new listings.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <Card 
                  key={alert.id} 
                  className={`transition-all ${
                    alert.isRead 
                      ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700' 
                      : 'bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-800'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getAlertIcon(alert)}
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm font-medium truncate">
                            {alert.savedSearchName}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                          </CardDescription>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {!alert.isRead && (
                          <Badge variant="default" className="text-xs">
                            New
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleClearAlert(alert.id)}
                          className="h-6 w-6 p-0 text-gray-500 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {getAlertMessage(alert)}
                      </p>

                      {alert.matchingProperties.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                            New properties:
                          </p>
                          <div className="space-y-1">
                            {alert.matchingProperties.slice(0, 3).map((property) => (
                              <div 
                                key={property.id}
                                className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-700 rounded p-2"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{property.name}</p>
                                  <p className="text-gray-600 dark:text-gray-400">
                                    ${property.price.total.toLocaleString()} • {property.location.city}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  title="View property"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                            {alert.matchingProperties.length > 3 && (
                              <p className="text-xs text-gray-500 text-center">
                                +{alert.matchingProperties.length - 3} more properties
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {!alert.isRead && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsRead(alert.id)}
                            className="flex-1"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Mark as read
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View all
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
