// fedai-backend-proxy/src/api/controllers/gemini.controller.multi-provider.js
// Enhanced Gemini controller with multi-provider support

const AIProviderFactory = require('../../services/ai-providers/provider.factory');
const {
  getBaseSystemInstruction,
  getJsonOutputStructure,
  getChemicalSolutionInstructions,
  getContextualDataPrompt,
  getTaskInstruction
} = require('../utils/prompt.helpers.js');

/**
 * Multi-provider AI controller
 * Supports Gemini, OpenRouter, and local OpenAI-compatible APIs
 */
module.exports = () => {
  /**
   * Handles the plant analysis request using configured AI provider
   */
  const analyzeContent = async (req, res) => {
    try {
      const {
        image,
        userDescription,
        language,
        userLocation,
        weatherData,
        environmentalData,
        followUpAnswer,
        // Multi-provider fields
        aiProvider = 'gemini',
        aiApiKey,
        aiBaseUrl,
        aiModel
      } = req.body;

      // Validate required fields
      if (!image || !image.base64 || !image.mimeType) {
        return res.status(400).json({
          error: 'Missing or invalid image data.',
          errorKey: 'ANALYSIS_ERROR'
        });
      }

      if (!language || !language.geminiPromptLanguage) {
        return res.status(400).json({
          error: 'Missing or invalid language information.',
          errorKey: 'ANALYSIS_ERROR'
        });
      }

      // Create provider configuration
      const providerConfig = {
        apiKey: aiApiKey,
        baseUrl: aiBaseUrl,
        model: aiModel
      };

      // Create AI provider instance
      let provider;
      try {
        provider = AIProviderFactory.createProvider(aiProvider, providerConfig);
      } catch (error) {
        return res.status(400).json({
          error: `Invalid AI provider: ${error.message}`,
          errorKey: 'ANALYSIS_ERROR'
        });
      }

      // Validate provider configuration
      const validation = await provider.validate();
      if (!validation.valid) {
        return res.status(503).json({
          error: `AI provider configuration invalid: ${validation.error}`,
          errorKey: 'API_KEY_MISSING'
        });
      }

      // Build system instruction
      const currentJsonOutputStructure = getJsonOutputStructure(
        userLocation,
        weatherData,
        environmentalData
      );
      const currentTaskInstruction = getTaskInstruction(
        userLocation,
        weatherData,
        environmentalData
      );
      const currentContextualDataPrompt = getContextualDataPrompt(
        language,
        userLocation,
        weatherData,
        environmentalData,
        userDescription,
        followUpAnswer
      );

      const systemInstruction = `
${getBaseSystemInstruction(language.geminiPromptLanguage)}
${currentJsonOutputStructure}
${getChemicalSolutionInstructions()}
${currentContextualDataPrompt}
${currentTaskInstruction}
`;

      // Generate content using provider
      const jsonResponseString = await provider.generateContent({
        systemInstruction,
        image,
        model: aiModel,
        signal: req.signal
      });

      // Parse and validate response
      try {
        const parsedData = JSON.parse(jsonResponseString);

        // Ensure boolean flags are set correctly
        const finalResponse = {
          ...parsedData,
          locationConsidered:
            parsedData.locationConsidered !== undefined
              ? parsedData.locationConsidered
              : !!userLocation,
          weatherConsidered:
            parsedData.weatherConsidered !== undefined
              ? parsedData.weatherConsidered
              : !!(
                  weatherData?.current ||
                  weatherData?.recentMonthlyAverage ||
                  weatherData?.historicalMonthlyAverage
                ),
          environmentalDataConsidered:
            parsedData.environmentalDataConsidered !== undefined
              ? parsedData.environmentalDataConsidered
              : !!(environmentalData?.elevation || environmentalData?.soilPH),
          // Add provider metadata
          aiProvider: provider.name,
          aiModel: aiModel || provider.getMetadata().defaultModel
        };

        res.json(finalResponse);
      } catch (parseError) {
        console.error('Error parsing AI JSON response:', parseError, 'Raw response:', jsonResponseString);
        res.status(500).json({
          error: 'AI response was not valid JSON.',
          rawText: jsonResponseString,
          errorKey: 'JSON_PARSE_ERROR'
        });
      }
    } catch (error) {
      console.error('Error in AI analyzeContent controller:', error);

      let statusCode = 500;
      let errorMessage = 'An unexpected error occurred on the proxy.';
      let errorKey = 'ANALYSIS_ERROR';

      if (error.message) {
        errorMessage = `AI API Error: ${error.message}`;

        if (
          error.message.toLowerCase().includes('api key not valid') ||
          error.message.toLowerCase().includes('permission denied') ||
          error.message.toLowerCase().includes('unauthorized')
        ) {
          statusCode = 401;
          errorKey = 'API_KEY_MISSING';
        } else if (
          error.message.toLowerCase().includes('model not found') ||
          error.message.toLowerCase().includes('invalid model')
        ) {
          statusCode = 400;
          errorMessage = `AI API Error: Invalid model specified or model not found.`;
        } else if (error.status === 429 || (error.error && error.error.code === 429)) {
          statusCode = 429;
          errorKey = 'RATE_LIMIT_ERROR';
        } else if (typeof error.status === 'number') {
          statusCode = error.status;
        }
      }

      res.status(statusCode).json({ error: errorMessage, errorKey });
    }
  };

  /**
   * Checks the status of configured AI provider
   */
  const checkStatus = async (req, res) => {
    try {
      const {
        aiProvider = 'gemini',
        aiApiKey,
        aiBaseUrl,
        aiModel
      } = req.query;

      const providerConfig = {
        apiKey: aiApiKey,
        baseUrl: aiBaseUrl,
        model: aiModel
      };

      const provider = AIProviderFactory.createProvider(aiProvider, providerConfig);
      const result = await provider.testConnection();

      if (result.status === 'UP') {
        res.json({
          status: 'UP',
          provider: provider.name,
          details: result.details,
          models: result.models || []
        });
      } else {
        res.status(503).json({
          status: 'DOWN',
          provider: provider.name,
          details: result.details
        });
      }
    } catch (error) {
      console.error('Error in AI checkStatus controller:', error);
      res.status(503).json({
        status: 'DOWN',
        details: error.message
      });
    }
  };

  /**
   * Get list of available AI providers
   */
  const getProviders = async (req, res) => {
    try {
      const providers = AIProviderFactory.getAvailableProviders();
      res.json({ providers });
    } catch (error) {
      console.error('Error getting providers:', error);
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * Validate provider configuration
   */
  const validateProvider = async (req, res) => {
    try {
      const { providerType, config } = req.body;

      if (!providerType) {
        return res.status(400).json({ error: 'Provider type is required' });
      }

      const result = await AIProviderFactory.validateProvider(providerType, config);
      res.json(result);
    } catch (error) {
      console.error('Error validating provider:', error);
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * Get available models for a provider
   */
  const getModels = async (req, res) => {
    try {
      const { aiProvider = 'gemini', aiApiKey, aiBaseUrl } = req.query;

      const providerConfig = {
        apiKey: aiApiKey,
        baseUrl: aiBaseUrl
      };

      const provider = AIProviderFactory.createProvider(aiProvider, providerConfig);
      const models = await provider.getAvailableModels();

      res.json({ models });
    } catch (error) {
      console.error('Error fetching models:', error);
      res.status(500).json({ error: error.message, models: [] });
    }
  };

  return {
    analyzeContent,
    checkStatus,
    getProviders,
    validateProvider,
    getModels
  };
};
