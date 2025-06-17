
import { useState, useEffect } from 'react';
import { type UiStrings, type ServiceStatusInfo, type TestServiceResult } from '@/types';
import { testIpLocationService } from '@/services/ipLocationService';
import { testWeatherService } from '@/services/weatherService';
import { testElevationService } from '@/services/elevationService';
import { testSoilService } from '@/services/soilService';
import { testGeminiService } from '@/services/geminiService';
// No need to import useLocalizationContext here, as App.tsx will pass uiStrings to ServiceStatusFooter

interface ServiceTestConfig {
  id: string;
  displayNameKey: keyof UiStrings; // This remains as a key
  testFn: () => Promise<TestServiceResult>; 
}

// These displayNameKeys will be resolved to actual strings in ServiceStatusFooter using its uiStrings from context
const SERVICE_TEST_CONFIGS: ServiceTestConfig[] = [
  { id: 'location', displayNameKey: 'serviceLocation', testFn: testIpLocationService },
  { id: 'weather', displayNameKey: 'serviceWeather', testFn: testWeatherService },
  { id: 'elevation', displayNameKey: 'serviceElevation', testFn: testElevationService },
  { id: 'soil', displayNameKey: 'serviceSoil', testFn: testSoilService },
  { id: 'ai', displayNameKey: 'serviceAI', testFn: testGeminiService },
];

export function useServiceStatus() {
  const [serviceStatuses, setServiceStatuses] = useState<ServiceStatusInfo[]>([]);

  useEffect(() => {
    const initialStatuses: ServiceStatusInfo[] = SERVICE_TEST_CONFIGS.map(config => ({
      id: config.id,
      displayNameKey: config.displayNameKey, // Keep as key
      status: 'PENDING',
    }));
    setServiceStatuses(initialStatuses);

    const runTests = async () => {
      const results = await Promise.all(
        SERVICE_TEST_CONFIGS.map(async (config) => {
          const result = await config.testFn();
          return {
            id: config.id,
            displayNameKey: config.displayNameKey, // Keep as key
            status: result.status, 
            details: result.details,
          };
        })
      );
      setServiceStatuses(results);
    };
    runTests();
  }, []); 

  return { serviceStatuses };
}
