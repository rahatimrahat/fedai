# Fedai: Plant Health AI 🌿

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/rahatimrahat/fedai/releases)
[![Tests](https://img.shields.io/badge/tests-22%20passing-brightgreen.svg)](https://github.com/rahatimrahat/fedai)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue.svg)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-purple.svg)](https://vitejs.dev)

**Fedai is an intelligent assistant designed to help you understand and improve your plant's health.** By leveraging advanced image analysis and contextual data (like your location, local weather, and soil characteristics), Fedai provides insightful analysis and actionable solutions.

## ✨ Key Features

- 🤖 **AI-Powered Diagnosis** - Multi-provider support (Gemini, OpenRouter, Local AI)
- 📸 **Image Analysis** - Advanced plant disease detection from photos
- 🌍 **Environmental Context** - Location, weather, soil, and elevation data
- 🌐 **Multi-Language** - Support for multiple languages
- 📊 **Real-Time Monitoring** - Service health status dashboard
- 🎨 **Modern UI** - Responsive design with smooth animations
- 🧪 **Well-Tested** - Comprehensive test suite with 22 passing tests
- 🐳 **Docker Ready** - Easy deployment with Docker Compose

## 📁 Repository Structure

This project uses an **intentional monorepo structure**:

```
fedai/
├── 📂 Frontend (Root Directory)
│   ├── components/        # React components
│   ├── contexts/          # React contexts (AI Settings, etc.)
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Page components
│   ├── providers/         # AI provider implementations
│   ├── services/          # API service clients
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   ├── App.tsx            # Main app component
│   ├── index.tsx          # React entry point
│   ├── index.html         # HTML entry with import maps
│   ├── types.ts           # Centralized types
│   ├── constants.ts       # App constants
│   ├── localization.ts    # Multi-language support
│   ├── theme.css          # Global styles
│   └── package.json       # Frontend dependencies
│
├── 📂 fedai-backend-proxy/  # Backend API Server
│   ├── src/
│   │   ├── api/           # Controllers, routes, middleware
│   │   ├── services/      # AI provider services
│   │   └── utils/         # Backend utilities
│   ├── server.js          # Server entry point
│   └── package.json       # Backend dependencies
│
├── 📂 docs/               # Comprehensive documentation
│   ├── QUICKSTART.md      # 3-step setup guide
│   ├── DEPLOYMENT.md      # Production deployment
│   ├── AI_PROVIDER_SETUP.md
│   └── ...
│
└── 📝 Configuration Files
    ├── docker-compose.yml     # Production Docker setup
    ├── docker-compose.dev.yml # Development Docker setup
    ├── render.yaml            # Render deployment config
    ├── vite.config.ts         # Vite bundler config
    └── tsconfig.json          # TypeScript config
```

**Why frontend in root?** This structure supports our unique dev approach using `esm.sh/tsx` for browser-based TypeScript compilation during development, while using Vite for optimized production builds.

## For Everyone: What is Fedai?

Imagine you have a plant that looks sick, but you're not sure what's wrong or how to help it. Fedai is like having a knowledgeable gardening assistant in your pocket!

*   **Snap a Photo:** Take a picture of your plant.
*   **Get Insights:** Fedai analyzes the photo and, if you allow it, uses your location to consider local environmental factors.
*   **Understand the Problem:** It identifies potential diseases or issues.
*   **Find Solutions:** Fedai suggests ways to treat your plant, including different approaches and estimated costs.

It's designed to be easy to use, even if you don't know much about plant diseases or technology.

## 🏗️ Architecture

Fedai is a full-stack web application with clear separation of concerns:

### **Frontend (Root Directory)**
- **Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS
- **Features:** Image upload, AI settings, multi-language support, real-time analysis
- **Location:** All source files in root directory (see structure above)
- **Unique Approach:** Uses `esm.sh/tsx` for dev + Vite for production builds
- 📖 [Frontend Documentation](docs/FRONTEND_README.md)

### **Backend Proxy (fedai-backend-proxy/)**
- **Tech Stack:** Node.js, Express, multi-provider AI integration
- **Purpose:** Secure API key management, external service orchestration
- **Services:**
  - AI Providers (Gemini, OpenRouter, Local AI)
  - Weather data (Open-Meteo)
  - Soil data (SoilGrids)
  - Plant database (OpenPlantBook)
- 📖 [Backend Documentation](fedai-backend-proxy/README.md)

### **Why This Structure?**
✅ **Security:** API keys never exposed to browser
✅ **Modularity:** Clear backend/frontend separation
✅ **Flexibility:** Support for multiple AI providers
✅ **Developer Experience:** Simplified dev workflow with hot reload

## 🚀 Quick Start

### For Users
Access the deployed application at [your-deployment-url] (coming soon)

### For Developers
Get started in 3 steps - see **[QUICKSTART.md](QUICKSTART.md)**

```bash
# 1. Clone and setup backend
cd fedai-backend-proxy
npm install
# Add API keys to .env file

# 2. Setup frontend (in separate terminal)
cd ..
npm install

# 3. Run both services
npm run dev          # Frontend (http://localhost:5173)
cd fedai-backend-proxy && npm start  # Backend (http://localhost:3001)
```

### Using Docker
```bash
docker-compose -f docker-compose.dev.yml up
# Frontend: http://localhost:5173
# Backend: http://localhost:3001
```

📖 **Full Documentation:**
- [Quick Start Guide](QUICKSTART.md) - 3-step setup
- [AI Provider Setup](docs/AI_PROVIDER_SETUP.md) - Configure Gemini/OpenRouter/Local AI
- [Deployment Guide](docs/DEPLOYMENT.md) - Deploy to Render
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues

## Key Features

*   **AI-Powered Image Analysis:** Identifies plant health issues from images.
*   **Contextual Data Integration:** Uses location, weather, and soil data for more accurate diagnoses.
*   **Actionable Solutions:** Provides cultural, biological, and chemical treatment options.
*   **User-Friendly Interface:** Designed for ease of use.
*   **Multi-language Support.**

We hope Fedai helps you keep your plants healthy and thriving!
