// fedai-backend-proxy/src/app.js

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

// --- Initialize Express App ---
const app = express();

// --- CORS Configuration ---
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:8000', 'http://127.0.0.1:3000', 'http://127.0.0.1:8000', 'http://localhost:5173', 'https://*.onrender.com', 'http://127.0.0.1:5173'], // Added common Vite port
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// --- Initialize Gemini AI Client ---
const apiKey = process.env.GEMINI_API_KEY;
let ai;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
} else {
  // console.warn("GEMINI_API_KEY is not defined. AI-related endpoints will not function correctly.");
}

// --- Import and Mount Routers ---
// We inject the `ai` client into the Gemini controller/router
const geminiController = require('./api/controllers/gemini.controller')(ai);
const geminiRoutes = require('./api/routes/gemini.routes')(geminiController);
const dataRoutes = require('./api/routes/data.routes');

app.use('/api/gemini-proxy', geminiRoutes);
app.use('/api', dataRoutes); // Mounts routes for /weather, /soil, etc.

// --- Root Route for Health Check ---
app.get('/', (req, res) => {
  res.send('Fedai Backend Proxy is running.');
});

module.exports = app;