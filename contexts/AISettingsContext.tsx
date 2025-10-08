import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AISettings, DEFAULT_AI_SETTINGS, AIProviderType } from '@/types/aiSettings';

interface AISettingsContextType {
  settings: AISettings;
  updateSettings: (newSettings: Partial<AISettings>) => void;
  resetSettings: () => void;
  saveSettings: () => void;
  isLoaded: boolean;
}

const AISettingsContext = createContext<AISettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'fedai_ai_settings';

export const AISettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_AI_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load AI settings:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save AI settings:', error);
    }
  }, [settings]);

  // Auto-save when settings change
  useEffect(() => {
    if (isLoaded) {
      saveSettings();
    }
  }, [settings, isLoaded, saveSettings]);

  const updateSettings = useCallback((newSettings: Partial<AISettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_AI_SETTINGS);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AISettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        saveSettings,
        isLoaded
      }}
    >
      {children}
    </AISettingsContext.Provider>
  );
};

export const useAISettings = (): AISettingsContextType => {
  const context = useContext(AISettingsContext);
  if (context === undefined) {
    throw new Error('useAISettings must be used within an AISettingsProvider');
  }
  return context;
};
