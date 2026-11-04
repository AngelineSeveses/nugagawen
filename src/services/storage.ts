/**
 * On-device storage. AsyncStorage is a simple key-value store that survives app
 * restarts. Values are saved as JSON text. Nothing leaves the phone.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const storageKeys = {
  preferences: 'nugagawen:preferences:v1',
  saved: 'nugagawen:saved:v1',
} as const;

export async function loadJSON<T>(key: string): Promise<T | undefined> {
  try {
    const text = await AsyncStorage.getItem(key);
    return text ? (JSON.parse(text) as T) : undefined;
  } catch {
    return undefined; // corrupted or unavailable storage: fall back to defaults
  }
}

export async function saveJSON(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Saving preferences should never crash the app.
  }
}
