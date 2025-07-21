import { PlantData } from '../types/api';

const PROXY_PLANT_ENDPOINT_PREFIX = '/api/plant';

export const fetchPlantData = async (plantId: string): Promise<PlantData> => {
  const url = `${PROXY_PLANT_ENDPOINT_PREFIX}/${plantId}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch plant data.');
  }
  return response.json();
};
