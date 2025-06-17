
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import { LocalizationProvider } from '@/components/LocalizationContext';
import { DataProvider } from '@/components/DataContext';
import { AnalysisProvider } from '@/components/AnalysisContext';
import ErrorBoundary from '@/components/ErrorBoundary';

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
