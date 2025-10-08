// fedai-backend-proxy/src/app.enhanced.js
// Enhanced version with endpoint-specific rate limiting and environment-based CORS

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

// Import endpoint-specific rate limiters
const {
  geminiLimiter,
  dataLimiter,
  statusLimiter,
  globalLimiter,
  ipLocationLimiter
} = require('./middleware/rateLimiter');

// --- Initialize Express App ---
const app = express();

// --- CORS Configuration (Environment-based) ---
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

let allowedOrigins = [];

if (isDevelopment) {
  // Development: Allow common dev server ports
  allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:8000'
  ];
} else if (isProduction) {
  // Production: Only allow specific production domains
  const productionDomain = process.env.FRONTEND_URL;
  if (productionDomain) {
    allowedOrigins = [productionDomain];
  } else {
    console.warn('WARNING: FRONTEND_URL not set in production environment. CORS may not work correctly.');
    allowedOrigins = ['https://fedai.app']; // Fallback, replace with actual domain
  }
} else {
  // Staging or other environments
  allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:5173'];
}

console.log(`CORS allowed origins (${process.env.NODE_ENV || 'development'}):`, allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));

// Apply global rate limiter to all requests (fallback)
app.use(globalLimiter);

// --- Initialize Gemini AI Client ---
const apiKey = process.env.GEMINI_API_KEY;
let ai;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
  console.log('Gemini AI client initialized successfully.');
} else {
  console.warn('WARNING: GEMINI_API_KEY is not defined. AI-related endpoints will not function correctly.');
}

// --- Import Controllers ---
const geminiController = require('./api/controllers/gemini.controller')(ai);

// Use cached controller if caching is enabled
const useCaching = process.env.ENABLE_CACHING !== 'false'; // Default to true
const dataController = useCaching
  ? require('./api/controllers/data.controller.cached')
  : require('./api/controllers/data.controller');

console.log(`Data caching: ${useCaching ? 'ENABLED' : 'DISABLED'}`);

// --- Import Routers ---
const geminiRoutes = require('./api/routes/gemini.routes')(geminiController);
const dataRoutes = require('./api/routes/data.routes');

// --- Mount Routes with Specific Rate Limiters ---

// Gemini routes with strict rate limiting
app.use('/api/gemini-proxy', geminiLimiter, geminiRoutes);

// Data routes with moderate rate limiting
app.use('/api/weather', dataLimiter, dataRoutes);
app.use('/api/soil', dataLimiter, dataRoutes);
app.use('/api/elevation', dataLimiter, dataRoutes);

// IP location with its own limiter
app.use('/api/ip-location', ipLocationLimiter, dataRoutes);

// Plant data with moderate limits
app.use('/api/plant', dataLimiter, dataRoutes);

// General /api routes (catch-all)
app.use('/api', dataRoutes);

// --- Cache Stats Endpoint (if caching is enabled) ---
if (useCaching) {
  app.get('/api/cache/stats', statusLimiter, dataController.getCacheStatsEndpoint);
}

// --- Health Check Endpoints ---
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    service: 'Fedai Backend Proxy',
    environment: process.env.NODE_ENV || 'development',
    caching: useCaching,
    timestamp: new Date().toISOString()
  });
});

app.get('/health', statusLimiter, (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    features: {
      caching: useCaching,
      geminiAI: !!ai
    }
  });
});

// --- Error Handling Middleware ---
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS policy: This origin is not allowed',
      errorKey: 'CORS_ERROR'
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    errorKey: 'INTERNAL_ERROR',
    message: isDevelopment ? err.message : undefined
  });
});

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    errorKey: 'NOT_FOUND',
    path: req.path
  });
});

module.exports = app;
