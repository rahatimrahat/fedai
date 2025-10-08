// fedai-backend-proxy/src/api/controllers/data.controller.cached.js
// Enhanced version with caching support

const robustFetch = require('../utils/robustFetch');
const {
  weatherCache,
  soilCache,
  elevationCache,
  generateLocationKey,
  getCachedOrFetch
} = require('../utils/cache');

const {
  IPAPI_CO_URL,
  IP_API_COM_URL,
  OPEN_METEO_API_BASE,
  OPEN_METEO_ARCHIVE_API_BASE,
  OPEN_ELEVATION_API_URL_PREFIX,
  OPEN_TOPO_DATA_API_URL_PREFIX,
  SOILGRIDS_API_URL_PREFIX,
  OPEN_PLANTBOOK_API_URL_PREFIX,
  GEOLOCATION_API_TIMEOUT_MS,
} = require('../utils/constants');

// Import helper function from original controller
function calculateAveragesFromDaily(dailyData) {
    if (!dailyData || (!dailyData.temperature_2m_mean && !dailyData.precipitation_sum && !dailyData.growing_degree_days) ||
        (dailyData.temperature_2m_mean?.length === 0 && dailyData.precipitation_sum?.length === 0 && (dailyData.growing_degree_days === undefined || dailyData.growing_degree_days?.length === 0)) ) {
        return { mean_temp: null, total_precip: null, gdd_sum: null };
    }
    const validTemps = dailyData.temperature_2m_mean?.filter(t => t !== null && t !== undefined) || [];
    const validPrecips = dailyData.precipitation_sum?.filter(p => p !== null && p !== undefined) || [];
    const validGDDs = dailyData.growing_degree_days?.filter(gdd => gdd !== null && gdd !== undefined) || [];
    const mean_temp = validTemps.length > 0 ? validTemps.reduce((a, b) => a + b, 0) / validTemps.length : null;
    const total_precip = validPrecips.length > 0 ? validPrecips.reduce((a, b) => a + b, 0) : null;
    const gdd_sum = validGDDs.length > 0 ? validGDDs.reduce((a, b) => a + b, 0) : null;
    return {
        mean_temp: mean_temp !== null ? parseFloat(mean_temp.toFixed(1)) : null,
        total_precip: total_precip !== null ? parseFloat(total_precip.toFixed(1)) : null,
        gdd_sum: gdd_sum !== null ? parseFloat(gdd_sum.toFixed(1)) : null,
    };
}

// --- Weather Data Controller (with caching) ---
const getWeatherData = async (req, res) => {
  const { latitude, longitude } = req.body;

  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Latitude and longitude are required.' });
  }

  // Generate cache key based on rounded coordinates
  const cacheKey = generateLocationKey(latitude, longitude);

  try {
    // Try to get from cache or fetch
    const weatherData = await getCachedOrFetch(weatherCache, cacheKey, async () => {
      // This function only executes on cache miss
      return await fetchWeatherDataInternal(latitude, longitude);
    });

    res.json(weatherData);
  } catch (error) {
    console.error("Error in getWeatherData:", error);
    res.status(500).json({ error: 'Failed to fetch weather data.', details: error.message });
  }
};

// Internal weather fetch function (extracted for caching)
async function fetchWeatherDataInternal(latitude, longitude) {
  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const todayDate = new Date();
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(todayDate.getDate() - 1);
  const firstDayOfMonthDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);

  const today = formatDate(todayDate);
  const yesterday = formatDate(yesterdayDate);
  const firstDayOfMonth = formatDate(firstDayOfMonthDate);

  // 1. Fetch Current Weather
  const currentParams = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current: 'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,et0_fao_evapotranspiration',
    timezone: 'auto', temperature_unit: 'celsius', wind_speed_unit: 'kmh', precipitation_unit: 'mm',
  });
  const currentDataPromise = robustFetch(`${OPEN_METEO_API_BASE}/forecast?${currentParams.toString()}`);

  // 2. Fetch Recent Daily Weather
  let recentDailyPromise = Promise.resolve(null);
  if (firstDayOfMonthDate <= yesterdayDate) {
    const recentParams = new URLSearchParams({
      latitude: latitude.toString(), longitude: longitude.toString(),
      start_date: firstDayOfMonth, end_date: yesterday,
      daily: 'temperature_2m_mean,precipitation_sum,time,growing_degree_days',
      timezone: 'auto', temperature_unit: 'celsius', precipitation_unit: 'mm',
    });
    recentDailyPromise = robustFetch(`${OPEN_METEO_ARCHIVE_API_BASE}?${recentParams.toString()}`);
  }

  // 3. Fetch Historical Monthly Averages
  const historicalDataPromises = [];
  const currentMonth = todayDate.getMonth();
  const currentYear = todayDate.getFullYear();
  for (let i = 0; i < 5; i++) {
    const year = currentYear - (i + 1);
    const monthStr = (currentMonth + 1).toString().padStart(2, '0');
    const startDateHistorical = `${year}-${monthStr}-01`;
    const endDateHistorical = formatDate(new Date(year, currentMonth + 1, 0));

    const historicalParams = new URLSearchParams({
      latitude: latitude.toString(), longitude: longitude.toString(),
      start_date: startDateHistorical, end_date: endDateHistorical,
      daily: 'temperature_2m_mean,precipitation_sum,growing_degree_days',
      timezone: 'auto', temperature_unit: 'celsius', precipitation_unit: 'mm',
    });
    historicalDataPromises.push(robustFetch(`${OPEN_METEO_ARCHIVE_API_BASE}?${historicalParams.toString()}`));
  }

  const [currentDataResult, recentDailyResult, ...historicalResultsSettled] = await Promise.allSettled([
      currentDataPromise,
      recentDailyPromise,
      ...historicalDataPromises
  ]);

  let recentMonthlyAverage = null;
  const recentDailyRawData = recentDailyResult.status === 'fulfilled' ? recentDailyResult.value?.daily : null;
  if (recentDailyRawData) {
      recentMonthlyAverage = calculateAveragesFromDaily(recentDailyRawData);
  }

  let overallHistoricalAverage = { mean_temp: null, total_precip: null, gdd_sum: null };
  const historicalDailyAverages = historicalResultsSettled
      .filter(r => r.status === 'fulfilled' && r.value?.daily)
      .map(r => calculateAveragesFromDaily(r.value.daily));

  if (historicalDailyAverages.length > 0) {
      const validHistTemps = historicalDailyAverages.map(h => h.mean_temp).filter(t => t !== null);
      const validHistPrecips = historicalDailyAverages.map(h => h.total_precip).filter(p => p !== null);
      const validHistGDDs = historicalDailyAverages.map(h => h.gdd_sum).filter(gdd => gdd !== null);

      if (validHistTemps.length > 0) overallHistoricalAverage.mean_temp = parseFloat((validHistTemps.reduce((s, v) => s + v, 0) / validHistTemps.length).toFixed(1));
      if (validHistPrecips.length > 0) overallHistoricalAverage.total_precip = parseFloat((validHistPrecips.reduce((s, v) => s + v, 0) / validHistPrecips.length).toFixed(1));
      if (validHistGDDs.length > 0) overallHistoricalAverage.gdd_sum = parseFloat((validHistGDDs.reduce((s, v) => s + v, 0) / validHistGDDs.length).toFixed(1));
  }

  return {
    current: currentDataResult.status === 'fulfilled' ? currentDataResult.value.current : null,
    recentDailyRawData: recentDailyRawData,
    recentMonthlyAverage: recentMonthlyAverage,
    historicalMonthlyAverage: overallHistoricalAverage.mean_temp !== null || overallHistoricalAverage.total_precip !== null ? overallHistoricalAverage : null,
    weatherDataTimestamp: new Date().toISOString()
  };
}

// --- Soil Data Controller (with caching) ---
const getSoilData = async (req, res) => {
  const { latitude, longitude } = req.body;

  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Latitude and longitude are required.' });
  }

  const cacheKey = generateLocationKey(latitude, longitude);

  try {
    const soilData = await getCachedOrFetch(soilCache, cacheKey, async () => {
      return await fetchSoilDataInternal(latitude, longitude);
    });

    res.json(soilData);
  } catch (error) {
    console.error("Error in getSoilData:", error);
    res.status(500).json({ error: 'Failed to fetch soil data.', details: error.message });
  }
};

async function fetchSoilDataInternal(latitude, longitude) {
  const params = new URLSearchParams({
    lon: longitude.toString(),
    lat: latitude.toString(),
    depth: '0-5cm',
    property: 'phh2o,soc,cec,nitrogen,sand,silt,clay,bdod',
    value: 'mean'
  });

  const soilApiResponse = await robustFetch(`${SOILGRIDS_API_URL_PREFIX}?${params.toString()}`);

  if (soilApiResponse && soilApiResponse.properties && soilApiResponse.properties.layers) {
    const layers = soilApiResponse.properties.layers;
    const data = {};

    const propertyMap = {
      phh2o: 'soilPH',
      soc: 'soilOrganicCarbon',
      cec: 'soilCEC',
      nitrogen: 'soilNitrogen',
      sand: 'soilSand',
      silt: 'soilSilt',
      clay: 'soilClay',
      bdod: 'soilBulkDensity'
    };

    layers.forEach(layer => {
      const name = layer.name;
      const meanValue = layer.depths?.[0]?.values?.mean;
      const convertedValue = layer.unit_measure?.mapped_units
        ? meanValue / parseFloat(layer.unit_measure.d_factor)
        : meanValue;

      if (propertyMap[name] && convertedValue !== undefined && convertedValue !== null) {
        data[propertyMap[name]] = parseFloat(convertedValue.toFixed(2));
      }
    });

    return {
      data,
      source: 'SoilGrids250m',
      timestamp: new Date().toISOString()
    };
  }

  throw new Error('Invalid soil data response from SoilGrids API');
}

// --- Elevation Data Controller (with caching) ---
const getElevation = async (req, res) => {
  const { latitude, longitude } = req.body;

  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Latitude and longitude are required.' });
  }

  const cacheKey = generateLocationKey(latitude, longitude);

  try {
    const elevationData = await getCachedOrFetch(elevationCache, cacheKey, async () => {
      return await fetchElevationInternal(latitude, longitude);
    });

    res.json(elevationData);
  } catch (error) {
    console.error("Error in getElevation:", error);
    res.status(500).json({ error: 'Failed to fetch elevation data.', details: error.message });
  }
};

async function fetchElevationInternal(latitude, longitude) {
  const errors = {};

  // Try primary service: Open-Elevation
  try {
    const primaryUrl = `${OPEN_ELEVATION_API_URL_PREFIX}?locations=${latitude},${longitude}`;
    const primaryData = await robustFetch(primaryUrl, {}, 10000);

    if (primaryData && primaryData.results && primaryData.results[0]?.elevation !== undefined) {
      return {
        elevation: primaryData.results[0].elevation,
        serviceName: 'Open-Elevation',
        timestamp: new Date().toISOString()
      };
    }
  } catch (err) {
    errors['open-elevation'] = err.message;
  }

  // Try fallback service: Open-Topo-Data
  try {
    const fallbackUrl = `${OPEN_TOPO_DATA_API_URL_PREFIX}?locations=${latitude},${longitude}`;
    const fallbackData = await robustFetch(fallbackUrl, {}, 10000);

    if (fallbackData && fallbackData.results && fallbackData.results[0]?.elevation !== undefined) {
      return {
        elevation: fallbackData.results[0].elevation,
        serviceName: 'Open-Topo-Data',
        timestamp: new Date().toISOString()
      };
    }
  } catch (err) {
    errors['open-topo-data'] = err.message;
  }

  throw new Error(`All elevation services failed: ${JSON.stringify(errors)}`);
}

// --- IP Location Controller (no caching - varies per request) ---
const getIpLocation = async (req, res) => {
  const errors = {};

  try {
    const primaryData = await robustFetch(IPAPI_CO_URL, {}, GEOLOCATION_API_TIMEOUT_MS);
    if (primaryData && !primaryData.error && primaryData.latitude && primaryData.longitude) {
      return res.json({
        latitude: primaryData.latitude,
        longitude: primaryData.longitude,
        city: primaryData.city || 'Unknown',
        country: primaryData.country_name || 'Unknown',
        countryCode: primaryData.country_code,
        serviceName: 'ipapi.co'
      });
    }
    if (primaryData && primaryData.error) {
      errors.ipapi = primaryData.reason || 'ipapi.co returned an error';
    }
  } catch (err) {
    errors.ipapi = err.message;
  }

  try {
    const fallbackData = await robustFetch(IP_API_COM_URL, {}, GEOLOCATION_API_TIMEOUT_MS);
    if (fallbackData && fallbackData.status === 'success') {
      return res.json({
        latitude: fallbackData.lat,
        longitude: fallbackData.lon,
        city: fallbackData.city,
        country: fallbackData.country,
        countryCode: fallbackData.countryCode,
        serviceName: 'ip-api.com'
      });
    }
    if (fallbackData && fallbackData.status === 'fail') {
      errors['ip-api'] = fallbackData.message || 'ip-api.com returned status: fail';
    }
  } catch (err) {
    errors['ip-api'] = err.message;
  }

  res.status(502).json({ error: 'Both IP location services failed.', details: errors });
};

// --- Plant Data Controller (no caching for now, could add later) ---
const getPlantData = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Plant ID is required.' });
  }

  if (!process.env.OPEN_PLANTBOOK_API_KEY) {
    return res.status(503).json({ error: 'OpenPlantBook API key not configured.' });
  }

  try {
    const plantData = await robustFetch(
      `${OPEN_PLANTBOOK_API_URL_PREFIX}${id}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPEN_PLANTBOOK_API_KEY}`
        }
      },
      10000
    );

    res.json(plantData);
  } catch (error) {
    console.error("Error in getPlantData:", error);
    res.status(500).json({ error: 'Failed to fetch plant data.', details: error.message });
  }
};

// --- Cache Stats Endpoint (for monitoring) ---
const { getCacheStats } = require('../utils/cache');

const getCacheStatsEndpoint = async (req, res) => {
  const stats = getCacheStats();
  res.json(stats);
};

module.exports = {
  getWeatherData,
  getSoilData,
  getElevation,
  getIpLocation,
  getPlantData,
  getCacheStatsEndpoint
};
