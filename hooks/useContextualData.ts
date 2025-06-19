
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

        const envPromise = Promise.all([elevPromise, soilPromise]).then(([elevation, soil]) => {
            const envDataToSet: EnvironmentalData = {
                dataTimestamp: new Date().toISOString(),
                errorKey: null,
                soilErrorDetail: undefined
            };

            // Process elevation data
            if (elevation?.elevation) {
                envDataToSet.elevation = elevation.elevation;
            }

            // Process soil data
            if (soil) {
                if (soil.error) {
                    envDataToSet.errorKey = 'soilDataFetchError';
                    envDataToSet.soilErrorDetail = soil.error;
                    // Potentially still assign any partial data if the structure allows, though unlikely with an error
                    if (soil.soilPH) envDataToSet.soilPH = soil.soilPH;
                    // Add other properties if they might exist despite the error
                } else if (soil.source === 'SoilGrids (NoDataAtLocation)') {
                    envDataToSet.errorKey = 'soilDataNotAtLocation';
                } else if (Object.keys(soil).filter(k => k !== 'source' && k !== 'error' && soil[k as keyof typeof soil] !== undefined).length > 0) {
                    // Assign soil properties only if there are actual data properties
                    envDataToSet.soilPH = soil.soilPH;
                    envDataToSet.soilOrganicCarbon = soil.soilOrganicCarbon;
                    envDataToSet.soilCEC = soil.soilCEC;
                    envDataToSet.soilNitrogen = soil.soilNitrogen;
                    envDataToSet.soilSand = soil.soilSand;
                    envDataToSet.soilSilt = soil.soilSilt;
                    envDataToSet.soilClay = soil.soilClay;
                    envDataToSet.soilAWC = soil.soilAWC;
                } else if (!envDataToSet.errorKey) { // If no specific soil error or NoDataAtLocation was set
                    envDataToSet.errorKey = 'soilDataUnavailable'; // Soil object exists but is empty or has no usable data
                }
            } else { // soil is null or undefined
                envDataToSet.errorKey = 'soilDataUnavailable';
            }

            // Determine final errorKey based on both elevation and soil states
            const elevationFailed = !elevation?.elevation;
            const soilFailedOrUnavailable = envDataToSet.errorKey === 'soilDataUnavailable' ||
                                          envDataToSet.errorKey === 'soilDataFetchError' ||
                                          envDataToSet.errorKey === 'soilDataNotAtLocation';
            const soilHasSpecificError = envDataToSet.errorKey === 'soilDataFetchError' || envDataToSet.errorKey === 'soilDataNotAtLocation';

            if (elevationFailed) {
                if (soilFailedOrUnavailable && !soilHasSpecificError) {
                    // Both failed generically, or soil was unavailable and elevation failed
                    envDataToSet.errorKey = 'environmentalDataUnavailable';
                } else if (!envDataToSet.errorKey) {
                    // Soil was successful (or no specific soil error key was set for it), but elevation failed
                    envDataToSet.errorKey = 'elevationDataUnavailable';
                }
                // If soilHasSpecificError, that error key (e.g., 'soilDataFetchError') will persist,
                // and we don't overwrite it with 'elevationDataUnavailable' or 'environmentalDataUnavailable'.
                // This prioritizes specific soil errors.
            }
            // If elevation succeeded but soil failed, the soil error key is already set.

            // error field will be populated by the effect below based on errorKey
            setEnvironmentalData(prev => ({...(prev || { dataTimestamp: envDataToSet.dataTimestamp }), ...envDataToSet}));
        }).catch(err => {
            console.error("Environmental data fetch error in useContextualData (Promise.all rejection):", err);
            // This catch handles errors from Promise.all itself (e.g., if one of the promises rejects immediately)
            // or if there's an error within the .then() block before setEnvironmentalData.
            setEnvironmentalData({ errorKey: 'environmentalDataUnavailable', dataTimestamp: new Date().toISOString() });
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
      let localizedErrorMessage: string;
      const errorKey = environmentalData.errorKey as keyof UiStrings;
      const messageTemplate = uiStrings[errorKey];

      if (errorKey === 'soilDataFetchError' && environmentalData.soilErrorDetail) {
        localizedErrorMessage = typeof messageTemplate === 'function'
          ? (messageTemplate as (detail: string) => string)(environmentalData.soilErrorDetail)
          : typeof messageTemplate === 'string'
          ? messageTemplate.replace('{detail}', environmentalData.soilErrorDetail)
          : String(uiStrings.apiError);
      } else {
        localizedErrorMessage = typeof messageTemplate === 'function'
          ? (messageTemplate as () => string)()
          : typeof messageTemplate === 'string'
          ? messageTemplate
          : String(uiStrings.apiError);
      }
      setEnvironmentalData(prev => ({ ...prev!, error: localizedErrorMessage }));
    } else if (environmentalData && environmentalData.errorKey === null && environmentalData.error !== undefined) {
      // Clear error string if errorKey is cleared
      setEnvironmentalData(prev => {
          const { error, soilErrorDetail, ...rest } = prev!; // Also clear soilErrorDetail
          return rest;
      });
    }
  }, [uiStrings, weatherData?.errorKey, environmentalData?.errorKey, environmentalData?.soilErrorDetail, selectedLanguage.code]);


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
