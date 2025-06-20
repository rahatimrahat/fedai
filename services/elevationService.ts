
import { type UserLocation, type TestServiceResult } from '@/types';
import { 
    CACHE_PREFIX_ELEVATION, 
    CACHE_DURATION_ELEVATION_MS,
    SERVICE_TEST_TIMEOUT_MS
} from '@/constants';
import { getCachedOrFetch } from './cache'; // Import the generic cache utility

const PROXY_ELEVATION_ENDPOINT = '/api/elevation';

// Defines the structure of the data fetched by the proxy and cached
interface ElevationFetchResult {
  elevation: string | null;
  source?: string; // Source from proxy
  error?: string; // Error message if fetch failed
}

async function fetchElevationViaProxy(latitude: number, longitude: number): Promise<ElevationFetchResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SERVICE_TEST_TIMEOUT_MS + 2000);
    
    const response = await fetch(PROXY_ELEVATION_ENDPOINT, {
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
    
    const data = await response.json();

    // data.elevation can be null for locations at sea level, this is valid.
    // So we check for undefined to indicate a missing field / bad response.
    if (data.elevation === undefined) {
      // console.warn('Elevation proxy call returned no elevation data:', data.error);
      throw new Error(data.error || 'Proxy returned no elevation data.');
    }
    return { elevation: data.elevation, source: data.source || 'proxy' };

  } catch (error) {
    let errorMessage = `Error fetching elevation via proxy for ${latitude},${longitude}`;
    if (error instanceof Error) {
        errorMessage = error.message; // Use original message
        if (error.name === 'AbortError') {
            errorMessage = `Elevation proxy request timed out for ${latitude},${longitude}.`;
        } else if (errorMessage.toLowerCase().includes('failed to fetch')) {
            errorMessage = `Network error or CORS issue with elevation proxy: ${errorMessage}`;
        }
    } else {
        errorMessage = String(error);
    }
    console.error(`Error fetching elevation via proxy for ${latitude},${longitude}: ${errorMessage}. Original error:`, error);
    throw new Error(errorMessage);
  }
}

export async function fetchElevation(location: UserLocation): Promise<string | null> {
  const { latitude, longitude } = location;
  const cacheKey = `${CACHE_PREFIX_ELEVATION}${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  
  const result = await getCachedOrFetch<ElevationFetchResult>(
    cacheKey,
    () => fetchElevationViaProxy(latitude, longitude),
    CACHE_DURATION_ELEVATION_MS
  );

  // The hook/component primarily expects the elevation string or null.
  // The error/source is handled during fetching/caching.
  return result.elevation;
}

export async function testElevationService(): Promise<TestServiceResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SERVICE_TEST_TIMEOUT_MS);
    
    const response = await fetch(PROXY_ELEVATION_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: 28.001, longitude: 86.859 }), 
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.elevation) { 
        return { status: 'UP' };
      }
      return { status: 'DOWN', details: `Elevation Proxy error: ${data.error || 'Bad response structure from proxy'}` };
    }
    return { status: 'DOWN', details: `Elevation Proxy HTTP error: ${response.status}` };
  } catch (error) {
    let message = 'Failed to test Elevation Proxy';
    if (error instanceof Error) {
        message = error.message;
        if (error.name === 'AbortError') {
            message = 'Elevation Proxy test request timed out.';
        } else if (message.toLowerCase().includes('failed to fetch')) {
            message = 'Network error or CORS issue during Elevation Proxy test (Failed to fetch).';
        }
    }
    // console.warn('Elevation Service (via Proxy) test failed:', message);
    return { status: 'ERROR', details: message };
  }
}
