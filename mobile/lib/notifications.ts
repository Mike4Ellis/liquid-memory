/**
 * Push Notifications for Liquid Memory Mobile
 * US-023: Daily inspiration and sync notifications
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationPreferences {
  dailyInspiration: boolean;
  syncComplete: boolean;
  reminderTime: number; // Hour of day (0-23)
}

const defaultPreferences: NotificationPreferences = {
  dailyInspiration: true,
  syncComplete: true,
  reminderTime: 9, // 9 AM
};

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('Must use physical device for Push Notifications');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

/**
 * Schedule daily inspiration notification
 */
export async function scheduleDailyInspiration(hour: number = 9): Promise<string | null> {
  // Cancel existing daily notifications
  await cancelDailyNotifications();

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🎨 Daily Inspiration',
      body: 'Discover new creative prompts for your AI art journey.',
      data: { type: 'daily_inspiration' },
    },
    trigger: {
      hour,
      minute: 0,
      repeats: true,
    },
  });

  return identifier;
}

/**
 * Send sync completion notification
 */
export async function sendSyncCompleteNotification(itemsSynced: number): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '☁️ Sync Complete',
      body: `${itemsSynced} items synced to your library.`,
      data: { type: 'sync_complete' },
    },
    trigger: null, // Immediate
  });
}

/**
 * Cancel all daily notifications
 */
export async function cancelDailyNotifications(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  
  for (const notification of scheduled) {
    if (notification.content.data?.type === 'daily_inspiration') {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
}

/**
 * Get push token for server-side notifications
 */
export async function getPushToken(): Promise<string | null> {
  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  } catch (error) {
    console.error('Failed to get push token:', error);
    return null;
  }
}

/**
 * Initialize notifications with preferences
 */
export async function initializeNotifications(
  preferences: Partial<NotificationPreferences> = {}
): Promise<void> {
  const prefs = { ...defaultPreferences, ...preferences };
  
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  if (prefs.dailyInspiration) {
    await scheduleDailyInspiration(prefs.reminderTime);
  }

  // Set up notification categories for actions
  await Notifications.setNotificationCategoryAsync('sync', [
    {
      identifier: 'view',
      buttonTitle: 'View Library',
      options: { opensAppToForeground: true },
    },
  ]);
}
