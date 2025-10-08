import React, { useState } from 'react';
import { useAISettings } from '@/contexts/AISettingsContext';
import AISettingsModal from './AISettingsModal';

/**
 * Button to open AI settings modal
 * Shows current provider in tooltip
 */
const AISettingsButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { settings } = useAISettings();

  const getProviderDisplayName = () => {
    switch (settings.provider) {
      case 'gemini':
        return 'Google Gemini';
      case 'openrouter':
        return 'OpenRouter';
      case 'local-openai':
        return 'Local AI';
      default:
        return settings.provider;
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`p-2.5 rounded-md hover:bg-[var(--glass-bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--primary-900)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-100)] transition-colors ${className}`}
        title={`AI Settings (Current: ${getProviderDisplayName()})`}
        aria-label="AI Settings"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      </button>

      <AISettingsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default AISettingsButton;
