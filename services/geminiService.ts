
import {
  type ImageFile,
  type Language,
  type UserLocation,
  type WeatherData,
  type EnvironmentalData,
  type DiseaseInfo,
  type TestServiceResult,
  type QualitativeConfidenceData,
} from '../types';
import { GEMINI_ANALYSIS_TIMEOUT_MS, GEMINI_TEST_TIMEOUT_MS } from '@/constants';
import { handleApiError, logError } from '@/utils/errorHandler';

// Prompt construction helpers are removed from here and moved to the backend.

export async function analyzePlantHealth(
  imageFile: ImageFile,
  userDescription: string | null,
  language: Language, // Send the whole language object
  userLocation: UserLocation | null,
  weatherData: WeatherData | null,
  environmentalData: EnvironmentalData | null,
  _deviceTilt: null, // This parameter seems unused, keeping for signature consistency
  _uiStringsApiKeyError: string, // No longer used for direct error message construction
  _uiStringsAnalysisError: string, // No longer used for direct error message construction
  followUpAnswer?: string | null,
): Promise<DiseaseInfo> {
  const requestPayload = {
    image: {
      base64: imageFile.base64,
      mimeType: imageFile.mimeType,
    },
    userDescription,
    language, // Send the full language object
    userLocation,
    weatherData,
    environmentalData,
    followUpAnswer,
  };

  const PROXY_ENDPOINT = '/api/gemini-proxy';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, GEMINI_ANALYSIS_TIMEOUT_MS);

    const response = await fetch(PROXY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let proxyErrorMsg = `Proxy error: ${response.status} ${response.statusText}`;
      // let errorKey: DiseaseInfo['errorKey'] = 'ANALYSIS_ERROR'; // errorKey is part of errorData from proxy now
      try {
        const errorData = await response.json(); // Expecting { error: "message", errorKey: "KEY" }
        if (errorData && errorData.error) {
          proxyErrorMsg = errorData.error;
        }
        // Potentially log errorData.errorKey if useful for server-side logs via some mechanism,
        // but the thrown error will primarily carry the message.
        // if (errorData && errorData.errorKey) {
             // You could append this to the message if desired:
             // proxyErrorMsg += ` (Key: ${errorData.errorKey})`;
        // }
      } catch (e) {
        // Ignore if error response is not JSON
      }
      // Specific error type determination (like RATE_LIMIT_ERROR) can be done here
      // and reflected in the error message if desired.
      if (response.status === 429) proxyErrorMsg = `Rate limit exceeded: ${proxyErrorMsg}`;
      else if (response.status === 503) proxyErrorMsg = `Service unavailable: ${proxyErrorMsg}`;
      
      throw new Error(proxyErrorMsg);
    }

    // The backend is expected to return a complete and valid DiseaseInfo object on success.
    // Any errors should have been caught by the !response.ok check above.
    return await response.json() as DiseaseInfo;

  } catch (error) {
    const fedaiError = handleApiError(error, 'Analysis failed');
    logError(fedaiError, 'PlantHealthAnalysis');
    throw fedaiError;
  }
}

export async function testGeminiService(): Promise<TestServiceResult> {
  const PROXY_STATUS_ENDPOINT = '/api/gemini-proxy/status';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GEMINI_TEST_TIMEOUT_MS);

    const response = await fetch(PROXY_STATUS_ENDPOINT, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.status === 'UP') {
        return { status: 'UP' };
      }
      return { status: 'DOWN', details: data.details || 'Proxy status endpoint returned non-UP status' };
    }
    return { status: 'DOWN', details: `Proxy status endpoint HTTP error: ${response.status}` };
  } catch (error) {
    const fedaiError = handleApiError(error, 'Failed to connect to backend proxy status endpoint');
    logError(fedaiError, 'GeminiServiceTest');
    return { status: 'DOWN', details: fedaiError.message };
  }
}
