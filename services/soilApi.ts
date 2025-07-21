import { TestServiceResult } from '@/types';

const SOILGRIDS_API_URL = 'https://rest.isric.org/soilgrids/v2.0/properties/query';

export const fetchSoilData = async (lat: number, lon: number) => {
  const properties = ["bdod", "cec", "cfvo", "clay", "nitrogen", "ocd", "ocs", "phh2o", "sand", "silt", "soc"];
  const depths = ["0-5cm", "5-15cm"];
  const values = ["mean", "Q0.5", "Q0.05", "Q0.95", "uncertainty"];

  const url = `${SOILGRIDS_API_URL}?lon=${lon}&lat=${lat}&property=${properties.join(',')}&depth=${depths.join(',')}&value=${values.join(',')}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.properties.layers;
  } catch (error) {
    console.error("Failed to fetch soil data:", error);
    throw new Error('Failed to fetch soil data.');
  }
};

export const testSoilService = async (): Promise<TestServiceResult> => {
  try {
    const url = `${SOILGRIDS_API_URL}?lon=13.41&lat=52.52&property=bdod&depth=0-5cm`;
    const response = await fetch(url);
    if (response.ok) {
      return { status: 'OPERATIONAL', details: 'Service is operational' };
    }
    return { status: 'DEGRADED', details: `Service returned status: ${response.status}` };
  } catch (error) {
    return { status: 'DOWN', details: 'Service is unreachable' };
  }
};
