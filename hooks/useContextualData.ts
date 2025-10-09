
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { type UserLocation, type WeatherData, type EnvironmentalData, type UiStrings, LanguageCode, DailyWeatherData } from '../types';
import { fetchWeatherData } from '@/services/weatherService';
import { fetchElevation } from '@/services/elevationService';
import { fetchSoilData } from '@/services/soilApi';
import { useLocalizationContext } from '@/components/LocalizationContext';

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
  const [retryTrigger, setRetryTrigger] = useState<number>(0);

  // AbortController to cancel ongoing fetch operations and prevent race conditions
  const abortControllerRef = useRef<AbortController | null>(null);

  // Retry function for manual refetch
  const retryFetch = useCallback(() => {
    setRetryTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (userLocation) {
      // Cancel any ongoing fetch operations from previous effect runs
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new AbortController for this fetch operation
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      const signal = abortController.signal;

      const fetchData = async () => {
        if (!weatherData || (!weatherData.current && !weatherData.recentMonthlyAverage && !weatherData.historicalMonthlyAverage && !weatherData.recentDailyRawData && !weatherData.errorKey)) {
          setIsLoadingWeather(true);
        }
        if (!environmentalData || (!environmentalData.elevation && !environmentalData.soilPH && !environmentalData.errorKey)) {
          setIsLoadingEnvironmental(true);
        }
      
        // Clear previous states
        setWeatherData((prev) => {
            const currentState = prev ?? {};
            return {
                ...currentState,
                current: null,
                recentDailyRawData: null,
                recentMonthlyAverage: null,
                historicalMonthlyAverage: null,
                errorKey: null,
                error: undefined,
            };
        });
        setEnvironmentalData((prev) => {
            const currentState = prev ?? {};
            return {
                ...currentState,
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
                error: undefined
            };
        });
        
        const weatherFetcher = async () => {
            try {
              const newGenericWeatherData = await fetchWeatherData(userLocation);
              // Only update state if not aborted
              if (!signal.aborted) {
                  setWeatherData(prev => ({
                    current: newGenericWeatherData.current,
                    recentDailyRawData: newGenericWeatherData.recentDailyRawData,
                    recentMonthlyAverage: newGenericWeatherData.recentMonthlyAverage,
                    historicalMonthlyAverage: newGenericWeatherData.historicalMonthlyAverage,
                    weatherDataTimestamp: newGenericWeatherData.weatherDataTimestamp,
                    errorKey: null,
                    error: undefined,
                  }));
              }
            } catch (err) {
                // Ignore AbortError - it's expected when component unmounts or location changes
                if (err instanceof Error && err.name === 'AbortError') {
                  return;
                }
                console.error("Weather fetch error in useContextualData:", err);
                // Only update state if not aborted
                if (!signal.aborted) {
                    setWeatherData(prevData => ({
                        ...(prevData || {}),
                        current: null,
                        recentDailyRawData: null,
                        recentMonthlyAverage: null,
                        historicalMonthlyAverage: null,
                        errorKey: 'weatherUnavailable',
                        error: (err instanceof Error ? err.message : String(err)),
                        weatherDataTimestamp: prevData?.weatherDataTimestamp || new Date().toISOString()
                    }));
                }
            } finally {
                // Only update loading state if not aborted
                if (!signal.aborted) {
                    setIsLoadingWeather(false);
                }
            }
        };

        const envFetcher = async () => {
            const elevPromise = fetchElevation(userLocation);
            const soilPromise = fetchSoilData(userLocation);

            try {
                const [elevationResult, soilResult] = await Promise.allSettled([elevPromise, soilPromise]);

                const envDataToSet: EnvironmentalData = {
                    dataTimestamp: new Date().toISOString(),
                    errorKey: null,
                    error: undefined,
                };

                if (elevationResult.status === 'fulfilled' && elevationResult.value?.elevation !== undefined) {
                    envDataToSet.elevation = elevationResult.value.elevation;
                } else if (elevationResult.status === 'rejected') {
                    console.error("Elevation fetch error:", elevationResult.reason);
                    envDataToSet.errorKey = 'elevationDataUnavailable';
                    envDataToSet.error = (elevationResult.reason instanceof Error ? elevationResult.reason.message : String(elevationResult.reason));
                } else { // Fulfilled but no elevation data or undefined (should not happen with current service)
                    envDataToSet.errorKey = 'elevationDataUnavailable';
                    envDataToSet.error = (uiStrings.elevationDataUnavailable || 'Elevation data is unavailable (empty).');
                }

                if (soilResult.status === 'fulfilled' && soilResult.value) {
                    const soilVal = soilResult.value; // SoilDataReturnType
                    if (soilVal.data && Object.keys(soilVal.data).length > 0) {
                        Object.assign(envDataToSet, soilVal.data);
                        // If elevation succeeded but soil failed, we don't want soil's error to overwrite elevation's success
                        // So, only set soil error if there isn't an elevation error already, or make it combined.
                        // For simplicity, let's prioritize the first error or a combined one.
                        // The current logic below will set soilErrorKey if soil fails, potentially overwriting elevationErrorKey.
                        // This needs careful handling if both can fail.
                    } else { // This 'else' means soilPromise fulfilled, but soilVal.data is empty or soilVal.error/errorCode is present.
                        // This case is now handled by fetchSoilDataViaProxy throwing an error, so it would be 'rejected'.
                        // Kept for robustness if service changes.
                        envDataToSet.errorKey = envDataToSet.errorKey || 'soilDataUnavailable'; // Preserve elevation error if present
                        envDataToSet.error = envDataToSet.error || (soilVal.error || (uiStrings.soilDataUnavailable || 'Soil data is unavailable (empty).'));
                    }
                } else if (soilResult.status === 'rejected') {
                    console.error("Soil fetch error:", soilResult.reason);
                    // If elevation also failed, errorKey might already be set. Append or use a generic one.
                    if (envDataToSet.errorKey) { // Both failed
                        envDataToSet.errorKey = 'environmentalDataUnavailable'; // Generic key
                        envDataToSet.error = `${envDataToSet.error}. ${uiStrings.soilDataUnavailable || 'Soil data also unavailable.'} ${(soilResult.reason instanceof Error ? soilResult.reason.message : String(soilResult.reason))}`;
                    } else {
                        envDataToSet.errorKey = 'soilDataUnavailable';
                        envDataToSet.error = (soilResult.reason instanceof Error ? soilResult.reason.message : String(soilResult.reason));
                    }
                }
                // Only update state if not aborted
                if (!signal.aborted) {
                    setEnvironmentalData((prev) => {
                        const currentState = prev ?? { dataTimestamp: new Date().toISOString() };
                        return {
                            ...currentState,
                            ...envDataToSet
                        };
                    });
                }
            } catch (criticalError) { // Catch for Promise.allSettled itself or critical unhandled issue
                 // Ignore AbortError - it's expected when component unmounts or location changes
                 if (criticalError instanceof Error && criticalError.name === 'AbortError') {
                   return;
                 }
                 console.error("Critical error in environmental data Promise.allSettled block:", criticalError);
                 // Only update state if not aborted
                 if (!signal.aborted) {
                     setEnvironmentalData({
                         errorKey: 'environmentalDataUnavailable',
                         error: (criticalError instanceof Error ? criticalError.message : String(criticalError)),
                         dataTimestamp: new Date().toISOString()
                     });
                 }
            } finally {
                // Only update loading state if not aborted
                if (!signal.aborted) {
                    setIsLoadingEnvironmental(false);
                }
            }
        };

        weatherFetcher();
        envFetcher();
      };
      fetchData();

      // Cleanup function to abort ongoing requests when component unmounts or location changes
      return () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    } else {
      setWeatherData(null);
      setEnvironmentalData(null);
      setIsLoadingWeather(false);
      setIsLoadingEnvironmental(false);
    }
  }, [userLocation, retryTrigger]); // Added retryTrigger to trigger manual refetch

  // Effect to set localized error messages based on errorKey and uiStrings
  useEffect(() => {
    if (weatherData?.errorKey) {
      const messageFromUiStrings = uiStrings[weatherData.errorKey as keyof UiStrings];
      let localizedErrorMessage: string = typeof messageFromUiStrings === 'function'
        ? (messageFromUiStrings as (...args: any[]) => string)()
        : typeof messageFromUiStrings === 'string'
        ? messageFromUiStrings
        : String(uiStrings.apiError);
      setWeatherData(prev => ({ ...prev!, error: localizedErrorMessage }));
    } else if (weatherData && weatherData.errorKey === null && weatherData.error !== undefined) {
      // Clear error string if errorKey is cleared
      setWeatherData(prev => {
        const { error, ...rest } = prev!;
        return rest;
      });
    }

    if (environmentalData?.errorKey) {
      // If environmentalData.error is already populated (e.g. by backend's message or service layer), use it directly.
      // Otherwise, generate from uiStrings based on errorKey.
      if (!environmentalData.error) {
        const messageTemplate = uiStrings[environmentalData.errorKey as keyof UiStrings];
        const localizedErrorMessage = typeof messageTemplate === 'function'
          ? (messageTemplate as () => string)() // Assuming no arguments for these new keys for now
          : typeof messageTemplate === 'string'
          ? messageTemplate
          : String(uiStrings.apiError); // Fallback
        setEnvironmentalData(prev => ({ ...prev!, error: localizedErrorMessage }));
      }
      // If environmentalData.error was already set by the fetch logic, we don't overwrite it here.
    } else if (environmentalData && environmentalData.errorKey === null && environmentalData.error !== undefined) {
      // Clear error string if errorKey is cleared (and error string exists)
      setEnvironmentalData(prev => {
        const { error, /* soilErrorDetail is removed */ ...rest } = prev!;
        return rest;
      });
    }
  }, [uiStrings, weatherData?.errorKey, weatherData?.error, environmentalData?.errorKey, environmentalData?.error, selectedLanguage.code]);


  const handleWeatherTabChange = (tab: 'current' | 'recent' | 'historical', refToFocus: React.RefObject<HTMLButtonElement>) => {
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
    isLoadingEnvironmental,
    retryFetch,
  };
}
