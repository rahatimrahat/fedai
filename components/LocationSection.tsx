
import React from 'react';
import { useDataContext, UserLocation } from './DataContext.tsx'; // Added UserLocation for type clarity if needed, though not strictly for this change
import { useLocalizationContext } from './LocalizationContext.tsx';
import { MapPinIcon, InformationCircleIcon } from '@/components/icons';
import LoadingSpinner from './ui/LoadingSpinner.tsx'; // Updated path
import Tooltip from './ui/Tooltip.tsx'; // Updated path

const LocationSection: React.FC = () => {
  const {
    locationPermission,
    locationStatusMessage,
    isLoadingLocation,
    userLocation, // Destructure userLocation
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
      {/*
        The button and specific message for 'prompt' state are removed.
        The component now relies on locationStatusMessage from the context
        to inform the user about automatic location fetching attempts.
      */}
      {locationStatusMessage && (
         <div 
           className={`text-sm p-1 ${determineLocationMessageColor()} flex items-center`}
           aria-live="polite"
           aria-atomic="true"
         >
          {/*
            The condition for the spinner is kept as is.
            When locationPermission is 'prompt', isLoadingLocation will be true due to automatic fetching,
            and locationStatusMessage will display "Attempting to automatically fetch..." or similar.
            If a spinner is desired *specifically next to this message* during 'prompt',
            the condition `locationPermission !== 'prompt'` would need adjustment.
            For now, the global loading state handled by isLoadingLocation should be sufficient.
          */}
          {isLoadingLocation && locationPermission !== 'prompt' && <LoadingSpinner className="w-4 h-4 inline mr-2" />}
          <span>{locationStatusMessage}</span>
          {/* Conditional span for additional feedback on location determination failure */}
          {!isLoadingLocation && userLocation === null && (locationStatusMessage === uiStrings.locationErrorGeneral || (locationStatusMessage && locationStatusMessage.includes(uiStrings.ipLocationFailed))) && (
            <span className="block mt-1 text-xs text-[var(--text-accent)]">
              This means the app cannot provide location-specific information.
            </span>
          )}
        </div>
      )}
    </section>
  );
};

export default LocationSection;
