
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
  // Base return structure, flags like locationConsidered will be entirely from backend.
  const baseReturn: Omit<DiseaseInfo, 'error' | 'errorKey' | 'qualitativeConfidence' | 'locationConsidered' | 'weatherConsidered' | 'environmentalDataConsidered'> & { qualitativeConfidence: QualitativeConfidenceData | null } = {
    diseaseName: null, definition: null, possibleCauses: [], structuredSolutions: [],
    aiWeatherRelevance: null, followUpQuestion: null,
    imageQualityNotes: null, differentialDiagnoses: null, qualitativeConfidence: null, errorCode: null,
  };

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
      let errorKey: DiseaseInfo['errorKey'] = 'ANALYSIS_ERROR';
      try {
        const errorData = await response.json();
        if (errorData && errorData.error) {
          proxyErrorMsg = errorData.error;
        }
        if (errorData && errorData.errorKey) { // Proxy might send a specific errorKey
            errorKey = errorData.errorKey;
        }
      } catch (e) {
        // Ignore if error response is not JSON
      }
      
      if (response.status === 429) errorKey = 'RATE_LIMIT_ERROR';
      else if (response.status === 503 && errorKey === 'ANALYSIS_ERROR') errorKey = 'NETWORK_ERROR'; 
      // Keep errorKey from proxy if it's more specific (like API_KEY_MISSING)

      // When returning an error, ensure all boolean flags are present, defaulting to false or based on input if appropriate
      return { 
          ...baseReturn, 
          error: proxyErrorMsg, 
          errorKey,
          locationConsidered: !!userLocation, // Reflect input if error before AI backend decision
          weatherConsidered: !!(weatherData?.current || weatherData?.recentMonthlyAverage || weatherData?.historicalMonthlyAverage || weatherData?.recentDailyRawData),
          environmentalDataConsidered: !!(environmentalData?.elevation || environmentalData?.soilPH || environmentalData?.soilOrganicCarbon || environmentalData?.soilCEC || environmentalData?.soilNitrogen || environmentalData?.soilSand || environmentalData?.soilAWC),
      };
    }

    // Assuming the proxy now returns the DiseaseInfo structure directly
    const parsedResponse = await response.json() as Partial<DiseaseInfo>;
      
    const completeResponse: DiseaseInfo = {
      ...baseReturn, 
      diseaseName: parsedResponse.diseaseName || null,
      definition: parsedResponse.definition || null,
      possibleCauses: parsedResponse.possibleCauses || [],
      structuredSolutions: parsedResponse.structuredSolutions || [],
      aiWeatherRelevance: parsedResponse.aiWeatherRelevance || null,
      similarPastCases: parsedResponse.similarPastCases || null,
      error: parsedResponse.error || null, 
      errorKey: parsedResponse.errorKey || (parsedResponse.error ? 'ANALYSIS_ERROR' : null), 
      followUpQuestion: parsedResponse.followUpQuestion || null,
      imageQualityNotes: parsedResponse.imageQualityNotes || null,
      differentialDiagnoses: parsedResponse.differentialDiagnoses || null,
      qualitativeConfidence: parsedResponse.qualitativeConfidence || null, 
      errorCode: parsedResponse.errorCode || null,
      // Boolean flags are now solely from the backend's response
      locationConsidered: parsedResponse.locationConsidered || false,
      weatherConsidered: parsedResponse.weatherConsidered || false,
      environmentalDataConsidered: parsedResponse.environmentalDataConsidered || false,
    };
    
    return completeResponse;

  } catch (error) {
    let errorKey: DiseaseInfo['errorKey'] = 'NETWORK_ERROR'; 
    let errorMessage = (error as Error).message || 'Unknown network error';

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorKey = 'ANALYSIS_TIMEOUT_ERROR';
        errorMessage = 'Analysis request timed out.';
      }
    }
    // When returning an error, ensure all boolean flags are present
    return { 
        ...baseReturn, 
        error: errorMessage, 
        errorKey,
        locationConsidered: !!userLocation,
        weatherConsidered: !!(weatherData?.current || weatherData?.recentMonthlyAverage || weatherData?.historicalMonthlyAverage || weatherData?.recentDailyRawData),
        environmentalDataConsidered: !!(environmentalData?.elevation || environmentalData?.soilPH || environmentalData?.soilOrganicCarbon || environmentalData?.soilCEC || environmentalData?.soilNitrogen || environmentalData?.soilSand || environmentalData?.soilAWC),
    };
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
