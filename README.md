# Fedai: Plant Health AI 🌿

**Fedai is an intelligent assistant designed to help you understand and improve your plant's health.** By leveraging advanced image analysis and contextual data (like your location, local weather, and soil characteristics), Fedai provides insightful analysis and actionable solutions.

This project is composed of two main parts:
*   A **frontend application** (React/TypeScript) whose files are located primarily in the root directory (e.g., `App.tsx`, `index.html`, `components/`, `services/`, `hooks/`, etc.).
*   A **backend proxy server** located in the `fedai-backend-proxy/` directory.

## For Everyone: What is Fedai?

Imagine you have a plant that looks sick, but you're not sure what's wrong or how to help it. Fedai is like having a knowledgeable gardening assistant in your pocket!

*   **Snap a Photo:** Take a picture of your plant.
*   **Get Insights:** Fedai analyzes the photo and, if you allow it, uses your location to consider local environmental factors.
*   **Understand the Problem:** It identifies potential diseases or issues.
*   **Find Solutions:** Fedai suggests ways to treat your plant, including different approaches and estimated costs.

It's designed to be easy to use, even if you don't know much about plant diseases or technology.

## For Technical Users: Project Overview

Fedai is a web application with the following components:

*   **Frontend Application:** A React/TypeScript application that provides the user interface. Users interact with this part to upload images, view analysis, and get recommendations. Most of its source code (`App.tsx`, `index.html`, `index.tsx`, `components/`, `hooks/`, `services/`, `pages/`, `package.json` etc.) is located in the project root.
    *   [Learn more about the Frontend](./FRONTEND_README.md)
*   **Backend Proxy Server:** A Node.js Express server that securely communicates with the Google Gemini API for the core AI-driven plant health analysis. It also handles requests for other external data like weather and soil information. This is located in the `fedai-backend-proxy/` directory.
    *   [Learn more about the Backend](./fedai-backend-proxy/README.md)

**Why this structure?**
*   **Security:** The backend proxy ensures that sensitive information, like API keys, is never exposed to the user's browser.
*   **Modularity:** While the frontend files are in the root, the backend is a distinct module. This separation helps manage complexity.
*   **Efficiency:** The frontend can focus on user experience, while the backend handles complex computations and external API interactions.

## Getting Started

1.  **For Users:** If you want to use Fedai, you'll typically access a deployed version of the application through your web browser.
2.  **For Developers:** If you want to contribute to or run a local version of Fedai:
    *   First, set up and run the [Backend Proxy Server](./fedai-backend-proxy/README.md) (located in `fedai-backend-proxy/`).
    *   Then, set up and run the [Frontend Application](./FRONTEND_README.md) (files located in the project root).

## Key Features

*   **AI-Powered Image Analysis:** Identifies plant health issues from images.
*   **Contextual Data Integration:** Uses location, weather, and soil data for more accurate diagnoses.
*   **Actionable Solutions:** Provides cultural, biological, and chemical treatment options.
*   **User-Friendly Interface:** Designed for ease of use.
*   **Multi-language Support.**

We hope Fedai helps you keep your plants healthy and thriving!
