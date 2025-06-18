
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
        const soilPromise = fetchSoilData(userLocation);

        const envPromise = Promise.all([elevPromise, soilPromise]).then(([elevation, soilDataResult]) => {
            const envDataToSet: EnvironmentalData = { dataTimestamp: new Date().toISOString(), errorKey: null, source: undefined };

            if (elevation) envDataToSet.elevation = elevation; // Assuming elevation is simpler and directly returns data or throws

            // Handle soil data and potential errors from fetchSoilData
            if (soilDataResult) {
                if (soilDataResult.error) {
                    // Handle structured error from soil service (as returned by proxy)
                    console.warn("useContextualData: Soil data fetch returned an error object:", soilDataResult.error);
                    if (soilDataResult.error.source === 'SoilGrids (NoDataAtLocation)') {
                        envDataToSet.errorKey = 'soilDataNotAvailableForLocationTitle';
                        envDataToSet.source = 'SoilGrids (NoDataAtLocation)'; // Set source for specific message display
                    } else if (soilDataResult.error.source === 'SoilGridsProxyStructureError') {
                        envDataToSet.errorKey = 'soilDataProxyStructureError';
                    } else if (soilDataResult.error.source === 'SoilGridsProxyInternalError') {
                        envDataToSet.errorKey = 'soilDataProxyInternalError';
                    } else {
                        envDataToSet.errorKey = 'soilDataServiceGeneralError'; // Fallback for other soil-related errors
                    }
                } else if (Object.keys(soilDataResult).length === 0 && !envDataToSet.errorKey) {
                    // Soil data is empty but no specific error was reported from proxy (e.g. SoilGrids had no data for properties)
                    // This might not be an "error" but rather "no data".
                    // For now, let's not set an errorKey here, allow individual properties to be null.
                    // The UI can then display "N/A" for those properties.
                    // If elevation also failed, a general error will be set below.
                } else if (Object.keys(soilDataResult).length > 0) {
                     // No error, and soilDataResult has properties
                    envDataToSet.soilPH = soilDataResult.soilPH;
                    envDataToSet.soilOrganicCarbon = soilDataResult.soilOrganicCarbon;
                    envDataToSet.soilCEC = soilDataResult.soilCEC;
                    envDataToSet.soilNitrogen = soilDataResult.soilNitrogen;
                    envDataToSet.soilSand = soilDataResult.soilSand;
                    envDataToSet.soilSilt = soilDataResult.soilSilt;
                    envDataToSet.soilClay = soilDataResult.soilClay;
                    envDataToSet.soilAWC = soilDataResult.soilAWC;
                    envDataToSet.source = soilDataResult.source; // e.g. 'SoilGrids'
                }
            }

            // General check if overall no useful environmental data was fetched
            if (!elevation && (!soilDataResult || soilDataResult.error || Object.keys(soilDataResult).filter(k => k !== 'error' && k !== 'source').length === 0) && !envDataToSet.errorKey) {
                 // If no elevation, AND (no soil data OR soil data had an error OR soil data was empty), AND no specific soil error key was already set
                envDataToSet.errorKey = 'environmentalDataUnavailable';
            }

            setEnvironmentalData(prev => ({...prev, ...envDataToSet}));
        }).catch(err => {
            // This catch is for errors like network failure when calling the proxy,
            // or if fetchElevation/fetchSoilData throw an unhandled exception directly.
            console.error("Environmental data promise chain error in useContextualData:", err);
            // Attempt to check if the error object has a source from our proxy structure
            const source = err.source;
            let errorKeyToSet = 'environmentalDataUnavailable'; // Default
            if (source === 'SoilGrids (NoDataAtLocation)') {
                errorKeyToSet = 'soilDataNotAvailableForLocationTitle';
            } else if (source === 'SoilGridsProxyStructureError') {
                errorKeyToSet = 'soilDataProxyStructureError';
            } else if (source === 'SoilGridsProxyInternalError') {
                errorKeyToSet = 'soilDataProxyInternalError';
            } else if (err.message && err.message.toLowerCase().includes('failed to fetch')) { // robustFetch might throw this
                 errorKeyToSet = 'soilDataServiceGeneralError'; // Or a more generic network error string
            }
            setEnvironmentalData({ errorKey: errorKeyToSet, dataTimestamp: new Date().toISOString(), source: source });
        }).finally(() => setIsLoadingEnvironmental(false));

        await Promise.allSettled([weatherPromise, envPromise]);
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
      const messageFromUiStrings = uiStrings[environmentalData.errorKey as keyof UiStrings];
      let localizedErrorMessage: string = typeof messageFromUiStrings === 'function'
        ? (messageFromUiStrings as (...args: any[]) => string)()
        : typeof messageFromUiStrings === 'string'
        ? messageFromUiStrings
        : String(uiStrings.apiError);
      setEnvironmentalData(prev => ({ ...prev!, error: localizedErrorMessage }));
    } else if (environmentalData && environmentalData.errorKey === null && environmentalData.error !== undefined) {
      // Clear error string if errorKey is cleared
      setEnvironmentalData(prev => {
          const { error, ...rest } = prev!;
          return rest;
      });
    }
  }, [uiStrings, weatherData?.errorKey, environmentalData?.errorKey, selectedLanguage.code]);


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
