
import React, { useState, useEffect, useRef } from 'react';
import { type UserLocation, type WeatherData, type EnvironmentalData, type UiStrings, LanguageCode, DailyWeatherData } from '../types';
import { fetchWeatherData } from '@/services/weatherService';
import { fetchElevation } from '@/services/elevationService';
import { fetchSoilData } from '@/services/soilService';
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

  useEffect(() => {
    if (userLocation) {
      const fetchData = async () => {
        if (!weatherData || (!weatherData.current && !weatherData.recentMonthlyAverage && !weatherData.historicalMonthlyAverage && !weatherData.recentDailyRawData && !weatherData.errorKey)) {
          setIsLoadingWeather(true);
        }
        if (!environmentalData || (!environmentalData.elevation && !environmentalData.soilPH && !environmentalData.errorKey)) {
          setIsLoadingEnvironmental(true);
        }
      
        // Clear previous error states before fetching new data
        setWeatherData(prev => ({
            ...(prev || {}),
            errorKey: null, 
            error: undefined, // Explicitly clear direct error string
        }));
        setEnvironmentalData(prev => ({ 
            ...(prev || {}), 
            errorKey: null, 
            error: undefined // Explicitly clear direct error string
        }));
        
        const weatherPromise = fetchWeatherData(userLocation).then(newGenericWeatherData => {
          setWeatherData(prev => ({
            ...(prev || {}), 
            current: newGenericWeatherData.current,
            recentDailyRawData: newGenericWeatherData.recentDailyRawData,
            recentMonthlyAverage: newGenericWeatherData.recentMonthlyAverage,
            historicalMonthlyAverage: newGenericWeatherData.historicalMonthlyAverage,
            weatherDataTimestamp: newGenericWeatherData.weatherDataTimestamp,
            errorKey: newGenericWeatherData.error ? 'weatherUnavailable' : null,
            // error field will be populated by the effect below based on errorKey
          }));
        }).catch(err => {
            console.error("Weather fetch error in useContextualData:", err);
            setWeatherData(prevData => ({
                ...prevData,
                errorKey: 'weatherUnavailable',
                weatherDataTimestamp: new Date().toISOString()
            }));
        }).finally(() => setIsLoadingWeather(false));

        const elevPromise = fetchElevation(userLocation);
        const soilPromise = fetchSoilData(userLocation); // Returns SoilDataReturnType

        // Use Promise.allSettled to handle individual promise failures without Promise.all failing fast.
        const envPromise = Promise.allSettled([elevPromise, soilPromise]).then(([elevationResult, soilResult]) => {
            const envDataToSet: EnvironmentalData = {
                dataTimestamp: new Date().toISOString(),
                errorKey: null,
                error: undefined, // Initialize error message field
                // soilErrorDetail: undefined, // This field is removed
            };

            let elevationErrorKey: string | null = null;
            if (elevationResult.status === 'fulfilled' && elevationResult.value?.elevation) {
                envDataToSet.elevation = elevationResult.value.elevation;
            } else {
                elevationErrorKey = 'elevationDataUnavailable'; // Potential error
            }

            let soilErrorKey: string | null = null;
            if (soilResult.status === 'fulfilled' && soilResult.value) {
                const soilVal = soilResult.value; // SoilDataReturnType
                if (soilVal.data && Object.keys(soilVal.data).length > 0) {
                    Object.assign(envDataToSet, soilVal.data);
                    // if (soilVal.source) envDataToSet.soilSource = soilVal.source; // Optional: if you want to store source
                } else if (soilVal.errorCode) { // Backend or service layer reported a structured error
                    soilErrorKey = soilVal.errorCode;
                    envDataToSet.error = soilVal.error; // Use message from backend/service
                    // if (soilVal.detail) envDataToSet.soilErrorDetail = soilVal.detail; // If we decide to keep detail
                } else { // Fallback if structure is unexpected (should not happen if service is robust)
                    soilErrorKey = 'soilDataUnavailable';
                    envDataToSet.error = uiStrings.soilDataUnavailable || 'Soil data is unavailable.';
                }
            } else { // soilPromise itself failed or value somehow null
                soilErrorKey = 'soilDataFetchError'; // Generic fetch error for the promise itself
                // Try to get more specific error from rejected promise if possible
                if (soilResult.status === 'rejected' && soilResult.reason?.error && soilResult.reason?.errorCode) {
                    envDataToSet.error = soilResult.reason.error;
                    soilErrorKey = soilResult.reason.errorCode;
                } else if (soilResult.status === 'rejected' && soilResult.reason instanceof Error) {
                     envDataToSet.error = soilResult.reason.message;
                } else {
                    envDataToSet.error = uiStrings.soilDataFetchError || 'Failed to fetch soil data.';
                }
            }

            // Determine final errorKey and error message
            if (soilErrorKey) {
                envDataToSet.errorKey = soilErrorKey;
                // envDataToSet.error is already set from soil processing
            } else if (elevationErrorKey) {
                envDataToSet.errorKey = elevationErrorKey;
                envDataToSet.error = uiStrings.elevationDataUnavailable || 'Elevation data is unavailable.';
            } else {
                envDataToSet.errorKey = null; // Both successful
                envDataToSet.error = undefined; // Clear any potential error message
            }

            setEnvironmentalData(prev => ({...(prev || { dataTimestamp: envDataToSet.dataTimestamp }), ...envDataToSet}));
        }).catch(err => { // Should be less likely to be hit if using allSettled properly for sub-promises
            console.error("Critical error in environmental data processing:", err);
            setEnvironmentalData({ errorKey: 'environmentalDataUnavailable', error: uiStrings.environmentalDataUnavailable, dataTimestamp: new Date().toISOString() });
        }).finally(() => setIsLoadingEnvironmental(false));

        // Await all top-level promises (weatherPromise is already being handled with its own .then/.catch/.finally)
        // envPromise handles its own setIsLoadingEnvironmental(false)
        await Promise.allSettled([weatherPromise, envPromise]); // Keep this for overall completion if needed, or rely on individual finally blocks.
      };
      fetchData();
    } else {
      setWeatherData(null);
      setEnvironmentalData(null);
      setIsLoadingWeather(false);
      setIsLoadingEnvironmental(false);
    }
  }, [userLocation]); // Removed selectedLanguage from dependencies as it's not directly used for fetching

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
  };
}
