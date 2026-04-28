import { logger } from '@/utils/logger';
import type { SavedSearch, Property, PropertyAlert, NotificationFrequency } from '@/types/property';
import { propertyService } from './propertyService';

/**
 * Notification Service
 * Handles property alerts, notifications, and email functionality
 */

class NotificationService {
  /**
   * Check for new matching properties for saved searches
   */
  async checkForNewMatches(savedSearches: SavedSearch[]): Promise<PropertyAlert[]> {
    const alerts: PropertyAlert[] = [];
    
    for (const savedSearch of savedSearches) {
      if (!savedSearch.isActive) continue;
      
      try {
        // Get current search results
        const searchResult = await propertyService.searchProperties(
          savedSearch.filters,
          savedSearch.sortBy,
          1,
          50 // Check up to 50 recent properties
        );
        
        // Filter properties listed after the last notification time
        const cutoffTime = savedSearch.lastNotified 
          ? new Date(savedSearch.lastNotified).getTime()
          : 0;
        
        const newProperties = searchResult.properties.filter(property => {
          const listedTime = new Date(property.listedDate).getTime();
          return listedTime > cutoffTime;
        });
        
        if (newProperties.length > 0) {
          const alert: PropertyAlert = {
            id: this.generateId(),
            savedSearchId: savedSearch.id,
            savedSearchName: savedSearch.name,
            matchingProperties: newProperties,
            newPropertiesCount: newProperties.length,
            createdAt: new Date().toISOString(),
            isRead: false,
            userId: savedSearch.userId,
          };
          
          alerts.push(alert);
          
          // Update the last notified time for the saved search
          await this.updateLastNotifiedTime(savedSearch.id, savedSearch.userId);
        }
      } catch (error) {
        logger.error(`Error checking search ${savedSearch.id}:`, error);
      }
    }
    
    return alerts;
  }

  /**
   * Send email notification (mock implementation)
   */
  async sendEmailNotification(
    email: string, 
    alert: PropertyAlert, 
    savedSearch: SavedSearch
  ): Promise<boolean> {
    try {
      // In a real implementation, this would call an email service API
      logger.info('Sending email notification:', {
        to: email,
        subject: `New Property Alert: ${alert.newPropertiesCount} new properties match "${savedSearch.name}"`,
        properties: alert.matchingProperties.map(p => ({
          name: p.name,
          price: p.price.total,
          location: `${p.location.city}, ${p.location.state}`,
          url: `/properties/${p.id}`,
        })),
      });
      
      // Simulate API delay
      await this.delay(500);
      
      // Mock success
      return true;
    } catch (error) {
      logger.error('Failed to send email notification:', error);
      return false;
    }
  }

  /**
   * Check if notification should be sent based on frequency
   */
  shouldSendNotification(
    savedSearch: SavedSearch, 
    lastNotificationTime?: string
  ): boolean {
    if (!lastNotificationTime) return true;
    
    const now = new Date();
    const lastNotified = new Date(lastNotificationTime);
    
    switch (savedSearch.notificationFrequency) {
      case 'instant':
        return true;
      
      case 'daily':
        const dailyThreshold = new Date(lastNotified);
        dailyThreshold.setDate(dailyThreshold.getDate() + 1);
        return now >= dailyThreshold;
      
      case 'weekly':
        const weeklyThreshold = new Date(lastNotified);
        weeklyThreshold.setDate(weeklyThreshold.getDate() + 7);
        return now >= weeklyThreshold;
      
      default:
        return false;
    }
  }

  /**
   * Get next notification time for a saved search
   */
  getNextNotificationTime(
    savedSearch: SavedSearch, 
    lastNotificationTime?: string
  ): Date | null {
    if (!savedSearch.isActive || savedSearch.notificationFrequency === 'instant') {
      return null;
    }
    
    const baseTime = lastNotificationTime ? new Date(lastNotificationTime) : new Date();
    
    switch (savedSearch.notificationFrequency) {
      case 'daily':
        const nextDaily = new Date(baseTime);
        nextDaily.setDate(nextDaily.getDate() + 1);
        return nextDaily;
      
      case 'weekly':
        const nextWeekly = new Date(baseTime);
        nextWeekly.setDate(nextWeekly.getDate() + 7);
        return nextWeekly;
      
      default:
        return null;
    }
  }

  /**
   * Update the last notified time for a saved search
   */
  private async updateLastNotifiedTime(searchId: string, userId: string): Promise<void> {
    try {
      // In a real implementation, this would update the database
      // For now, we'll update localStorage
      const saved = localStorage.getItem(`propchain-saved-searches-${userId}`);
      if (saved) {
        const searches = JSON.parse(saved);
        const updatedSearches = searches.map((search: SavedSearch) => 
          search.id === searchId 
            ? { ...search, lastNotified: new Date().toISOString() }
            : search
        );
        localStorage.setItem(`propchain-saved-searches-${userId}`, JSON.stringify(updatedSearches));
      }
    } catch (error) {
      logger.error('Failed to update last notified time:', error);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Simulate API delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Process notifications for all active saved searches
   */
  async processNotifications(
    savedSearches: SavedSearch[], 
    userEmail: string,
    onInAppNotification: (alert: PropertyAlert) => void
  ): Promise<void> {
    const alerts = await this.checkForNewMatches(savedSearches);
    
    for (const alert of alerts) {
      const savedSearch = savedSearches.find(s => s.id === alert.savedSearchId);
      if (!savedSearch) continue;
      
      // Check if we should send notification based on frequency
      if (!this.shouldSendNotification(savedSearch, savedSearch.lastNotified)) {
        continue;
      }
      
      // Send in-app notification
      if (savedSearch.inAppNotifications) {
        onInAppNotification(alert);
      }
      
      // Send email notification
      if (savedSearch.emailNotifications && userEmail) {
        await this.sendEmailNotification(userEmail, alert, savedSearch);
      }
    }
  }

  /**
   * Get notification statistics
   */
  getNotificationStats(alerts: PropertyAlert[]) {
    const total = alerts.length;
    const unread = alerts.filter(a => !a.isRead).length;
    const today = alerts.filter(a => {
      const alertDate = new Date(a.createdAt);
      const todayDate = new Date();
      return alertDate.toDateString() === todayDate.toDateString();
    }).length;
    
    const thisWeek = alerts.filter(a => {
      const alertDate = new Date(a.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return alertDate >= weekAgo;
    }).length;
    
    return {
      total,
      unread,
      today,
      thisWeek,
    };
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
