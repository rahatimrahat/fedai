import React from 'react';
import { type DiseaseInfo } from '@/types';
import { useLocalizationContext } from '../LocalizationContext';
import BounceIn from '../ui/BounceIn';

interface TechnicalTabProps {
  result: DiseaseInfo;
}

const TechnicalTab: React.FC<TechnicalTabProps> = ({ result }) => {
  const { uiStrings } = useLocalizationContext();

  return (
    <BounceIn key="technical-tab-content">
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
  );
};

export default TechnicalTab;
