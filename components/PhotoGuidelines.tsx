
import React from 'react';
import { useLocalizationContext } from './LocalizationContext.tsx';
import { CheckCircleIcon } from '@/components/icons'; // Assuming you have this or similar icon

interface PhotoGuidelinesProps {
  isVisible: boolean;
}

const PhotoGuidelines: React.FC<PhotoGuidelinesProps> = ({ isVisible }) => {
  const { uiStrings } = useLocalizationContext();

  if (!isVisible) {
    return null;
  }

  const guidelines = [
    { key: 'photoGuidelineGoodLight', text: uiStrings.photoGuidelineGoodLight },
    { key: 'photoGuidelineClearFocus', text: uiStrings.photoGuidelineClearFocus },
    { key: 'photoGuidelineAffectedPart', text: uiStrings.photoGuidelineAffectedPart },
    { key: 'photoGuidelineWholePlantContext', text: uiStrings.photoGuidelineWholePlantContext },
    { key: 'photoGuidelineAvoidClutter', text: uiStrings.photoGuidelineAvoidClutter },
    { key: 'photoGuidelineMultipleAngles', text: uiStrings.photoGuidelineMultipleAngles },
  ];

  return (
    <div className="mt-4 p-4 bg-[var(--glass-bg-primary)] border border-[var(--glass-border)] rounded-lg shadow-sm space-y-3 transition-all duration-300 ease-in-out">
      <h4 className="text-md font-semibold text-[var(--text-headings)]">{uiStrings.photoTipsTitle}</h4>
      <ul className="space-y-2 text-sm text-[var(--text-primary)]">
        {guidelines.map((guideline) => (
          <li key={guideline.key} className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-[var(--primary-500)] mr-2.5 mt-0.5 flex-shrink-0" />
            <span>{guideline.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PhotoGuidelines;
