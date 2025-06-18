
import { type UserLocation, type TestServiceResult } from '../types';
import { 
    CACHE_KEY_IP_LOCATION, 
    CACHE_DURATION_IP_LOCATION_MS,
    SERVICE_TEST_TIMEOUT_MS
} from '../constants';
import { getCachedOrFetch } from './cache'; // Import the generic cache utility

const PROXY_IP_LOCATION_ENDPOINT = '/api/ip-location';

// This interface defines what fetchIpLocationViaProxy returns and what is cached
interface IpLocationFetchResult {
    location: UserLocation | null;
    serviceName: string | null;
    error?: string; // Error message if the fetch failed
}

async function fetchIpLocationViaProxy(): Promise<IpLocationFetchResult> {
  console.log('[FedaiDebug] fetchIpLocationViaProxy: Attempting to fetch from /api/ip-location');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SERVICE_TEST_TIMEOUT_MS + 2000); 
    
    const response = await fetch(PROXY_IP_LOCATION_ENDPOINT, { 
        method: 'GET', 
        signal: controller.signal 
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `Proxy HTTP error! status: ${response.status}` }));
      throw new Error(errorData.error || `Proxy HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();

    if (data.latitude && data.longitude) {
      console.log('[FedaiDebug] fetchIpLocationViaProxy: Success', data);
      return {
        location: {
          latitude: data.latitude,
          longitude: data.longitude,
          source: 'ip', 
          city: data.city,
          country: data.country, 
          countryCode: data.countryCode,
          // Accuracy message will be constructed in useLocationLogic based on this data
        } as UserLocation,
        serviceName: data.serviceName || 'proxy',
      };
    } else {
      console.warn('[FedaiDebug] fetchIpLocationViaProxy: Proxy returned no location data or error field', data);
      return { location: null, serviceName: null, error: data.error || 'Proxy returned no IP location data.' };
    }
  } catch (error) {
    let errorMessage = 'Unknown error with IP location proxy.';
    if (error instanceof Error) {
        errorMessage = error.message;
        if (error.name === 'AbortError') {
            errorMessage = 'IP location proxy request timed out.';
        } else if (errorMessage.toLowerCase().includes('failed to fetch')) {
            errorMessage = 'Network error or CORS issue with IP location proxy (Failed to fetch). Check browser console for details.';
        }
    } else {
        errorMessage = String(error);
    }
    console.error('[FedaiDebug] fetchIpLocationViaProxy: Error - ', errorMessage, 'Original Error:', error);
    return { location: null, serviceName: null, error: errorMessage };
  }
}

export async function fetchIpLocation(): Promise<IpLocationFetchResult> {
  // The fetchIpLocationViaProxy function is the one that actually performs the network request.
  // getCachedOrFetch will handle caching its result.
  return getCachedOrFetch<IpLocationFetchResult>(
    CACHE_KEY_IP_LOCATION,
    fetchIpLocationViaProxy,
    CACHE_DURATION_IP_LOCATION_MS
  );
}

export async function testIpLocationService(): Promise<TestServiceResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SERVICE_TEST_TIMEOUT_MS);
    const response = await fetch(PROXY_IP_LOCATION_ENDPOINT, { 
        method: 'GET',
        signal: controller.signal 
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.latitude && data.longitude) {
        return { status: 'UP' };
      }
      return { status: 'DOWN', details: `IP Location Proxy error: ${data.error || 'Bad response structure'}` };
    }
    return { status: 'DOWN', details: `IP Location Proxy HTTP error: ${response.status}` };
  } catch (error) {
    let message = 'Failed to test IP Location Proxy';
    if (error instanceof Error) {
        message = error.message;
        if (error.name === 'AbortError') {
            message = 'IP Location Proxy test request timed out.';
        } else if (message.toLowerCase().includes('failed to fetch')) {
            message = 'Network error or CORS issue during IP Location Proxy test (Failed to fetch).';
        }
    }
    // console.warn('IP Location Service (via Proxy) test failed:', message);
    return { status: 'ERROR', details: message };
  }
}