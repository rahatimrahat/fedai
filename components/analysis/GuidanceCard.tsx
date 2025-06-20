import React from 'react';
import { InformationCircleIcon, ExclamationTriangleIcon } from '../icons'; // Adjusted path
import { useLocalizationContext } from '../LocalizationContext'; // Adjusted path

interface GuidanceCardProps {
  title: string;
  messages: string[];
  cardType: 'info' | 'warning' | 'error' | 'success';
  aiWeatherRelevance?: string;
}

const GuidanceCard: React.FC<GuidanceCardProps> = ({ title, messages, cardType, aiWeatherRelevance }) => {
  const { uiStrings } = useLocalizationContext();

  let cardBgClass = '';
  let cardTextClass = '';
  let IconComponent: React.ElementType = InformationCircleIcon;
  let iconClass = '';

  switch (cardType) {
    case 'success':
      cardBgClass = 'bg-[var(--status-green-bg)] border-[var(--status-green)]';
      cardTextClass = 'text-[var(--status-green-text)]';
      iconClass = 'text-[var(--status-green-text)]';
      IconComponent = InformationCircleIcon; // Or a CheckCircleIcon if available
      break;
    case 'warning':
      cardBgClass = 'bg-[var(--status-yellow-bg)] border-[var(--status-yellow)]';
      cardTextClass = 'text-[var(--status-yellow-text)]';
      iconClass = 'text-[var(--status-yellow-text)]';
      IconComponent = ExclamationTriangleIcon;
      break;
    case 'error':
      cardBgClass = 'bg-[var(--status-red-bg)] border-[var(--status-red)]';
      cardTextClass = 'text-[var(--status-red-text)]';
      iconClass = 'text-[var(--status-red-text)]';
      IconComponent = ExclamationTriangleIcon;
      break;
    case 'info':
    default:
      cardBgClass = 'bg-[var(--status-blue-bg)] border-[var(--status-blue)]';
      cardTextClass = 'text-[var(--status-blue-text)]';
      iconClass = 'text-[var(--status-blue-text)]';
      IconComponent = InformationCircleIcon;
      break;
  }

  return (
    <div
      className={`card mt-8 p-6 ${cardBgClass}`}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-center">
        <IconComponent className={`w-7 h-7 ${iconClass} mr-3.5 flex-shrink-0`} />
        <h3 className={`text-xl font-semibold ${cardTextClass} opacity-90`}>{title}</h3>
      </div>
      <div className={`${cardTextClass} opacity-80 mt-2.5 pl-10 space-y-2`}>
        {messages.map((msg, index) => (
          <p key={index} className="whitespace-pre-wrap">{msg}</p>
        ))}
      </div>
      {aiWeatherRelevance && (
        <div className="mt-4 pt-3 border-t border-[var(--glass-border)] opacity-70">
          <h4 className="text-lg font-semibold text-[var(--text-headings)] mb-1.5 flex items-center">
            {uiStrings.technicalAssessmentLabel}
            {/* Tooltip can be added later if needed */}
          </h4>
          <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">{aiWeatherRelevance}</p>
        </div>
      )}
    </div>
  );
};

export default GuidanceCard;
