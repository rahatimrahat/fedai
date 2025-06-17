
import { type UserLocation, type EnvironmentalData, type TestServiceResult } from '../types';
import { 
    CACHE_PREFIX_SOIL,
    CACHE_DURATION_SOIL_MS,
    SERVICE_TEST_TIMEOUT_MS
} from '../constants';
import { getCachedOrFetch } from './cache'; // Import the generic cache utility

const PROXY_SOIL_ENDPOINT = '/api/soil';

// This type defines what the fetchSoilDataViaProxy returns and what is cached
export type SoilDataReturnType = Partial<Pick<EnvironmentalData, 'soilPH' | 'soilOrganicCarbon' | 'soilCEC' | 'soilNitrogen' | 'soilSand' | 'soilSilt' | 'soilClay' | 'soilAWC'>> & { 
    source?: string; 
    error?: string; // Error message if fetch failed
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `Proxy HTTP error! status: ${response.status}` }));
      throw new Error(errorData.error || `Proxy HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json() as SoilDataReturnType;

    if (data.error) {
      // console.warn(`Soil proxy for ${latitude},${longitude} returned an error: ${data.error}`);
      return { error: data.error, source: data.source || 'proxy' };
    }
    if (data.source === 'SoilGrids (NoDataAtLocation)') {
        // console.log(`Soil proxy reported no data at location ${latitude},${longitude}`);
        // Return the object with source information, indicating no data
        return { source: data.source }; 
    }
    // If data is present (even if some soil properties are null), it's a successful fetch from proxy
    return data; 
    
  } catch (error) {
    let errorMessage = `Error fetching soil data via proxy for ${latitude},${longitude}`;
    if (error instanceof Error) {
        if (error.name === 'AbortError') {
            errorMessage = `Soil proxy request timed out for ${latitude},${longitude}.`;
        } else if (error.message.toLowerCase().includes('failed to fetch')) {
            errorMessage = `Network error or CORS issue with soil proxy for ${latitude},${longitude} (Failed to fetch). Check browser console.`;
        } else {
            errorMessage = `${errorMessage}: ${error.message}`;
        }
    }
    // console.error(errorMessage, error);
    // If fetch fails catastrophically, return error and source indicating fetch failure
    return { error: errorMessage, source: 'proxy (fetch-failed)' };
  }
}

export async function fetchSoilData(location: UserLocation): Promise<SoilDataReturnType | null> {
  const { latitude, longitude } = location;
  const cacheKey = `${CACHE_PREFIX_SOIL}${latitude.toFixed(4)}-${longitude.toFixed(4)}`;

  const result = await getCachedOrFetch<SoilDataReturnType>(
    cacheKey,
    () => fetchSoilDataViaProxy(latitude, longitude),
    CACHE_DURATION_SOIL_MS
  );

  // If the result indicates an error or specific 'NoDataAtLocation' source,
  // useContextualData expects null or an object that leads to an error display.
  // If no properties are returned AND there's an error, it's effectively 'unavailable'.
  if (result.error) {
    // Propagate the error and source info if needed by the caller,
    // or return null if only properties are desired.
    // For useContextualData, returning the object with error/source is fine.
    return result;
  }
  
  // If source is 'SoilGrids (NoDataAtLocation)', means service worked but no data.
  if (result.source === 'SoilGrids (NoDataAtLocation)') {
    return { source: result.source }; // Return object with source
  }

  // Filter out source and error for successful cases if only soil properties are needed by caller.
  // However, useContextualData uses the raw result. If it were different, this would be needed:
  // const { error, source, ...soilProperties } = result;
  // return Object.keys(soilProperties).length > 0 ? soilProperties : null;
  
  // If there's no error, and it's not a "NoDataAtLocation" case, return the full result.
  // If result is just { source: "SoilGrids" } with no other props, it means no data points were found.
  const { error, source, ...soilProperties } = result;
  if (Object.keys(soilProperties).length > 0) {
    return result; // Contains actual soil data
  } else if (source && !error) {
    return { source }; // E.g. { source: "SoilGrids (NoDataAtLocation)" } or { source: "SoilGrids" } if empty
  }
  return null; // Fallback if truly empty and no source/error context
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
      const data = await response.json();
      if (data && (data.soilPH || data.source === 'SoilGrids (NoDataAtLocation)' || (data.source === 'SoilGrids' && Object.keys(data).length === 1) )) { 
        return { status: 'UP' };
      }
      return { status: 'DOWN', details: `Soil Proxy error: ${data.error || 'Bad response structure from proxy'}` };
    }
    return { status: 'DOWN', details: `Soil Proxy HTTP error: ${response.status}` };
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
    // console.warn('Soil Data Service (via Proxy) test failed:', message);
    return { status: 'ERROR', details: message };
  }
}