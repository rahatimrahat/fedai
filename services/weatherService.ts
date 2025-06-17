
import { type UserLocation, type WeatherData, type DailyWeatherData, type MonthlyAverageData, type TestServiceResult } from '../types';
import { 
    CACHE_PREFIX_WEATHER,
    CACHE_DURATION_WEATHER_MS,
    SERVICE_TEST_TIMEOUT_MS
} from '../constants';
import { getCachedOrFetch } from './cache'; // Import the generic cache utility

const PROXY_WEATHER_ENDPOINT = '/api/weather';

// // Helper function to calculate averages - MOVED TO BACKEND
// function calculateAverages(dailyData: DailyWeatherData | null): MonthlyAverageData { ... }

async function fetchAndProcessWeatherDataViaProxy(location: UserLocation): Promise<WeatherData> {
  const { latitude, longitude } = location;
  const currentTimestamp = new Date().toISOString();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SERVICE_TEST_TIMEOUT_MS + 5000); 
    
    const response = await fetch(PROXY_WEATHER_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude, longitude }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `Proxy HTTP error! status: ${response.status}` }));
      throw new Error(errorData.error || `Proxy HTTP error! status: ${response.status}`);
    }

    // Backend now sends pre-calculated averages and raw daily data
    const proxyResponse = await response.json() as WeatherData; 
    
    const fetchedData: WeatherData = {
      current: proxyResponse.current,
      recentDailyRawData: proxyResponse.recentDailyRawData, // Still useful for sparklines
      recentMonthlyAverage: proxyResponse.recentMonthlyAverage,
      historicalMonthlyAverage: proxyResponse.historicalMonthlyAverage,
      weatherDataTimestamp: proxyResponse.weatherDataTimestamp || currentTimestamp,
    };

    if (proxyResponse.current || proxyResponse.recentMonthlyAverage || proxyResponse.historicalMonthlyAverage) {
        return fetchedData;
    } else {
        // console.warn(`Weather proxy for ${latitude},${longitude} returned no data components.`);
        return { error: 'Weather proxy returned no data.', weatherDataTimestamp: currentTimestamp };
    }

  } catch (error) {
    let errorMessage = `Error fetching weather data via proxy for ${latitude},${longitude}`;
     if (error instanceof Error) {
        if (error.name === 'AbortError') {
            errorMessage = `Weather proxy request timed out for ${latitude},${longitude}.`;
        } else if (error.message.toLowerCase().includes('failed to fetch')) {
            errorMessage = `Network error or CORS issue with weather proxy for ${latitude},${longitude} (Failed to fetch). Check browser console.`;
        } else {
            errorMessage = `${errorMessage}: ${error.message}`;
        }
    }
    // console.error(errorMessage, error);
    return { error: errorMessage, weatherDataTimestamp: currentTimestamp };
  }
}

export async function fetchWeatherData(location: UserLocation): Promise<WeatherData> {
  const { latitude, longitude } = location;
  const cacheKey = `${CACHE_PREFIX_WEATHER}${latitude.toFixed(4)}-${longitude.toFixed(4)}`;

  return getCachedOrFetch<WeatherData>(
    cacheKey,
    () => fetchAndProcessWeatherDataViaProxy(location),
    CACHE_DURATION_WEATHER_MS
  );
}

export async function testWeatherService(): Promise<TestServiceResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SERVICE_TEST_TIMEOUT_MS + 2000);
    
    const response = await fetch(PROXY_WEATHER_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: 52.52, longitude: 13.41 }), // Test coordinates
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && (data.current || data.recentMonthlyAverage || data.historicalMonthlyAverage)) { // Check for pre-calculated averages
        return { status: 'UP' };
      }
      return { status: 'DOWN', details: `Weather Proxy error: ${data.error || 'Bad response structure'}` };
    }
    return { status: 'DOWN', details: `Weather Proxy HTTP error: ${response.status}` };
  } catch (error) {
    let message = 'Failed to test Weather Proxy';
    if (error instanceof Error) {
        message = error.message;
        if (error.name === 'AbortError') {
            message = 'Weather Proxy test request timed out.';
        } else if (message.toLowerCase().includes('failed to fetch')) {
            message = 'Network error or CORS issue during Weather Proxy test (Failed to fetch).';
        }
    }
    // console.warn('Weather Service (via Proxy) test failed:', message);
    return { status: 'ERROR', details: message };
  }
}