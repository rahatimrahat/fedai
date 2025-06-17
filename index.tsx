
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { LocalizationProvider } from './components/LocalizationContext.tsx';
import { DataProvider } from './components/DataContext.tsx';
import { AnalysisProvider } from './components/AnalysisContext.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx'; // Import ErrorBoundary

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <LocalizationProvider>
        <DataProvider>
          <AnalysisProvider>
            <App />
          </AnalysisProvider>
        </DataProvider>
      </LocalizationProvider>
    </ErrorBoundary>
  </React.StrictMode>
);