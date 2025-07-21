import { TestServiceResult } from '@/types';
import { SoilGridsClient } from 'soilgrids-client';

const client = new SoilGridsClient();

export const fetchSoilData = async (lat: number, lon: number) => {
  const { data, error } = await client.getSoilProperties({
    lat,
    lon,
    properties: ["bdod", "cec", "cfvo", "clay", "nitrogen", "ocd", "ocs", "phh2o", "sand", "silt", "soc"],
    depths: ["0-5cm", "5-15cm"],
    values: ["mean", "Q0.5", "Q0.05", "Q0.95", "uncertainty"]
  });

  if (error) {
    console.error("Failed to fetch soil data:", error);
    throw new Error('Failed to fetch soil data.');
  }
  return data?.properties.layers;
};

export const testSoilService = async (): Promise<TestServiceResult> => {
  try {
    const { data, error } = await client.getSoilProperties({
        lat: 52.52,
        lon: 13.41,
        properties: ["bdod"],
        depths: ["0-5cm"]
    });

    if (error) {
      return { status: 'DEGRADED', details: 'Test query failed' };
    }

    if (data) {
      return { status: 'OPERATIONAL', details: 'Service is operational' };
    }

    return { status: 'DEGRADED', details: 'Test query returned no data' };
  } catch (error) {
    return { status: 'DOWN', details: 'Service is unreachable' };
  }
};
