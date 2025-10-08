// fedai-backend-proxy/src/services/ai-providers/gemini.provider.js
// Google Gemini AI Provider

const BaseAIProvider = require('./base.provider');
const { GoogleGenAI } = require('@google/genai');

class GeminiProvider extends BaseAIProvider {
  constructor(config) {
    super(config);
    this.name = 'gemini';
    this.apiKey = config.apiKey || process.env.GEMINI_API_KEY;
    this.client = this.apiKey ? new GoogleGenAI({ apiKey: this.apiKey }) : null;
  }

  async validate() {
    if (!this.apiKey) {
      return { valid: false, error: 'API key is required for Gemini' };
    }

    try {
      await this.testConnection();
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  async generateContent({ systemInstruction, image, model = 'gemini-2.0-flash-exp', signal }) {
    if (!this.client) {
      throw new Error('Gemini client not initialized. API key missing.');
    }

    try {
      const imagePart = {
        inlineData: {
          mimeType: image.mimeType,
          data: image.base64
        }
      };

      const contents = { parts: [imagePart] };

      const response = await this.client.models.generateContent({
        model,
        contents,
        config: {
          responseMimeType: 'application/json',
          systemInstruction
        }
      });

      let jsonResponseString = response.text.trim();

      // Remove markdown code fences if present
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonResponseString.match(fenceRegex);
      if (match && match[2]) {
        jsonResponseString = match[2].trim();
      }

      return jsonResponseString;
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }

  async testConnection() {
    if (!this.client) {
      throw new Error('Gemini client not initialized');
    }

    try {
      await this.client.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: 'Test',
        config: {
          responseMimeType: 'text/plain',
          thinkingConfig: { thinkingBudget: 0 }
        }
      });

      return { status: 'UP', details: 'Gemini API is accessible' };
    } catch (error) {
      return { status: 'DOWN', details: error.message };
    }
  }

  /**
   * Fetch available models from Gemini API
   */
  async getAvailableModels() {
    if (!this.client) {
      throw new Error('Gemini client not initialized');
    }

    try {
      // Note: Gemini API doesn't have a models list endpoint
      // We return a curated list of known models
      return [
        {
          id: 'gemini-2.0-flash-exp',
          name: 'Gemini 2.0 Flash (Experimental)',
          description: 'Latest experimental model with vision support',
          supportsVision: true
        },
        {
          id: 'gemini-1.5-pro',
          name: 'Gemini 1.5 Pro',
          description: 'High-quality model with large context window',
          supportsVision: true
        },
        {
          id: 'gemini-1.5-flash',
          name: 'Gemini 1.5 Flash',
          description: 'Fast and efficient model',
          supportsVision: true
        }
      ];
    } catch (error) {
      console.error('Error fetching Gemini models:', error);
      return [];
    }
  }

  getMetadata() {
    return {
      name: 'Google Gemini',
      provider: 'gemini',
      requiresApiKey: true,
      supportsVision: true,
      supportsStreaming: false,
      defaultModel: 'gemini-2.0-flash-exp',
      availableModels: [
        'gemini-2.0-flash-exp',
        'gemini-1.5-pro',
        'gemini-1.5-flash'
      ]
    };
  }
}

module.exports = GeminiProvider;
