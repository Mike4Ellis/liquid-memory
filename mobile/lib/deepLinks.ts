/**
 * Deep Linking Configuration for Liquid Memory Mobile
 * US-022: Share Extension Support
 */

import { Linking } from 'react-native';

export const linking = {
  prefixes: ['liquidmemory://', 'https://liquidmemory.app'],
  config: {
    screens: {
      Main: {
        screens: {
          Home: 'home',
          Camera: 'capture',
          Library: 'library',
          Settings: 'settings',
        },
      },
      PromptEditor: 'edit/:itemId',
    },
  },
};

// Handle shared images from other apps
export interface SharedItem {
  mimeType: string;
  data: string;
  extraData?: Record<string, unknown>;
}

export function handleSharedImage(data: SharedItem): { uri: string; type: string } | null {
  if (data.mimeType?.startsWith('image/')) {
    return {
      uri: data.data,
      type: data.mimeType,
    };
  }
  return null;
}
