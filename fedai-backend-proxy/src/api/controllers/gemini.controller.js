
// fedai-backend-proxy/src/api/controllers/gemini.controller.js
const { GoogleGenAI } = require('@google/genai'); // Ensure this is the correct import
const {
    getBaseSystemInstruction,
    getJsonOutputStructure,
    getChemicalSolutionInstructions,
    getContextualDataPrompt,
    getTaskInstruction
} = require('../utils/prompt.helpers.js');


/**
 * Factory function that creates the Gemini controller.
 * @param {GoogleGenAI} ai - The initialized GoogleGenAI client instance.
 * @returns {object} - The Gemini controller object with methods.
 */
module.exports = (ai) => {
  /**
   * Handles the plant analysis request to the Gemini API.
   */
  const analyzeContent = async (req, res) => {
    if (!ai) {
      return res.status(503).json({ error: 'Gemini AI client is not initialized due to missing API key.', errorKey: 'API_KEY_MISSING' });
    }

    try {
      const { 
        image, 
        userDescription, 
        language, // Expecting { code, uiName, geminiPromptLanguage }
        userLocation, 
        weatherData, 
        environmentalData, 
        followUpAnswer 
      } = req.body;

      if (!image || !image.base64 || !image.mimeType) {
        return res.status(400).json({ error: 'Missing or invalid image data.', errorKey: 'ANALYSIS_ERROR' });
      }
      if (!language || !language.geminiPromptLanguage) {
        return res.status(400).json({ error: 'Missing or invalid language information.', errorKey: 'ANALYSIS_ERROR' });
      }
      
      const currentJsonOutputStructure = getJsonOutputStructure(userLocation, weatherData, environmentalData);
      const currentTaskInstruction = getTaskInstruction(userLocation, weatherData, environmentalData);
      const currentContextualDataPrompt = getContextualDataPrompt(language, userLocation, weatherData, environmentalData, userDescription, followUpAnswer);

      const systemInstruction = `
${getBaseSystemInstruction(language.geminiPromptLanguage)}
${currentJsonOutputStructure}
${getChemicalSolutionInstructions()}
${currentContextualDataPrompt}
${currentTaskInstruction}
`;

      const imagePart = { inlineData: { mimeType: image.mimeType, data: image.base64 } };
      const contents = { parts: [imagePart] }; // Text prompt is now part of systemInstruction

      const geminiResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: contents,
        config: { 
            responseMimeType: "application/json",
            systemInstruction: systemInstruction // Pass the combined prompt as system instruction
        },
      });

      let jsonResponseString = geminiResponse.text.trim();
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonResponseString.match(fenceRegex);
      if (match && match[2]) {
        jsonResponseString = match[2].trim();
      }

      try {
        const parsedData = JSON.parse(jsonResponseString);
        // Ensure boolean flags are set correctly if Gemini doesn't include them
        // This provides defaults if the AI omits them, but the prompt asks for them.
        const finalResponse = {
            ...parsedData,
            locationConsidered: parsedData.locationConsidered !== undefined ? parsedData.locationConsidered : !!userLocation,
            weatherConsidered: parsedData.weatherConsidered !== undefined ? parsedData.weatherConsidered : !!(weatherData?.current || weatherData?.recentMonthlyAverage || weatherData?.historicalMonthlyAverage),
            environmentalDataConsidered: parsedData.environmentalDataConsidered !== undefined ? parsedData.environmentalDataConsidered : !!(environmentalData?.elevation || environmentalData?.soilPH)
        };
        res.json(finalResponse);
      } catch (parseError) {
        console.error("Error parsing Gemini JSON response:", parseError, "Raw response:", geminiResponse.text);
        res.status(500).json({ error: 'AI response was not valid JSON.', rawText: geminiResponse.text, errorKey: 'JSON_PARSE_ERROR' });
      }
    } catch (error) {
      console.error("Error in Gemini analyzeContent controller:", error);
      let statusCode = 500;
      let errorMessage = 'An unexpected error occurred on the proxy.';
      let errorKey = 'ANALYSIS_ERROR'; // Default errorKey for backend

      if (error.message) {
        errorMessage = `Gemini API Error: ${error.message}`;
        if (error.message.toLowerCase().includes('api key not valid') || error.message.toLowerCase().includes('permission denied')) {
            statusCode = 401; // Or 403
            errorKey = 'API_KEY_MISSING';
        } else if (error.message.toLowerCase().includes('model not found') || error.message.toLowerCase().includes('invalid model')) {
            statusCode = 400;
            errorMessage = `Gemini API Error: Invalid model specified or model not found.`;
        } else if (error.status === 429 || (error.error && error.error.code === 429) ) { // Check if error object has status
             statusCode = 429;
             errorKey = 'RATE_LIMIT_ERROR';
        } else if (typeof error.status === 'number') { // Generic status code from error
            statusCode = error.status;
        }
      }
      
      res.status(statusCode).json({ error: errorMessage, errorKey });
    }
  };

  /**
   * Checks the status of the Gemini API connection.
   */
  const checkStatus = async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ status: 'DOWN', details: 'GEMINI_API_KEY not configured on server.' });
    }
    if (!ai) {
      return res.status(503).json({ status: 'DOWN', details: 'Gemini AI client is not initialized (API key missing).' });
    }
    try {
      // Using a minimal prompt and config for status check
      await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: "Test", // Shortest possible content
        config: { 
            responseMimeType: "text/plain", // Expect plain text
            thinkingConfig: { thinkingBudget: 0 } // Disable thinking for fastest response
        } 
      });
      res.json({ status: 'UP', details: 'Proxy is running and Gemini API key seems valid.' });
    } catch (error) {
      console.error("Error in Gemini checkStatus controller:", error);
      let details = `Could not connect to Gemini API: ${error.message}`;
      if (error.message?.toLowerCase().includes('api key not valid')) {
        details = 'Gemini API key is not valid.';
      }
      res.status(503).json({ status: 'DOWN', details });
    }
  };

  return { analyzeContent, checkStatus };
};
