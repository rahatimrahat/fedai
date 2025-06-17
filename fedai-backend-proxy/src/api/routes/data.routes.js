// fedai-backend-proxy/src/api/routes/data.routes.js

const express = require('express');
const router = express.Router();
const dataController = require('../controllers/data.controller');

// IP Location Route
router.get('/ip-location', dataController.getIpLocation);

// Weather Data Route
router.post('/weather', dataController.getWeatherData);

// Elevation Data Route
router.post('/elevation', dataController.getElevationData);

// Soil Data Route
router.post('/soil', dataController.getSoilData);

module.exports = router;