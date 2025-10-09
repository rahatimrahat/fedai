import { describe, it, expect, beforeEach, vi } from 'vitest';
import { testIpLocationService } from '@/services/ipLocationService';

global.fetch = vi.fn();

describe('IP Location Service Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully test IP location service', async () => {
    const mockResponse = {
      latitude: 40.7128,
      longitude: -74.0060,
      city: 'New York',
      country: 'US'
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await testIpLocationService();

    expect(result.status).toBe('UP');
    expect(result.details).toContain('operational');
  });

  it('should handle rate limiting gracefully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 429,
    });

    const result = await testIpLocationService();

    expect(result.status).toBe('DOWN');
    expect(result.details).toContain('429');
  });

  it('should validate location data structure', async () => {
    const mockResponse = {
      latitude: 40.7128,
      longitude: -74.0060,
      // Missing city and country
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await testIpLocationService();

    expect(result.status).toBe('UP');
  });
});
