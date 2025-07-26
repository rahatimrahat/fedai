import React, { useState, useEffect, useRef } from 'react';
import { type UserLocation, type WeatherData, type EnvironmentalData, type UiStrings, LanguageCode, DailyWeatherData } from '../types';
import { fetchWeatherData } from '@/services/weatherService';
import { fetchElevation } from '@/services/elevationService';
import { fetchSoilData } from '@/services/soilApi';
import { useLocalizationContext } from '@/components/LocalizationContext';
import { logError } from '@/utils/errorHandler';

export function useContextualData(userLocation: UserLocation | null) {
  const { uiStrings, selectedLanguage } = useLocalizationContext();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [weatherDisplayTab, setWeatherDisplayTab] = useState<'current' | 'recent' | 'historical'>('current');
  const weatherTabCurrentRef = useRef<HTMLButtonElement>(null);
  const weatherTabRecentRef = useRef<HTMLButtonElement>(null);
  const weatherTabHistoricalRef = useRef<HTMLButtonElement>(null);

  const [environmentalData, setEnvironmentalData] = useState<EnvironmentalData | null>(null);
  const [isLoadingEnvironmental, setIsLoadingEnvironmental] = useState<boolean>(false);
  const [environmentalError, setEnvironmentalError] = useState<string | null>(null);

  // Ref to track the current fetch operation to prevent race conditions
  const fetchIdRef = useRef<number>(0);
  const retryCountRef = useRef<{ weather: number; environmental: number }>({ weather: 0, environmental: 0 });

  const resetFetchState = () => {
    setWeatherData((prev?: WeatherData | null): WeatherData | null => ({
      ...(prev || {}),
      current: undefined,
      recentDailyRawData: undefined,
      recentMonthlyAverage: undefined,
      historicalMonthlyAverage: undefined,
      errorKey: null,
      error: undefined,
    }));
    setEnvironmentalData((prev?: EnvironmentalData | null): EnvironmentalData | null => ({
      ...(prev || {}),
      elevation: undefined,
      soilPH: undefined,
      soilOrganicCarbon: undefined,
      soilCEC: undefined,
      soilNitrogen: undefined,
      soilSand: undefined,
      soilSilt: undefined,
      soilClay: undefined,
      soilAWC: undefined,
      errorKey: null,
      error: undefined
    }));
  };

  const fetchWithRetry = async <T>(
    fetchFunction: () => Promise<T>,
    onSuccess: (data: T) => void,
    onError: (error: any, retryCount: number) => void,
    maxRetries = 3
  ) => {
    try {
      const result = await fetchFunction();
      onSuccess(result);
    } catch (error) {
      const currentRetryCount = retryCountRef.current.weather;
      if (currentRetryCount < maxRetries) {
        retryCountRef.current.weather = currentRetryCount + 1;
        const retryDelay = Math.pow(2, currentRetryCount) * 500; // Exponential backoff
        console.warn(`Fetch failed, retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        fetchWithRetry(fetchFunction, onSuccess, onError, maxRetries);
      } else {
        onError(error, currentRetryCount + 1);
      }
    }
  };

  useEffect(() => {
    if (userLocation) {
      const currentFetchId = ++fetchIdRef.current;
      retryCountRef.current = { weather: 0, environmental: 0 }; // Reset retry counters

      setIsLoadingWeather(true);
      setIsLoadingEnvironmental(true);

      resetFetchState();

      const fetchData = async () => {
        try {
          // Weather data fetching with retry
          await fetchWithRetry(
            () => fetchWeatherData(userLocation),
            (data: any) => {  // Explicitly type the data parameter
              if (currentFetchId === fetchIdRef.current) {
                setWeatherData(prev => ({
                  ...(prev || {}),
                  current: data.current,
                  recentDailyRawData: data.recentDailyRawData,
                  recentMonthlyAverage: data.recentMonthlyAverage,
                  historicalMonthlyAverage: data.historicalMonthlyAverage,
                  weatherDataTimestamp: data.weatherDataTimestamp,
                  errorKey: null,
                  error: undefined,
                }));
                setWeatherError(null);
                setIsLoadingWeather(false);
              }
            },
            (error, retryCount) => {
              if (currentFetchId === fetchIdRef.current) {
                console.error(`Final weather fetch error after ${retryCount} retries:`, error);
                setWeatherData((prev: WeatherData | null) => ({
                  ...(prev || {}),
                  current: null,
                  recentDailyRawData: null,
                  recentMonthlyAverage: null,
                  historicalMonthlyAverage: null,
                  errorKey: 'weatherUnavailable',
                  error: (error instanceof Error ? error.message : String(error)),
                  weatherDataTimestamp: prev?.weatherDataTimestamp || new Date().toISOString()
                }));
                setWeatherError(uiStrings.weatherUnavailable || 'Weather data is unavailable');
                setIsLoadingWeather(false);
              }
            },
            3
          );

          // Environmental data fetching with retry
          await fetchWithRetry(
            async () => {
              const [elevationResult, soilResult] = await Promise.allSettled([
                fetchElevation(userLocation),
                fetchSoilData(userLocation)
              ]);

              let elevation: number | undefined;
              let soilData: any;

              if (elevationResult.status === 'fulfilled' && elevationResult.value) {
                elevation = elevationResult.value?.elevation;
              } else if (elevationResult.status === 'rejected') {
                throw new Error(`Elevation fetch failed: ${(elevationResult as PromiseRejectedResult).reason}`);
              }

              if (soilResult.status === 'fulfilled' && soilResult.value) {
                const soilVal = soilResult.value;
                if (!soilVal.data || Object.keys(soilVal.data).length === 0) {
                  throw new Error(`Soil data is empty`);
                }
                soilData = soilVal.data;
              } else if (soilResult.status === 'rejected') {
                throw new Error(`Soil fetch failed: ${(soilResult as PromiseRejectedResult).reason}`);
              }

              return { elevation, ...(soilData as Record<string, any>) };
            },
            (data: Record<string, any>) => {  // Explicitly type the data parameter
              if (currentFetchId === fetchIdRef.current) {
                setEnvironmentalData(prev => ({
                  ...(prev || {}),
                  dataTimestamp: new Date().toISOString(),
                  errorKey: null,
                  error: undefined,
                  ...data
                }));
                setEnvironmentalError(null);
                setIsLoadingEnvironmental(false);
              }
            },
            (error, retryCount) => {
              if (currentFetchId === fetchIdRef.current) {
                console.error(`Final environmental fetch error after ${retryCount} retries:`, error);
                setEnvironmentalData((prev: EnvironmentalData | null) => ({
                  ...(prev || {}),
                  dataTimestamp: new Date().toISOString(),
                  errorKey: 'environmentalDataUnavailable',
                  error: (error instanceof Error ? error.message : String(error)),
                }));
                setEnvironmentalError(uiStrings.environmentalDataUnavailable || 'Environmental data is unavailable');
                setIsLoadingEnvironmental(false);
              }
            },
            3
          );

        } catch (criticalError) {
          console.error("Critical error in fetchData:", criticalError);
          if (currentFetchId === fetchIdRef.current) {
            setWeatherData((prev: WeatherData | null) => ({
              ...(prev || {}),
              current: null,
              recentDailyRawData: null,
              recentMonthlyAverage: null,
              historicalMonthlyAverage: null,
              errorKey: 'weatherUnavailable',
              error: (criticalError instanceof Error ? criticalError.message : String(criticalError)),
            }));
            setEnvironmentalData((prev: EnvironmentalData | null) => ({
              ...(prev || {}),
              dataTimestamp: new Date().toISOString(),
              errorKey: 'environmentalDataUnavailable',
              error: (criticalError instanceof Error ? criticalError.message : String(criticalError)),
            }));
            setWeatherError(uiStrings.apiError || 'API Error');
            setEnvironmentalError(uiStrings.apiError || 'API Error');
            setIsLoadingWeather(false);
            setIsLoadingEnvironmental(false);
          }
        }
      };

      fetchData();
    } else {
      resetFetchState();
      setIsLoadingWeather(false);
      setIsLoadingEnvironmental(false);
    }
  }, [userLocation, uiStrings]);

  useEffect(() => {
    if (weatherError) {
      let localizedErrorMessage = weatherError;
      if (typeof weatherError === 'string' && !uiStrings[weatherError as keyof UiStrings]) {
        // Try to find a matching error message template
        for (const [key, value] of Object.entries(uiStrings)) {
          if (typeof value === 'function') {
            const result = value();
            if (result.includes(weatherError)) {
              localizedErrorMessage = result;
              break;
            }
          } else if (value.includes(weatherError)) {
            localizedErrorMessage = value;
            break;
          }
        }
      }
      setWeatherData((prev: WeatherData | null) => ({
        ...prev!,
        error: localizedErrorMessage
      }));
    }

    if (environmentalError) {
      let localizedErrorMessage = environmentalError;
      if (typeof environmentalError === 'string' && !uiStrings[environmentalError as keyof UiStrings]) {
        for (const [key, value] of Object.entries(uiStrings)) {
          if (typeof value === 'function') {
            const result = value();
            if (result.includes(environmentalError)) {
              localizedErrorMessage = result;
              break;
            }
          } else if (value.includes(environmentalError)) {
            localizedErrorMessage = value;
            break;
          }
        }
      }
      setEnvironmentalData((prev: EnvironmentalData | null) => ({
        ...prev!,
        error: localizedErrorMessage
      }));
    }
  }, [weatherError, environmentalError, uiStrings]);

  const handleWeatherTabChange = (tab: 'current' | 'recent' | 'historical', refToFocus: React.RefObject<HTMLButtonElement>) => {
    setWeatherDisplayTab(tab);
    setTimeout(() => refToFocus.current?.focus(), 0);
  };

  return {
    weatherData,
    isLoadingWeather,
    weatherError,
    weatherDisplayTab,
    handleWeatherTabChange,
    weatherTabCurrentRef,
    weatherTabRecentRef,
    weatherTabHistoricalRef,
    environmentalData,
    isLoadingEnvironmental,
    environmentalError,
  };
}
