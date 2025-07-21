import { vi } from 'vitest';
import { testIpLocationService } from '../../services/ipLocationService';

describe('testIpLocationService', () => {
  it('should return an UP status when the service is available', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ latitude: 1, longitude: 2 }),
    })));

    const result = await testIpLocationService();
    expect(result.status).toBe('UP');

    vi.restoreAllMocks();
  });
});
