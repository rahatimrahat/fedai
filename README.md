

# Fedai: Plant Health AI 🌿

**Fedai** is an intelligent assistant designed to help you understand and improve your plant's health. By leveraging advanced image analysis and federated data (like your location, local weather, and soil characteristics), Fedai provides contextual insights and actionable solutions. The application focuses on an efficient, non-login, and cached data access experience.

## For General Users

### What can Fedai do?
- **Analyze Plant Photos:** Upload a photo of a plant, and Fedai will try to identify potential diseases or issues.
- **Provide Contextual Information:** Fedai uses your location (with your permission) to fetch local weather and environmental data, which helps in making a more accurate diagnosis.
- **Offer Solutions:** Based on the analysis, Fedai suggests cultural, biological, or chemical solutions, along with estimated budgets and application notes.
- **Technical Assessment:** Understand how Fedai arrived at its conclusions with a detailed technical breakdown.
- **Multi-language Support:** The app is available in multiple languages.

### How to Use Fedai
1.  **Start Diagnosis:** Click the "Start Plant Diagnosis" button on the home screen.
2.  **Upload or Capture an Image:**
    *   You can upload an image of the affected plant from your device.
    *   Alternatively, you can use your device's camera to capture a new photo.
    *   Follow the **Photo Guidelines** for best results (good lighting, clear focus on affected parts, etc.).
3.  **Optional Description:** Add any extra details about the plant's condition or symptoms in the text area. This can help Fedai make a better assessment.
4.  **Grant Location Permission (Recommended):**
    *   Fedai will ask for your location permission. Granting this allows the app to fetch local weather and environmental data, leading to a much more accurate and relevant analysis.
    *   If you deny permission or if it's unavailable, Fedai will try to use an approximate IP-based location, or proceed with limited contextual data.
5.  **Analyze:** Click the "Analyze" button.
    *   Fedai will go through a pipeline: Image Processing, Fetching Location, Fetching Environment Data, and AI Analysis. You'll see this progress in a modal.
    *   The AI Analysis step now communicates with a backend proxy (a separate application you'll need to run), which securely handles the Google Gemini API interaction.
6.  **View Results:**
    *   Once the analysis is complete, you'll see a card with the diagnosis.
    *   **Summary Tab:** Shows the disease name (if any), definition, confidence level, and a technical assessment from Fedai.
    *   **Solutions Tab:** Lists recommended solutions (cultural, biological, chemical), with details on application, example product types, and estimated budget.
    *   **Technical Details Tab:** Provides possible causes, differential diagnoses (other possibilities Fedai considered), and notes if data like location or weather was used in the assessment.
7.  **Follow-up Questions:** If Fedai needs more information for a diagnosis, it might ask a follow-up question. Provide your answer and submit it for a revised analysis.
8.  **Service Status:** The footer of the app shows the current status of the various services Fedai relies on (Location, Weather, AI Proxy, etc.).

### Tips for Best Results
*   **High-Quality Photos:** Clear, well-lit photos focusing on the symptoms are crucial. Use the in-app photo guidelines.
*   **Enable Location Services:** This significantly improves the accuracy of the diagnosis by providing local context.
*   **Provide Details:** The more information you give about the plant's symptoms and conditions, the better Fedai can assist you.

## For Technical Users

### Project Overview
Fedai is a modern web application built with React and TypeScript. It leverages the Google Gemini API (via a backend proxy) for its core AI-driven plant health analysis. The frontend is designed to be responsive, accessible, and provide a smooth user experience.
For development, it uniquely uses `esm.sh/tsx` and an import map for on-the-fly TSX compilation directly in the browser, eliminating the need for a separate build step during development.

**Key Technologies (Frontend - Development Setup):**
*   **React 19:** For building the user interface.
*   **TypeScript:** For static typing and improved code quality.
*   **Tailwind CSS:** For utility-first styling.
*   **Framer Motion:** For animations.
*   **Import Maps & esm.sh/tsx:** Allows running TypeScript/TSX directly in the browser by resolving module imports from `esm.sh`. This is the current development approach.

### Backend Proxy (Separate Application)
The Fedai frontend application is designed to make API calls to a backend proxy (e.g., at `/api/gemini-proxy`). This proxy is responsible for securely communicating with the Google Gemini API.

**Why a Backend Proxy?**
*   **Security:** Your `GEMINI_API_KEY` must **never** be exposed in client-side JavaScript. The backend proxy keeps your API key secure on the server.
*   **Control:** Allows for server-side logic, logging, and easier management of API interactions with Gemini and other external services (like weather, elevation, etc.).

**The backend proxy is a separate Node.js application. Please refer to the `backend-proxy/README.md` file within this project for detailed setup and running instructions for Linux, Windows, and macOS.**

### Setting Up and Running the Fedai Ecosystem

You'll need to run two main parts:
1.  **The Backend Proxy Server:** Follow the instructions in `backend-proxy/README.md`. Ensure it's running, typically on `http://localhost:3001`.
2.  **The Fedai Frontend Application:** (This codebase) Follow the instructions below.

#### Running the Fedai Frontend Application (Development)

**Prerequisites for Frontend Development:**
*   A modern web browser (Chrome, Firefox, Edge recommended).
*   A text editor (like VS Code).
*   Node.js and npm (primarily for `npx serve`, though other simple HTTP servers work too).

**Steps for Development:**

1.  **Get the Frontend Application Code:**
    *   If you haven't already, clone or download and extract the Fedai frontend application files into its own directory (e.g., `fedai-frontend-app`).

2.  **Run the Frontend Application (Using a Local HTTP Server):**
    The application uses `esm.sh/tsx` for on-the-fly compilation, so you just need to serve the `index.html` file via an HTTP server.
    Opening `index.html` directly via `file:///` protocol **will not work** due to browser security restrictions with ES modules and API requests.
    *   **Using Node.js `serve` (Recommended):**
        *   Open a terminal or command prompt.
        *   Navigate to the Fedai frontend application's root directory (the one containing `index.html`).
        *   If you don't have `serve` installed globally, you can run it using `npx`:
            ```bash
            npx serve
            ```
        *   This will typically start a server on `http://localhost:3000` (or another available port). Note the URL.
    *   **Using Python (Alternative):**
        *   Open a terminal.
        *   Navigate to the Fedai frontend application's root directory.
        *   Run (for Python 3):
            ```bash
            python3 -m http.server
            ```
            Or (for Python 2):
            ```bash
            python -m SimpleHTTPServer
            ```
        *   This usually starts a server on `http://localhost:8000`. Note the URL.
    *   **Other HTTP Servers:** Any simple static file server will work.

3.  **Use the Application:**
    *   Ensure your Backend Proxy Server is running (e.g., on `http://localhost:3001`).
    *   Open the URL provided by your local HTTP server (e.g., `http://localhost:3000`) in your browser.
    *   The frontend will make API calls to relative paths like `/api/gemini-proxy`, `/api/weather`, etc. These are expected to be handled by your running Backend Proxy. The proxy's CORS settings in `backend-proxy/server.js` are configured to allow requests from common frontend development ports (like 3000, 8000, 5173). If your frontend server uses a different port, you may need to add it to the `corsOptions.origin` array in `backend-proxy/server.js` and restart the proxy.

#### Production Build
While the `esm.sh/tsx` setup is excellent for rapid development and simplicity by avoiding a local build step, a typical production deployment involves a build process.
If you have a `package.json` with build scripts (e.g., using Vite), the general steps for creating a production build would be:

1.  **Install Dependencies:**
    If you haven't already, open a terminal in the Fedai frontend application's root directory and run:
    ```bash
    npm install
    ```
    This installs any necessary development tools and libraries defined in `package.json`.

2.  **Build the Application:**
    Run the build script, commonly:
    ```bash
    npm run build
    ```
    This command will typically compile TypeScript, bundle all JavaScript modules, minify assets, and output the optimized static files into a `dist` directory (or a similar folder like `build`).

3.  **Deploy:**
    The contents of the `dist` directory are what you would deploy to your web hosting service (e.g., Vercel, Netlify, AWS S3, Firebase Hosting, or any static site host).

This process results in a highly optimized version of the application suitable for serving to end-users.

### Frontend Codebase Structure & File Descriptions
(This section describes the files within the Fedai frontend application)

#### Root Directory
*   **`index.html`**:
    *   The main HTML entry point. Includes Tailwind CSS, custom styles, import maps, and loads `esm.sh/tsx` for on-the-fly TSX compilation.
*   **`index.tsx`**:
    *   React application entry point, sets up context providers, and renders the `App` component.
*   **`App.tsx`**:
    *   Root React component, handles main layout, view switching (Diagnosis vs. Management Dashboard), and initial diagnosis flow.
*   **`metadata.json`**:
    *   Application metadata (name, description, permissions).
*   **`theme.css`**:
    *   Global styles, CSS variables, Tailwind directives, light/dark mode themes.
*   **`types.ts`**:
    *   Centralized TypeScript type definitions.
*   **`localization.ts`**:
    *   Language definitions and UI string translations.
*   **`constants.ts`**:
    *   Application-wide constants (cache keys, image configs, timeouts). External API URLs have been removed as they are now managed by the backend proxy.

---
#### `components/` Directory
Contains reusable UI components for the frontend.
*   `LanguageSelector.tsx`, `ImageInput.tsx`, `DiseaseResultCard.tsx`, `ServiceStatusFooter.tsx`, `AnalysisFlowController.tsx` (orchestrates image input and the display of contextual data sections like Location, Weather, and Environment, along with the analysis results), `PipelineVisualization.tsx`, `PhotoGuidelines.tsx`, `BackendServicesDashboard.tsx`.
*   **Sub-directory `contextual/` (Components for displaying contextual data):**
    *   `WeatherSection.tsx`, `EnvironmentalSection.tsx`. (Note: `LocationSection.tsx` is directly in `components/`).
*   **`icons/`**: Contains static SVG icons and the animated `UnfurlingLeafIcon.tsx`.
*   **Sub-directory `ui/` (General UI Elements):**
    *   `LoadingSpinner.tsx`, `BounceIn.tsx`, `Tooltip.tsx`, `TypingText.tsx`, `SoilTextureVisualizer.tsx`, `Tab.tsx`, `Tabs.tsx`, `Modal.tsx`.
*   **Sub-directory `analysis/` (Analysis-Specific Components):**
    *   `ConfidenceGauge.tsx`.
*   **Context Providers:**
    *   `LocalizationContext.tsx`, `DataContext.tsx`, `AnalysisContext.tsx`.

---
#### `hooks/` Directory
Custom React Hooks for frontend logic and state.
*   `useServiceStatus.ts` (tests proxied external services and the AI proxy status).
*   `useLocationLogic.ts`.
*   `useContextualData.ts`.
*   `useElementScroll.ts`, `useModalAccessibility.ts`, `useFocusOnCondition.ts`.

---
#### `services/` Directory
Modules for interacting with the backend proxy and managing frontend caching.
*   **`cache.ts`**: New utility for generic caching logic.
*   `ipLocationService.ts`, `weatherService.ts`, `elevationService.ts`, `soilService.ts`: These now call the backend proxy endpoints (e.g., `/api/weather`) and use the `cache.ts` utility for client-side caching of proxy responses.
*   **`geminiService.ts`**:
    *   Constructs payloads to be sent to the backend proxy at `/api/gemini-proxy`. (Prompt construction is now handled by the backend).
    *   Handles responses and errors received from this proxy.
    *   The `testGeminiService` function pings a status endpoint on the proxy (`/api/gemini-proxy/status`).

### Future Considerations
*   **Robust Backend Proxy:** The example proxy is functional. For production, enhance it with more robust error handling, security measures (input validation, rate limiting), logging, and deploy it to a suitable hosting platform (e.g., Vercel Functions, Netlify Functions, Google Cloud Run, AWS Lambda, or a traditional server).
*   **Error Reporting:** Implement a comprehensive error reporting service (e.g., Sentry) for both frontend and backend.
*   **Comprehensive Testing:** Add unit, integration, and end-to-end tests.
