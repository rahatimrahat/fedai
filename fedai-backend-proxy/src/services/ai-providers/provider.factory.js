// fedai-backend-proxy/src/services/ai-providers/provider.factory.js
// Factory for creating AI provider instances

const GeminiProvider = require('./gemini.provider');
const OpenRouterProvider = require('./openrouter.provider');
const LocalOpenAIProvider = require('./local-openai.provider');

const PROVIDER_MAP = {
  'gemini': GeminiProvider,
  'openrouter': OpenRouterProvider,
  'local-openai': LocalOpenAIProvider,
  'lm-studio': LocalOpenAIProvider, // Alias
  'llama-cpp': LocalOpenAIProvider, // Alias
  'koboldcpp': LocalOpenAIProvider  // Alias
};

class AIProviderFactory {
  /**
   * Create an AI provider instance
   * @param {string} providerType - Type of provider (gemini, openrouter, local-openai)
   * @param {Object} config - Provider configuration
   * @returns {BaseAIProvider}
   */
  static createProvider(providerType, config = {}) {
    const ProviderClass = PROVIDER_MAP[providerType];

    if (!ProviderClass) {
      throw new Error(
        `Unknown AI provider: ${providerType}. Available providers: ${Object.keys(PROVIDER_MAP).join(', ')}`
      );
    }

    return new ProviderClass(config);
  }

  /**
   * Get list of available providers with metadata
   * @returns {Array<Object>}
   */
  static getAvailableProviders() {
    return Object.entries(PROVIDER_MAP).map(([key, ProviderClass]) => {
      const instance = new ProviderClass({});
      return {
        id: key,
        ...instance.getMetadata()
      };
    });
  }

  /**
   * Create provider from environment variables (for backwards compatibility)
   * @returns {BaseAIProvider}
   */
  static createFromEnv() {
    const providerType = process.env.AI_PROVIDER || 'gemini';

    const config = {
      apiKey: process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY,
      baseUrl: process.env.LOCAL_AI_URL,
      model: process.env.AI_MODEL
    };

    return AIProviderFactory.createProvider(providerType, config);
  }

  /**
   * Validate provider configuration
   * @param {string} providerType
   * @param {Object} config
   * @returns {Promise<{valid: boolean, error?: string}>}
   */
  static async validateProvider(providerType, config) {
    try {
      const provider = AIProviderFactory.createProvider(providerType, config);
      return await provider.validate();
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}

module.exports = AIProviderFactory;
