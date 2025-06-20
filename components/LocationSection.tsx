
import React from 'react';
import { useDataContext } from './DataContext.tsx';
import { useLocalizationContext } from './LocalizationContext.tsx';
import { MapPinIcon, InformationCircleIcon } from '@/components/icons';
import LoadingSpinner from './ui/LoadingSpinner.tsx';
import Tooltip from './ui/Tooltip.tsx';

const LocationSection: React.FC = () => {
  const {
    userLocation, // Destructure userLocation
    status,       // Add status
    error,        // Add error
    // fetchDeviceLocation, // Available from context if a button is needed here
  } = useDataContext();
  const { uiStrings } = useLocalizationContext();

  const renderContent = () => {
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
          <p className="text-sm p-1 text-[var(--status-blue-text)]">
            {uiStrings.locationPermissionPromptMessage}
          </p>
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
          <p className="text-sm p-1 text-[var(--status-red-text)]">
            {error || uiStrings.locationPermissionDeniedUserMessage}
          </p>
        );
      case 'error-fetch':
      case 'error-ip-fetch':
        return (
          <p className="text-sm p-1 text-[var(--status-red-text)]">
            {error || uiStrings.locationErrorGeneral}
          </p>
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
