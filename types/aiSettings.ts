// types/aiSettings.ts
// Type definitions for AI provider settings

export type AIProviderType = 'gemini' | 'openrouter' | 'local-openai';

export interface AIProviderMetadata {
  id: string;
  name: string;
  provider: AIProviderType;
  requiresApiKey: boolean;
  supportsVision: boolean;
  supportsStreaming: boolean;
  defaultModel: string | null;
  availableModels?: string[];
  note?: string;
  examples?: Record<string, string>;
  baseUrl?: string;
}

export interface AISettings {
  provider: AIProviderType;
  apiKey: string;
  baseUrl?: string; // For local OpenAI-compatible APIs
  model?: string; // Optional custom model
}

export interface AISettingsFormData extends AISettings {
  testStatus?: 'idle' | 'testing' | 'success' | 'error';
  testMessage?: string;
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  provider: 'gemini',
  apiKey: '',
  baseUrl: 'http://localhost:1234/v1',
  model: ''
};

export const AI_PROVIDER_PRESETS: Record<string, Partial<AISettings>> = {
  'lm-studio': {
    provider: 'local-openai',
    baseUrl: 'http://localhost:1234/v1',
    model: 'local-model'
  },
  'llama-cpp': {
    provider: 'local-openai',
    baseUrl: 'http://localhost:8080/v1',
    model: 'llama-model'
  },
  'koboldcpp': {
    provider: 'local-openai',
    baseUrl: 'http://localhost:5001/v1',
    model: 'kobold-model'
  },
  'text-gen-webui': {
    provider: 'local-openai',
    baseUrl: 'http://localhost:5000/v1',
    model: 'text-gen-model'
  }
};
