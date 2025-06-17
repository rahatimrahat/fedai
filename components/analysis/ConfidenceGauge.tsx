
import React from 'react';
import { useLocalizationContext } from '@/components/LocalizationContext';
import { type ConfidenceGaugeProps, type ConfidenceLevel, type QualitativeConfidenceData } from '../../types';
import Tooltip from '../ui/Tooltip.tsx'; 
import { InformationCircleIcon } from '@/components/icons';

const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = ({ qualitativeConfidenceData, className = '' }) => {
  const { uiStrings } = useLocalizationContext();

  let level: ConfidenceLevel = 'Unknown';
  let numericValue = 0;
  let colorClass = 'text-[var(--text-secondary)]';
  let ringColorClass = 'stroke-[var(--text-secondary)]';
  let bgColorClass = 'stroke-[var(--border-color-soft)]';
  let levelText = uiStrings.confidenceUnknown;
  let justificationText: string | null = null;

  if (qualitativeConfidenceData) {
    justificationText = qualitativeConfidenceData.justification;
    switch (qualitativeConfidenceData.levelKey?.toUpperCase()) { // Use levelKey and make it case-insensitive
      case 'CONFIDENCE_HIGH':
        level = 'High';
        numericValue = 90;
        colorClass = 'text-[var(--status-green-text)]';
        ringColorClass = 'stroke-[var(--status-green)]';
        levelText = uiStrings.confidenceHigh;
        break;
      case 'CONFIDENCE_MEDIUM': // Assuming this key might be used
      case 'MODERATE': // Legacy or alternative from prompt
        level = 'Moderate';
        numericValue = 60;
        colorClass = 'text-[var(--status-yellow-text)]';
        ringColorClass = 'stroke-[var(--status-yellow)]';
        levelText = uiStrings.confidenceMedium;
        break;
      case 'CONFIDENCE_LOW':
        level = 'Low';
        numericValue = 30;
        colorClass = 'text-[var(--status-red-text)]';
        ringColorClass = 'stroke-[var(--status-red)]';
        levelText = uiStrings.confidenceLow;
        break;
      case 'CONFIDENCE_UNKNOWN':
      default:
        level = 'Unknown';
        numericValue = 0;
        colorClass = 'text-[var(--text-secondary)]';
        ringColorClass = 'stroke-[var(--text-secondary)]';
        levelText = uiStrings.confidenceUnknown;
        break;
    }
  }

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (numericValue / 100) * circumference;

  return (
    <div className={`flex flex-col items-center p-3 bg-[var(--glass-bg-secondary)] border border-[var(--glass-border)] rounded-lg shadow-sm ${className}`}>
      <div className="flex items-center mb-2">
        <h4 className="text-sm font-semibold text-[var(--text-headings)]">{uiStrings.confidenceLevelLabel}</h4>
        {justificationText && (
            <Tooltip content={justificationText} position="top" idSuffix="confidence-justification">
                <InformationCircleIcon className="w-4 h-4 ml-1.5 text-[var(--text-secondary)] hover:text-[var(--accent-teal)] cursor-help" />
            </Tooltip>
        )}
      </div>
      <div className="relative w-32 h-32">
        <svg className="w-full h-full" viewBox="0 0 120 120">
          <circle
            className={`${bgColorClass} transition-all duration-300`}
            strokeWidth="10"
            fill="transparent"
            r={radius}
            cx="60"
            cy="60"
          />
          <circle
            className={`${ringColorClass} transition-all duration-1000 ease-out`}
            strokeWidth="10"
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx="60"
            cy="60"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset,
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%',
            }}
          />
          <text
            x="50%"
            y="50%"
            dominantBaseline="middle"
            textAnchor="middle"
            className={`text-xl font-bold ${colorClass} transition-colors duration-300`}
          >
            {level !== 'Unknown' ? `${numericValue}%` : '?'}
          </text>
        </svg>
      </div>
      <p className={`mt-2 text-sm font-medium ${colorClass}`}>
        {levelText}
      </p>
    </div>
  );
};

export default ConfidenceGauge;
