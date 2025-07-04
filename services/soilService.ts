
import { type UserLocation, type EnvironmentalData, type TestServiceResult } from '../types';
import { 
    CACHE_PREFIX_SOIL,
    CACHE_DURATION_SOIL_MS,
    SERVICE_TEST_TIMEOUT_MS
} from '../constants';
import { getCachedOrFetch } from './cache'; // Import the generic cache utility

const PROXY_SOIL_ENDPOINT = '/api/soil';

// This type defines what the fetchSoilDataViaProxy returns and what is cached
export type SoilDataReturnType = {
  data?: Partial<Pick<EnvironmentalData, 'soilPH' | 'soilOrganicCarbon' | 'soilCEC' | 'soilNitrogen' | 'soilSand' | 'soilSilt' | 'soilClay' | 'soilAWC'>>;
  source?: string;
  dataTimestamp?: string; // From backend success response
  error?: string;         // User-friendly error message from backend
  errorCode?: string;     // Error code for frontend logic from backend
  detail?: string;        // Detailed error from backend's catch block
};


async function fetchSoilDataViaProxy(latitude: number, longitude: number): Promise<SoilDataReturnType> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SERVICE_TEST_TIMEOUT_MS + 5000); 
    
    const response = await fetch(PROXY_SOIL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude, longitude }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const result = await response.json() as SoilDataReturnType;
      // Check if the backend-provided result itself signifies an error
      if (result.error || result.errorCode) {
        // console.warn(`Soil data proxy for ${latitude},${longitude} returned error: ${result.error || result.errorCode}`); // Optional: keep console.warn
        throw new Error(result.error || `Soil data proxy indicated an error: ${result.errorCode || 'Unknown'}`);
      }
      return result; // Backend now sends a well-structured response for success
    }
    // Handle non-ok responses from the proxy itself (e.g., 500, 502)
    else {
      let errorMessage = `Soil proxy HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json(); // errorData might be SoilDataReturnType like
        if (errorData && errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData && errorData.errorCode) {
          errorMessage = `Soil proxy error: ${errorData.errorCode}`;
        }
      } catch (e) {
        // Use default message
      }
      throw new Error(errorMessage);
    }
  } catch (error) {
    let errorMessage = `Error fetching soil data via proxy for ${latitude},${longitude}`;
    // Preserve existing detailed error message construction
    if (error instanceof Error) {
        // If it's already an error from the blocks above (e.g. from response.ok but result.error), rethrow it
        if (error.message.startsWith("Soil data proxy indicated an error") ||
            error.message.startsWith("Soil proxy HTTP error!") ||
            error.message.startsWith("Soil proxy error:")) {
             throw error;
        }
        // Otherwise, it's a new error (e.g. network, timeout)
        errorMessage = error.message; // Use original message
        if (error.name === 'AbortError') {
            errorMessage = `Soil proxy request timed out for ${latitude},${longitude}.`;
        } else if (errorMessage.toLowerCase().includes('failed to fetch')) {
            errorMessage = `Network error or CORS issue with soil proxy: ${errorMessage}`;
        }
    } else {
        errorMessage = String(error);
    }
    console.error(`Error fetching soil data via proxy for ${latitude},${longitude}: ${errorMessage}. Original error:`, error);
    throw new Error(errorMessage);
  }
}

export async function fetchSoilData(location: UserLocation): Promise<SoilDataReturnType> {
  const { latitude, longitude } = location;
  const cacheKey = `${CACHE_PREFIX_SOIL}${latitude.toFixed(4)}-${longitude.toFixed(4)}`;

  // getCachedOrFetch should return SoilDataReturnType directly.
  // The object returned by fetchSoilDataViaProxy (data or structured error) is cached and returned.
  const result = await getCachedOrFetch<SoilDataReturnType>(
    cacheKey,
    () => fetchSoilDataViaProxy(latitude, longitude),
    CACHE_DURATION_SOIL_MS
  );
  return result; // Return the object directly
}


export async function testSoilService(): Promise<TestServiceResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SERVICE_TEST_TIMEOUT_MS + 2000);
    
    const response = await fetch(PROXY_SOIL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: 52.0, longitude: 5.0 }), 
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json() as SoilDataReturnType;
      // Service is UP if we get data (data.data has properties) OR
      // if we get a specific error code from the backend (like NO_DATA_AT_LOCATION, which is a valid, handled scenario)
      if (data && (data.data || data.errorCode)) {
        // If data.errorCode is present, it means the backend handled the request and provided a specific error,
        // which we consider as the service being "UP" in terms of reachability and basic function.
        // If data.data is present, it's a success.
        return { status: 'UP' };
      }
      // If response was ok, but data structure is not what we expect from our standardized responses
      return { status: 'DOWN', details: `Soil Proxy error: Unexpected response structure from proxy. Response: ${JSON.stringify(data)}` };
    }
    // If response not ok, try to parse error from proxy if possible
    const errorDetails = await response.text().catch(() => `Soil Proxy HTTP error: ${response.status}`);
    return { status: 'DOWN', details: `Soil Proxy HTTP error: ${response.status}. Details: ${errorDetails}` };
  } catch (error) {
    let message = 'Failed to test Soil Proxy';
     if (error instanceof Error) {
        message = error.message;
        if (error.name === 'AbortError') {
            message = 'Soil Proxy test request timed out.';
        } else if (message.toLowerCase().includes('failed to fetch')) {
            message = 'Network error or CORS issue during Soil Proxy test (Failed to fetch).';
        }
    }
    return { status: 'ERROR', details: message };
  }
}