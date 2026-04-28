'use client';

import React, { useState } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  BellRing, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  Mail,
  MailOff,
  Settings,
  X,
  ArrowLeft
} from 'lucide-react';
import { formatPrice } from '@/utils/searchUtils';
import { PRICE_ALERT_TYPE_LABELS, type PriceAlertType } from '@/types/property';
import Link from 'next/link';
import { toast } from 'sonner';
import { WalletConnector } from '@/components/WalletConnector';
import { PriceAlertBell } from '@/components/PriceAlertBell';

export default function AlertsPage() {
  const { 
    priceAlerts, 
    priceAlertNotifications,
    removePriceAlert, 
    togglePriceAlert,
    markPriceAlertNotificationAsRead,
    clearPriceAlertNotification,
    clearAllPriceAlertNotifications,
    settings,
    updateSettings,
  } = useNotificationStore();

  const [activeTab, setActiveTab] = useState('alerts');

  const unreadNotificationsCount = priceAlertNotifications.filter(n => !n.isRead).length;

  const handleRemoveAlert = (alertId: string) => {
    removePriceAlert(alertId);
    toast.success('Alert removed successfully');
  };

  const handleToggleAlert = (alertId: string) => {
    togglePriceAlert(alertId);
  };

  const handleMarkAsRead = (notificationId: string) => {
    markPriceAlertNotificationAsRead(notificationId);
  };

  const handleClearNotification = (notificationId: string) => {
    clearPriceAlertNotification(notificationId);
  };

  const getAlertTypeIcon = (type: PriceAlertType) => {
    switch (type) {
      case 'above':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'below':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      case 'change':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/properties">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Properties
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">PC</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">PropChain</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <PriceAlertBell />
              <WalletConnector />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Price Alerts
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your property price alerts and notification preferences
            </p>
          </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              My Alerts
              {priceAlerts.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {priceAlerts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <BellRing className="w-4 h-4" />
              Notifications
              {unreadNotificationsCount > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {unreadNotificationsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="mt-6">
            {priceAlerts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">No alerts set</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Set up price alerts on property detail pages to get notified when prices change.
                  </p>
                  <Link href="/properties">
                    <Button>Browse Properties</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {priceAlerts.map((alert) => (
                  <Card key={alert.id} className={!alert.isActive ? 'opacity-60' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {getAlertTypeIcon(alert.alertType)}
                          <div>
                            <Link 
                              href={`/properties/${alert.propertyId}`}
                              className="font-medium hover:underline"
                            >
                              {alert.propertyName}
                            </Link>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <span>{PRICE_ALERT_TYPE_LABELS[alert.alertType]}</span>
                              <span>•</span>
                              <span>Target: {formatPrice(alert.targetPrice)}</span>
                              <span>•</span>
                              <span>Current: {formatPrice(alert.currentPrice)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {alert.isTriggered && (
                            <Badge variant="default" className="bg-green-600">
                              Triggered
                            </Badge>
                          )}
                          <Switch
                            checked={alert.isActive}
                            onCheckedChange={() => handleToggleAlert(alert.id)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveAlert(alert.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-6">
            {priceAlertNotifications.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BellRing className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    You&apos;ll see notifications here when your price alerts are triggered.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex justify-end mb-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      clearAllPriceAlertNotifications();
                      toast.success('All notifications cleared');
                    }}
                  >
                    Clear All
                  </Button>
                </div>
                <div className="space-y-3">
                  {priceAlertNotifications.map((notification) => (
                    <Card 
                      key={notification.id} 
                      className={!notification.isRead ? 'border-l-4 border-l-blue-500' : ''}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {getAlertTypeIcon(notification.alertType)}
                            <div>
                              <p className="font-medium">{notification.message}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                {new Date(notification.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(notification.id)}
                              >
                                Mark as read
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleClearNotification(notification.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {settings.emailEnabled ? (
                        <Mail className="w-5 h-5 text-green-600" />
                      ) : (
                        <MailOff className="w-5 h-5 text-gray-400" />
                      )}
                      <div>
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-gray-500">
                          Receive alerts via email when triggered
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.emailEnabled}
                      onCheckedChange={(checked) => updateSettings({ emailEnabled: checked })}
                    />
                  </div>

                  {settings.emailEnabled && (
                    <div className="ml-7">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={settings.email}
                        onChange={(e) => updateSettings({ email: e.target.value })}
                        className="max-w-md"
                      />
                    </div>
                  )}
                </div>

                <hr />

                {/* In-App Settings */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-blue-600" />
                    <div>
                      <Label>In-App Notifications</Label>
                      <p className="text-sm text-gray-500">
                        Show notifications in the app
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.inAppEnabled}
                    onCheckedChange={(checked) => updateSettings({ inAppEnabled: checked })}
                  />
                </div>

                <hr />

                {/* Default Frequency */}
                <div className="space-y-2">
                  <Label>Default Notification Frequency</Label>
                  <div className="flex gap-2">
                    {['instant', 'daily', 'weekly'].map((freq) => (
                      <Button
                        key={freq}
                        variant={settings.defaultFrequency === freq ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateSettings({ 
                          defaultFrequency: freq as 'instant' | 'daily' | 'weekly' 
                        })}
                      >
                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  );
}