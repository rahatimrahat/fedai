
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  type ImageFile, 
  type DiseaseInfo, 
  PipelineStepId, // Changed from "type PipelineStepId"
  type UserLocation, 
  type WeatherData, 
  type EnvironmentalData,
  type Language,
  LanguageCode,
} from '../types';
import { analyzePlantHealth } from '@/services/geminiService';
import { useLocalizationContext } from './LocalizationContext.tsx';
import { useDataContext } from './DataContext.tsx'; 
import { ALL_UI_STRINGS } from '@/localization'; // For direct access if needed

interface AnalysisContextType {
  imageFile: ImageFile | null;
  userDescription: string;
  setUserDescription: (description: string) => void;
  diseaseInfo: DiseaseInfo | null;
  isLoadingAnalysis: boolean;
  appError: string | null; // User-facing localized error message
  appErrorKey: DiseaseInfo['errorKey'] | null; // For internal error type
  setAppErrorKey: (key: DiseaseInfo['errorKey'] | null) => void; // Allow manual setting
  followUpAnswer: string;
  setFollowUpAnswer: (answer: string) => void;
  currentPipelineStep: PipelineStepId | null;
  isAnalyzeDisabled: boolean;
  handleImageSelected: (file: ImageFile) => void;
  handleImageCleared: () => void;
  triggerAnalysis: () => Promise<void>; // Updated signature
  handleFollowUpSubmit: () => Promise<void>;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export const AnalysisProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { selectedLanguage, uiStrings } = useLocalizationContext();
  const { userLocation, weatherData, environmentalData, isDataFullyLoaded } = useDataContext();

  const [imageFile, setImageFile] = useState<ImageFile | null>(null);
  const [userDescription, setUserDescription] = useState<string>('');
  const [diseaseInfo, setDiseaseInfo] = useState<DiseaseInfo | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);
  
  const [appErrorKey, setAppErrorKeyInternal] = useState<DiseaseInfo['errorKey'] | null>(null);
  const [appError, setAppError] = useState<string | null>(null);

  const [followUpAnswer, setFollowUpAnswer] = useState<string>('');
  const [currentPipelineStep, setCurrentPipelineStep] = useState<PipelineStepId | null>(null);

  // Update localized appError when appErrorKey or uiStrings change
  useEffect(() => {
    if (appErrorKey) {
      let message = uiStrings[appErrorKey as keyof typeof uiStrings] || uiStrings.analysisError;
      if (typeof message === 'function') {
        message = (message as () => string)(); 
      }
      setAppError(message);
    } else {
      setAppError(null);
    }
  }, [appErrorKey, uiStrings]);

  const setAppErrorKey = useCallback((key: DiseaseInfo['errorKey'] | null) => {
    setAppErrorKeyInternal(key);
  }, []);


  const handleImageSelected = (file: ImageFile) => {
    setImageFile(file);
    setDiseaseInfo(null); // Clear previous results
    setAppErrorKey(null); // Clear previous errors
    setFollowUpAnswer('');
    setCurrentPipelineStep(PipelineStepId.IMAGE_UPLOAD);
  };

  const handleImageCleared = () => {
    if (imageFile?.previewUrl) {
      URL.revokeObjectURL(imageFile.previewUrl);
    }
    setImageFile(null);
    setUserDescription('');
    setDiseaseInfo(null);
    setAppErrorKey(null);
    setFollowUpAnswer('');
    setCurrentPipelineStep(null);
  };

  const performAnalysis = useCallback(async (isFollowUp: boolean = false) => {
    if (!imageFile) {
      setAppErrorKey('analysisError'); // Or a more specific "image missing" key
      return;
    }

    setIsLoadingAnalysis(true);
    setAppErrorKey(null);
    if (!isFollowUp) setDiseaseInfo(null); 

    const steps: PipelineStepId[] = [PipelineStepId.IMAGE_UPLOAD];
    if (userLocation) steps.push(PipelineStepId.LOCATION_DATA);
    if (userLocation && (weatherData || environmentalData)) steps.push(PipelineStepId.ENVIRONMENT_DATA);
    steps.push(PipelineStepId.AI_ANALYSIS);

    for (const step of steps) {
        setCurrentPipelineStep(step);
        if (step !== PipelineStepId.AI_ANALYSIS) {
            await new Promise(resolve => setTimeout(resolve, 300)); 
        }
    }
    
    try {
      const result = await analyzePlantHealth(
        imageFile,
        userDescription,
        selectedLanguage,
        userLocation,
        weatherData,
        environmentalData,
        null, 
        uiStrings.apiKeyMissingError, 
        uiStrings.analysisError,      
        isFollowUp ? followUpAnswer : null,
      );

      if (result.errorKey) {
        setAppErrorKey(result.errorKey);
        if (result.followUpQuestion) {
            // Set a clear structure for "error with follow-up"
            setDiseaseInfo({
                // Explicitly nullify fields that belong to a successful diagnosis
                diseaseName: null,
                definition: null,
                possibleCauses: [],
                structuredSolutions: [],
                aiWeatherRelevance: null,
                imageQualityNotes: result.imageQualityNotes, // Keep if present, might be relevant
                differentialDiagnoses: null,
                qualitativeConfidence: null,
                errorCode: result.errorCode, // Preserve if backend sends it
                // Keep the essential error info and the follow-up
                error: result.error,
                errorKey: result.errorKey,
                followUpQuestion: result.followUpQuestion,
                // Add a flag to make it clear this is not a successful result object
                isErrorState: true,
                // Ensure all other DiseaseInfo fields are explicitly handled or nulled
                locationConsidered: result.locationConsidered || false,
                weatherConsidered: result.weatherConsidered || false,
                environmentalDataConsidered: result.environmentalDataConsidered || false,
                similarPastCases: null, // Typically not relevant in an error/follow-up scenario
            });
        } else {
            // This case (errorKey without followUpQuestion) means result is an error object.
            // Add isErrorState: true for consistency.
            setDiseaseInfo({ ...result, isErrorState: true });
        }
      } else if (result.error && !result.errorKey && !result.followUpQuestion) {
        setAppErrorKey('analysisError'); 
        setAppError(result.error); 
        setDiseaseInfo({ ...result, isErrorState: true }); // Add isErrorState
      }
      else {
        setDiseaseInfo(result);
        if (isFollowUp) {
            setFollowUpAnswer(''); 
        }
      }
    } catch (e) { // This now catches errors thrown by analyzePlantHealth (network, timeout, etc.)
      console.error("Critical analysis error in performAnalysis:", e);
      setAppErrorKey('analysisError'); 
      // Ensure appError is set via the useEffect listening to appErrorKey,
      // or set it directly: setAppError(e instanceof Error ? e.message : String(e));
      setDiseaseInfo(null); // Ensure stale data is cleared
    } finally {
      setIsLoadingAnalysis(false);
      setCurrentPipelineStep(null);
    }
  }, [
    imageFile, userDescription, selectedLanguage, userLocation, weatherData, environmentalData, 
    uiStrings, followUpAnswer, /* From isFollowUp logic */
    setAppErrorKey, setIsLoadingAnalysis, setDiseaseInfo, setCurrentPipelineStep /* Zustand setters */
  ]);
  
  const triggerAnalysis = useCallback(() => performAnalysis(false), [performAnalysis]);

  const handleFollowUpSubmit = useCallback(async () => {
    if (followUpAnswer.trim()) {
      await performAnalysis(true);
    }
  }, [followUpAnswer, performAnalysis]);


  const isAnalyzeDisabled = !imageFile || isLoadingAnalysis || !isDataFullyLoaded;


  return (
    <AnalysisContext.Provider value={{
      imageFile,
      userDescription, setUserDescription,
      diseaseInfo,
      isLoadingAnalysis,
      appError,
      appErrorKey,
      setAppErrorKey,
      followUpAnswer, setFollowUpAnswer,
      currentPipelineStep,
      isAnalyzeDisabled,
      handleImageSelected,
      handleImageCleared,
      triggerAnalysis,
      handleFollowUpSubmit,
    }}>
      {children}
    </AnalysisContext.Provider>
  );
};

export const useAnalysisContext = (): AnalysisContextType => {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error('useAnalysisContext must be used within an AnalysisProvider');
  }
  return context;
};
