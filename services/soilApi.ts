import { SoilClient } from 'openepi-client';

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
