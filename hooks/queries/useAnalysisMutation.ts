import { useMutation } from '@tanstack/react-query';
import {
  type ImageFile,
  type Language,
  type UserLocation,
  type WeatherData,
  type EnvironmentalData,
  type DiseaseInfo
} from '@/types';
import { analyzePlantHealth } from '@/services/geminiService.multi-provider';

interface AnalysisMutationParams {
  imageFile: ImageFile;
  userDescription: string | null;
  language: Language;
  userLocation: UserLocation | null;
  weatherData: WeatherData | null;
  environmentalData: EnvironmentalData | null;
  followUpAnswer?: string | null;
}

/**
 * React Query mutation hook for plant health analysis
 * Handles AI analysis requests with proper error handling
 */
export function useAnalysisMutation(
  onSuccess?: (data: DiseaseInfo) => void,
  onError?: (error: Error) => void
) {
  return useMutation<DiseaseInfo, Error, AnalysisMutationParams>({
    mutationFn: async (params) => {
      return analyzePlantHealth(
        params.imageFile,
        params.userDescription,
        params.language,
        params.userLocation,
        params.weatherData,
        params.environmentalData,
        null,
        'API key missing', // These strings should come from uiStrings
        'Analysis error',
        params.followUpAnswer
      );
    },
    onSuccess,
    onError,
    // Don't retry AI analysis (expensive operation)
    retry: false
  });
}
