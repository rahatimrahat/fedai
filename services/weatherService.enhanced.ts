import { type UserLocation, type WeatherData } from '../types';
import { getCachedOrFetch } from './cache';
import { WEATHER_CACHE_DURATION_MS } from '@/constants';
import { handleApiError, logError } from '@/utils/errorHandler';

/**
 * Enhanced weather service with AbortSignal support
 */
export async function fetchWeatherData(
  userLocation: UserLocation,
  signal?: AbortSignal
): Promise<WeatherData> {
  const cacheKey = `weather_${userLocation.latitude.toFixed(3)}_${userLocation.longitude.toFixed(3)}`;

  try {
    return await getCachedOrFetch<WeatherData>(
      cacheKey,
      async () => {
        const response = await fetch('/api/weather', {
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
          throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data as WeatherData;
      },
      WEATHER_CACHE_DURATION_MS
    );
  } catch (error) {
    // Re-throw abort errors immediately
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }

    const fedaiError = handleApiError(error, 'Failed to fetch weather data');
    logError(fedaiError, 'WeatherService');
    throw new Error(fedaiError.message);
  }
}
