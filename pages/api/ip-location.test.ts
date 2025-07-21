import { testIpLocationService } from '../../services/ipLocationService';

describe('testIpLocationService', () => {
  it('should return an operational status when the service is available', async () => {
    const result = await testIpLocationService();
    expect(result.status).toBe('OPERATIONAL');
  });
});
