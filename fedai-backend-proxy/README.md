# Fedai Backend Proxy Server

This Node.js Express server acts as a backend proxy for the Fedai Plant Health AI frontend application. The frontend application files are located in the main project root directory (see [../FRONTEND_README.md](../FRONTEND_README.md) for details on the frontend).

The primary purposes of this backend proxy are:
1.  To securely handle API requests to the Google Gemini API, keeping the API key confidential.
2.  To proxy requests to other external services (e.g., weather, soil data, elevation) to avoid CORS issues and centralize data fetching logic.

This README provides instructions for setting up and running this backend proxy server. For an overview of the entire Fedai project, please see the [main project README](../README.md).

## Prerequisites

Before you begin, ensure you have the following installed on your system:

*   **Node.js:** Version 18.x or later is recommended. Node.js includes `npm` (Node Package Manager).
    *   **Download Node.js:** [https://nodejs.org/](https://nodejs.org/)
    *   **Verification:** Open your terminal and type:
        ```bash
        node -v
        npm -v
        ```

## Setup Instructions

1.  **Navigate to the Backend Directory:**
    *   This backend proxy server is located in the `fedai-backend-proxy` sub-directory of the main project. Navigate into it:
        ```bash
        cd path/to/your/fedai-project/fedai-backend-proxy
        ```

2.  **Install Dependencies:**
    In your terminal, within this `fedai-backend-proxy` directory, run:
    ```bash
    npm install
    ```

3.  **Create `.env` File for API Key and Configuration:**
    *   Create a file named `.env` in this `fedai-backend-proxy` root directory.
    *   Add your Google Gemini API key and desired port:
        ```env
        GEMINI_API_KEY=YOUR_ACTUAL_GEMINI_API_KEY_HERE
        PORT=3001
        # Add other API keys if needed for proxied services
        ```
    *   Replace `YOUR_ACTUAL_GEMINI_API_KEY_HERE` with your real API key.
    *   **Important:** This `.env` file should be listed in the `.gitignore` file in this directory.

4.  **Review `.gitignore` File:**
    Ensure that `.env` and `node_modules/` are included in the `.gitignore` file.

## Running the Backend Proxy

1.  **Open your Terminal.**
2.  **Navigate to this `fedai-backend-proxy` Directory.**
3.  **Start the Server:**
    ```bash
    npm start
    ```
    This command executes `node server.js`.

4.  **Verify:**
    You should see output similar to:
    ```
    Fedai Backend Proxy listening on port 3001
    Frontend (running from project root) should call this proxy at http://localhost:3001/api/*
    ```
    Keep this terminal window open while using the Fedai frontend application.

## API Endpoints

The proxy exposes several endpoints under the `/api` path:

*   **`/api/gemini-proxy` (POST):** Forwards requests to the Google Gemini API.
*   **`/api/gemini-proxy/status` (GET):** Checks Gemini API status.
*   **`/api/weather` (GET):** Proxies requests to a weather service.
*   **`/api/soil` (GET):** Proxies requests to a soil data service.
*   **`/api/elevation` (GET):** Proxies requests to an elevation service.
*   **`/api/ip-location` (GET):** Provides approximate location via IP.

Refer to `src/api/routes/` and `src/api/controllers/` for details.

## CORS Configuration

The `server.js` (or `src/app.js`) includes CORS configuration. It's typically set to allow requests from frontend development server origins like `http://localhost:3000`, `http://localhost:5173` (Vite default), etc.
If your frontend server runs on a different port, add its origin to the CORS settings in the backend and restart the proxy. For production, configure the origin to your deployed frontend's domain.

## Development Notes

*   Manage all secrets and configurations via the `.env` file.
*   For production, enhance error handling, logging, and security.

## Stopping the Server
Press `Ctrl+C` in the terminal where the server is running.
