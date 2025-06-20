// fedai-backend-proxy/src/api/routes/data.routes.js

const express = require('express');
const router = express.Router();
const {
  getWeatherData,
  getElevationData,
  getSoilData,
  getIpLocation // Add this
} = require('../controllers/data.controller');

// Weather Data Route
router.post('/weather', getWeatherData);

// Elevation Data Route
router.post('/elevation', getElevationData);

// Soil Data Route
router.post('/soil', getSoilData);

// IP Location Route
router.get('/ip-location', getIpLocation);

module.exports = router;