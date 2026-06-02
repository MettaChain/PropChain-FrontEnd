'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, BellRing, TrendingUp, TrendingDown, AlertCircle, X, Check, Settings } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';
import { toast } from 'sonner';
import Link from 'next/link';
import type { PriceAlertType } from '@/types/property';
import { formatDistanceToNow } from 'date-fns';

export const PriceAlertBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    priceAlertNotifications,
    markPriceAlertNotificationAsRead,
    clearPriceAlertNotification,
    clearAllPriceAlertNotifications,
  } = useNotificationStore();

  const unreadCount = priceAlertNotifications.filter((n) => !n.isRead).length;

  const getIcon = (type: PriceAlertType) => {
    switch (type) {
      case 'above': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'below': return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'change': return <AlertCircle className="w-4 h-4 text-orange-600" />;
    }
  };

  const handleMarkRead = (id: string) => {
    markPriceAlertNotificationAsRead(id);
  };

  const handleClear = (id: string) => {
    clearPriceAlertNotification(id);
  };

  const handleClearAll = () => {
    clearAllPriceAlertNotifications();
    toast.success('All notifications cleared');
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(true)}
        aria-label={`Price alerts${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      >
        {unreadCount > 0 ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="w-[380px] sm:w-[480px]">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <span>Price Alert Notifications</span>
              {priceAlertNotifications.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-xs">
                  Clear all
                </Button>
              )}
            </SheetTitle>
            <SheetDescription>
              Notifications when token prices cross your alert thresholds.
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-200px)] mt-6">
            {priceAlertNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">No notifications yet</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Set price alerts on property pages to get notified.
                </p>
                <Link href="/alerts" onClick={() => setIsOpen(false)}>
                  <Button size="sm" variant="outline">
                    <Settings className="w-3 h-3 mr-2" />
                    Manage Alerts
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {priceAlertNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={notification.isRead ? 'opacity-70' : 'border-l-4 border-l-blue-500'}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{getIcon(notification.alertType)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Link
                              href={`/properties/${notification.propertyId}`}
                              onClick={() => setIsOpen(false)}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              View property
                            </Link>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleMarkRead(notification.id)}
                              aria-label="Mark as read"
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                            onClick={() => handleClear(notification.id)}
                            aria-label="Dismiss notification"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <div className="pt-2 text-center">
                  <Link href="/alerts" onClick={() => setIsOpen(false)}>
                    <Button size="sm" variant="outline" className="w-full">
                      <Settings className="w-3 h-3 mr-2" />
                      Manage All Alerts
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
};
