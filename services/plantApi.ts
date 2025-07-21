import { PlantData } from '../types/api';

export const fetchPlantData = async (plantId: string): Promise<PlantData> => {
  // The API key MUST be stored securely as an environment variable
  const API_KEY = process.env.REACT_APP_OPENPLANTBOOK_API_KEY;
  // IMPORTANT: Note the trailing slash at the end of the URL
  const url = `https://open.plantbook.io/api/v1/plant/detail/${plantId}/`;

  const response = await fetch(url, {
    headers: {
      // Correct Authentication format as per documentation
      'Authorization': `Token ${API_KEY}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch plant data.');
  }
  return response.json();
};
