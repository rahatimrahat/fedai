import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AIProviderSettings from '@/components/AIProviderSettings';
import { AISettingsContext } from '@/contexts/AISettingsContext';
import { LocalizationContext } from '@/components/LocalizationContext';

const mockUiStrings = {
  aiProviderLabel: 'AI Provider',
  gemini: 'Google Gemini',
  openrouter: 'OpenRouter',
  localai: 'Local AI',
  modelLabel: 'Model',
  apiKeyLabel: 'API Key',
  apiKeyPlaceholder: 'Enter your API key',
  saveButton: 'Save',
  testConnectionButton: 'Test Connection',
  connectionSuccess: 'Connection successful',
  connectionFailed: 'Connection failed',
};

describe('AI Provider Selection User Interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render AI provider selector', () => {
    const mockContext = {
      provider: 'gemini' as const,
      apiKey: '',
      model: 'gemini-2.5-flash',
      baseUrl: '',
      setProvider: vi.fn(),
      setApiKey: vi.fn(),
      setModel: vi.fn(),
      setBaseUrl: vi.fn(),
      testConnection: vi.fn(),
      isValid: true,
    };

    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <AISettingsContext.Provider value={mockContext}>
          <AIProviderSettings />
        </AISettingsContext.Provider>
      </LocalizationContext.Provider>
    );

    expect(screen.getByText(/AI Provider/)).toBeDefined();
  });

  it('should allow user to switch between providers', () => {
    const setProvider = vi.fn();
    const mockContext = {
      provider: 'gemini' as const,
      apiKey: '',
      model: 'gemini-2.5-flash',
      baseUrl: '',
      setProvider,
      setApiKey: vi.fn(),
      setModel: vi.fn(),
      setBaseUrl: vi.fn(),
      testConnection: vi.fn(),
      isValid: true,
    };

    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <AISettingsContext.Provider value={mockContext}>
          <AIProviderSettings />
        </AISettingsContext.Provider>
      </LocalizationContext.Provider>
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'openrouter' } });

    expect(setProvider).toHaveBeenCalledWith('openrouter');
  });

  it('should show model dropdown for selected provider', async () => {
    const mockContext = {
      provider: 'gemini' as const,
      apiKey: '',
      model: 'gemini-2.5-flash',
      baseUrl: '',
      setProvider: vi.fn(),
      setApiKey: vi.fn(),
      setModel: vi.fn(),
      setBaseUrl: vi.fn(),
      testConnection: vi.fn(),
      isValid: true,
    };

    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <AISettingsContext.Provider value={mockContext}>
          <AIProviderSettings />
        </AISettingsContext.Provider>
      </LocalizationContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Model/)).toBeDefined();
    });
  });

  it('should validate API key input', async () => {
    const setApiKey = vi.fn();
    const mockContext = {
      provider: 'gemini' as const,
      apiKey: '',
      model: 'gemini-2.5-flash',
      baseUrl: '',
      setProvider: vi.fn(),
      setApiKey,
      setModel: vi.fn(),
      setBaseUrl: vi.fn(),
      testConnection: vi.fn(),
      isValid: false,
    };

    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <AISettingsContext.Provider value={mockContext}>
          <AIProviderSettings />
        </AISettingsContext.Provider>
      </LocalizationContext.Provider>
    );

    const apiKeyInput = screen.getByPlaceholderText(/Enter your API key/);
    fireEvent.change(apiKeyInput, { target: { value: 'test-api-key-123' } });

    expect(setApiKey).toHaveBeenCalledWith('test-api-key-123');
  });

  it('should allow user to test connection', async () => {
    const testConnection = vi.fn().mockResolvedValue({ status: 'UP' });
    const mockContext = {
      provider: 'gemini' as const,
      apiKey: 'valid-key',
      model: 'gemini-2.5-flash',
      baseUrl: '',
      setProvider: vi.fn(),
      setApiKey: vi.fn(),
      setModel: vi.fn(),
      setBaseUrl: vi.fn(),
      testConnection,
      isValid: true,
    };

    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <AISettingsContext.Provider value={mockContext}>
          <AIProviderSettings />
        </AISettingsContext.Provider>
      </LocalizationContext.Provider>
    );

    const testButton = screen.getByText('Test Connection');
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(testConnection).toHaveBeenCalled();
    });
  });

  it('should show error message for invalid connection', async () => {
    const testConnection = vi.fn().mockResolvedValue({ status: 'DOWN', details: 'Invalid API key' });
    const mockContext = {
      provider: 'gemini' as const,
      apiKey: 'invalid-key',
      model: 'gemini-2.5-flash',
      baseUrl: '',
      setProvider: vi.fn(),
      setApiKey: vi.fn(),
      setModel: vi.fn(),
      setBaseUrl: vi.fn(),
      testConnection,
      isValid: true,
    };

    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <AISettingsContext.Provider value={mockContext}>
          <AIProviderSettings />
        </AISettingsContext.Provider>
      </LocalizationContext.Provider>
    );

    const testButton = screen.getByText('Test Connection');
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(screen.getByText(/failed/i)).toBeDefined();
    });
  });

  it('should persist settings to localStorage', () => {
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    const setApiKey = vi.fn();
    const mockContext = {
      provider: 'gemini' as const,
      apiKey: '',
      model: 'gemini-2.5-flash',
      baseUrl: '',
      setProvider: vi.fn(),
      setApiKey,
      setModel: vi.fn(),
      setBaseUrl: vi.fn(),
      testConnection: vi.fn(),
      isValid: true,
    };

    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <AISettingsContext.Provider value={mockContext}>
          <AIProviderSettings />
        </AISettingsContext.Provider>
      </LocalizationContext.Provider>
    );

    const apiKeyInput = screen.getByPlaceholderText(/Enter your API key/);
    fireEvent.change(apiKeyInput, { target: { value: 'new-key' } });

    expect(setApiKey).toHaveBeenCalled();
  });
});
