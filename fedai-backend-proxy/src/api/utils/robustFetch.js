// fedai-backend-proxy/src/api/utils/robustFetch.js

const fetch = require('node-fetch');
const { GEOLOCATION_API_TIMEOUT_MS } = require('./constants');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { HttpProxyAgent } = require('http-proxy-agent');

/**
 * A robust fetch helper with a timeout mechanism and retry logic.
 * @param {string} url - The URL to fetch.
 * @param {object} options - Fetch options.
 * @param {number} timeout - Timeout in milliseconds.
 * @returns {Promise<any>} - The JSON response.
 */
async function robustFetch(url, options = {}, timeout = GEOLOCATION_API_TIMEOUT_MS) {
  const maxRetries = 3; // Number of retries
  let retryCount = 0;

  while (retryCount < maxRetries) {
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
        // Throwing here will be caught by the catch block, allowing retries.
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
      }
      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        // If it's a timeout, we don't retry by default. Re-throw.
        throw new Error(`Request to ${url} timed out after ${timeout}ms`);
      }

      // Increment retry count for other errors
      retryCount++;
      if (retryCount >= maxRetries) {
        // If max retries reached, re-throw the original error
        throw error;
      }

      // Exponential backoff delay: 200ms, 400ms, 800ms
      const retryDelay = Math.pow(2, retryCount) * 100;
      console.warn(`Request to ${url} failed: ${error.message}. Retrying (${retryCount}/${maxRetries}) in ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  // This line should theoretically not be reached if maxRetries is handled correctly in the catch block.
  // However, as a fallback, we throw an error.
  throw new Error(`Failed to fetch ${url} after ${maxRetries} retries.`);
}

module.exports = robustFetch;
