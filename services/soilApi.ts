import { SoilClient } from 'openepi-client';
import { TestServiceResult } from '@/types';

const client = new SoilClient();

export const fetchSoilData = async (lat: number, lon: number) => {
  const { data, error } = await client.getSoilProperty({
    lat: lat,
    lon: lon,
    depths: "0-5cm,5-15cm",
    properties: ["bdod", "phh2o", "soc", "cec", "nitrogen", "sand", "silt", "clay"],
    values: "mean"
  });

  if (error) {
    console.error("Failed to fetch soil data:", error);
    throw new Error('Failed to fetch soil data.');
  }
  return data?.properties;
};

export const testSoilService = async (): Promise<TestServiceResult> => {
  try {
    // Perform a test query to Open-Meteo's soil API
    const { data, error } = await client.getSoilProperty({
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
