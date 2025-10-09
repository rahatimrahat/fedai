import { testSoilService } from './soilApi';
import { vi } from 'vitest';
import { SoilClient } from 'openepi-client';

console.log('Mocking openepi-client...');
vi.mock('openepi-client', () => {
  console.log('Inside mock factory');
  const SoilClient = vi.fn();
  SoilClient.prototype.getSoilProperty = vi.fn();
  console.log('SoilClient mocked');
  return { SoilClient };
});

describe('testSoilService', () => {
  it('should return an UP status when the service is available', async () => {
    console.log('Running operational status test...');
    const mockClient = new SoilClient();
    (mockClient.getSoilProperty as vi.Mock).mockResolvedValue({ data: {}, error: null });

    const result = await testSoilService();
    console.log('Result from testSoilService:', result);
    expect(result.status).toBe('UP');
  });

  it('should return an ERROR status when the service returns an error', async () => {
    console.log('Running degraded status test...');
    const mockClient = new SoilClient();
    (mockClient.getSoilProperty as vi.Mock).mockResolvedValue({ data: null, error: new Error('Failed to fetch') });

    const result = await testSoilService();
    console.log('Result from testSoilService:', result);
    expect(result.status).toBe('ERROR');
  });

  it('should return a down status when the service throws an error', async () => {
    console.log('Running down status test...');
    const mockClient = new SoilClient();
    (mockClient.getSoilProperty as vi.Mock).mockRejectedValue(new Error('Network error'));

    const result = await testSoilService();
    console.log('Result from testSoilService:', result);
    expect(result.status).toBe('DOWN');
  });
});
