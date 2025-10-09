import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '@/App';

global.fetch = vi.fn();

describe('End-to-End: Service Status Monitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display all service statuses on app load', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/gemini-proxy/status')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'UP', provider: 'gemini' }),
        });
      }

      if (url.includes('/api/ip-location')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            latitude: 40.7128,
            longitude: -74.0060,
          }),
        });
      }

      if (url.includes('/api/weather')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ temperature: 20 }),
        });
      }

      if (url.includes('/api/soil')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: { soilPH: '6.5' } }),
        });
      }

      if (url.includes('/api/elevation')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ elevation: 100 }),
        });
      }

      return Promise.reject(new Error('Unknown URL'));
    });

    render(<App />);

    // Wait for service status indicators
    await waitFor(() => {
      // Check for service status section or indicators
      const statusElements = screen.getAllByText(/UP|✓|operational/i);
      expect(statusElements.length).toBeGreaterThan(0);
    }, { timeout: 10000 });
  });

  it('should show degraded state when services are down', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/soil')) {
        return Promise.resolve({
          ok: false,
          status: 500,
        });
      }

      if (url.includes('/api/ip-location')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            latitude: 40.7128,
            longitude: -74.0060,
          }),
        });
      }

      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<App />);

    await waitFor(() => {
      // Should show error or degraded indicator
      expect(screen.getByText(/error|failed|down/i)).toBeDefined();
    }, { timeout: 10000 });
  });

  it('should update status indicators when services recover', async () => {
    let serviceUp = false;

    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/soil')) {
        if (!serviceUp) {
          serviceUp = true;
          return Promise.reject(new Error('Service down'));
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: { soilPH: '6.5' } }),
        });
      }

      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<App />);

    // Initially should show error
    await waitFor(() => {
      expect(screen.getByText(/error|down/i)).toBeDefined();
    }, { timeout: 5000 });

    // After retry, should show success
    await waitFor(() => {
      expect(screen.getByText(/6.5/)).toBeDefined();
    }, { timeout: 10000 });
  });
});
