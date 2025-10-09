import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '@/App';

global.fetch = vi.fn();

describe('End-to-End: Multi-Language Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should switch UI language and maintain functionality', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/ip-location')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            latitude: 40.7128,
            longitude: -74.0060,
            city: 'New York',
            country: 'USA',
          }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<App />);

    // Find language switcher
    await waitFor(() => {
      const languageSelect = screen.getByRole('combobox');
      expect(languageSelect).toBeDefined();
    });

    // Switch to Turkish
    const languageSelect = screen.getByRole('combobox');
    fireEvent.change(languageSelect, { target: { value: 'tr' } });

    // Verify UI updated to Turkish
    await waitFor(() => {
      // Look for Turkish text in the UI
      expect(screen.getByText(/Konum/i) || screen.getByText(/Dil/i)).toBeDefined();
    });
  });

  it('should persist language preference across sessions', () => {
    const localStorageMock = {
      getItem: vi.fn(() => 'tr'),
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

    render(<App />);

    // App should load with Turkish
    expect(localStorageMock.getItem).toHaveBeenCalledWith('fedai_language');
  });

  it('should send analysis requests in selected language', async () => {
    const analysisMock = vi.fn();

    (global.fetch as any).mockImplementation((url: string, options: any) => {
      if (url.includes('/api/gemini-proxy/analyze')) {
        analysisMock(JSON.parse(options.body));
        return Promise.resolve({
          ok: true,
          json: async () => ({
            diseaseName: 'Powdery Mildew',
            description: 'Fungal disease',
            severity: 'moderate',
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<App />);

    // Switch to Turkish
    const languageSelect = screen.getByRole('combobox');
    fireEvent.change(languageSelect, { target: { value: 'tr' } });

    // Upload and analyze
    const file = new File(['plant'], 'plant.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });
      fireEvent.change(input);
    }

    await waitFor(() => {
      const analyzeButton = screen.getByText(/Analiz/i);
      fireEvent.click(analyzeButton);
    });

    // Verify request included Turkish language
    await waitFor(() => {
      expect(analysisMock).toHaveBeenCalled();
      const requestBody = analysisMock.mock.calls[0][0];
      expect(requestBody.language).toBe('tr');
    });
  });
});
