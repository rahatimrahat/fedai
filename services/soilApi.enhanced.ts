import { type UserLocation } from '../types';
import { getCachedOrFetch } from './cache';
import { SOIL_CACHE_DURATION_MS } from '@/constants';
import { handleApiError, logError } from '@/utils/errorHandler';

export interface SoilData {
  soilPH?: number;
  soilOrganicCarbon?: number;
  soilCEC?: number;
  soilNitrogen?: number;
  soilSand?: number;
  soilSilt?: number;
  soilClay?: number;
  soilBulkDensity?: number;
}

export interface SoilDataResponse {
  data: SoilData;
  source?: string;
  timestamp?: string;
}

/**
 * Enhanced soil service with AbortSignal support
 */
export async function fetchSoilData(
  userLocation: UserLocation,
  signal?: AbortSignal
): Promise<SoilDataResponse> {
  const cacheKey = `soil_${userLocation.latitude.toFixed(3)}_${userLocation.longitude.toFixed(3)}`;

  try {
    return await getCachedOrFetch<SoilDataResponse>(
      cacheKey,
      async () => {
        const response = await fetch('/api/soil', {
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
          throw new Error(`Soil API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data as SoilDataResponse;
      },
      SOIL_CACHE_DURATION_MS
    );
  } catch (error) {
    // Re-throw abort errors immediately
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }

    const fedaiError = handleApiError(error, 'Failed to fetch soil data');
    logError(fedaiError, 'SoilService');
    throw new Error(fedaiError.message);
  }
}
