
import React from 'react';
import { useDataContext } from './DataContext.tsx';
import { useLocalizationContext } from './LocalizationContext.tsx';
import { MapPinIcon, InformationCircleIcon } from '../icons';
import LoadingSpinner from './ui/LoadingSpinner.tsx'; // Updated path
import Tooltip from './ui/Tooltip.tsx'; // Updated path

const LocationSection: React.FC = () => {
  const {
    locationPermission,
    locationStatusMessage,
    isLoadingLocation,
    requestLocationPermission,
  } = useDataContext();
  const { uiStrings } = useLocalizationContext();

  const determineLocationMessageColor = () => {
    if (locationStatusMessage === uiStrings.locationGpsSuccessMessage) return 'text-[var(--status-green-text)] font-medium';
    if (locationStatusMessage === uiStrings.locationIpSuccessMessage) return 'text-[var(--status-yellow-text)] font-medium';
    if (locationStatusMessage === uiStrings.locationPermissionPromptMessage || locationStatusMessage === uiStrings.locationStatusFetching) return 'text-[var(--status-blue-text)]';
    if (locationStatusMessage === uiStrings.locationPermissionDeniedUserMessage || 
        locationStatusMessage === uiStrings.locationPermissionUnavailableUserMessage ||
        locationStatusMessage === uiStrings.locationErrorGeneral ||
        (locationStatusMessage && (locationStatusMessage.includes(uiStrings.ipLocationFailed) || locationStatusMessage.includes(uiStrings.locationStatusError) ))
    ) return 'text-[var(--status-red-text)]';
    return 'text-[var(--text-secondary)]';
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
      {locationPermission === 'prompt' && (
        <div className="space-y-4">
          <p className="location-prompt-card text-sm p-4 rounded-md">{uiStrings.locationPermissionPromptMessage}</p>
          <button
            onClick={requestLocationPermission}
            className="btn btn-primary w-full text-sm py-2.5"
            disabled={isLoadingLocation}
            aria-label={uiStrings.requestLocationPermissionButton}
          >
            {isLoadingLocation ? <LoadingSpinner className="w-4 h-4 inline mr-2" /> : null}
            {uiStrings.requestLocationPermissionButton}
          </button>
        </div>
      )}
      {locationStatusMessage && (
         <div 
           className={`text-sm p-1 ${determineLocationMessageColor()} flex items-center`}
           aria-live="polite"
           aria-atomic="true"
         >
          {isLoadingLocation && locationPermission !== 'prompt' && <LoadingSpinner className="w-4 h-4 inline mr-2" />}
          <span>{locationStatusMessage}</span>
        </div>
      )}
    </section>
  );
};

export default LocationSection;
