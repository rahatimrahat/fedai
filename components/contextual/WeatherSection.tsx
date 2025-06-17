
import React, { useState, useRef } from 'react';
import { useDataContext } from '../DataContext.tsx';
import { useLocalizationContext } from '../LocalizationContext.tsx';
import { 
    SunIcon, 
    ThermometerIcon, 
    DropletIcon, 
    CloudIcon, 
    ChevronRightIcon as WindSpeedIcon, // Renamed for clarity
    ChevronDownIcon,
    CalendarDaysIcon,
    ExclamationTriangleIcon
} from '../icons';
import LoadingSpinner from '../ui/LoadingSpinner.tsx'; 
import { SparkLine } from '@/components/ui/SparkLine';
import BounceIn from '../ui/BounceIn.tsx'; 
import { getWmoDescription } from '../../localization';
import { type CurrentWeatherData, type MonthlyAverageData, type UiStrings } from '../../types';
import WeatherDataSkeleton from '../WeatherDataSkeleton.tsx';
import Tabs from '../ui/Tabs.tsx'; 
import Tab from '../ui/Tab.tsx';   

// Reusable display components (could be further broken down if needed)
const CurrentWeatherDisplay: React.FC<{ data: CurrentWeatherData, uiStrings: UiStrings, selectedLanguageCode: string }> = React.memo(({ data, uiStrings, selectedLanguageCode }) => (
  <div className="space-y-1.5">
    <p className="flex items-center">
        <ThermometerIcon className="w-5 h-5 mr-2 text-[var(--primary-500)]" />
        <strong>{uiStrings.temperature}:</strong>
        <span className="ml-1.5">{data.temperature_2m?.toLocaleString(selectedLanguageCode, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) ?? 'N/A'}°C</span>
    </p>
    <p className="flex items-center">
        <DropletIcon className="w-5 h-5 mr-2 text-blue-500" />
        <strong>{uiStrings.humidity}:</strong>
        <span className="ml-1.5">{data.relative_humidity_2m?.toLocaleString(selectedLanguageCode) ?? 'N/A'}%</span>
    </p>
    <p className="flex items-center">
        <CloudIcon className="w-5 h-5 mr-2 text-sky-600" />
        <strong>{uiStrings.precipitation}:</strong>
        <span className="ml-1.5">{data.precipitation?.toLocaleString(selectedLanguageCode, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) ?? 'N/A'}mm</span>
    </p>
    <p className="flex items-center">
        <WindSpeedIcon className="w-5 h-5 mr-2 text-gray-500" />
        <strong>{uiStrings.windSpeed}:</strong>
        <span className="ml-1.5">{data.wind_speed_10m?.toLocaleString(selectedLanguageCode, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) ?? 'N/A'} km/h</span>
    </p>
    <p><strong>{uiStrings.weatherCondition}:</strong> {getWmoDescription(data.weather_code, uiStrings)}</p>
    {data.et0_fao_evapotranspiration !== undefined && data.et0_fao_evapotranspiration !== null &&
      <p><strong>{uiStrings.evapotranspirationLabel}:</strong> {data.et0_fao_evapotranspiration.toLocaleString(selectedLanguageCode, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {uiStrings.evapotranspirationUnit}</p>
    }
  </div>
));

const RecentWeatherDisplay: React.FC<{ data: MonthlyAverageData, uiStrings: UiStrings, selectedLanguageCode: string }> = React.memo(({ data, uiStrings, selectedLanguageCode }) => (
  <div className="space-y-1.5">
    <p><strong>{uiStrings.meanTemperature}:</strong> {data.mean_temp?.toLocaleString(selectedLanguageCode, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) ?? 'N/A'}°C</p>
    <p><strong>{uiStrings.totalPrecipitation}:</strong> {data.total_precip?.toLocaleString(selectedLanguageCode, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) ?? 'N/A'}mm</p>
    {data.gdd_sum !== null && data.gdd_sum !== undefined &&
        <p><strong>{uiStrings.gddLabel}:</strong> {data.gdd_sum.toLocaleString(selectedLanguageCode, { maximumFractionDigits: 0 })} {uiStrings.gddUnit}</p>
    }
    <p className="text-xs text-[var(--text-secondary)] pt-1">({selectedLanguageCode === 'tr' ? "Bu ay şu ana kadar" : "Current month to date"})</p>
  </div>
));

const HistoricalWeatherDisplay: React.FC<{ data: MonthlyAverageData, uiStrings: UiStrings, selectedLanguageCode: string }> = React.memo(({ data, uiStrings, selectedLanguageCode }) => (
  <div className="space-y-1.5">
    <p><strong>{uiStrings.meanTemperature}:</strong> {data.mean_temp?.toLocaleString(selectedLanguageCode, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) ?? 'N/A'}°C</p>
    <p><strong>{uiStrings.totalPrecipitation}:</strong> {data.total_precip?.toLocaleString(selectedLanguageCode, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) ?? 'N/A'}mm</p>
     {data.gdd_sum !== null && data.gdd_sum !== undefined &&
        <p><strong>{uiStrings.gddLabel}:</strong> {data.gdd_sum.toLocaleString(selectedLanguageCode, { maximumFractionDigits: 0 })} {uiStrings.gddUnit}</p>
    }
    <p className="text-xs text-[var(--text-secondary)] pt-1">({uiStrings.fiveYearAverage} {selectedLanguageCode === 'tr' ? "bu ay için" : "for this month"})</p>
  </div>
));


const WeatherSection: React.FC = () => {
  const {
    weatherData, isLoadingWeather, weatherDisplayTab, handleWeatherTabChange,
    weatherTabCurrentRef, weatherTabRecentRef, weatherTabHistoricalRef, 
  } = useDataContext();
  const { uiStrings, selectedLanguage } = useLocalizationContext();
  const [showDetailedWeather, setShowDetailedWeather] = useState(false);

  const renderWeatherSummaryCardContent = () => {
    if (isLoadingWeather && (!weatherData || !weatherData.current)) {
      return <WeatherDataSkeleton />;
    }
  
    if (!weatherData && !isLoadingWeather) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-4 h-full bg-[var(--glass-bg-secondary)] rounded-lg border border-[var(--glass-border)]">
          <ExclamationTriangleIcon className="w-12 h-12 text-[var(--status-yellow-text)] mb-3" />
          <p className="text-md font-semibold text-[var(--text-headings)]">{uiStrings.weatherUnavailable}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {uiStrings.weatherDataUnavailableNoLocation}
          </p>
        </div>
      );
    }
  
    if (weatherData.error && !weatherData.current && !weatherData.recentMonthlyAverage && !weatherData.historicalMonthlyAverage) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-4 h-full bg-[var(--status-red-bg)] rounded-lg border border-[var(--status-red)]">
          <ExclamationTriangleIcon className="w-12 h-12 text-[var(--status-red-text)] mb-3" />
          <p className="text-md font-semibold text-[var(--status-red-text)]">{uiStrings.errorTitle}</p>
          <p className="text-sm text-[var(--status-red-text)] opacity-90 mt-1">{weatherData.error}</p>
        </div>
      );
    }
  
    if (!weatherData.current && !isLoadingWeather) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-4 h-full bg-[var(--glass-bg-secondary)] rounded-lg border border-[var(--glass-border)]">
          <ExclamationTriangleIcon className="w-12 h-12 text-[var(--status-yellow-text)] mb-3" />
          <p className="text-md font-semibold text-[var(--text-headings)]">{uiStrings.weatherUnavailable}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {uiStrings.currentWeatherInfoUnavailable}
          </p>
        </div>
      );
    }
    
    if (!weatherData.current) {
        return <WeatherDataSkeleton />; 
    }

    const tempTrendData = weatherData.recentDailyRawData?.temperature_2m_mean.slice(-15) || [];
    const currentTemp = weatherData.current?.temperature_2m;
    const currentConditionCode = weatherData.current?.weather_code;
    const currentHumidity = weatherData.current?.relative_humidity_2m;
    const currentPrecip = weatherData.current?.precipitation;
    
    let weatherIcon = <SunIcon className="w-12 h-12" />; 
    if (currentConditionCode !== undefined) {
        if (currentConditionCode >= 0 && currentConditionCode <= 3) weatherIcon = <SunIcon className="w-12 h-12" />; 
        else if (currentConditionCode >= 45 && currentConditionCode <= 48) weatherIcon = <CloudIcon className="w-12 h-12" />; 
        else if (currentConditionCode >= 51 && currentConditionCode <= 86) weatherIcon = <CloudIcon className="w-12 h-12" />; 
        else if (currentConditionCode >= 95 && currentConditionCode <= 99) weatherIcon = <CloudIcon className="w-12 h-12" />; 
    }

    return (
        <div className="space-y-3 text-sm">
            <div className="flex items-center p-4 bg-[var(--glass-bg-secondary)] rounded-lg border border-[var(--glass-border)]">
                <div className={`mr-4 text-[var(--primary-500)]`}>{weatherIcon}</div>
                <div className="flex-grow">
                    <div className="text-[var(--text-secondary)] text-xs">{uiStrings.temperature} ({uiStrings.weatherTabCurrent})</div>
                    <div className="text-2xl font-bold text-[var(--text-headings)]">
                        {currentTemp?.toLocaleString(selectedLanguage.code, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) ?? 'N/A'}°C
                    </div>
                     {currentConditionCode !== undefined && (
                        <div className="text-xs text-[var(--text-secondary)] -mt-0.5">
                            {getWmoDescription(currentConditionCode, uiStrings)}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start p-3 bg-[var(--glass-bg-secondary)] rounded-lg border border-[var(--glass-border)]">
                    <DropletIcon className="w-5 h-5 text-blue-500 mr-2.5 mt-0.5 flex-shrink-0" />
                    <div>
                        <div className="text-[var(--text-secondary)] text-xs">{uiStrings.humidity}</div>
                        <div className="text-base font-semibold text-[var(--text-primary)]">
                            {currentHumidity?.toLocaleString(selectedLanguage.code) ?? 'N/A'}%
                        </div>
                    </div>
                </div>
                <div className="flex items-start p-3 bg-[var(--glass-bg-secondary)] rounded-lg border border-[var(--glass-border)]">
                    <CloudIcon className="w-5 h-5 text-sky-600 mr-2.5 mt-0.5 flex-shrink-0" />
                    <div>
                        <div className="text-[var(--text-secondary)] text-xs">{uiStrings.precipitation}</div>
                        <div className="text-base font-semibold text-[var(--text-primary)]">
                            {currentPrecip?.toLocaleString(selectedLanguage.code, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) ?? 'N/A'} mm
                        </div>
                    </div>
                </div>
            </div>

            {tempTrendData.length > 1 && (
                <div className="p-3 bg-[var(--glass-bg-secondary)] rounded-lg border border-[var(--glass-border)]">
                    <div className="text-[var(--text-secondary)] text-xs mb-1">{uiStrings.currentMonthTempTrend}</div>
                    <SparkLine data={tempTrendData} width={200} height={35} className="w-full"/>
                </div>
            )}
        </div>
    );
  };

  const renderDetailedWeatherData = () => {
    if (isLoadingWeather && !weatherData) return <WeatherDataSkeleton />;
    if (!weatherData || (!weatherData.current && !weatherData.recentMonthlyAverage && !weatherData.historicalMonthlyAverage)) return null; 

    const dataToDisplay = weatherDisplayTab === 'current' ? weatherData?.current :
                          weatherDisplayTab === 'recent' ? weatherData?.recentMonthlyAverage :
                          weatherData?.historicalMonthlyAverage;
    
    const timestamp = weatherData?.weatherDataTimestamp ? new Date(weatherData.weatherDataTimestamp).toLocaleString(selectedLanguage.code, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'}) : '';
    const noDataForTab = !dataToDisplay || 
        (weatherDisplayTab === 'recent' && weatherData?.recentMonthlyAverage?.mean_temp === null && weatherData?.recentMonthlyAverage?.total_precip === null && weatherData?.recentMonthlyAverage?.gdd_sum === null) ||
        (weatherDisplayTab === 'historical' && weatherData?.historicalMonthlyAverage?.mean_temp === null && weatherData?.historicalMonthlyAverage?.total_precip === null && weatherData?.historicalMonthlyAverage?.gdd_sum === null);

    const weatherTabPanelId = "weather-tabpanel-content-detailed";
    
    return (
      <div className="space-y-3 mt-4">
        <Tabs
            activeTab={weatherDisplayTab}
            onTabChange={(tabName) => {
                const tab = tabName as 'current' | 'recent' | 'historical';
                let refToFocus: React.RefObject<HTMLButtonElement>;
                if (tab === 'current') refToFocus = weatherTabCurrentRef;
                else if (tab === 'recent') refToFocus = weatherTabRecentRef;
                else refToFocus = weatherTabHistoricalRef;
                handleWeatherTabChange(tab, refToFocus);
            }}
            ariaLabel={uiStrings.weatherTabCurrent} 
            className="flex border-b border-[var(--glass-border)] overflow-x-auto"
            tabPanelIdPrefix="weather-detailed"
        >
            {weatherData?.current && (
                <Tab name="current" label={uiStrings.weatherTabCurrent} id="weather-detailed-current-tab" ariaControls={`${weatherTabPanelId}-current`} buttonRef={weatherTabCurrentRef} />
            )}
            {(weatherData?.recentMonthlyAverage && (weatherData.recentMonthlyAverage.mean_temp !== null || weatherData.recentMonthlyAverage.total_precip !== null || weatherData.recentMonthlyAverage.gdd_sum !== null)) && (
                <Tab name="recent" label={uiStrings.weatherTabRecent} id="weather-detailed-recent-tab" ariaControls={`${weatherTabPanelId}-recent`} buttonRef={weatherTabRecentRef} />
            )}
            {(weatherData?.historicalMonthlyAverage && (weatherData.historicalMonthlyAverage.mean_temp !== null || weatherData.historicalMonthlyAverage.total_precip !== null || weatherData.historicalMonthlyAverage.gdd_sum !== null)) && (
                <Tab name="historical" label={uiStrings.weatherTabHistorical} id="weather-detailed-historical-tab" ariaControls={`${weatherTabPanelId}-historical`} buttonRef={weatherTabHistoricalRef} />
            )}
        </Tabs>
        
        <div className="pt-2 min-h-[120px] text-[var(--text-primary)]">
          {isLoadingWeather && <WeatherDataSkeleton />}
          {!isLoadingWeather && noDataForTab && <p className="text-sm">{uiStrings.weatherUnavailable}</p>}
          {!isLoadingWeather && !noDataForTab && dataToDisplay && (
             <>
              {weatherDisplayTab === 'current' && weatherData?.current && (
                <div id={`${weatherTabPanelId}-current`} role="tabpanel" aria-labelledby="weather-detailed-current-tab">
                    <BounceIn className="text-sm space-y-1.5" key="current-weather-detail">
                        <CurrentWeatherDisplay data={weatherData.current} uiStrings={uiStrings} selectedLanguageCode={selectedLanguage.code} />
                    </BounceIn>
                </div>
              )}
              {weatherDisplayTab === 'recent' && weatherData?.recentMonthlyAverage && (
                 <div id={`${weatherTabPanelId}-recent`} role="tabpanel" aria-labelledby="weather-detailed-recent-tab">
                    <BounceIn className="text-sm space-y-1.5" key="recent-weather-detail">
                        <RecentWeatherDisplay data={weatherData.recentMonthlyAverage} uiStrings={uiStrings} selectedLanguageCode={selectedLanguage.code} />
                    </BounceIn>
                </div>
              )}
              {weatherDisplayTab === 'historical' && weatherData?.historicalMonthlyAverage && (
                <div id={`${weatherTabPanelId}-historical`} role="tabpanel" aria-labelledby="weather-detailed-historical-tab">
                    <BounceIn className="text-sm space-y-1.5" key="historical-weather-detail">
                        <HistoricalWeatherDisplay data={weatherData.historicalMonthlyAverage} uiStrings={uiStrings} selectedLanguageCode={selectedLanguage.code} />
                    </BounceIn>
                </div>
              )}
            </>
          )}
        </div>
        {!isLoadingWeather && timestamp && <p className="text-xs text-[var(--text-secondary)] opacity-80 mt-3">{uiStrings.weatherLastUpdated}: {timestamp}</p>}
      </div>
    );
  };

  return (
    <BounceIn className="md:col-span-1">
      <section className="card p-6 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-3">
              <CalendarDaysIcon className="w-6 h-6 text-[var(--accent-teal)] flex-shrink-0" />
              <h2 className="text-xl font-semibold text-[var(--text-headings)]">{uiStrings.weatherSummaryTitle}</h2> 
          </div>
          <div className="flex-grow">
            {renderWeatherSummaryCardContent()}
          </div>
          {(weatherData?.current || weatherData?.recentMonthlyAverage || weatherData?.historicalMonthlyAverage) && (
              <button 
                  onClick={() => setShowDetailedWeather(!showDetailedWeather)}
                  className="mt-4 text-sm font-medium text-[var(--primary-500)] hover:text-[var(--primary-900)] flex items-center focus:outline-none focus:ring-1 focus:ring-[var(--primary-500)] p-1 rounded-md self-start"
                  aria-expanded={showDetailedWeather}
                  aria-controls="detailed-weather-content"
              >
                  {showDetailedWeather ? uiStrings.hideMoreDetailsButton : uiStrings.viewMoreDetailsButton}
                  <ChevronDownIcon className={`w-4 h-4 ml-1.5 transition-transform duration-200 ${showDetailedWeather ? 'rotate-180' : ''}`} />
              </button>
          )}
          {showDetailedWeather && (
              <div id="detailed-weather-content" className="mt-3 border-t border-[var(--glass-border)] pt-3">
                  {renderDetailedWeatherData()}
              </div>
          )}
      </section>
    </BounceIn>
  );
};

export default WeatherSection;
