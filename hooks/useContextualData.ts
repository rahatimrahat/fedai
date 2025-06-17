
import React, { useState, useEffect, useRef } from 'react';
import { type UserLocation, type WeatherData, type EnvironmentalData, type UiStrings, LanguageCode, DailyWeatherData } from '../types';
import { fetchWeatherData } from '../services/weatherService';
import { fetchElevation } from '../services/elevationService';
import { fetchSoilData } from '../services/soilService';
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
            const envDataToSet: EnvironmentalData = { dataTimestamp: new Date().toISOString(), errorKey: null };
            if (elevation) envDataToSet.elevation = elevation;
            if (soil) {
                envDataToSet.soilPH = soil.soilPH;
                envDataToSet.soilOrganicCarbon = soil.soilOrganicCarbon;
                envDataToSet.soilCEC = soil.soilCEC;
                envDataToSet.soilNitrogen = soil.soilNitrogen;
                envDataToSet.soilSand = soil.soilSand;
                envDataToSet.soilSilt = soil.soilSilt;
                envDataToSet.soilClay = soil.soilClay;
                envDataToSet.soilAWC = soil.soilAWC;
            }
            if (!elevation && (!soil || Object.keys(soil).length === 0)) {
                envDataToSet.errorKey = 'environmentalDataUnavailable';
            }
            // error field will be populated by the effect below based on errorKey
            setEnvironmentalData(prev => ({...prev, ...envDataToSet}));
        }).catch(err => {
            console.error("Environmental data fetch error in useContextualData:", err);
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
