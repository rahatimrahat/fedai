# Fedai Frontend Application

This document provides details for the frontend part of the **Fedai: Plant Health AI** project. The frontend is a React/TypeScript application that provides the user interface for analyzing plant health.

All frontend source files (e.g., `App.tsx`, `index.html`, `package.json`, `components/`, `hooks/`, `services/`) are located in the project's root directory.

## For General Users (Using the Frontend)

### What can this app do?
- **Analyze Plant Photos:** Upload a photo of a plant, and Fedai will try to identify potential diseases or issues.
- **Provide Contextual Information:** The app uses your location (with your permission) to fetch local weather and environmental data, which helps in making a more accurate diagnosis.
- **Offer Solutions:** Based on the analysis, Fedai suggests cultural, biological, or chemical solutions, along with estimated budgets and application notes.
- **Technical Assessment:** Understand how Fedai arrived at its conclusions with a detailed technical breakdown.
- **Multi-language Support:** The app is available in multiple languages.

### How to Use This App
1.  **Start Diagnosis:** Click the "Start Plant Diagnosis" button on the home screen.
2.  **Upload or Capture an Image:**
    *   You can upload an image of the affected plant from your device.
    *   Alternatively, you can use your device's camera to capture a new photo.
    *   Follow the **Photo Guidelines** for best results (good lighting, clear focus on affected parts, etc.).
3.  **Optional Description:** Add any extra details about the plant's condition or symptoms in the text area. This can help make a better assessment.
4.  **Grant Location Permission (Recommended):**
    *   The app will ask for your location permission. Granting this allows it to fetch local weather and environmental data, leading to a much more accurate and relevant analysis.
    *   If you deny permission or if it's unavailable, it will try to use an approximate IP-based location, or proceed with limited contextual data.
5.  **Analyze:** Click the "Analyze" button.
    *   The app will go through a pipeline: Image Processing, Fetching Location, Fetching Environment Data, and AI Analysis. You'll see this progress in a modal.
    *   The AI Analysis step communicates with the backend proxy (see [Backend Proxy README](./fedai-backend-proxy/README.md)), which securely handles the Google Gemini API interaction.
6.  **View Results:**
    *   Once the analysis is complete, you'll see a card with the diagnosis.
    *   **Summary Tab:** Shows the disease name (if any), definition, confidence level, and a technical assessment.
    *   **Solutions Tab:** Lists recommended solutions (cultural, biological, chemical), with details on application, example product types, and estimated budget.
    *   **Technical Details Tab:** Provides possible causes, differential diagnoses (other possibilities considered), and notes if data like location or weather was used in the assessment.
7.  **Follow-up Questions:** If more information is needed for a diagnosis, the app might ask a follow-up question. Provide your answer and submit it for a revised analysis.
8.  **Service Status:** The footer of the app shows the current status of the various services it relies on (Location, Weather, AI Proxy, etc.).

### Tips for Best Results
*   **High-Quality Photos:** Clear, well-lit photos focusing on the symptoms are crucial. Use the in-app photo guidelines.
*   **Enable Location Services:** This significantly improves the accuracy of the diagnosis by providing local context.
*   **Provide Details:** The more information you give about the plant's symptoms and conditions, the better the assistance.

## For Technical Users & Developers

### Frontend Project Overview
This frontend is a modern web application built with React and TypeScript. It leverages the Google Gemini API (via the [Fedai Backend Proxy](./fedai-backend-proxy/README.md)) for its core AI-driven plant health analysis. The frontend is designed to be responsive, accessible, and provide a smooth user experience.
For development, it uniquely uses `esm.sh/tsx` and an import map for on-the-fly TSX compilation directly in the browser, eliminating the need for a separate build step during development.

**Key Technologies (Frontend - Development Setup):**
*   **React 19:** For building the user interface.
*   **TypeScript:** For static typing and improved code quality.
*   **Tailwind CSS:** For utility-first styling.
*   **Framer Motion:** For animations.
*   **Import Maps & esm.sh/tsx:** Allows running TypeScript/TSX directly in the browser by resolving module imports from `esm.sh`. This is the current development approach.

### Backend Proxy Requirement
The Fedai frontend application is designed to make API calls to a backend proxy (e.g., at `/api/gemini-proxy`). This proxy is responsible for securely communicating with the Google Gemini API.

**You must have the [Fedai Backend Proxy](./fedai-backend-proxy/README.md) set up and running for this frontend application to function correctly.** The backend proxy is located in the `fedai-backend-proxy/` subdirectory.

### Setting Up and Running the Frontend Application (Development)

**Prerequisites for Frontend Development:**
*   A modern web browser (Chrome, Firefox, Edge recommended).
*   A text editor (like VS Code).
*   Node.js and npm (primarily for `npx serve` or Vite's dev server).

**Steps for Development:**

1.  **Get the Project Code:**
    *   Ensure you have cloned or downloaded the entire Fedai project. All frontend files are in the root directory.

2.  **Ensure Backend Proxy is Running:**
    *   Follow the instructions in the [Backend Proxy README](./fedai-backend-proxy/README.md) (in `fedai-backend-proxy/`) to start the proxy server. It typically runs on `http://localhost:3001`.

3.  **Run the Frontend Application:**
    There are two main ways to run the frontend for development:

    *   **A. Using Vite Dev Server (Recommended for active development if `package.json` scripts are set up):**
        *   Open a terminal or command prompt in the project's root directory (where `package.json` and `vite.config.ts` are).
        *   Install dependencies:
            ```bash
            npm install
            ```
        *   Start the Vite dev server (check `package.json` for the exact script, usually `dev`):
            ```bash
            npm run dev
            ```
        *   This will typically start a server on `http://localhost:5173` (or another available port) and provide Hot Module Replacement (HMR). Note the URL.

    *   **B. Using a Simple HTTP Server (for `esm.sh/tsx` direct browser compilation):**
        The application's `index.html` uses `esm.sh/tsx` for on-the-fly compilation, so you can serve `index.html` via any simple HTTP server.
        Opening `index.html` directly via `file:///` protocol **will not work** due to browser security restrictions with ES modules and API requests.
        *   **Using Node.js `serve`:**
            *   Open a terminal or command prompt in the project's root directory.
            *   If you don't have `serve` installed globally, you can run it using `npx`:
                ```bash
                npx serve
                ```
            *   This will typically start a server on `http://localhost:3000`. Note the URL.
        *   **Using Python (Alternative):**
            *   Open a terminal in the project's root directory.
            *   Run (for Python 3): `python3 -m http.server` or (for Python 2): `python -m SimpleHTTPServer`.
            *   This usually starts a server on `http://localhost:8000`.

4.  **Use the Application:**
    *   Ensure your Backend Proxy Server is running (e.g., on `http://localhost:3001`).
    *   Open the URL provided by your chosen development server (e.g., `http://localhost:5173` or `http://localhost:3000`) in your browser.
    *   The frontend will make API calls to relative paths like `/api/gemini-proxy`, `/api/weather`, `/api/plant/:id`, etc. These are expected to be handled by your running Backend Proxy. The proxy's CORS settings are configured to allow requests from common frontend development ports. If your frontend server uses a different port, you may need to add it to the `corsOptions.origin` array in the backend's `server.js` and restart the proxy.

#### Production Build
While the `esm.sh/tsx` setup is excellent for simplicity, a typical production deployment involves a build process using Vite.

1.  **Install Dependencies:**
    Open a terminal in the project's root directory and run:
    ```bash
    npm install
    ```
    This installs any necessary development tools and libraries defined in `package.json`.

2.  **Build the Application:**
    Run the build script (usually defined in `package.json`):
    ```bash
    npm run build
    ```
    This command will typically compile TypeScript, bundle all JavaScript modules, minify assets, and output the optimized static files into a `dist` directory in the project root.

3.  **Deploy:**
    The contents of the `dist` directory are what you would deploy to your web hosting service (e.g., Vercel, Netlify, AWS S3, Firebase Hosting, or any static site host).

### Frontend Codebase Structure & File Descriptions (All in Project Root)

*   **`index.html`**: Main HTML entry point. Includes Tailwind CSS, custom styles, import maps, and loads `esm.sh/tsx`.
*   **`index.tsx`**: React application entry point.
*   **`App.tsx`**: Root React component.
*   **`package.json`**: Defines frontend dependencies and scripts (build, dev server).
*   **`vite.config.ts`**: Configuration for the Vite build tool and dev server.
*   **`tsconfig.json`**: TypeScript compiler options.
*   **`metadata.json`**: Application metadata.
*   **`theme.css`**: Global styles, CSS variables, Tailwind directives.
*   **`types.ts`**: Centralized TypeScript type definitions.
*   **`localization.ts`**: Language definitions and UI string translations.
*   **`constants.ts`**: Frontend-specific constants.
*   **`components/`**: Directory for reusable UI components.
*   **`hooks/`**: Directory for custom React Hooks.
*   **`services/`**: Directory for modules interacting with the backend proxy and managing frontend caching.
*   **`pages/`**: Directory, likely for page-level components or client-side API routes (e.g., `pages/api/ip-location.ts`).
*   **`LICENSE`**: Project license (applies to both frontend and backend).
*   **`FRONTEND_README.md`**: This file.
*   **`README.md`**: Main project README.

### Future Considerations
*   **Error Reporting:** Implement a comprehensive error reporting service (e.g., Sentry) for the frontend.
*   **Comprehensive Testing:** Add more unit, integration, and end-to-end tests for frontend components and user flows.
