import type { NextApiRequest, NextApiResponse } from 'next';

// --- Service Configuration ---

// An array of service configurations. The handler will try them in order.
const ipLocationServices = [
  {
    name: 'ipapi.co',
    url: 'https://ipapi.co/json/',
    transform: (data: any) => {
      if (data.error) throw new Error(data.reason || 'ipapi.co returned an error');
      if (!data.latitude || !data.longitude) return null;
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city,
        country: data.country_name,
        countryCode: data.country_code,
      };
    },
  },
  {
    name: 'ip-api.com',
    url: 'https://ip-api.com/json/?fields=status,message,country,countryCode,regionName,city,lat,lon,timezone,query',
    transform: (data: any) => {
      if (data.status === 'fail') throw new Error(data.message || 'ip-api.com returned status: fail');
      if (data.status !== 'success' || !data.lat || !data.lon) return null;
      return {
        latitude: data.lat,
        longitude: data.lon,
        city: data.city,
        country: data.country,
        countryCode: data.countryCode,
      };
    },
  },
  {
    name: 'freegeoip.app',
    url: 'https://freegeoip.app/json/',
    transform: (data: any) => {
      if (!data.latitude || !data.longitude) return null;
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city,
        country: data.country_name,
        countryCode: data.country_code,
      };
    },
  },
  {
    name: 'ipinfo.io',
    url: 'https://ipinfo.io/json',
    transform: (data: any) => {
        if (!data.loc) return null;
        const [lat, lon] = data.loc.split(',');
        return {
            latitude: parseFloat(lat),
            longitude: parseFloat(lon),
            city: data.city,
            country: data.country,
            countryCode: data.country, // ipinfo.io free tier doesn't provide a separate code
        };
    }
  }
];


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(/, /)[0] : req.socket.remoteAddress;
  console.log(`// DEBUG_LOG: Determined IP address for location lookup: ${ip}`);

  const errors: Record<string, string> = {};

  for (const service of ipLocationServices) {
    try {
      console.log(`// DEBUG_LOG: Attempting IP location lookup with ${service.name}`);
      const response = await fetch(service.url, {
        headers: { 'User-Agent': 'Fedai-App/1.0' },
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      const location = service.transform(data);

      if (location) {
        console.log(`// DEBUG_LOG: Successfully found location with ${service.name}`);
        res.status(200).json({ ...location, serviceName: service.name });
        return;
      }
      // If transform returns null, it's a "soft" failure (e.g., no location data).
      // We'll log it and try the next service.
      console.warn(`// DEBUG_LOG: ${service.name} did not return a valid location object.`);
      errors[service.name] = `${service.name} did not return a valid location object.`;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`// DEBUG_LOG: Error with ${service.name}: ${errorMessage}`);
      errors[service.name] = errorMessage;
    }
  }

  // If the loop completes without returning, all services have failed.
  console.error('// DEBUG_LOG: All IP location services failed.');
  res.status(503).json({
    error: 'All IP location services failed to determine location.',
    details: errors,
  });
}
