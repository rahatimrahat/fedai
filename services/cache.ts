
import { CACHE_THROTTLE_DELAY_MS } from '@/constants';
import { logError } from '@/utils/errorHandler';

// Simple throttle implementation to avoid lodash-es dependency issue
function throttle<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastExecTime = 0;
  
  return function (...args: Parameters<T>) {
    const now = Date.now();
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    if (now - lastExecTime > wait) {
      func(...args);
      lastExecTime = now;
    } else {
      timeout = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, wait - (now - lastExecTime));
    }
  } as T;
}

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
    logError({ message: `Error setting item in localStorage for key ${key}`, originalError: error as Error }, 'CacheSet');
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
    logError({ message: `Error reading from cache for key ${cacheKey}`, originalError: error as Error }, 'CacheRead');
    localStorage.removeItem(cacheKey); // Corrupted
  }

  try {
    const freshData = await fetchFunction(); // This might throw now

    // Only cache if freshData is not undefined (and no error was thrown)
    // Null is a valid cacheable value (e.g. elevation can be null).
    if (freshData !== undefined) {
      const itemToCache: CachedItem<T> = {
        timestamp: Date.now(),
        data: freshData,
      };
      throttledSetLocalStorageItem(cacheKey, JSON.stringify(itemToCache));
    }
    return freshData;
  } catch (error) {
    console.warn(`Fetch function for cache key ${cacheKey} failed and will not be cached:`, error);
    logError({ message: `Fetch function for cache key ${cacheKey} failed`, originalError: error as Error }, 'CacheFetch');
    // Do not cache anything if fetchFunction throws.
    // Re-throw the error so the caller can handle it.
    throw error;
  }
}
