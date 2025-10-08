// fedai-backend-proxy/src/api/routes/data.routes.enhanced.js
// Enhanced data routes with validation

const express = require('express');
const { validateBody, validateParams, schemas } = require('../../middleware/validation');

const router = express.Router();

// Determine which controller to use based on environment
const useCaching = process.env.ENABLE_CACHING !== 'false';
const dataController = useCaching
  ? require('../controllers/data.controller.cached')
  : require('../controllers/data.controller');

/**
 * POST /api/weather
 * Fetch weather data for coordinates
 */
router.post(
  '/weather',
  validateBody(schemas.coordinates),
  dataController.getWeatherData
);

/**
 * POST /api/soil
 * Fetch soil data for coordinates
 */
router.post(
  '/soil',
  validateBody(schemas.coordinates),
  dataController.getSoilData
);

/**
 * POST /api/elevation
 * Fetch elevation data for coordinates
 */
router.post(
  '/elevation',
  validateBody(schemas.coordinates),
  dataController.getElevation
);

/**
 * GET /api/ip-location
 * Get approximate location from IP address
 * No validation needed (uses request IP)
 */
router.get(
  '/ip-location',
  dataController.getIpLocation
);

/**
 * GET /api/plant/:id
 * Fetch plant data from OpenPlantBook
 */
router.get(
  '/plant/:id',
  validateParams(schemas.plantId),
  dataController.getPlantData
);

module.exports = router;
