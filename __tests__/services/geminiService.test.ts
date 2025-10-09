import { describe, it, expect, beforeEach, vi } from 'vitest';
import { testGeminiService } from '@/services/geminiService.multi-provider';

global.fetch = vi.fn();

describe('Gemini AI Service Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully test Gemini service status', async () => {
    const mockResponse = {
      status: 'UP',
      provider: 'gemini',
      details: 'Gemini API is accessible',
      models: []
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await testGeminiService();

    expect(result.status).toBe('UP');
    expect(result.details).toContain('operational');
  });

  it('should handle Gemini API key missing', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'API key missing' }),
    });

    const result = await testGeminiService();

    expect(result.status).toBe('DOWN');
    expect(result.details).toContain('401');
  });

  it('should handle Gemini service unavailable', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Service unavailable'));

    const result = await testGeminiService();

    expect(result.status).toBe('DOWN');
  });

  it('should handle rate limiting from Gemini', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({ error: 'Rate limit exceeded' }),
    });

    const result = await testGeminiService();

    expect(result.status).toBe('DOWN');
    expect(result.details).toContain('429');
  });
});
