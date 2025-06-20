import React from 'react';
import { type DiseaseInfo } from '@/types';
import { useLocalizationContext } from '../LocalizationContext';
import Tooltip from '../ui/Tooltip';
import BounceIn from '../ui/BounceIn';
import ConfidenceGauge from './ConfidenceGauge';
import { InformationCircleIcon } from '../icons';

interface SummaryTabProps {
  result: DiseaseInfo;
}

const SummaryTab: React.FC<SummaryTabProps> = ({ result }) => {
  const { uiStrings } = useLocalizationContext();

  return (
    <BounceIn key="summary-tab-content">
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
  );
};

export default SummaryTab;
