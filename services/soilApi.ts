import { type UserLocation, type TestServiceResult } from '@/types';
import {
    CACHE_PREFIX_SOIL,
    CACHE_DURATION_SOIL_MS,
    SERVICE_TEST_TIMEOUT_MS,
    GEOLOCATION_API_TIMEOUT_MS,
    API_BASE_URL
} from '@/constants';
import { getCachedOrFetch } from './cache'; // Import the generic cache utility
import { handleApiError, logError } from '@/utils/errorHandler';

const PROXY_SOIL_ENDPOINT = `${API_BASE_URL}/api/soil`;

// Defines the structure of the data fetched by the proxy and cached
// This should align with what the backend controller returns for soil data
interface SoilFetchResult {
  data?: {
    soilPH?: string;
    soilOrganicCarbon?: string;
    soilCEC?: string;
    soilNitrogen?: string;
    soilSand?: string;
    soilSilt?: string;
    soilClay?: string;
    soilAWC?: string;
  };
  error?: string;
  errorCode?: string;
  source?: string;
  dataTimestamp?: string;
}

async function fetchSoilDataViaProxy(location: UserLocation): Promise<SoilFetchResult> {
  const { latitude, longitude } = location;
  const currentTimestamp = new Date().toISOString();

  try {
    const controller = new AbortController();
    // Use a timeout slightly longer than the general geolocation timeout, as soil data might take longer
    const timeoutId = setTimeout(() => controller.abort(), GEOLOCATION_API_TIMEOUT_MS + 2000); 
    
    const response = await fetch(PROXY_SOIL_ENDPOINT, {
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
        // Ignore if error response is not JSON, use default message
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json() as SoilFetchResult;

    // Basic validation: check if data or error is present.
    // The backend controller returns an error field if data is unavailable or processing fails.
    if (!data || (!data.data && !data.error)) {
      // console.warn(`Soil proxy for ${latitude},${longitude} returned an unexpected response structure.`);
      throw new Error(`Soil proxy for ${latitude},${longitude} returned an unexpected response structure.`);
    }
    
    // Ensure timestamp is present if data is fetched successfully
    if (data.data && !data.dataTimestamp) {
        data.dataTimestamp = currentTimestamp;
    }

    return data;

  } catch (error) {
    const fedaiError = handleApiError(error, `Error fetching soil data via proxy for ${latitude},${longitude}`);
    logError(fedaiError, 'SoilDataFetch');
    // Throw an error that the hook can catch and map to UI strings
    throw new Error(fedaiError.message);
  }
}

export async function fetchSoilData(location: UserLocation): Promise<SoilFetchResult> {
  const { latitude, longitude } = location;
  // Use a cache key that includes lat/lon for specificity
  const cacheKey = `${CACHE_PREFIX_SOIL}${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  
  return getCachedOrFetch<SoilFetchResult>(
    cacheKey,
    () => fetchSoilDataViaProxy(location),
    CACHE_DURATION_SOIL_MS
  );
}

export async function testSoilService(): Promise<TestServiceResult> {
  try {
    const controller = new AbortController();
    // Use a timeout appropriate for testing the proxy
    const timeoutId = setTimeout(() => controller.abort(), SERVICE_TEST_TIMEOUT_MS + 2000);
    
    // Use sample coordinates that are likely to have soil data
    const response = await fetch(PROXY_SOIL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: 40.7128, longitude: -74.0060 }), // New York City coordinates
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
      } catch (e) { /* ignore */ }
      return { status: 'DOWN', details: `Soil Proxy HTTP error: ${response.status} - ${errorMessage}` };
    }
    
    const data = await response.json() as SoilFetchResult;

    // Check if the response contains either valid data or an error message from the proxy
    if (data && (data.data || data.error)) {
      return { status: 'UP', details: 'Service is operational' };
    }

    return { status: 'ERROR', details: 'Soil Proxy returned an unexpected response structure.' };
  } catch (error) {
    const fedaiError = handleApiError(error, 'Failed to test Soil Proxy');
    logError(fedaiError, 'SoilServiceTest');
    return { status: 'DOWN', details: fedaiError.message };
  }
}
