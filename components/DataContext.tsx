import React, { createContext, useContext, ReactNode, useRef } from 'react';
import { useLocationLogic } from '../hooks/useLocationLogic';
import { useContextualData } from '../hooks/useContextualData';
import { UserLocation, WeatherData, EnvironmentalData } from '../types';

interface DataContextType {
  userLocation: UserLocation | null;
  locationPermission: string;
  locationStatusMessage: string;
  isLoadingLocation: boolean;
  requestLocationPermission: () => void;
  weatherData: WeatherData | null;
  isLoadingWeather: boolean;
  environmentalData: EnvironmentalData | null;
  isLoadingEnvironmental: boolean;
  isDataFullyLoaded: boolean;
  weatherDisplayTab: 'current' | 'recent' | 'historical';
  handleWeatherTabChange: (tab: 'current' | 'recent' | 'historical', refToFocus: React.RefObject<HTMLButtonElement>) => void;
  weatherTabCurrentRef: React.RefObject<HTMLButtonElement>;
  weatherTabRecentRef: React.RefObject<HTMLButtonElement>;
  weatherTabHistoricalRef: React.RefObject<HTMLButtonElement>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    userLocation,
    locationPermission,
    locationStatusMessage,
    isLoadingLocation,
    requestLocationPermission,
  } = useLocationLogic();

  const {
    weatherData,
    isLoadingWeather,
    environmentalData,
    isLoadingEnvironmental,
    weatherDisplayTab,
    handleWeatherTabChange,
    weatherTabCurrentRef,
    weatherTabRecentRef,
    weatherTabHistoricalRef,
  } = useContextualData(userLocation);

  // Determine if all initial data loading is complete
  const isDataFullyLoaded = !isLoadingLocation && (!userLocation || (!isLoadingWeather && !isLoadingEnvironmental));

  const value = {
    userLocation,
    locationPermission,
    locationStatusMessage,
    isLoadingLocation,
    requestLocationPermission,
    weatherData,
    isLoadingWeather,
    environmentalData,
    isLoadingEnvironmental,
    isDataFullyLoaded,
    weatherDisplayTab,
    handleWeatherTabChange,
    weatherTabCurrentRef,
    weatherTabRecentRef,
    weatherTabHistoricalRef,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useDataContext = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
};
