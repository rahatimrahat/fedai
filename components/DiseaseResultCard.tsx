
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
import ConfidenceGauge from './analysis/ConfidenceGauge.tsx'; 
import Tabs from './ui/Tabs.tsx'; 
import Tab from './ui/Tab.tsx';   

interface DiseaseResultCardProps {
  result: DiseaseInfo | null;
}

const getIconForSolutionType = (type: SolutionDetail['type']): React.ReactNode => {
  const iconClass = "w-4 h-4 mr-1.5 inline-block";
  switch (type) {
    case 'cultural':
      return <AcademicCapIcon className={iconClass} />;
    case 'biological':
      return <SparklesIcon className={iconClass} />; 
    case 'chemical_general':
      return <BeakerIcon className={iconClass} />;
    case 'observation':
      return <EyeIcon className={iconClass} />;
    case 'preventive':
      return <AcademicCapIcon className={iconClass} style={{ transform: 'scaleX(-1)'}}/>; 
    case 'fertilizer_adjustment':
      return <AdjustmentsHorizontalIcon className={iconClass} />;
    default:
      return null;
  }
};

const SolutionTypePill: React.FC<{ type: SolutionDetail['type'] }> = ({ type }) => {
  const { uiStrings } = useLocalizationContext();
  let text = '';
  let pillClass = 'pill-default'; 
  const icon = getIconForSolutionType(type);

  switch (type) {
    case 'cultural':
      text = uiStrings.solutionTypeCultural;
      pillClass = 'pill-cultural';
      break;
    case 'biological':
      text = uiStrings.solutionTypeBiological;
      pillClass = 'pill-biological';
      break;
    case 'chemical_general':
      text = uiStrings.solutionTypeChemicalGeneral;
      pillClass = 'pill-chemical';
      break;
    case 'observation':
      text = uiStrings.solutionTypeObservation;
      pillClass = 'pill-observation';
      break;
    case 'preventive':
      text = uiStrings.solutionTypePreventive;
      pillClass = 'pill-preventive';
      break;
    case 'fertilizer_adjustment':
      text = uiStrings.solutionTypeFertilizerAdjustment;
      pillClass = 'pill-fertilizer';
      break;
    default:
      text = type;
  }

  return (
    <span className={`${pillClass} pill-base flex items-center`}>
      {icon}
      {text}
    </span>
  );
};

const SolutionItemCard: React.FC<{ solution: SolutionDetail, isFirst: boolean }> = ({ solution, isFirst }) => {
  const { uiStrings } = useLocalizationContext();

  const getLocalizedBudget = (budgetKeyword?: string) => {
    if (!budgetKeyword) return uiStrings.solutionEstimatedBudgetUnknown;
    switch (budgetKeyword.toUpperCase()) {
      case 'BUDGET_LOW': return uiStrings.solutionEstimatedBudgetLow;
      case 'BUDGET_MEDIUM': return uiStrings.solutionEstimatedBudgetMedium;
      case 'BUDGET_HIGH': return uiStrings.solutionEstimatedBudgetHigh;
      default: return uiStrings.solutionEstimatedBudgetUnknown;
    }
  };

  return (
    <div className={`px-0.5 py-1 ${!isFirst ? 'solution-item-separator' : ''}`}> 
      <div 
        className="p-4 rounded-lg transition-all duration-200 hover:shadow-md hover:border-[var(--border-color-soft)] h-full flex flex-col bg-[var(--glass-bg-secondary)] border border-[var(--glass-border)]"
      >
        <div className="mb-2.5">
          <SolutionTypePill type={solution.type} />
        </div>
        <div className="text-[var(--text-primary)] text-base leading-relaxed flex-grow mb-2"> 
            {solution.description}
        </div>
        {solution.applicationNotes && (
          <div className="text-sm text-[var(--text-secondary)] mt-2"> 
            <strong className="font-medium text-[var(--text-primary)]">{uiStrings.applicationNotesLabel}:</strong> {solution.applicationNotes}
          </div>
        )}
        {solution.type === 'chemical_general' && solution.exampleBrands && solution.exampleBrands.length > 0 && (
          <div className="mt-2">
            <p className="text-sm font-medium text-[var(--text-primary)]">{uiStrings.solutionExampleBrandsLabel}:</p>
            <ul className="list-disc list-inside ml-4 text-sm text-[var(--text-secondary)] space-y-0.5">
              {solution.exampleBrands.map((brand, i) => <li key={i}>{brand}</li>)}
            </ul>
          </div>
        )}
        {solution.estimatedBudget && (
          <p className="text-sm text-[var(--text-secondary)] mt-1.5">
            <strong className="font-medium text-[var(--text-primary)]">{uiStrings.solutionEstimatedBudgetLabel}:</strong> {getLocalizedBudget(solution.estimatedBudget)}
          </p>
        )}
      </div>
    </div>
  );
};


const DiseaseResultCard: React.FC<DiseaseResultCardProps> = ({ result }) => {
  const { uiStrings } = useLocalizationContext(); 
  const [activeTab, setActiveTab] = useState<'summary' | 'solutions' | 'technical'>('summary');

  if (!result) return null;

  if (result.error && !result.followUpQuestion && !result.errorCode) {
    return (
      <div 
        className="card mt-8 p-6 bg-[var(--status-red-bg)] border-[var(--status-red)]"
        aria-live="polite"
        aria-atomic="true"
      > 
        <div className="flex items-center">
          <ExclamationTriangleIcon className="w-7 h-7 text-[var(--status-red-text)] mr-3.5 flex-shrink-0" />
          <h3 className="text-xl font-semibold text-[var(--status-red-text)] opacity-90">{uiStrings.errorTitle}</h3>
        </div>
        <p className="text-[var(--status-red-text)] opacity-80 mt-2.5 pl-10">{result.error}</p>
      </div>
    );
  }
  
  if (result.errorCode || (!result.diseaseName && !result.followUpQuestion && !result.error)) {
    let guidanceTitle = uiStrings.noDiseaseGuidanceTitle;
    let guidanceMessages: string[] = [];
    let cardBgClass = "bg-[var(--status-blue-bg)] border-[var(--status-blue)]";
    let cardTextClass = "text-[var(--status-blue-text)]";
    let iconClass = "text-[var(--status-blue-text)]";

    switch (result.errorCode) {
        case 'NO_DISEASE_IMAGE_INSUFFICIENT':
            guidanceTitle = uiStrings.noDiseaseFound;
            if (result.imageQualityNotes) guidanceMessages.push(result.imageQualityNotes);
            guidanceMessages.push(uiStrings.noDiseaseGuidanceInsufficientImage);
            cardBgClass = "bg-[var(--status-yellow-bg)] border-[var(--status-yellow)]";
            cardTextClass = "text-[var(--status-yellow-text)]";
            iconClass = "text-[var(--status-yellow-text)]";
            break;
        case 'NO_DISEASE_PLANT_HEALTHY':
            guidanceTitle = uiStrings.noDiseaseGuidancePlantHealthy.split('\n')[0]; 
            guidanceMessages.push(uiStrings.noDiseaseGuidancePlantHealthy);
            cardBgClass = "bg-[var(--status-green-bg)] border-[var(--status-green)]";
            cardTextClass = "text-[var(--status-green-text)]";
            iconClass = "text-[var(--status-green-text)]";
            break;
        case 'NO_DISEASE_GENERAL_SYMPTOMS':
            guidanceTitle = uiStrings.noDiseaseGuidanceGeneralSymptoms.split('\n')[0];
            guidanceMessages.push(uiStrings.noDiseaseGuidanceGeneralSymptoms);
            cardBgClass = "bg-[var(--status-yellow-bg)] border-[var(--status-yellow)]";
            cardTextClass = "text-[var(--status-yellow-text)]";
            iconClass = "text-[var(--status-yellow-text)]";
            break;
        default: 
            guidanceTitle = uiStrings.noDiseaseFound;
            if (result.error) guidanceMessages.push(result.error); 
            else if (result.imageQualityNotes) guidanceMessages.push(result.imageQualityNotes);
            else guidanceMessages.push(uiStrings.noDiseaseGuidanceObservationPrompt);
            break;
    }
    
    if (result.error && result.errorCode) { 
        guidanceMessages = [result.error, ...guidanceMessages.filter(m => m !== result.error)];
    }

    return (
      <div 
        className={`card mt-8 p-6 ${cardBgClass}`}
        aria-live="polite"
        aria-atomic="true"
      > 
         <div className="flex items-center">
          <InformationCircleIcon className={`w-7 h-7 ${iconClass} mr-3.5 flex-shrink-0`} />
          <h3 className={`text-xl font-semibold ${cardTextClass} opacity-90`}>{guidanceTitle}</h3>
        </div>
        <div className={`${cardTextClass} opacity-80 mt-2.5 pl-10 space-y-2`}>
            {guidanceMessages.map((msg, index) => (
                <p key={index} className="whitespace-pre-wrap">{msg}</p>
            ))}
        </div>
        {result.aiWeatherRelevance && (
            <div className="mt-4 pt-3 border-t border-[var(--glass-border)] opacity-70">
                <h4 className="text-lg font-semibold text-[var(--text-headings)] mb-1.5 flex items-center">
                  {uiStrings.technicalAssessmentLabel}
                  <Tooltip content={uiStrings.technicalAssessmentExplanationContent} position="top" idSuffix="tech-assess-no-disease">
                    <InformationCircleIcon className="w-5 h-5 ml-2 text-[var(--text-secondary)] hover:text-[var(--accent-teal)] cursor-help" />
                  </Tooltip>
                </h4>
                <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">{result.aiWeatherRelevance}</p>
            </div>
        )}
      </div>
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
            <BounceIn key="summary-tab">
              <div className="space-y-5">
                {result.definition && (
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-headings)] mb-2" style={{fontSize: 'var(--h2-size)'}}>{uiStrings.definitionLabel}</h3>
                    <p className="text-[var(--text-primary)] text-base leading-relaxed">{result.definition}</p>
                  </div>
                )}
                <ConfidenceGauge qualitativeConfidenceData={result.qualitativeConfidence} />
                {result.aiWeatherRelevance && (
                  <div className="p-4 bg-[var(--glass-bg-secondary)] border border-[var(--glass-border)] rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-[var(--primary-900)] mb-2 flex items-center" style={{fontSize: 'var(--h2-size)'}}>
                      {uiStrings.technicalAssessmentLabel}
                      <Tooltip content={uiStrings.technicalAssessmentExplanationContent} position="top" idSuffix="tech-assess-main">
                        <InformationCircleIcon className="w-5 h-5 ml-2 text-[var(--text-secondary)] hover:text-[var(--accent-teal)] cursor-help" />
                      </Tooltip>
                    </h3>
                    <p className="text-sm text-[var(--text-primary)] opacity-90 whitespace-pre-wrap leading-relaxed">{result.aiWeatherRelevance}</p>
                  </div>
                )}
                 {result.imageQualityNotes && (
                  <BounceIn>
                    <div className="p-3 bg-[var(--glass-bg-secondary)] border border-[var(--glass-border)] rounded-lg shadow-sm">
                      <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{uiStrings.imageQualityNotesLabel}</h4>
                      <p className="text-xs text-[var(--text-secondary)] italic">{result.imageQualityNotes}</p>
                    </div>
                  </BounceIn>
                )}
              </div>
            </BounceIn>
          </div>
        )}

        {activeTab === 'solutions' && (
           <div id={`${tabContentIdPrefix}-solutions-content`} role="tabpanel" aria-labelledby={`${tabContentIdPrefix}-solutions-tab`}>
            <BounceIn key="solutions-tab">
              {solutions.length > 0 ? (
                <div className="space-y-0 py-1">
                  {solutions.map((solution, index) => (
                     <SolutionItemCard 
                        key={index} 
                        solution={solution}
                        isFirst={index === 0} 
                      />
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 bg-[var(--glass-bg-secondary)] rounded-lg border border-[var(--glass-border)]">
                  <InformationCircleIcon className="w-10 h-10 text-[var(--status-blue-text)] mx-auto mb-2" />
                  <p className="text-md font-semibold text-[var(--text-headings)] mb-1">
                    {uiStrings.noSpecificSolutionsFoundTitle}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {uiStrings.noSpecificSolutionsFoundMessage}
                  </p>
                </div>
              )}
              {hasChemicalSolution && (
                <div className="mt-4 p-4 bg-[var(--status-red-bg)] border border-[var(--status-red)] rounded-lg text-sm text-[var(--status-red-text)] leading-relaxed">
                  <p><strong className="font-semibold">{uiStrings.consultLocalExperts.split('.')[0]}.</strong> {uiStrings.consultLocalExperts.substring(uiStrings.consultLocalExperts.indexOf('.') + 1).trim()}</p>
                </div>
              )}
              {hasFertilizerSolution && (
                 <div className="mt-4 p-4 bg-[var(--status-yellow-bg)] border border-[var(--status-yellow)] rounded-lg text-sm text-[var(--status-yellow-text)] leading-relaxed">
                   <p><strong className="font-semibold">{uiStrings.consultLocalExpertsSoil.split('.')[0]}.</strong> {uiStrings.consultLocalExpertsSoil.substring(uiStrings.consultLocalExpertsSoil.indexOf('.') + 1).trim()}</p>
                 </div>
              )}
            </BounceIn>
          </div>
        )}

        {activeTab === 'technical' && (
          <div id={`${tabContentIdPrefix}-technical-content`} role="tabpanel" aria-labelledby={`${tabContentIdPrefix}-technical-tab`}>
            <BounceIn key="technical-tab">
              <div className="space-y-5">
                {result.possibleCauses && result.possibleCauses.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-headings)] mb-2.5" style={{fontSize: 'var(--h2-size)'}}>{uiStrings.possibleCausesLabel}</h3>
                    <ul className="list-disc list-outside space-y-1.5 text-[var(--text-primary)] pl-5 text-base">
                      {result.possibleCauses.map((cause, index) => (
                        <li key={index} className="leading-relaxed">{cause}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.differentialDiagnoses && result.differentialDiagnoses.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-headings)] mb-2.5" style={{fontSize: 'var(--h2-size)'}}>{uiStrings.differentialDiagnosesLabel}</h3>
                    <div className="space-y-3">
                      {result.differentialDiagnoses.map((diag, index) => (
                        <div key={index} className="p-3 bg-[var(--glass-bg-secondary)] border border-[var(--glass-border)] rounded-lg shadow-sm">
                          <h4 className="font-medium text-[var(--text-primary)]">{diag.name}</h4>
                          <p className="text-sm text-[var(--text-secondary)] italic leading-relaxed">{diag.justification}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {result.similarPastCases && (
                  <div>
                    <h3 className="text-base font-semibold text-[var(--text-headings)] mb-1">{uiStrings.similarPastCasesLabel}</h3>
                    <p className="text-sm text-[var(--text-secondary)] italic leading-relaxed">{result.similarPastCases}</p>
                  </div>
                )}
                <div className="mt-5 pt-5 border-t border-[var(--glass-border)] text-sm text-[var(--text-secondary)] space-y-1">
                  {result.locationConsidered && <p>✓ {uiStrings.dataConsideredLocation}</p>}
                  {result.weatherConsidered && <p>✓ {uiStrings.dataConsideredWeather}</p>}
                  {result.environmentalDataConsidered && <p>✓ {uiStrings.dataConsideredEnvironmental}</p>}
                </div>
              </div>
            </BounceIn>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiseaseResultCard;
