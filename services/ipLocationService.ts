
import { type UserLocation, type TestServiceResult } from '../types';
import {
    CACHE_KEY_IP_LOCATION,
    CACHE_DURATION_IP_LOCATION_MS,
    SERVICE_TEST_TIMEOUT_MS,
    API_BASE_URL
} from '../constants';
import { getCachedOrFetch } from './cache'; // Import the generic cache utility
import { handleApiError, logError } from '@/utils/errorHandler';

const PROXY_IP_LOCATION_ENDPOINT = `${API_BASE_URL}/api/ip-location`;

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
    const fedaiError = handleApiError(error, 'Unknown error with IP location proxy.');
    logError(fedaiError, 'IpLocationFetch');
    throw new Error(fedaiError.message);
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
    const fedaiError = handleApiError(error, 'Failed to test IP Location Proxy');
    logError(fedaiError, 'IpLocationServiceTest');
    return { status: 'DOWN', details: fedaiError.message };
  }
}
