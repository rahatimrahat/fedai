import type { NextApiRequest, NextApiResponse } from 'next';

// URLs obtained from fedai-backend-proxy/src/api/utils/constants.js
const IPAPI_CO_URL = 'https://ipapi.co/json/';
// For ip-api.com, the provided URL includes specific fields. We'll use this.
// Note: The original constant file has 'https://ip-api.com...', ensure to use https.
const IP_API_COM_URL = 'https://ip-api.com/json/?fields=status,message,country,countryCode,regionName,city,lat,lon,timezone,query';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Extract user's IP address
  // When deployed behind a reverse proxy (like Vercel), x-forwarded-for is the relevant header.
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(/, /)[0] : req.socket.remoteAddress;

  // Log the determined IP for debugging (optional, consider removing in production if sensitive)
  // console.log(`Determined IP address: ${ip}`);

  // --- Primary Service Call (ipapi.co) ---
  try {
    // ipapi.co uses the caller's IP address if no IP is specified in the path.
    // For a Next.js API route, this will be the user's IP or a close proxy.
    // If we needed to specify an IP: const primaryUrl = `https://ipapi.co/${ip}/json/`;
    const primaryUrl = IPAPI_CO_URL;

    const primaryRes = await fetch(primaryUrl, {
      headers: { 'User-Agent': 'Fedai-App/1.0' } // Good practice to set a User-Agent
    });

    if (!primaryRes.ok) {
      // console.warn(`ipapi.co failed with status: ${primaryRes.status}`);
      throw new Error(`ipapi.co request failed with status ${primaryRes.status}`);
    }

    const data = await primaryRes.json();

    if (data.error) {
      // console.warn(`ipapi.co returned error: ${data.reason}`);
      throw new Error(data.reason || 'ipapi.co returned an error');
    }

    if (data.latitude && data.longitude) {
      res.status(200).json({
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city,
        country: data.country_name, // Corrected field name
        countryCode: data.country_code, // Corrected field name
        serviceName: 'ipapi.co',
        // queryIp: data.ip // ipapi.co also returns the IP it used in the 'ip' field
      });
      return;
    }
    // If no latitude/longitude, treat as failure and fall through to secondary
    // console.warn('ipapi.co did not return latitude/longitude.');
    throw new Error('ipapi.co did not return latitude/longitude');

  } catch (error) {
    // console.warn(`Error with ipapi.co: ${error instanceof Error ? error.message : String(error)}. Falling back to ip-api.com.`);

    // --- Fallback Service Call (ip-api.com) ---
    try {
      // ip-api.com also uses the caller's IP if no IP is specified,
      // or it can take an IP in the path like: `https://ip-api.com/json/${ip}?fields=...`
      // The URL from constants already includes fields, so we use it directly.
      // If we wanted to explicitly pass the IP: const secondaryUrl = `https://ip-api.com/json/${ip}?fields=status,message,country,countryCode,regionName,city,lat,lon,timezone,query`;
      const secondaryUrl = IP_API_COM_URL;

      const fallbackRes = await fetch(secondaryUrl, {
        headers: { 'User-Agent': 'Fedai-App/1.0' }
      });

      if (!fallbackRes.ok) {
        // console.warn(`ip-api.com failed with status: ${fallbackRes.status}`);
        throw new Error(`ip-api.com request failed with status ${fallbackRes.status}`);
      }

      const dataFallback = await fallbackRes.json();

      if (dataFallback.status === 'fail') {
        // console.warn(`ip-api.com returned error: ${dataFallback.message}`);
        throw new Error(dataFallback.message || 'ip-api.com returned status: fail');
      }

      if (dataFallback.status === 'success' && dataFallback.lat && dataFallback.lon) {
        res.status(200).json({
          latitude: dataFallback.lat,
          longitude: dataFallback.lon,
          city: dataFallback.city,
          country: dataFallback.country,
          countryCode: dataFallback.countryCode,
          serviceName: 'ip-api.com',
          // queryIp: dataFallback.query // ip-api.com returns the IP it used in 'query' field
        });
        return;
      }
      // console.warn('ip-api.com did not return success or latitude/longitude.');
      throw new Error('ip-api.com did not return success or valid location data.');

    } catch (fallbackError) {
      // console.error(`All IP location services failed. Primary error: ${error instanceof Error ? error.message : String(error)}, Fallback error: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
      res.status(503).json({
        error: 'All IP location services failed.',
        primaryError: error instanceof Error ? error.message : String(error),
        fallbackError: fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
      });
    }
  }
}
