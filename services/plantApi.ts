import { PlantData } from '../types/api';
import { handleApiError, logError } from '@/utils/errorHandler';

const PROXY_PLANT_ENDPOINT_PREFIX = '/api/plant';

export const fetchPlantData = async (plantId: string): Promise<PlantData> => {
  try {
    const url = `${PROXY_PLANT_ENDPOINT_PREFIX}/${plantId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch plant data.');
    }
    return response.json();
  } catch (error) {
    const fedaiError = handleApiError(error, 'Failed to fetch plant data.');
    logError(fedaiError, 'PlantDataFetch');
    throw fedaiError;
  }
};
