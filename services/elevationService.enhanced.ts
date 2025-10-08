import { type UserLocation } from '../types';
import { getCachedOrFetch } from './cache';
import { ELEVATION_CACHE_DURATION_MS } from '@/constants';
import { handleApiError, logError } from '@/utils/errorHandler';

export interface ElevationData {
  elevation: number;
  serviceName?: string;
  timestamp?: string;
}

/**
 * Enhanced elevation service with AbortSignal support
 */
export async function fetchElevation(
  userLocation: UserLocation,
  signal?: AbortSignal
): Promise<ElevationData> {
  const cacheKey = `elevation_${userLocation.latitude.toFixed(3)}_${userLocation.longitude.toFixed(3)}`;

  try {
    return await getCachedOrFetch<ElevationData>(
      cacheKey,
      async () => {
        const response = await fetch('/api/elevation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            latitude: userLocation.latitude,
            longitude: userLocation.longitude
          }),
          signal // Pass abort signal to fetch
        });

        if (!response.ok) {
          throw new Error(`Elevation API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data as ElevationData;
      },
      ELEVATION_CACHE_DURATION_MS
    );
  } catch (error) {
    // Re-throw abort errors immediately
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }

    const fedaiError = handleApiError(error, 'Failed to fetch elevation data');
    logError(fedaiError, 'ElevationService');
    throw new Error(fedaiError.message);
  }
}
