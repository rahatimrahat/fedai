import { useQuery } from '@tanstack/react-query';
import { type UserLocation, type WeatherData } from '@/types';
import { fetchWeatherData } from '@/services/weatherService';

/**
 * React Query hook for fetching weather data
 * Automatically handles caching, background refetching, and loading states
 */
export function useWeatherQuery(userLocation: UserLocation | null) {
  return useQuery<WeatherData, Error>({
    queryKey: ['weather', userLocation?.latitude, userLocation?.longitude],
    queryFn: async ({ signal }) => {
      if (!userLocation) {
        throw new Error('User location is required');
      }
      return fetchWeatherData(userLocation, signal);
    },
    enabled: !!userLocation, // Only fetch if location is available
    staleTime: 30 * 60 * 1000, // Weather data is fresh for 30 minutes
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
    retry: 2 // Retry twice on failure
  });
}
