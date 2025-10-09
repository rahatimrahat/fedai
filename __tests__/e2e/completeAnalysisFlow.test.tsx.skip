import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '@/App';

// Mock all external API calls
global.fetch = vi.fn();

describe('End-to-End: Complete Analysis Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock localStorage
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
  });

  it('should complete full user flow from location to analysis', async () => {
    // Mock location API
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

      if (url.includes('/api/weather')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            temperature: 20,
            humidity: 65,
            windSpeed: 5,
            weatherCode: 0,
          }),
        });
      }

      if (url.includes('/api/soil')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: {
              soilPH: '6.5',
              soilOrganicCarbon: '2.5',
            },
          }),
        });
      }

      if (url.includes('/api/elevation')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            elevation: 100,
          }),
        });
      }

      return Promise.reject(new Error('Unknown URL'));
    });

    render(<App />);

    // Wait for location to load
    await waitFor(() => {
      expect(screen.getByText(/New York/)).toBeDefined();
    }, { timeout: 5000 });

    // Wait for environmental data to load
    await waitFor(() => {
      expect(screen.getByText(/6.5/)).toBeDefined();
    }, { timeout: 5000 });

    // Upload an image
    const file = new File(['plant'], 'plant.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });
      fireEvent.change(input);
    }

    // Click analyze button
    await waitFor(() => {
      const analyzeButton = screen.getByText(/Analyze/i);
      expect(analyzeButton).toHaveProperty('disabled', false);
      fireEvent.click(analyzeButton);
    });

    // Verify analysis started
    await waitFor(() => {
      expect(screen.getByText(/Analyzing/i)).toBeDefined();
    });
  });

  it('should handle location permission denied gracefully', async () => {
    // Mock geolocation API
    const geolocationMock = {
      getCurrentPosition: vi.fn((success, error) => {
        error({ code: 1, message: 'User denied geolocation' });
      }),
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    };

    Object.defineProperty(global.navigator, 'geolocation', {
      value: geolocationMock,
      writable: true,
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Location Access Blocked/i)).toBeDefined();
    });

    // User should see fallback option
    expect(screen.getByText(/IP-Based Location/i)).toBeDefined();
  });

  it('should allow user to retry failed operations', async () => {
    let callCount = 0;

    (global.fetch as any).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          latitude: 40.7128,
          longitude: -74.0060,
          city: 'New York',
          country: 'USA',
        }),
      });
    });

    render(<App />);

    // Wait for error
    await waitFor(() => {
      expect(screen.getByText(/Try Again/i) || screen.getByText(/Retry/i)).toBeDefined();
    });

    // Click retry
    const retryButton = screen.getByText(/Try Again/i) || screen.getByText(/Retry/i);
    fireEvent.click(retryButton);

    // Wait for success
    await waitFor(() => {
      expect(screen.getByText(/New York/i)).toBeDefined();
    }, { timeout: 5000 });
  });
});
