/**
 * Secure Storage for Liquid Memory Mobile
 * Uses expo-secure-store for sensitive data
 */

import * as SecureStore from 'expo-secure-store';

const KEYS = {
  PUSH_TOKEN: 'push_token',
  ENCRYPTION_KEY: 'encryption_key',
  AUTH_TOKEN: 'auth_token',
} as const;

/**
 * Save value securely
 */
export async function saveSecurely(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error('Failed to save securely:', error);
    throw new Error('Secure storage failed');
  }
}

/**
 * Get value from secure storage
 */
export async function getSecurely(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error('Failed to get from secure storage:', error);
    return null;
  }
}

/**
 * Delete value from secure storage
 */
export async function deleteSecurely(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error('Failed to delete from secure storage:', error);
  }
}

// Export key names for type safety
export { KEYS };
