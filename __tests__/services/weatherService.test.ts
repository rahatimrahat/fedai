import { describe, it, expect, beforeEach, vi } from 'vitest';
import { testWeatherService } from '@/services/weatherService';

// Mock fetch globally
global.fetch = vi.fn();

describe('Weather Service Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully test weather service with valid response', async () => {
    const mockResponse = {
      current: {
        temperature_2m: 20,
        relative_humidity_2m: 65,
        wind_speed_10m: 5,
        weather_code: 0
      }
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await testWeatherService();

    expect(result.status).toBe('UP');
  });

  it('should handle weather service HTTP errors', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const result = await testWeatherService();

    expect(result.status).toBe('DOWN');
    expect(result.details).toContain('HTTP error');
  });

  it('should handle weather service network errors', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const result = await testWeatherService();

    expect(result.status).toBe('DOWN');
    expect(result.details).toBeDefined();
  });

  it('should handle weather service timeout', async () => {
    (global.fetch as any).mockImplementationOnce(() =>
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
    );

    const result = await testWeatherService();

    expect(result.status).toBe('DOWN');
  }, 10000);
});
