// fedai-backend-proxy/src/utils/cache.js
// Simple in-memory cache using node-cache
// For production, use Redis for distributed caching

const NodeCache = require('node-cache');

// Create cache instances with different TTLs
const weatherCache = new NodeCache({
  stdTTL: 1800, // 30 minutes
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false // Better performance
});

const soilCache = new NodeCache({
  stdTTL: 86400, // 24 hours (soil data rarely changes)
  checkperiod: 3600,
  useClones: false
});

const elevationCache = new NodeCache({
  stdTTL: 0, // Never expire (elevation never changes)
  useClones: false
});

/**
 * Generate a cache key from coordinates
 * Rounds to 3 decimal places (~111 meters precision)
 */
function generateLocationKey(latitude, longitude) {
  const lat = parseFloat(latitude).toFixed(3);
  const lon = parseFloat(longitude).toFixed(3);
  return `${lat},${lon}`;
}

/**
 * Wrapper for cached API calls
 * @param {NodeCache} cache - Cache instance to use
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Async function to fetch data if not cached
 * @returns {Promise<any>} - Cached or fresh data
 */
async function getCachedOrFetch(cache, key, fetchFn) {
  // Try to get from cache
  const cached = cache.get(key);
  if (cached !== undefined) {
    console.log(`Cache HIT for key: ${key}`);
    return cached;
  }

  console.log(`Cache MISS for key: ${key}`);

  // Fetch fresh data
  const freshData = await fetchFn();

  // Store in cache
  cache.set(key, freshData);

  return freshData;
}

/**
 * Get cache statistics for monitoring
 */
function getCacheStats() {
  return {
    weather: {
      keys: weatherCache.keys().length,
      hits: weatherCache.getStats().hits,
      misses: weatherCache.getStats().misses,
      ksize: weatherCache.getStats().ksize,
      vsize: weatherCache.getStats().vsize
    },
    soil: {
      keys: soilCache.keys().length,
      hits: soilCache.getStats().hits,
      misses: soilCache.getStats().misses,
      ksize: soilCache.getStats().ksize,
      vsize: soilCache.getStats().vsize
    },
    elevation: {
      keys: elevationCache.keys().length,
      hits: elevationCache.getStats().hits,
      misses: elevationCache.getStats().misses,
      ksize: elevationCache.getStats().ksize,
      vsize: elevationCache.getStats().vsize
    }
  };
}

/**
 * Clear all caches (useful for testing)
 */
function clearAllCaches() {
  weatherCache.flushAll();
  soilCache.flushAll();
  elevationCache.flushAll();
}

module.exports = {
  weatherCache,
  soilCache,
  elevationCache,
  generateLocationKey,
  getCachedOrFetch,
  getCacheStats,
  clearAllCaches
};
