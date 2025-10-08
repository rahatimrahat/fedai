import { useQueries } from '@tanstack/react-query';
import { type UserLocation } from '@/types';
import { fetchElevation, type ElevationData } from '@/services/elevationService';
import { fetchSoilData, type SoilDataResponse } from '@/services/soilApi';

/**
 * React Query hook for fetching environmental data (elevation + soil)
 * Uses useQueries to fetch both in parallel
 */
export function useEnvironmentalQuery(userLocation: UserLocation | null) {
  const results = useQueries({
    queries: [
      // Elevation query
      {
        queryKey: ['elevation', userLocation?.latitude, userLocation?.longitude],
        queryFn: async ({ signal }: { signal?: AbortSignal }) => {
          if (!userLocation) {
            throw new Error('User location is required');
          }
          return fetchElevation(userLocation, signal);
        },
        enabled: !!userLocation,
        staleTime: Infinity, // Elevation never changes
        gcTime: Infinity, // Keep elevation data forever
        retry: 2
      },
      // Soil query
      {
        queryKey: ['soil', userLocation?.latitude, userLocation?.longitude],
        queryFn: async ({ signal }: { signal?: AbortSignal }) => {
          if (!userLocation) {
            throw new Error('User location is required');
          }
          return fetchSoilData(userLocation, signal);
        },
        enabled: !!userLocation,
        staleTime: 24 * 60 * 60 * 1000, // Soil data is fresh for 24 hours
        gcTime: 7 * 24 * 60 * 60 * 1000, // Keep in cache for 1 week
        retry: 2
      }
    ]
  });

  const [elevationQuery, soilQuery] = results;

  return {
    elevation: {
      data: elevationQuery.data as ElevationData | undefined,
      isLoading: elevationQuery.isLoading,
      error: elevationQuery.error,
      isError: elevationQuery.isError
    },
    soil: {
      data: soilQuery.data as SoilDataResponse | undefined,
      isLoading: soilQuery.isLoading,
      error: soilQuery.error,
      isError: soilQuery.isError
    },
    isLoading: elevationQuery.isLoading || soilQuery.isLoading,
    isError: elevationQuery.isError || soilQuery.isError
  };
}
