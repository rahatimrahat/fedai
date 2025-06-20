
import React, { useState } from 'react';
import { type DiseaseInfo, type SolutionDetail, type QualitativeConfidenceData } from '@/types';
import { 
    SparklesIcon, 
    InformationCircleIcon, 
    ExclamationTriangleIcon,
    BeakerIcon, 
    AcademicCapIcon, 
    EyeIcon, 
    AdjustmentsHorizontalIcon 
} from '@/components/icons';
import { useLocalizationContext } from './LocalizationContext.tsx';
import Tooltip from './ui/Tooltip.tsx'; 
import BounceIn from './ui/BounceIn.tsx';
import GuidanceCard from './analysis/GuidanceCard';
import ConfidenceGauge from './analysis/ConfidenceGauge.tsx'; 
import Tabs from './ui/Tabs.tsx'; 
import Tab from './ui/Tab.tsx';   
import SummaryTab from './analysis/SummaryTab';
import SolutionsTab from './analysis/SolutionsTab';
import TechnicalTab from './analysis/TechnicalTab';

interface DiseaseResultCardProps {
  result: DiseaseInfo | null;
}

const DiseaseResultCard: React.FC<DiseaseResultCardProps> = ({ result }) => {
  const { uiStrings } = useLocalizationContext(); 
  const [activeTab, setActiveTab] = useState<'summary' | 'solutions' | 'technical'>('summary');

  if (!result) return null;

  if (result.error && !result.followUpQuestion && !result.errorCode) {
    return (
      <GuidanceCard
        title={uiStrings.errorTitle}
        messages={[result.error]}
        cardType="error"
      />
    );
  }
  
  if (result.errorCode || (!result.diseaseName && !result.followUpQuestion && !result.error)) {
    let guidanceTitle = uiStrings.noDiseaseGuidanceTitle;
    let guidanceMessages: string[] = [];
    let cardType: 'info' | 'warning' | 'error' | 'success' = 'info';

    switch (result.errorCode) {
      case 'NO_DISEASE_IMAGE_INSUFFICIENT':
        guidanceTitle = uiStrings.noDiseaseFound;
        if (result.imageQualityNotes) guidanceMessages.push(result.imageQualityNotes);
        guidanceMessages.push(uiStrings.noDiseaseGuidanceInsufficientImage);
        cardType = 'warning';
        break;
      case 'NO_DISEASE_PLANT_HEALTHY':
        guidanceTitle = uiStrings.noDiseaseGuidancePlantHealthy.split('\n')[0];
        guidanceMessages.push(uiStrings.noDiseaseGuidancePlantHealthy);
        cardType = 'success';
        break;
      case 'NO_DISEASE_GENERAL_SYMPTOMS':
        guidanceTitle = uiStrings.noDiseaseGuidanceGeneralSymptoms.split('\n')[0];
        guidanceMessages.push(uiStrings.noDiseaseGuidanceGeneralSymptoms);
        cardType = 'warning';
        break;
      default:
        guidanceTitle = uiStrings.noDiseaseFound;
        if (result.error) {
          guidanceMessages.push(result.error);
          cardType = result.errorCode ? 'warning' : 'error';
        } else if (result.imageQualityNotes) {
          guidanceMessages.push(result.imageQualityNotes);
          cardType = 'info';
        } else {
          guidanceMessages.push(uiStrings.noDiseaseGuidanceObservationPrompt);
          cardType = 'info';
        }
        break;
    }

    if (result.errorCode && result.error && !guidanceMessages.includes(result.error)) {
       if (guidanceMessages.length > 0 && result.imageQualityNotes === guidanceMessages[0] && result.error !== result.imageQualityNotes) {
          guidanceMessages.unshift(result.error);
       } else if (!guidanceMessages.includes(result.error)) { // Add if not already there (e.g. from default case)
          guidanceMessages.push(result.error);
       }
    }
    
    if (guidanceMessages.length === 0 && result.error) {
      guidanceMessages.push(result.error);
    }

     if (guidanceMessages.length === 0) {
       guidanceMessages.push(uiStrings.noDiseaseGuidanceObservationPrompt);
       cardType = 'info';
     }

    return (
      <GuidanceCard
        title={guidanceTitle}
        messages={guidanceMessages}
        cardType={cardType}
        aiWeatherRelevance={result.aiWeatherRelevance}
      />
    );
  }
  
  const hasChemicalSolution = result.structuredSolutions.some(s => s.type === 'chemical_general');
  const hasFertilizerSolution = result.structuredSolutions.some(s => s.type === 'fertilizer_adjustment');
  const solutions = result.structuredSolutions || [];

  const tabContentIdPrefix = "disease-result-card";

  return (
    <div 
      className="card mt-8 p-0 sm:p-0"
      aria-live="polite"
      aria-atomic="true" 
    > 
      {result.diseaseName && (
        <div className="flex items-start space-x-3 p-5 sm:p-6 border-b border-[var(--glass-border)]">
          <SparklesIcon className="w-8 h-8 text-[var(--accent-teal)] mt-0.5 flex-shrink-0" />
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-headings)] tracking-tight" style={{fontSize: 'var(--h1-size)'}}>{result.diseaseName}</h2>
        </div>
      )}

      <div className="px-3 sm:px-4 pt-1">
        <Tabs 
            activeTab={activeTab} 
            onTabChange={(tabName) => setActiveTab(tabName as 'summary' | 'solutions' | 'technical')}
            ariaLabel="Disease Result Sections"
            className="-mb-px flex space-x-2 sm:space-x-3 border-b border-[var(--glass-border)]"
            tabPanelIdPrefix={tabContentIdPrefix}
        >
          <Tab name="summary" label={uiStrings.summaryTab} id={`${tabContentIdPrefix}-summary-tab`} ariaControls={`${tabContentIdPrefix}-summary-content`} />
          <Tab name="solutions" label={uiStrings.solutionsTab} id={`${tabContentIdPrefix}-solutions-tab`} ariaControls={`${tabContentIdPrefix}-solutions-content`} />
          <Tab name="technical" label={uiStrings.technicalDetailsTab} id={`${tabContentIdPrefix}-technical-tab`} ariaControls={`${tabContentIdPrefix}-technical-content`} />
        </Tabs>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {activeTab === 'summary' && (
          <div id={`${tabContentIdPrefix}-summary-content`} role="tabpanel" aria-labelledby={`${tabContentIdPrefix}-summary-tab`}>
            <SummaryTab result={result} />
          </div>
        )}

        {activeTab === 'solutions' && (
           <div id={`${tabContentIdPrefix}-solutions-content`} role="tabpanel" aria-labelledby={`${tabContentIdPrefix}-solutions-tab`}>
            <SolutionsTab result={result} />
          </div>
        )}

        {activeTab === 'technical' && (
          <div id={`${tabContentIdPrefix}-technical-content`} role="tabpanel" aria-labelledby={`${tabContentIdPrefix}-technical-tab`}>
            <TechnicalTab result={result} />
          </div>
        )}
      </div>
    </div>
  );
};

export default DiseaseResultCard;
