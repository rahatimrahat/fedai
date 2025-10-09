# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fedai is an AI-powered plant health diagnostic application that uses Google Gemini API for image analysis. The project consists of two main components:

1. **Frontend** (React/TypeScript) - All frontend code is in the **project root** directory
2. **Backend Proxy** (Node.js/Express) - Located in `fedai-backend-proxy/` subdirectory

The frontend communicates with the backend proxy, which securely handles API calls to Google Gemini and other external services (weather, soil data, elevation, OpenPlantBook).

## Development Setup

### Frontend (Root Directory)

```bash
# Install dependencies
npm install

# Start development server (Vite, typically runs on http://localhost:5173)
npm run dev

# Run tests
npm test

# Lint code
npm lint

# Format code
npm run format

# Build for production
npm run build

# Preview production build
npm preview
```

### Backend Proxy (fedai-backend-proxy/)

```bash
# Navigate to backend directory
cd fedai-backend-proxy

# Install dependencies
npm install

# Create .env file with required API keys:
# GEMINI_API_KEY=your_key_here
# OPEN_PLANTBOOK_API_KEY=your_key_here
# PORT=3001

# Start backend server (runs on http://localhost:3001)
npm start
```

### Docker Deployment

```bash
# Run both frontend and backend using Docker Compose
docker-compose up

# Frontend will be available at http://localhost:3000
# Backend will be available at http://localhost:3001
```

## Architecture

### Frontend Architecture (Root Directory)

The frontend uses a unique development approach with `esm.sh/tsx` for on-the-fly TSX compilation in the browser during development, while using Vite for production builds.

**Key Directories:**
- `components/` - React components organized by feature
  - `components/analysis/` - Analysis-specific components
  - `components/contextual/` - Contextual data display components
  - `components/icons/` - Icon components
  - `components/ui/` - Reusable UI primitives
- `hooks/` - Custom React hooks (e.g., `useContextualData.ts`, `useLocationLogic.ts`, `useServiceStatus.ts`)
- `services/` - Frontend services that communicate with backend proxy
  - `geminiService.ts` - Google Gemini API proxy calls
  - `weatherService.ts` - Weather data fetching
  - `soilApi.ts` - Soil data fetching
  - `elevationService.ts` - Elevation data fetching
  - `plantApi.ts` - OpenPlantBook API calls
  - `ipLocationService.ts` - IP-based location service
  - `cache.ts` - Client-side caching logic
- `pages/` - Page-level components
- `types/` - TypeScript type definitions directory
- `utils/` - Utility functions

**Key Files:**
- `App.tsx` - Root React component with lazy loading for BackendServicesDashboard
- `index.tsx` - React application entry point
- `index.html` - HTML entry point with import maps
- `types.ts` - Centralized TypeScript types
- `localization.ts` - Multi-language support with UI strings
- `constants.ts` - Frontend constants
- `theme.css` - Global styles, CSS variables, Tailwind directives
- `vite.config.ts` - Vite configuration with path aliases (`@/` points to root)
- `tsconfig.json` - TypeScript configuration

**State Management:**
- Context API is used throughout (see `AnalysisContext.tsx`, `DataContext.tsx`, `LocalizationContext.tsx`)
- No external state management library (Redux, Zustand, etc.)

### Backend Proxy Architecture (fedai-backend-proxy/)

The backend is a simple Express server that acts as a secure proxy to keep API keys confidential.

**Structure:**
- `server.js` - Entry point that loads and starts the Express app
- `src/app.js` - Express app configuration with CORS, rate limiting, and route mounting
- `src/api/controllers/` - Request handlers for different API endpoints
- `src/api/routes/` - Route definitions
- `src/api/utils/` - Utility functions for backend

**API Endpoints (all under `/api`):**
- `/api/gemini-proxy` (POST) - Forwards requests to Google Gemini API
- `/api/gemini-proxy/status` (GET) - Checks Gemini API status
- `/api/weather` (POST) - Proxies weather service requests
- `/api/soil` (POST) - Proxies soil data requests
- `/api/elevation` (POST) - Proxies elevation service requests
- `/api/plant/:id` (GET) - Fetches plant data from OpenPlantBook API
- `/api/ip-location` (GET) - Provides IP-based location

**CORS Configuration:**
The backend allows requests from:
- `http://localhost:3000`, `http://127.0.0.1:3000` (common dev servers)
- `http://localhost:5173`, `http://127.0.0.1:5173` (Vite default)
- `http://localhost:8000`, `http://127.0.0.1:8000` (Python server)
- `https://*.onrender.com` (production)

If you run the frontend on a different port, add it to the `corsOptions.origin` array in `fedai-backend-proxy/src/app.js` and restart the backend.

## Development Workflow

### Running the Full Application

1. **Start backend first:**
   ```bash
   cd fedai-backend-proxy
   npm start
   ```

2. **Then start frontend** (in a separate terminal):
   ```bash
   npm run dev
   ```

3. The frontend (http://localhost:5173) will communicate with the backend (http://localhost:3001)

### Path Aliases

The project uses `@/` as an alias pointing to the project root:
- `@/components/` resolves to `<root>/components/`
- `@/hooks/` resolves to `<root>/hooks/`
- `@/services/` resolves to `<root>/services/`
- etc.

This is configured in both `vite.config.ts` and `tsconfig.json`.

## Testing

Frontend tests use Vitest and React Testing Library:
- Test files are colocated with components (e.g., `LocationSection.test.tsx`)
- Run tests: `npm test`
- Test setup: `vitest.setup.ts`
- Test config: `vitest.config.ts`

## Code Quality

The project uses:
- **ESLint** - Linting with React and TypeScript rules
- **Prettier** - Code formatting
- **Husky** - Git hooks (runs lint-staged on commit)
- **lint-staged** - Runs Prettier and ESLint on staged files before commit

Pre-commit hooks automatically format and lint code.

## Localization

Multi-language support is implemented in `localization.ts` with translations for multiple languages. The `LocalizationContext` provides `uiStrings` throughout the app.

## Important Notes

- **API Keys:** Never commit API keys. The backend uses `.env` file for secrets (already in `.gitignore`)
- **Security:** The backend proxy exists specifically to keep API keys out of the frontend bundle
- **Frontend File Location:** Unlike typical monorepos, the frontend code lives in the root directory, not in a `frontend/` subdirectory
- **Development Mode:** The app uses `esm.sh/tsx` for browser-based TSX compilation during development, which is unconventional but allows for a simple dev setup
- **Production Builds:** Use Vite (`npm run build`) for optimized production bundles
- **Service Status:** The app includes real-time service status monitoring (see `ServiceStatusFooter.tsx` and `useServiceStatus.ts`)

## Common Development Tasks

### Adding a New Component

Place it in `components/` with appropriate subdirectory:
- UI primitives → `components/ui/`
- Analysis features → `components/analysis/`
- Icons → `components/icons/`
- General components → `components/`

### Adding a New Backend Endpoint

1. Create controller in `fedai-backend-proxy/src/api/controllers/`
2. Create route in `fedai-backend-proxy/src/api/routes/`
3. Mount route in `fedai-backend-proxy/src/app.js`
4. Create corresponding service in frontend `services/` directory

### Modifying Frontend-Backend Communication

- Frontend services are in `services/` directory
- They call endpoints like `/api/gemini-proxy`, `/api/weather`, etc.
- The backend proxy handles CORS and forwards to external APIs
- Check `cache.ts` for client-side caching behavior
