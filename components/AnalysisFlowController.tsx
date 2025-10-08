
import React, { useRef, useEffect } from 'react';
import { useAnalysisContext } from './AnalysisContext.multi-provider';
import { useLocalizationContext } from './LocalizationContext.tsx';
import ImageInput from './ImageInput.tsx';
import DiseaseResultCard from './DiseaseResultCard.tsx';
import LoadingSpinner from './ui/LoadingSpinner.tsx'; 
import BounceIn from './ui/BounceIn.tsx'; 
import TypingText from './ui/TypingText.tsx'; 
import PipelineVisualization from './PipelineVisualization.tsx';
import LocationSection from './LocationSection.tsx';
import WeatherSection from './contextual/WeatherSection.tsx'; 
import EnvironmentalSection from './contextual/EnvironmentalSection.tsx'; 
import {
  PipelineStepId,
  type PipelineStep,
} from '@/types';
import { 
  CloudArrowUpIcon, 
  ChatBubbleLeftRightIcon,
  ScaleIcon,
  GlobeEuropeAfricaIcon,
  SunIcon, 
  SparklesIcon, 
} from '@/components/icons';
import { useElementScroll } from '@/hooks/useElementScroll';
import { useModalAccessibility } from '@/hooks/useModalAccessibility';
import { useFocusOnCondition } from '@/hooks/useFocusOnCondition'; // Import the new hook

const MemoizedDiseaseResultCard = React.memo(DiseaseResultCard);

const AnalysisFlowController: React.FC = () => {
  const {
    imageFile,
    userDescription, setUserDescription,
    diseaseInfo,
    isLoadingAnalysis, appError, 
    followUpAnswer, setFollowUpAnswer,
    currentPipelineStep, 
    triggerAnalysis,
    handleFollowUpSubmit,
    isAnalyzeDisabled
  } = useAnalysisContext();
  
  const { uiStrings } = useLocalizationContext();
  const analyzeButtonRef = useRef<HTMLButtonElement>(null);
  const pipelineModalContentRef = useRef<HTMLDivElement>(null);
  const followUpSectionRef = useRef<HTMLDivElement>(null);
  const contextualDataGroupRef = useRef<HTMLDivElement>(null); 
  const resultsSectionRef = useRef<HTMLDivElement>(null); // Ref for disease results section

  const showContextualSections = !!imageFile; 

  const ANALYSIS_PIPELINE_STEPS: PipelineStep[] = [
    { id: PipelineStepId.IMAGE_UPLOAD, labelKey: 'pipelineStepImageUpload', icon: <CloudArrowUpIcon className="w-5 h-5" /> },
    { id: PipelineStepId.LOCATION_DATA, labelKey: 'pipelineStepLocationData', icon: <GlobeEuropeAfricaIcon className="w-5 h-5" /> },
    { id: PipelineStepId.ENVIRONMENT_DATA, labelKey: 'pipelineStepEnvironmentData', icon: <SunIcon className="w-5 h-5" /> },
    { id: PipelineStepId.AI_ANALYSIS, labelKey: 'pipelineStepAIAnalysis', icon: <ScaleIcon className="w-5 h-5" /> },
  ];
  
  useElementScroll(showContextualSections, contextualDataGroupRef, {
    scrollOptions: { behavior: 'smooth', block: 'start' },
    delay: 200 
  });

  useModalAccessibility(
    !!(isLoadingAnalysis && currentPipelineStep), 
    pipelineModalContentRef, 
    analyzeButtonRef
  );

  useElementScroll(
    !!(diseaseInfo?.followUpQuestion && !isLoadingAnalysis),
    followUpSectionRef,
    { scrollOptions: { behavior: 'smooth', block: 'center' }, delay: 100 }
  );

  // Use the new custom hook for focusing the follow-up textarea
  useFocusOnCondition(
    !!(diseaseInfo?.followUpQuestion && !isLoadingAnalysis),
    followUpSectionRef,
    'textarea',
    150
  );

  // useEffect for scrolling to results section
  useEffect(() => {
    if (diseaseInfo && !isLoadingAnalysis && resultsSectionRef.current) {
      resultsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [diseaseInfo, isLoadingAnalysis]);


  return (
    <div className="space-y-8 sm:space-y-10">
      {isLoadingAnalysis && currentPipelineStep && (
        <div className="pipeline-overlay-backdrop">
          <BounceIn className="w-full max-w-3xl">
            <PipelineVisualization 
              steps={ANALYSIS_PIPELINE_STEPS} 
              currentStepId={currentPipelineStep} 
              ref={pipelineModalContentRef} 
            />
          </BounceIn>
        </div>
      )}

      {appError && !diseaseInfo?.error && ( 
        <BounceIn>
          <div 
            className="card p-5 bg-[var(--status-red-bg)] border-[var(--status-red)] text-[var(--status-red-text)]"
            role="alert" 
            aria-live="polite"
            aria-atomic="true"
          >
            <strong className="font-semibold">{uiStrings.errorTitle}:</strong> {appError}
          </div>
        </BounceIn>
      )}

      <BounceIn>
        <form onSubmit={(e) => { e.preventDefault(); triggerAnalysis(); }} className="card space-y-6 p-6"> 
           <div className="flex items-center mb-2">
              <CloudArrowUpIcon className="w-6 h-6 text-[var(--primary-500)] mr-3"/>
              <h2 className="text-xl font-semibold text-[var(--text-headings)]">{uiStrings.uploadImage}</h2>
            </div>
          <ImageInput />
          <div className="space-y-4">
            <textarea
              value={userDescription}
              onChange={(e) => setUserDescription(e.target.value)}
              placeholder={uiStrings.optionalDescriptionPlaceholder}
              rows={5} 
              className="input-field"
              aria-label={uiStrings.optionalDescriptionPlaceholder}
            />
            <button
              ref={analyzeButtonRef}
              type="submit"
              disabled={isAnalyzeDisabled}
              className="btn btn-primary w-full text-base py-2.5" 
              aria-label={isLoadingAnalysis ? uiStrings.analyzingButton : uiStrings.analyzeButton}
            >
              {isLoadingAnalysis && <LoadingSpinner className="w-5 h-5 mr-2" />} 
              {isLoadingAnalysis ? uiStrings.analyzingButton : uiStrings.analyzeButton }
            </button>
          </div>
        </form>
      </BounceIn>

      {showContextualSections && (
        <BounceIn>
          <div ref={contextualDataGroupRef} className="space-y-6">
            <div className="mt-8 mb-6 p-4 bg-[var(--glass-bg-secondary)] rounded-lg text-center border border-[var(--glass-border)]">
                <SparklesIcon className="w-8 h-8 text-[var(--accent-teal)] mx-auto mb-2" />
                <TypingText
                  text={uiStrings.thinkingTextAfterImageUpload}
                  className="text-md font-medium text-[var(--text-primary)]"
                />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-[var(--text-headings)] mb-4 text-center sm:text-left" style={{fontSize: 'var(--h2-size)'}}>
                {uiStrings.localEnvironmentInsightsTitle}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
                  <LocationSection />
                  <WeatherSection />
                  <EnvironmentalSection />
              </div>
            </div>
          </div>
        </BounceIn>
      )}
      
      {diseaseInfo && !isLoadingAnalysis && (
        <div ref={resultsSectionRef} className="mt-8"> {/* Attach ref and move className */}
          <BounceIn>
            <MemoizedDiseaseResultCard result={diseaseInfo} />

            {diseaseInfo.followUpQuestion && (
              <div ref={followUpSectionRef} className="card mt-6 p-6 bg-glass space-y-4">
                <h3 className="text-xl font-semibold text-[var(--text-headings)] flex items-center">
                  <ChatBubbleLeftRightIcon className="w-6 h-6 mr-2.5 text-[var(--accent-teal)]" />
                  {uiStrings.followUpQuestionLabel}
              </h3>
              <p className="text-[var(--text-primary)] text-base leading-relaxed">{diseaseInfo.followUpQuestion}</p>
              <textarea
                value={followUpAnswer}
                onChange={(e) => setFollowUpAnswer(e.target.value)}
                rows={3}
                className="input-field"
                placeholder={uiStrings.typeYourAnswerPlaceholder}
                aria-label={uiStrings.typeYourAnswerPlaceholder}
              />
              <button
                onClick={handleFollowUpSubmit}
                disabled={isLoadingAnalysis || !followUpAnswer.trim()} 
                className="btn btn-accent w-full sm:w-auto py-2.5"
                aria-label={uiStrings.submitAnswerButton}
              >
                {uiStrings.submitAnswerButton}
              </button>
            </div>
          )}
          </BounceIn>
        </div>
      )}
    </div>
  );
};

export default AnalysisFlowController;
