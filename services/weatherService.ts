
import { type UserLocation, type WeatherData, type DailyWeatherData, type MonthlyAverageData, type TestServiceResult } from '@/types';
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
      let errorMessage = `Proxy HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // Use default message
      }
      throw new Error(errorMessage);
    }

    // Backend now sends pre-calculated averages and raw daily data
    const proxyResponse = await response.json() as WeatherData; 
    
    // Check if any crucial data component is present
    if (!(proxyResponse.current || proxyResponse.recentMonthlyAverage || proxyResponse.historicalMonthlyAverage)) {
        // console.warn(`Weather proxy for ${latitude},${longitude} returned no data components.`); // Keep console.warn if desired
        throw new Error(`Weather proxy for ${latitude},${longitude} returned no data components.`);
    }

    const fetchedData: WeatherData = {
      current: proxyResponse.current,
      recentDailyRawData: proxyResponse.recentDailyRawData, // Still useful for sparklines
      recentMonthlyAverage: proxyResponse.recentMonthlyAverage,
      historicalMonthlyAverage: proxyResponse.historicalMonthlyAverage,
      weatherDataTimestamp: proxyResponse.weatherDataTimestamp || currentTimestamp,
      // error field is no longer part of WeatherData if fetch is successful
    };

    return fetchedData;

  } catch (error) {
    let errorMessage = `Error fetching weather data via proxy for ${latitude},${longitude}`;
     if (error instanceof Error) {
        errorMessage = error.message; // Use original message
        if (error.name === 'AbortError') {
            errorMessage = `Weather proxy request timed out for ${latitude},${longitude}.`;
        } else if (errorMessage.toLowerCase().includes('failed to fetch')) {
            errorMessage = `Network error or CORS issue with weather proxy: ${errorMessage}`;
        }
    } else {
        errorMessage = String(error);
    }
    console.error(`Error fetching weather data via proxy for ${latitude},${longitude}: ${errorMessage}. Original error:`, error);
    throw new Error(errorMessage);
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
