
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

    // Assuming the proxy now returns the DiseaseInfo structure directly
    // and that if there was an error handled by the proxy (e.g. API key issue),
    // it would have resulted in !response.ok and been caught above.
    const parsedResponse = await response.json() as DiseaseInfo; // Expecting full DiseaseInfo on success
      
    // No need for baseReturn for success path if parsedResponse is complete.
    // If parsedResponse might be partial, then merging with a base for default nulls is needed.
    // For now, assume parsedResponse is the complete DiseaseInfo object on success.
    // Ensure all fields are present, defaulting to null/false if not from backend.
    const completeResponse: DiseaseInfo = {
        diseaseName: parsedResponse.diseaseName || null,
        definition: parsedResponse.definition || null,
        possibleCauses: parsedResponse.possibleCauses || [],
        structuredSolutions: parsedResponse.structuredSolutions || [],
        aiWeatherRelevance: parsedResponse.aiWeatherRelevance || null,
        similarPastCases: parsedResponse.similarPastCases || null,
        error: parsedResponse.error || null, // Should be null on success
        errorKey: parsedResponse.errorKey || null, // Should be null on success
        followUpQuestion: parsedResponse.followUpQuestion || null,
        imageQualityNotes: parsedResponse.imageQualityNotes || null,
        differentialDiagnoses: parsedResponse.differentialDiagnoses || null,
        qualitativeConfidence: parsedResponse.qualitativeConfidence || null,
        errorCode: parsedResponse.errorCode || null, // Should be null on success
        locationConsidered: parsedResponse.locationConsidered || false,
        weatherConsidered: parsedResponse.weatherConsidered || false,
        environmentalDataConsidered: parsedResponse.environmentalDataConsidered || false,
    };
    
    // If the successful response still has an error field filled by the backend,
    // it implies a handled error by the backend, treat as such.
    if (completeResponse.error || completeResponse.errorKey || completeResponse.errorCode) {
        throw new Error(completeResponse.error || `Analysis indicated an issue: ${completeResponse.errorKey || completeResponse.errorCode}`);
    }

    return completeResponse;

  } catch (error) {
    let errorMessage = (error instanceof Error ? error.message : String(error)) || 'Unknown analysis error';
    let finalErrorMessage = 'Analysis failed'; // Generic prefix

    if (error instanceof Error) {
        if (error.name === 'AbortError') {
            finalErrorMessage = 'Analysis request timed out.';
        } else if (errorMessage.toLowerCase().includes('failed to fetch')) {
            finalErrorMessage = `Network error during analysis: ${errorMessage}`;
        } else {
            // For errors thrown from !response.ok block or other generic errors
            finalErrorMessage = errorMessage;
        }
    } else {
        finalErrorMessage = `An unexpected error occurred during analysis: ${errorMessage}`;
    }
    console.error(`Critical analysis error in analyzePlantHealth: ${finalErrorMessage}. Original error:`, error);
    throw new Error(finalErrorMessage);
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
    let message = 'Failed to connect to backend proxy status endpoint';
     if (error instanceof Error) {
        if (error.name === 'AbortError') {
            message = 'Backend proxy status request timed out.';
        } else if (error.message.toLowerCase().includes('failed to fetch')) {
            message = 'Network error or CORS issue during proxy status test (Failed to fetch).';
        } else {
            message = error.message;
        }
    }
    return { status: 'ERROR', details: message };
  }
}
