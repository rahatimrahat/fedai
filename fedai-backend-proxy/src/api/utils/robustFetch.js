// fedai-backend-proxy/src/api/utils/robustFetch.js

const fetch = require('node-fetch');
const { GEOLOCATION_API_TIMEOUT_MS } = require('./constants');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { HttpProxyAgent } = require('http-proxy-agent');

/**
 * A robust fetch helper with a timeout mechanism.
 * @param {string} url - The URL to fetch.
 * @param {object} options - Fetch options.
 * @param {number} timeout - Timeout in milliseconds.
 * @returns {Promise<any>} - The JSON response.
 */
async function robustFetch(url, options = {}, timeout = GEOLOCATION_API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
    let agent;
    if (proxyUrl) {
      agent = url.startsWith('https') ? new HttpsProxyAgent(proxyUrl) : new HttpProxyAgent(proxyUrl);
    }

    const response = await fetch(url, { ...options, agent, signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
    }
    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request to ${url} timed out after ${timeout}ms`);
    }
    throw error; // Re-throw other errors
  }
}

module.exports = robustFetch;