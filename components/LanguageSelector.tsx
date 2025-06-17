import React from 'react';
import { useLocalizationContext } from '@/components/LocalizationContext';
import { LanguageCode } from '@/types';

const LanguageSelector: React.FC = () => {
  const { 
    selectedLanguage, 
    selectLanguage, 
    availableLanguages, 
    uiStrings 
  } = useLocalizationContext();

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    selectLanguage(event.target.value as LanguageCode);
  };

  return (
    <div className="relative">
      <select
        value={selectedLanguage.code}
        onChange={handleLanguageChange}
        aria-label={uiStrings.selectLanguage}
        className="appearance-none w-full sm:w-auto bg-[var(--glass-bg-secondary)] border border-[var(--glass-border)] text-[var(--text-primary)] text-sm rounded-md py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] transition-colors"
      >
        {availableLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.uiName}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[var(--text-secondary)]">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </div>
    </div>
  );
};

export default LanguageSelector;
