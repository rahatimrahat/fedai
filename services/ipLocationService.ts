
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
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SERVICE_TEST_TIMEOUT_MS + 2000); 
    
    const response = await fetch(PROXY_IP_LOCATION_ENDPOINT, { 
        method: 'GET', 
        signal: controller.signal 
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

    // Assuming data structure is { latitude, longitude, city, country, countryCode, serviceName }
    // If data is not as expected, or lat/lon are missing, it implies an issue.
    // The original logic returned a specific error object. Now, we should ensure valid data or throw.
    // If critical fields are missing, it might be better to throw an error,
    // or ensure the caller can handle potentially incomplete UserLocation.
    // For now, let's assume that if response.ok and JSON is parsed, data is valid as per expectations.
    // If specific fields like latitude or longitude are absolutely critical,
    // an additional check and throw could be added here.
    if (data.latitude === undefined || data.longitude === undefined) {
        // This case might indicate an unexpected response structure even if response.ok was true.
        throw new Error('Proxy returned incomplete IP location data.');
    }

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
  } catch (error) {
    let errorMessage = 'Unknown error with IP location proxy.';
    if (error instanceof Error) {
        errorMessage = error.message; // Use the original error message if available
        if (error.name === 'AbortError') {
            errorMessage = 'IP location proxy request timed out.';
        } else if (errorMessage.toLowerCase().includes('failed to fetch')) {
            // Keep or enhance the original message for network errors
            errorMessage = `Network error or CORS issue with IP location proxy: ${errorMessage}`;
        }
    } else {
        errorMessage = String(error); // For non-Error objects thrown
    }
    console.error(`Error fetching from IP location proxy: ${errorMessage}. Original error object:`, error); // Keep console.error
    throw new Error(errorMessage); // Re-throw as a new Error or the original if it's already an Error
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