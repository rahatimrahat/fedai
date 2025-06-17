
import { CACHE_THROTTLE_DELAY_MS } from '../constants';
import { throttle } from 'lodash-es';

interface CachedItem<T> {
  timestamp: number;
  data: T;
  // Allow storing additional metadata like 'source' or 'serviceName' if they are part of T
}

const throttledSetLocalStorageItem = throttle((key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`Error setting item in localStorage for key ${key}:`, error);
  }
}, CACHE_THROTTLE_DELAY_MS);

export async function getCachedOrFetch<T>(
  cacheKey: string,
  fetchFunction: () => Promise<T>,
  cacheDurationMs: number
): Promise<T> {
  try {
    const item = localStorage.getItem(cacheKey);
    if (item) {
      const cached: CachedItem<T> = JSON.parse(item);
      if (Date.now() - cached.timestamp < cacheDurationMs) {
        console.log(`Data for ${cacheKey} retrieved from cache.`);
        return cached.data;
      }
      localStorage.removeItem(cacheKey); // Stale
    }
  } catch (error) {
    console.warn(`Error reading from cache for key ${cacheKey}:`, error);
    localStorage.removeItem(cacheKey); // Corrupted
  }

  const freshData = await fetchFunction();
  
  // Only cache if freshData is not undefined. 
  // Null is a valid cacheable value (e.g. elevation can be null).
  // For errors, the fetchFunction itself should return a specific error structure
  // as part of T if error states need to be cached.
  if (freshData !== undefined) {
    const itemToCache: CachedItem<T> = {
      timestamp: Date.now(),
      data: freshData,
    };
    throttledSetLocalStorageItem(cacheKey, JSON.stringify(itemToCache));
  }
  return freshData;
}