// fedai-backend-proxy/src/middleware/validation.js
// Request validation middleware using Zod

const { z } = require('zod');

/**
 * Coordinate validation schema
 */
const coordinatesSchema = z.object({
  latitude: z.number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z.number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
});

/**
 * Language object schema
 */
const languageSchema = z.object({
  code: z.string().min(2).max(5),
  uiName: z.string(),
  geminiPromptLanguage: z.string()
});

/**
 * Image schema
 */
const imageSchema = z.object({
  base64: z.string().min(1, 'Image base64 data is required'),
  mimeType: z.enum(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'], {
    errorMap: () => ({ message: 'Invalid image MIME type. Allowed: jpeg, jpg, png, webp' })
  })
});

/**
 * Gemini analysis request schema
 */
const geminiAnalysisSchema = z.object({
  image: imageSchema,
  language: languageSchema,
  userDescription: z.string().max(5000, 'Description too long (max 5000 characters)').optional().nullable(),
  userLocation: coordinatesSchema.extend({
    city: z.string().optional(),
    country: z.string().optional(),
    source: z.string().optional()
  }).optional().nullable(),
  weatherData: z.any().optional().nullable(), // Complex structure, validate separately if needed
  environmentalData: z.any().optional().nullable(), // Complex structure, validate separately if needed
  followUpAnswer: z.string().max(2000, 'Follow-up answer too long (max 2000 characters)').optional().nullable()
});

/**
 * Weather/Soil/Elevation request schema
 */
const locationDataSchema = z.object({
  body: coordinatesSchema
});

/**
 * Plant ID schema
 */
const plantIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Plant ID is required')
  })
});

/**
 * Middleware factory for validating request body
 */
function validateBody(schema) {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated; // Replace with validated data
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          errorKey: 'VALIDATION_ERROR',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
}

/**
 * Middleware factory for validating request params
 */
function validateParams(schema) {
  return (req, res, next) => {
    try {
      const validated = schema.parse({ params: req.params });
      req.params = validated.params;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          errorKey: 'VALIDATION_ERROR',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
}

/**
 * Sanitize user-provided text to prevent XSS
 * Basic implementation - consider using a library like DOMPurify for more robust sanitization
 */
function sanitizeText(text) {
  if (!text || typeof text !== 'string') return text;

  return text
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
    .trim()
    .substring(0, 10000); // Hard limit on length
}

/**
 * Middleware to sanitize text fields in request body
 */
function sanitizeTextFields(fields = []) {
  return (req, res, next) => {
    if (req.body) {
      fields.forEach(field => {
        if (req.body[field]) {
          req.body[field] = sanitizeText(req.body[field]);
        }
      });
    }
    next();
  };
}

module.exports = {
  validateBody,
  validateParams,
  sanitizeText,
  sanitizeTextFields,
  // Export schemas for use in routes
  schemas: {
    geminiAnalysis: geminiAnalysisSchema,
    locationData: coordinatesSchema,
    plantId: plantIdSchema,
    coordinates: coordinatesSchema,
    image: imageSchema,
    language: languageSchema
  }
};
