
import React from 'react';
import { useDataContext } from './DataContext.tsx';
import { useLocalizationContext } from './LocalizationContext.tsx';
import { MapPinIcon, InformationCircleIcon } from '@/components/icons';
import LoadingSpinner from './ui/LoadingSpinner.tsx';
import Tooltip from './ui/Tooltip.tsx';

const LocationSection: React.FC = () => {
  const {
    userLocation,
    locationStatusMessage: status, // Renamed and using actual status from context
    locationPermission, // Added to potentially refine error messages if needed
    fetchDeviceLocation,
    fetchIpLocationData, // Added, though may not be used directly in this change
  } = useDataContext();
  const { uiStrings } = useLocalizationContext();

  const renderContent = () => {
    // The 'error' variable was mentioned in the old code comments but doesn't exist in DataContext.
    // We'll rely on 'status' and 'locationPermission' for error handling.
    // For 'error-fetch' and 'error-ip-fetch', a generic message is shown if specific 'error' prop isn't available.

    switch (status) {
      case 'idle':
      case 'checking-permission':
        return (
          <div className="flex items-center text-sm p-1 text-[var(--text-secondary)]">
            <LoadingSpinner className="w-4 h-4 inline mr-2" />
            <span>{uiStrings.locationStatusCheckingPermission || 'Checking permission...'}</span>
          </div>
        );
      case 'awaiting-permission':
        return (
          <div className="text-sm p-1 text-[var(--status-blue-text)]">
            <p className="font-semibold text-base mb-2">{uiStrings.locationPermissionTitle}</p>
            <p className="mb-3">{uiStrings.locationPermissionPromptMessage}</p>
            <button
              onClick={() => fetchDeviceLocation()}
              className="mt-2 px-4 py-2 text-sm font-medium text-white bg-[var(--primary-500)] rounded-md hover:bg-[var(--primary-600)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-500)]"
            >
              {uiStrings.shareLocationButton || "Share My Location"}
            </button>
          </div>
        );
      case 'fetching-ip':
      case 'fetching-gps':
        return (
          <div className="flex items-center text-sm p-1 text-[var(--text-secondary)]">
            <LoadingSpinner className="w-4 h-4 inline mr-2" />
            <span>{uiStrings.locationStatusFetching}</span>
          </div>
        );
      case 'success':
        return (
          <p className="text-sm p-1 text-[var(--status-green-text)] font-medium">
            {userLocation?.accuracyMessage}
          </p>
        );
      case 'error-permission':
        return (
          <div className="text-sm p-1 text-[var(--status-red-text)]">
            <p>{uiStrings.locationPermissionDeniedUserMessage}</p>
            <button
              onClick={() => fetchDeviceLocation()}
              className="mt-2 px-4 py-2 text-sm font-medium text-white bg-[var(--accent-red-600)] rounded-md hover:bg-[var(--accent-red-700)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-red-600)]"
            >
              {uiStrings.tryAgainButton || "Try Again"}
            </button>
          </div>
        );
      case 'error-fetch':
      case 'error-ip-fetch':
        return (
          <div className="text-sm p-1 text-[var(--status-red-text)]">
            <p>{uiStrings.locationErrorGeneral}</p>
            <button
              onClick={() => fetchDeviceLocation()}
              className="mt-2 px-4 py-2 text-sm font-medium text-white bg-[var(--accent-red-600)] rounded-md hover:bg-[var(--accent-red-700)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-red-600)]"
            >
              {uiStrings.tryAgainButton || "Try Again"}
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section className="card p-6 h-full">
      <div className="flex items-center mb-4">
        <MapPinIcon className="w-6 h-6 text-[var(--primary-500)] mr-3" />
        <h2 className="text-xl font-semibold text-[var(--text-headings)] flex items-center">
          {uiStrings.locationInfoTitle}
          <Tooltip content={uiStrings.whyLocationImportantContent} position="top" idSuffix="loc-info-tooltip">
            <InformationCircleIcon className="w-5 h-5 ml-2 text-[var(--text-secondary)] hover:text-[var(--accent-teal)] cursor-help" aria-label={uiStrings.whyLocationImportantTitle} />
          </Tooltip>
        </h2>
      </div>
      <div aria-live="polite" aria-atomic="true">
        {renderContent()}
      </div>
    </section>
  );
};

export default LocationSection;
