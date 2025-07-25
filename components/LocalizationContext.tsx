import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Language, LanguageCode, UiStrings, ALL_UI_STRINGS } from '@/types';
import { getEffectiveUiStrings, LANGUAGES } from '@/localization';
import { LOCAL_STORAGE_LANGUAGE_KEY, DEFAULT_LANGUAGE_CODE } from '@/constants';

interface LocalizationContextType {
  uiStrings: UiStrings;
  selectedLanguage: Language;
  selectLanguage: (langCode: LanguageCode) => void;
  isLoadingTranslations: boolean;
  availableLanguages: Language[];
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

// Helper to get the initial language
const getInitialLanguage = (): Language => {
  try {
    const storedLangCode = localStorage.getItem(LOCAL_STORAGE_LANGUAGE_KEY) as LanguageCode;
    const foundLanguage = LANGUAGES.find(lang => lang.code === storedLangCode);
    return foundLanguage || LANGUAGES.find(lang => lang.code === DEFAULT_LANGUAGE_CODE)!;
  } catch (error) {
    console.warn("Could not read language from localStorage, using default.", error);
    return LANGUAGES.find(lang => lang.code === DEFAULT_LANGUAGE_CODE)!;
  }
};

export const LocalizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(getInitialLanguage);
  const [uiStrings, setUiStrings] = useState<UiStrings>(() => getEffectiveUiStrings(selectedLanguage.code));
  const [isLoadingTranslations, setIsLoadingTranslations] = useState(true);

  useEffect(() => {
    setIsLoadingTranslations(true);
    const newStrings = getEffectiveUiStrings(selectedLanguage.code);
    setUiStrings(newStrings);
    try {
        localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, selectedLanguage.code);
    } catch (error) {
        console.warn("Failed to set language in localStorage", error);
    }
    document.documentElement.lang = selectedLanguage.code;
    setIsLoadingTranslations(false);
  }, [selectedLanguage]);

  const selectLanguage = useCallback((langCode: LanguageCode) => {
    const language = LANGUAGES.find(l => l.code === langCode);
    if (language) {
      setSelectedLanguage(language);
    }
  }, []);

  const value = {
    uiStrings,
    selectedLanguage,
    selectLanguage,
    isLoadingTranslations,
    availableLanguages: LANGUAGES,
  };

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalizationContext = (): LocalizationContextType => {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error('useLocalizationContext must be used within a LocalizationProvider');
  }
  return context;
};
