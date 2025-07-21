import { TestServiceResult } from '@/types';
import { SoilClient } from 'openepi-client';

const client = new SoilClient();

export const fetchSoilData = async (lat: number, lon: number) => {
  try {
    const { data, error } = await client.getSoilProperty({
      lat,
      lon,
      properties: [
        "bdod", "cec", "cfvo", "clay", "nitrogen", "ocd", "ocs", "phh2o", "sand", "silt", "soc"
      ],
      depths: ["0-5cm", "5-15cm"],
      values: ["mean", "Q0.5", "Q0.05", "Q0.95", "uncertainty"]
    });

    if (error || !data) {
      throw new Error('Failed to fetch soil data using openepi-client.');
    }

    return data.properties.layers;
  } catch (error) {
    console.error("Failed to fetch soil data:", error);
    throw new Error('Failed to fetch soil data.');
  }
};

export const testSoilService = async (): Promise<TestServiceResult> => {
  try {
    const { data, error } = await client.getSoilProperty({
      lat: 52.52,
      lon: 13.41,
      properties: ["bdod"],
      depths: ["0-5cm"],
      values: ["mean"]
    });

    if (error) {
      return { status: 'DEGRADED', details: 'Test query failed' };
    }

    if (data) {
      return { status: 'OPERATIONAL', details: 'Service is operational' };
    }

    return { status: 'DEGRADED', details: 'No data returned from service' };
  } catch (error) {
    return { status: 'DOWN', details: 'Service is unreachable' };
  }
};
