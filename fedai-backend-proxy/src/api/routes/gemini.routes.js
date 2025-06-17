// fedai-backend-proxy/src/api/routes/gemini.routes.js

const express = require('express');
const router = express.Router();

/**
 * Factory function that creates and configures the Gemini router.
 * @param {object} geminiController - The Gemini controller instance.
 * @returns {express.Router} - The configured router.
 */
module.exports = (geminiController) => {
  router.post('/', geminiController.analyzeContent);
  router.get('/status', geminiController.checkStatus);

  return router;
};