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
  origin: ['http://localhost:3000', 'http://localhost:8000', 'http://127.0.0.1:3000', 'http://127.0.0.1:8000', 'http://localhost:5173', 'https://*.onrender.com', 'http://127.0.0.1:5173'], // Added common Vite port
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.set('trust proxy', 1); // Trust the first proxy
app.use(express.json({ limit: '10mb' }));

// Apply rate limiting to all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(limiter);

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

app.use('/api/gemini-proxy', geminiRoutes);
app.use('/api', dataRoutes); // Mounts routes for /weather, /soil, etc.

// --- Root Route for Health Check ---
app.get('/', (req, res) => {
  res.send('Fedai Backend Proxy is running.');
});

module.exports = app;
