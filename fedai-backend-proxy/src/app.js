// fedai-backend-proxy/src/app.js

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit'); // Import rate-limit middleware
const { GoogleGenAI } = require('@google/genai');

// --- Initialize Express App ---
const app = express();

// --- CORS Configuration ---
const corsOptions = {
  origin: function (origin, callback) {
    // Development origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:8000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:8000',
      'http://localhost:5173',
      'http://127.0.0.1:5173'
    ];

    // Production origin - EXPLICIT, not wildcard (security)
    const productionOrigin = process.env.FRONTEND_URL || 'https://fedai-frontend.onrender.com';
    if (productionOrigin) {
      allowedOrigins.push(productionOrigin);
    }

    // Allow requests with no origin (server-to-server, curl, mobile apps)
    if (!origin) return callback(null, true);

    // Check against explicit allowed origins only
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Log blocked origins for debugging (but don't expose in error)
    console.warn(`[CORS] Blocked request from origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  optionsSuccessStatus: 200,
  credentials: true
};
app.use(cors(corsOptions));
app.set('trust proxy', 1); // Trust the first proxy
app.use(express.json({ limit: '10mb' }));

// --- Rate Limiting Configuration ---
// Different limits for different endpoint types

// Expensive AI analysis operations - stricter limits
const aiAnalysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 AI analyses per hour per IP
  message: 'Too many AI analysis requests. Please wait an hour before trying again.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Moderate data fetching operations
const dataFetchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // 60 data requests per 15 minutes per IP
  message: 'Too many data requests. Please wait a few minutes before trying again.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Lenient status/health check operations
const statusCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 status checks per 15 minutes per IP
  message: 'Too many status check requests.',
  standardHeaders: true,
  legacyHeaders: false,
});

// --- Initialize Gemini AI Client ---
const apiKey = process.env.GEMINI_API_KEY;
let ai;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
} else {
  // console.warn("GEMINI_API_KEY is not defined. AI-related endpoints will not function correctly.");
}

// --- Import and Mount Routers ---
// Use multi-provider controller instead of original
const geminiController = require('./api/controllers/gemini.controller.multi-provider')();
const geminiRoutes = require('./api/routes/gemini.routes.enhanced')(geminiController);
const dataRoutes = require('./api/routes/data.routes');

// Apply rate limiting before mounting routes
// AI analysis endpoints - strictest limits
app.use('/api/gemini-proxy/analyze', aiAnalysisLimiter);
app.use('/api/gemini-proxy/models', aiAnalysisLimiter);

// Status/health checks - lenient limits
app.use('/api/gemini-proxy/status', statusCheckLimiter);
app.use('/api/*/status', statusCheckLimiter);

// Data fetching endpoints - moderate limits
app.use('/api/weather', dataFetchLimiter);
app.use('/api/soil', dataFetchLimiter);
app.use('/api/elevation', dataFetchLimiter);
app.use('/api/ip-location', dataFetchLimiter);
app.use('/api/plant', dataFetchLimiter);

// Mount routes after rate limiters
app.use('/api/gemini-proxy', geminiRoutes);
app.use('/api', dataRoutes); // Mounts routes for /weather, /soil, etc.

// --- Root Route for Health Check ---
app.get('/', (req, res) => {
  res.send('Fedai Backend Proxy is running.');
});

module.exports = app;
