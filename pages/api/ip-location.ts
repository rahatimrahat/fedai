import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const ipRes = await fetch('https://ipapi.co/json/');
    const data = await ipRes.json();
    res.status(200).json({
      latitude: data.latitude,
      longitude: data.longitude,
      city: data.city,
      country: data.country_name,
      countryCode: data.country_code,
      serviceName: 'ipapi.co'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch IP location' });
  }
}
