import { describe, it, expect, beforeEach, vi } from 'vitest';
import { testSoilService } from '@/services/soilApi';

global.fetch = vi.fn();

describe('Soil Service Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully test soil service with valid data', async () => {
    const mockResponse = {
      data: {
        soilPH: '6.5',
        soilOrganicCarbon: '2.5',
        soilSand: '40',
        soilSilt: '30',
        soilClay: '30'
      },
      source: 'SoilGrids'
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await testSoilService();

    expect(result.status).toBe('UP');
    expect(result.details).toContain('operational');
  });

  it('should handle soil data unavailable for location', async () => {
    const mockResponse = {
      error: 'Soil data is not available for this specific location.',
      errorCode: 'SOIL_DATA_NOT_AT_LOCATION',
      source: 'SoilGrids'
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await testSoilService();

    // Service is UP even if specific location doesn't have data
    expect(result.status).toBe('UP');
  });

  it('should handle soil service backend errors', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' }),
    });

    const result = await testSoilService();

    expect(result.status).toBe('DOWN');
  });

  it('should handle CORS errors from proxy', async () => {
    (global.fetch as any).mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const result = await testSoilService();

    expect(result.status).toBe('DOWN');
    expect(result.details).toBeDefined();
  });
});
