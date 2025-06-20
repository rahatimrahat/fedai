
// fedai-backend-proxy/src/api/controllers/data.controller.js

const robustFetch = require('../utils/robustFetch');
const {
  IPAPI_CO_URL,
  IP_API_COM_URL,
  OPEN_METEO_API_BASE,
  OPEN_METEO_ARCHIVE_API_BASE,
  OPEN_ELEVATION_API_URL_PREFIX,
  OPEN_TOPO_DATA_API_URL_PREFIX,
  SOILGRIDS_API_URL_PREFIX,
  GEOLOCATION_API_TIMEOUT_MS,
} = require('../utils/constants');

// Helper function to calculate averages from daily data
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

// --- Weather Data Controller ---
const getWeatherData = async (req, res) => {
  const { latitude, longitude } = req.body;
  // console.log(`Received request for /api/weather for lat: ${latitude}, lon: ${longitude}`);
  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Latitude and longitude are required.' });
  }

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  try {
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
    if (firstDayOfMonthDate <= yesterdayDate) { // Only fetch if there's at least one day in the past for the current month
      const recentParams = new URLSearchParams({
        latitude: latitude.toString(), longitude: longitude.toString(),
        start_date: firstDayOfMonth, end_date: yesterday,
        daily: 'temperature_2m_mean,precipitation_sum,time,growing_degree_days', // Added GDD
        timezone: 'auto', temperature_unit: 'celsius', precipitation_unit: 'mm',
      });
      recentDailyPromise = robustFetch(`${OPEN_METEO_ARCHIVE_API_BASE}?${recentParams.toString()}`);
    }


    // 3. Fetch Historical Monthly Averages
    const historicalDataPromises = [];
    const currentMonth = todayDate.getMonth(); // 0-indexed
    const currentYear = todayDate.getFullYear();
    for (let i = 0; i < 5; i++) { // 5 past years
      const year = currentYear - (i + 1);
      const monthStr = (currentMonth + 1).toString().padStart(2, '0'); // 1-indexed month for API
      const startDateHistorical = `${year}-${monthStr}-01`;
      const endDateHistorical = formatDate(new Date(year, currentMonth + 1, 0)); // Last day of current month for that past year

      const historicalParams = new URLSearchParams({
        latitude: latitude.toString(), longitude: longitude.toString(),
        start_date: startDateHistorical, end_date: endDateHistorical,
        daily: 'temperature_2m_mean,precipitation_sum,growing_degree_days', // Added GDD
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
    
    res.json({
      current: currentDataResult.status === 'fulfilled' ? currentDataResult.value.current : null,
      recentDailyRawData: recentDailyRawData, // Send raw daily data for sparklines etc.
      recentMonthlyAverage: (recentMonthlyAverage && (recentMonthlyAverage.mean_temp !== null || recentMonthlyAverage.total_precip !== null || recentMonthlyAverage.gdd_sum !== null)) ? recentMonthlyAverage : null,
      historicalMonthlyAverage: (overallHistoricalAverage.mean_temp !== null || overallHistoricalAverage.total_precip !== null || overallHistoricalAverage.gdd_sum !== null) ? overallHistoricalAverage : null,
      weatherDataTimestamp: new Date().toISOString()
    });

  } catch (error) {
    // console.error(`Error in /api/weather proxy for ${latitude},${longitude}:`, error);
    res.status(500).json({ error: error.message || 'Failed to fetch weather data from Open-Meteo.' });
  }
};

// --- Elevation Data Controller ---
const getElevationData = async (req, res) => {
    const { latitude, longitude } = req.body;
    // console.log(`Received request for /api/elevation for lat: ${latitude}, lon: ${longitude}`);
    if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: 'Latitude and longitude are required.' });
    }
    try {
        // Try Open-Elevation
        try {
            const openElevationUrl = `${OPEN_ELEVATION_API_URL_PREFIX}${latitude},${longitude}`;
            const data = await robustFetch(openElevationUrl);
            if (data.results && data.results.length > 0 && data.results[0].elevation !== undefined) {
                return res.json({ elevation: `${Math.round(data.results[0].elevation)}m`, source: 'Open-Elevation' });
            }
            // console.warn('Open-Elevation returned no elevation data. Trying fallback.');
        } catch (primaryError) {
            // console.error(`Open-Elevation failed: ${primaryError.message}. Trying OpenTopoData.`);
        }
        
        // Try OpenTopoData as fallback
        const openTopoUrl = `${OPEN_TOPO_DATA_API_URL_PREFIX}${latitude},${longitude}`;
        const dataFallback = await robustFetch(openTopoUrl);
        if (dataFallback.status === 'OK' && dataFallback.results && dataFallback.results.length > 0 && dataFallback.results[0].elevation !== null) {
            return res.json({ elevation: `${Math.round(dataFallback.results[0].elevation)}m`, source: 'OpenTopoData' });
        }
        // console.warn('OpenTopoData also returned no valid elevation data.');
        res.status(503).json({ error: 'All elevation services failed to provide data.' });
    } catch (error) {
        // console.error(`Error in /api/elevation proxy for ${latitude},${longitude}:`, error);
        res.status(500).json({ error: error.message || 'Failed to fetch elevation data.' });
    }
};

// --- Soil Data Controller ---
const getSoilData = async (req, res) => {
    const { latitude, longitude } = req.body;
    // console.log(`Received request for /api/soil for lat: ${latitude}, lon: ${longitude}`);
    if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: 'Latitude and longitude are required.' });
    }
    
    const properties = 'phh2o,soc,cec,nitrogen,sand,silt,clay,wv0033,wv1500';
    const depths = '0-5cm';
    const valueType = 'mean';
    const soilGridsApiUrl = `${SOILGRIDS_API_URL_PREFIX}?lon=${longitude}&lat=${latitude}&property=${properties}&depth=${depths}&value=${valueType}`;
    
    try {
        const data = await robustFetch(soilGridsApiUrl, {}, GEOLOCATION_API_TIMEOUT_MS + 6000);

        // Handle Invalid API Response Structure
        if (!data || !data.properties || !Array.isArray(data.properties.layers)) {
            return res.status(502).json({
                error: 'SoilGrids returned an invalid response.',
                errorCode: 'SOIL_DATA_INVALID_RESPONSE',
                source: 'SoilGrids'
            });
        }
        
        // Handle "No Data At Location"
        if (data.properties.layers.length === 0 || data.properties.layers.every(l => l.depths[0]?.values?.mean === null || l.depths[0]?.values?.mean === undefined)) {
            return res.status(200).json({
                error: 'Soil data is not available for this specific location.',
                errorCode: 'SOIL_DATA_NOT_AT_LOCATION',
                source: 'SoilGrids'
            });
        }

        const soilProps = {};
        let wv0033_value = null;
        let wv1500_value = null;
        
        data.properties.layers.forEach(layer => {
            if (!layer || typeof layer !== 'object' || !layer.depths || !Array.isArray(layer.depths) || !layer.depths[0] || typeof layer.depths[0] !== 'object' || !layer.depths[0].values || typeof layer.depths[0].values !== 'object') {
                // console.warn(`// DEBUG_SOIL: Layer with unexpected depths/values structure:`, JSON.stringify(layer)); // Kept for debugging if necessary, but less verbose
                return;
            }

            const layerValue = layer.depths[0]?.values?.mean;
            if (layerValue === null || layerValue === undefined) return;

            const propName = layer.name ? String(layer.name).split('_')[0] : 'unknown';
            // if (propName === 'unknown') { // Less critical log, can be removed if too noisy
            //     console.warn(`// DEBUG_SOIL: Layer encountered with missing or invalid name:`, layer);
            // }
            switch(propName) {
                case 'phh2o': soilProps.soilPH = (layerValue / 10).toFixed(1); break;
                case 'soc': soilProps.soilOrganicCarbon = `${(layerValue / 10).toFixed(1)} g/kg`; break;
                case 'cec': soilProps.soilCEC = `${(layerValue / 10).toFixed(1)} cmolc/kg`; break;
                case 'nitrogen': soilProps.soilNitrogen = `${(layerValue / 100).toFixed(1)} g/kg`; break;
                case 'sand': soilProps.soilSand = `${(layerValue / 10).toFixed(0)}%`; break;
                case 'silt': soilProps.soilSilt = `${(layerValue / 10).toFixed(0)}%`; break;
                case 'clay': soilProps.soilClay = `${(layerValue / 10).toFixed(0)}%`; break;
                case 'wv0033': wv0033_value = layerValue; break;
                case 'wv1500': wv1500_value = layerValue; break;
            }
        });

        if (wv0033_value !== null && wv1500_value !== null && typeof wv0033_value === 'number' && typeof wv1500_value === 'number') {
            // AWC (Available Water Capacity) in mm for a 5cm layer thickness.
            // SoilGrids provides volumetric water content (wv) in cm3/cm3 (or % v/v).
            // To get mm of water in a 5cm (50mm) soil layer: (wv_field_capacity - wv_wilting_point) * layer_thickness_mm
            // wv0033 is water content at 33 kPa (often taken as field capacity)
            // wv1500 is water content at 1500 kPa (often taken as wilting point)
            // SoilGrids provides these values multiplied by 100 (e.g., 25 means 0.25 cm3/cm3).
            // So, ( (wv0033/100) - (wv1500/100) ) * 50mm
            // = (wv0033 - wv1500) / 100 * 50
            // = (wv0033 - wv1500) / 2
            // The original calculation was (wv0033_value - wv1500_value) / 20.
            // This implies that the SoilGrids wv values (wv0033_value, wv1500_value) are volumetric water content (cm³/cm³) scaled by 1000 (i.e., in permille).
            // The AWC (Available Water Capacity) is then calculated for a 5cm (50mm) soil layer depth.
            // Derivation:
            // AWC (mm) = ( (wv0033_value / 1000) - (wv1500_value / 1000) ) * 50mm layer_depth
            // AWC (mm) = (wv0033_value - wv1500_value) / 1000 * 50
            // AWC (mm) = (wv0033_value - wv1500_value) / 20
            // Sticking to this original calculation /20 for consistency with existing frontend.
            soilProps.soilAWC = `${((wv0033_value - wv1500_value) / 20).toFixed(1)} mm`;
        }

        // Standardize Success Response
        if (Object.keys(soilProps).length > 0) {
            res.json({
                data: soilProps,
                source: 'SoilGrids',
                dataTimestamp: new Date().toISOString()
            });
        } else {
            // Handle "Relevant Properties Missing" (and it wasn't a "No Data At Location" case, as that's handled above)
            return res.status(200).json({
                error: 'Could not find relevant soil properties for this location.',
                errorCode: 'SOIL_DATA_PROPERTIES_MISSING',
                source: 'SoilGrids'
            });
        }
    } catch (error) {
    const originalErrorMessage = String(error.message || error);
    // Log the full original error for server-side debugging
    console.error(`[SOIL_API_ERROR] Error in getSoilData for ${latitude},${longitude}: Remote API Error: ${originalErrorMessage}, Full Error Object:`, error);

    if (originalErrorMessage.startsWith('HTTP error! status: 404')) {
        return res.status(404).json({
            error: 'SoilGrids service indicated that the requested resource was not found. This might be due to invalid coordinates or parameters for the SoilGrids API.',
            errorCode: 'SOIL_DATA_API_NOT_FOUND',
            source: 'SoilGrids',
            detail: originalErrorMessage
        });
    } else if (originalErrorMessage.startsWith('HTTP error! status: 400')) {
        return res.status(400).json({
            error: 'SoilGrids service indicated a bad request. Please check the latitude/longitude values and other parameters.',
            errorCode: 'SOIL_DATA_API_BAD_REQUEST',
            source: 'SoilGrids',
            detail: originalErrorMessage
        });
    } else if (originalErrorMessage.includes('timed out')) { // Check for timeout string from robustFetch
         return res.status(504).json({
            error: 'The request to SoilGrids API timed out. The service may be temporarily unavailable or slow.',
            errorCode: 'SOIL_DATA_API_TIMEOUT',
            source: 'SoilGrids',
            detail: originalErrorMessage
        });
    } else if (originalErrorMessage.startsWith('HTTP error! status:')) { // Catch other HTTP errors from robustFetch
        // Extract status if possible, otherwise default to 502 (Bad Gateway, as proxy received invalid response from upstream)
        const match = originalErrorMessage.match(/status: (\d+)/);
        const upstreamStatus = match ? parseInt(match[1], 10) : 502;
        const proxyStatus = (upstreamStatus >= 500 && upstreamStatus <= 599) ? 502 : upstreamStatus; // If 5xx from upstream, proxy returns 502. Otherwise, pass through client errors like 4xx.

        return res.status(proxyStatus).json({
            error: `Failed to fetch soil data from SoilGrids due to an upstream HTTP error: ${upstreamStatus}.`,
            errorCode: 'SOIL_DATA_API_HTTP_ERROR', // A new generic code for unhandled HTTP errors from SoilGrids
            source: 'SoilGrids',
            detail: originalErrorMessage
        });
    }

    // Default fallback for other errors (e.g., unexpected robustFetch errors, or programming errors within the try block if robustFetch didn't even run)
    res.status(500).json({
        error: 'Failed to fetch or process soil data from the provider due to an unexpected error.',
        errorCode: 'SOIL_DATA_FETCH_FAILED', // General failure for non-HTTP, non-timeout issues from robustFetch, or other unexpected errors
        detail: originalErrorMessage
    });
    }
};

// --- IP Location Controller ---
const getIpLocation = async (req, res) => {
  let primaryErrorDetails = null;
  try {
    // Attempt 1: ipapi.co
    // robustFetch will throw if response.ok is false or on timeout
    const data = await robustFetch(IPAPI_CO_URL, { headers: {'User-Agent': 'Fedai-Backend-Proxy/1.0'} }, GEOLOCATION_API_TIMEOUT_MS);
    if (data.error) { // ipapi.co specific error field in a 200 OK response
      throw new Error(data.reason || 'ipapi.co returned an error in a 200 OK response');
    }
    if (data.latitude && data.longitude) {
      return res.json({
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city,
        country: data.country_name,
        countryCode: data.country_code,
        serviceName: 'ipapi.co'
      });
    }
    // If 200 OK but no lat/lon or expected error field
    throw new Error('ipapi.co did not return valid latitude/longitude in a 200 OK response');
  } catch (error) {
    primaryErrorDetails = error.message || String(error);
    console.warn(`IP Location: Primary service (ipapi.co) failed or returned unusable data: ${primaryErrorDetails}`);

    // Attempt 2: ip-api.com (Fallback)
    try {
      // robustFetch will throw if response.ok is false or on timeout
      const dataFallback = await robustFetch(IP_API_COM_URL, { headers: {'User-Agent': 'Fedai-Backend-Proxy/1.0'} }, GEOLOCATION_API_TIMEOUT_MS);
      if (dataFallback.status === 'fail') { // ip-api.com specific error field
        throw new Error(dataFallback.message || 'ip-api.com indicated failure');
      }
      if (dataFallback.status === 'success' && dataFallback.lat && dataFallback.lon) {
        return res.json({
          latitude: dataFallback.lat,
          longitude: dataFallback.lon,
          city: dataFallback.city,
          country: dataFallback.country,
          countryCode: dataFallback.countryCode,
          serviceName: 'ip-api.com'
        });
      }
      // If 200 OK but no success status or lat/lon
      throw new Error('ip-api.com did not return success or valid location data in a 200 OK response');
    } catch (fallbackError) {
      const fallbackErrorDetails = fallbackError.message || String(fallbackError);
      console.error(`IP Location: Fallback service (ip-api.com) also failed or returned unusable data: ${fallbackErrorDetails}`);
      return res.status(503).json({
        error: 'All IP location services failed or returned unusable data.',
        primaryServiceError: primaryErrorDetails, // Renamed for clarity
        fallbackServiceError: fallbackErrorDetails // Renamed for clarity
      });
    }
  }
};


module.exports = {
  getIpLocation,
  getWeatherData,
  getElevationData,
  getSoilData,
};