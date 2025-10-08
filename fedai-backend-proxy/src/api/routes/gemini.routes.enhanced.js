// fedai-backend-proxy/src/api/routes/gemini.routes.enhanced.js
// Enhanced routes with validation and sanitization

const express = require('express');
const { validateBody, sanitizeTextFields, schemas } = require('../../middleware/validation');

module.exports = (geminiController) => {
  const router = express.Router();

  /**
   * POST /api/gemini-proxy
   * Analyze plant health with AI
   * With validation and text sanitization
   */
  router.post(
    '/',
    sanitizeTextFields(['userDescription', 'followUpAnswer']),
    validateBody(schemas.geminiAnalysis),
    geminiController.analyzeContent
  );

  /**
   * GET /api/gemini-proxy/status
   * Check AI provider status
   */
  router.get('/status', geminiController.checkStatus);

  /**
   * GET /api/gemini-proxy/providers
   * Get list of available AI providers
   */
  router.get('/providers', geminiController.getProviders);

  /**
   * POST /api/gemini-proxy/validate
   * Validate provider configuration
   */
  router.post('/validate', geminiController.validateProvider);

  /**
   * GET /api/gemini-proxy/models
   * Get available models for a provider
   */
  router.get('/models', geminiController.getModels);

  return router;
};
