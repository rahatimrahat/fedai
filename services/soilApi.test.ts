import { testSoilService } from './soilApi';

describe('testSoilService', () => {
  it('should return an operational status when the service is available', async () => {
    const result = await testSoilService();
    expect(result.status).toBe('OPERATIONAL');
  });
});
