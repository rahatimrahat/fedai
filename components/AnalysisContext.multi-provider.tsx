import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  type ImageFile,
  type DiseaseInfo,
  PipelineStepId,
  type UserLocation,
  type WeatherData,
  type EnvironmentalData,
  type Language
} from '../types';
import { analyzePlantHealth } from '@/services/geminiService.multi-provider';
import { useLocalizationContext } from './LocalizationContext.tsx';
import { useDataContext } from './DataContext.tsx';
import { useAISettings } from '@/contexts/AISettingsContext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

interface AnalysisContextType {
  imageFile: ImageFile | null;
  userDescription: string;
  setUserDescription: (description: string) => void;
  debouncedUserDescription: string;
  diseaseInfo: DiseaseInfo | null;
  isLoadingAnalysis: boolean;
  appError: string | null;
  appErrorKey: DiseaseInfo['errorKey'] | null;
  setAppErrorKey: (key: DiseaseInfo['errorKey'] | null) => void;
  followUpAnswer: string;
  setFollowUpAnswer: (answer: string) => void;
  currentPipelineStep: PipelineStepId | null;
  isAnalyzeDisabled: boolean;
  handleImageSelected: (file: ImageFile) => void;
  handleImageCleared: () => void;
  triggerAnalysis: () => Promise<void>;
  handleFollowUpSubmit: () => Promise<void>;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export const AnalysisProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { selectedLanguage, uiStrings } = useLocalizationContext();
  const { userLocation, weatherData, environmentalData, isDataFullyLoaded } = useDataContext();
  const { settings: aiSettings } = useAISettings();

  const [imageFile, setImageFile] = useState<ImageFile | null>(null);
  const [userDescription, setUserDescription] = useState<string>('');
  const debouncedUserDescription = useDebouncedValue(userDescription, 500);

  const [diseaseInfo, setDiseaseInfo] = useState<DiseaseInfo | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);

  const [appErrorKey, setAppErrorKeyInternal] = useState<DiseaseInfo['errorKey'] | null>(null);
  const [appError, setAppError] = useState<string | null>(null);

  const [followUpAnswer, setFollowUpAnswer] = useState<string>('');
  const [currentPipelineStep, setCurrentPipelineStep] = useState<PipelineStepId | null>(null);

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
    setDiseaseInfo(null);
    setAppErrorKey(null);
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

  const performAnalysis = useCallback(
    async (isFollowUp: boolean = false) => {
      if (!imageFile) {
        setAppErrorKey('analysisError');
        return;
      }

      setIsLoadingAnalysis(true);
      setAppErrorKey(null);
      if (!isFollowUp) setDiseaseInfo(null);

      const steps: PipelineStepId[] = [PipelineStepId.IMAGE_UPLOAD];
      if (userLocation) steps.push(PipelineStepId.LOCATION_DATA);
      if (userLocation && (weatherData || environmentalData))
        steps.push(PipelineStepId.ENVIRONMENT_DATA);
      steps.push(PipelineStepId.AI_ANALYSIS);

      for (const step of steps) {
        setCurrentPipelineStep(step);
        if (step !== PipelineStepId.AI_ANALYSIS) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      try {
        // Pass AI settings to the analysis function
        const result = await analyzePlantHealth(
          imageFile,
          debouncedUserDescription,
          selectedLanguage,
          userLocation,
          weatherData,
          environmentalData,
          null,
          uiStrings.apiKeyMissingError,
          uiStrings.analysisError,
          isFollowUp ? followUpAnswer : null,
          aiSettings // Pass AI settings
        );

        if (result.errorKey) {
          setAppErrorKey(result.errorKey);
          if (result.followUpQuestion) {
            setDiseaseInfo({
              diseaseName: null,
              definition: null,
              possibleCauses: [],
              structuredSolutions: [],
              aiWeatherRelevance: null,
              imageQualityNotes: result.imageQualityNotes,
              differentialDiagnoses: null,
              qualitativeConfidence: null,
              errorCode: result.errorCode,
              error: result.error,
              errorKey: result.errorKey,
              followUpQuestion: result.followUpQuestion,
              isErrorState: true,
              locationConsidered: result.locationConsidered || false,
              weatherConsidered: result.weatherConsidered || false,
              environmentalDataConsidered: result.environmentalDataConsidered || false,
              similarPastCases: null
            });
          } else {
            setDiseaseInfo({ ...result, isErrorState: true });
          }
        } else if (result.error && !result.errorKey && !result.followUpQuestion) {
          setAppErrorKey('analysisError');
          setAppError(result.error);
          setDiseaseInfo({ ...result, isErrorState: true });
        } else {
          setDiseaseInfo(result);
          if (isFollowUp) {
            setFollowUpAnswer('');
          }
        }
      } catch (e) {
        console.error('Critical analysis error in performAnalysis:', e);
        setAppErrorKey('analysisError');
        setDiseaseInfo(null);
      } finally {
        setIsLoadingAnalysis(false);
        setCurrentPipelineStep(null);
      }
    },
    [
      imageFile,
      debouncedUserDescription,
      selectedLanguage,
      userLocation,
      weatherData,
      environmentalData,
      uiStrings,
      followUpAnswer,
      aiSettings, // Include AI settings in dependencies
      setAppErrorKey,
      setIsLoadingAnalysis,
      setDiseaseInfo,
      setCurrentPipelineStep
    ]
  );

  const triggerAnalysis = useCallback(() => performAnalysis(false), [performAnalysis]);

  const handleFollowUpSubmit = useCallback(async () => {
    if (followUpAnswer.trim()) {
      await performAnalysis(true);
    }
  }, [followUpAnswer, performAnalysis]);

  const isAnalyzeDisabled = !imageFile || isLoadingAnalysis || !isDataFullyLoaded;

  return (
    <AnalysisContext.Provider
      value={{
        imageFile,
        userDescription,
        setUserDescription,
        debouncedUserDescription,
        diseaseInfo,
        isLoadingAnalysis,
        appError,
        appErrorKey,
        setAppErrorKey,
        followUpAnswer,
        setFollowUpAnswer,
        currentPipelineStep,
        isAnalyzeDisabled,
        handleImageSelected,
        handleImageCleared,
        triggerAnalysis,
        handleFollowUpSubmit
      }}
    >
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
