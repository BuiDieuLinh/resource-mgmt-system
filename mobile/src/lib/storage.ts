/**
 * Secure Storage Service
 * Handles both native and web platforms
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Wrapper around SecureStore for cross-platform support
 */
class StorageService {
  /**
   * Check if SecureStore is available (native only, not web)
   */
  private isSecureStoreAvailable(): boolean {
    // SecureStore is only available on native platforms (iOS, Android)
    // On web, we need to use localStorage or AsyncStorage
    try {
      return Platform.OS !== 'web' && SecureStore.getItemAsync !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * Get item from secure storage
   */
  async getItem(key: string): Promise<string | null> {
    try {
      if (this.isSecureStoreAvailable()) {
        // Use SecureStore on native platforms
        const value = await SecureStore.getItemAsync(key);
        return value || null;
      } else {
        // Fallback for web platform - use sessionStorage
        const value =
          typeof globalThis !== 'undefined' && 'sessionStorage' in globalThis
            ? (globalThis as any).sessionStorage.getItem(key)
            : null;
        return value;
      }
    } catch (error) {
      console.error(`Error getting item from storage [${key}]:`, error);
      return null;
    }
  }

  /**
   * Set item in secure storage
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (this.isSecureStoreAvailable()) {
        // Use SecureStore on native platforms
        await SecureStore.setItemAsync(key, value);
      } else {
        // Fallback for web platform - use sessionStorage
        if (typeof globalThis !== 'undefined' && 'sessionStorage' in globalThis) {
          (globalThis as any).sessionStorage.setItem(key, value);
        }
      }
    } catch (error) {
      console.error(`Error setting item in storage [${key}]:`, error);
    }
  }

  /**
   * Delete item from secure storage
   */
  async deleteItem(key: string): Promise<void> {
    try {
      if (this.isSecureStoreAvailable()) {
        // Use SecureStore on native platforms
        await SecureStore.deleteItemAsync(key);
      } else {
        // Fallback for web platform - use sessionStorage
        if (typeof globalThis !== 'undefined' && 'sessionStorage' in globalThis) {
          (globalThis as any).sessionStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error(`Error deleting item from storage [${key}]:`, error);
    }
  }

  /**
   * Clear all items
   */
  async clear(): Promise<void> {
    try {
      if (typeof globalThis !== 'undefined' && 'sessionStorage' in globalThis) {
        (globalThis as any).sessionStorage.clear();
      }
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
}

export const storageService = new StorageService();
