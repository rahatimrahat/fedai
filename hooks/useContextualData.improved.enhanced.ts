import React, { useState, useEffect, useRef } from 'react';
import { type UserLocation, type WeatherData, type EnvironmentalData, type UiStrings } from '../types';
import { fetchWeatherData } from '@/services/weatherService';
import { fetchElevation } from '@/services/elevationService';
import { fetchSoilData } from '@/services/soilApi';
import { useLocalizationContext } from '@/components/LocalizationContext';

/**
 * Enhanced useContextualData hook with AbortController for better request management
 * - Automatically cancels previous requests when new ones start
 * - Cleaner code without manual fetchId tracking
 * - Proper cleanup on unmount
 */
export function useContextualData(userLocation: UserLocation | null) {
  const { uiStrings, selectedLanguage } = useLocalizationContext();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);
  const [weatherDisplayTab, setWeatherDisplayTab] = useState<'current' | 'recent' | 'historical'>('current');
  const weatherTabCurrentRef = useRef<HTMLButtonElement>(null);
  const weatherTabRecentRef = useRef<HTMLButtonElement>(null);
  const weatherTabHistoricalRef = useRef<HTMLButtonElement>(null);

  const [environmentalData, setEnvironmentalData] = useState<EnvironmentalData | null>(null);
  const [isLoadingEnvironmental, setIsLoadingEnvironmental] = useState<boolean>(false);

  // AbortControllers for managing async operations
  const weatherAbortControllerRef = useRef<AbortController | null>(null);
  const environmentalAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!userLocation) {
      // Clear data if location is removed
      setWeatherData(null);
      setEnvironmentalData(null);
      setIsLoadingWeather(false);
      setIsLoadingEnvironmental(false);

      // Cancel any ongoing requests
      if (weatherAbortControllerRef.current) {
        weatherAbortControllerRef.current.abort();
      }
      if (environmentalAbortControllerRef.current) {
        environmentalAbortControllerRef.current.abort();
      }

      return;
    }

    // --- Weather Data Fetch ---
    const fetchWeatherDataAsync = async () => {
      // Cancel previous weather request if still pending
      if (weatherAbortControllerRef.current) {
        weatherAbortControllerRef.current.abort();
      }

      // Create new AbortController for this request
      const abortController = new AbortController();
      weatherAbortControllerRef.current = abortController;

      setIsLoadingWeather(true);

      // Reset weather data (preserve timestamp from previous)
      setWeatherData(prev => ({
        current: null,
        recentDailyRawData: null,
        recentMonthlyAverage: null,
        historicalMonthlyAverage: null,
        errorKey: null,
        error: undefined,
        weatherDataTimestamp: prev?.weatherDataTimestamp || new Date().toISOString()
      }));

      try {
        const newWeatherData = await fetchWeatherData(userLocation, abortController.signal);

        // Only update if this request wasn't aborted
        if (!abortController.signal.aborted) {
          setWeatherData({
            current: newWeatherData.current,
            recentDailyRawData: newWeatherData.recentDailyRawData,
            recentMonthlyAverage: newWeatherData.recentMonthlyAverage,
            historicalMonthlyAverage: newWeatherData.historicalMonthlyAverage,
            weatherDataTimestamp: newWeatherData.weatherDataTimestamp,
            errorKey: null,
            error: undefined
          });
        }
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') {
          console.log('Weather fetch aborted');
          return;
        }

        console.error('Weather fetch error in useContextualData:', err);

        // Only update if this request wasn't aborted
        if (!abortController.signal.aborted) {
          setWeatherData(prev => ({
            ...(prev || {}),
            current: null,
            recentDailyRawData: null,
            recentMonthlyAverage: null,
            historicalMonthlyAverage: null,
            errorKey: 'weatherUnavailable',
            error: err instanceof Error ? err.message : String(err),
            weatherDataTimestamp: prev?.weatherDataTimestamp || new Date().toISOString()
          }));
        }
      } finally {
        // Only update loading state if this request wasn't aborted
        if (!abortController.signal.aborted) {
          setIsLoadingWeather(false);
        }
      }
    };

    // --- Environmental Data Fetch ---
    const fetchEnvironmentalDataAsync = async () => {
      // Cancel previous environmental request if still pending
      if (environmentalAbortControllerRef.current) {
        environmentalAbortControllerRef.current.abort();
      }

      // Create new AbortController for this request
      const abortController = new AbortController();
      environmentalAbortControllerRef.current = abortController;

      setIsLoadingEnvironmental(true);

      // Reset environmental data
      setEnvironmentalData(prev => ({
        ...(prev || {}),
        elevation: null,
        soilPH: null,
        soilOrganicCarbon: null,
        soilCEC: null,
        soilNitrogen: null,
        soilSand: null,
        soilSilt: null,
        soilClay: null,
        soilAWC: null,
        errorKey: null,
        error: undefined,
        dataTimestamp: new Date().toISOString()
      }));

      try {
        // Fetch elevation and soil data in parallel
        const [elevationResult, soilResult] = await Promise.allSettled([
          fetchElevation(userLocation, abortController.signal),
          fetchSoilData(userLocation, abortController.signal)
        ]);

        // Stop if aborted
        if (abortController.signal.aborted) {
          return;
        }

        const envDataToSet: EnvironmentalData = {
          dataTimestamp: new Date().toISOString(),
          errorKey: null,
          error: undefined
        };

        // Process elevation result
        if (elevationResult.status === 'fulfilled' && elevationResult.value?.elevation !== undefined) {
          envDataToSet.elevation = elevationResult.value.elevation;
        } else if (elevationResult.status === 'rejected') {
          console.error('Elevation fetch error:', elevationResult.reason);
          envDataToSet.errorKey = 'elevationDataUnavailable';
          envDataToSet.error = elevationResult.reason instanceof Error
            ? elevationResult.reason.message
            : String(elevationResult.reason);
        }

        // Process soil result
        if (soilResult.status === 'fulfilled' && soilResult.value?.data) {
          Object.assign(envDataToSet, soilResult.value.data);
        } else if (soilResult.status === 'rejected') {
          console.error('Soil fetch error:', soilResult.reason);

          // Combine error keys if both failed
          if (envDataToSet.errorKey) {
            envDataToSet.errorKey = 'environmentalDataUnavailable';
            envDataToSet.error = `${envDataToSet.error}. ${uiStrings.soilDataUnavailable || 'Soil data unavailable.'}`;
          } else {
            envDataToSet.errorKey = 'soilDataUnavailable';
            envDataToSet.error = soilResult.reason instanceof Error
              ? soilResult.reason.message
              : String(soilResult.reason);
          }
        }

        // Only update if not aborted
        if (!abortController.signal.aborted) {
          setEnvironmentalData(envDataToSet);
        }
      } catch (criticalError) {
        // Ignore abort errors
        if (criticalError instanceof Error && criticalError.name === 'AbortError') {
          console.log('Environmental fetch aborted');
          return;
        }

        console.error('Critical error in environmental data fetch:', criticalError);

        // Only update if not aborted
        if (!abortController.signal.aborted) {
          setEnvironmentalData({
            errorKey: 'environmentalDataUnavailable',
            error: criticalError instanceof Error ? criticalError.message : String(criticalError),
            dataTimestamp: new Date().toISOString()
          });
        }
      } finally {
        // Only update loading state if not aborted
        if (!abortController.signal.aborted) {
          setIsLoadingEnvironmental(false);
        }
      }
    };

    // Trigger both fetches
    fetchWeatherDataAsync();
    fetchEnvironmentalDataAsync();

    // Cleanup: abort ongoing requests when location changes or component unmounts
    return () => {
      if (weatherAbortControllerRef.current) {
        weatherAbortControllerRef.current.abort();
      }
      if (environmentalAbortControllerRef.current) {
        environmentalAbortControllerRef.current.abort();
      }
    };
  }, [userLocation]); // Removed selectedLanguage from deps as it's not used in fetch

  // Localize error messages when language changes
  useEffect(() => {
    if (weatherData?.errorKey && !weatherData.error) {
      const messageFromUiStrings = uiStrings[weatherData.errorKey as keyof UiStrings];
      const localizedErrorMessage: string =
        typeof messageFromUiStrings === 'function'
          ? (messageFromUiStrings as () => string)()
          : typeof messageFromUiStrings === 'string'
          ? messageFromUiStrings
          : String(uiStrings.apiError);

      setWeatherData(prev => ({ ...prev!, error: localizedErrorMessage }));
    }

    if (environmentalData?.errorKey && !environmentalData.error) {
      const messageTemplate = uiStrings[environmentalData.errorKey as keyof UiStrings];
      const localizedErrorMessage =
        typeof messageTemplate === 'function'
          ? (messageTemplate as () => string)()
          : typeof messageTemplate === 'string'
          ? messageTemplate
          : String(uiStrings.apiError);

      setEnvironmentalData(prev => ({ ...prev!, error: localizedErrorMessage }));
    }
  }, [uiStrings, selectedLanguage.code, weatherData?.errorKey, environmentalData?.errorKey]);

  const handleWeatherTabChange = (
    tab: 'current' | 'recent' | 'historical',
    refToFocus: React.RefObject<HTMLButtonElement>
  ) => {
    setWeatherDisplayTab(tab);
    setTimeout(() => refToFocus.current?.focus(), 0);
  };

  return {
    weatherData,
    isLoadingWeather,
    weatherDisplayTab,
    handleWeatherTabChange,
    weatherTabCurrentRef,
    weatherTabRecentRef,
    weatherTabHistoricalRef,
    environmentalData,
    isLoadingEnvironmental
  };
}
