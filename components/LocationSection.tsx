
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

  // Debug logging
  console.log('[LocationSection] Render - status:', status, 'userLocation:', userLocation, 'permission:', locationPermission);

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
          <div className="space-y-3">
            {/* Location Display */}
            <div className="bg-[var(--status-green-bg)] border border-[var(--status-green)] rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[var(--status-green-text)] mb-2">
                    📍 {userLocation?.city || uiStrings.locationUnknown || 'Unknown Location'}
                    {userLocation?.country && `, ${userLocation.country}`}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] font-mono">
                    {userLocation?.latitude.toFixed(4)}°, {userLocation?.longitude.toFixed(4)}°
                  </p>
                </div>
                <div className="ml-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--status-green)] text-white">
                    {userLocation?.source === 'gps' ? '🎯 GPS' : '🌐 IP'}
                  </span>
                </div>
              </div>
              {userLocation?.accuracyMessage && (
                <p className="text-xs text-[var(--status-green-text)] mt-2 italic">
                  {userLocation.accuracyMessage}
                </p>
              )}
            </div>

            {/* Contextual Data Status */}
            <div className="text-xs text-[var(--text-secondary)] pl-1">
              {uiStrings.locationSuccessInfo || 'Weather and soil data will be loaded based on this location.'}
            </div>
          </div>
        );
      case 'error-permission':
        return (
          <div className="bg-[var(--status-red-bg)] border border-[var(--status-red)] rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">🚫</span>
              <div className="flex-1">
                <p className="font-semibold text-sm text-[var(--status-red-text)] mb-1">
                  {uiStrings.locationPermissionDenied || 'Location Access Blocked'}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mb-3">
                  {uiStrings.locationPermissionDeniedUserMessage}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mb-3">
                  <strong>{uiStrings.reasonLabel || 'Reason:'}:</strong> {uiStrings.locationPermissionDeniedReason || 'Browser location permission denied. Enable it in your browser settings to use GPS location.'}
                </p>
                <button
                  onClick={() => fetchDeviceLocation()}
                  className="mt-2 px-4 py-2 text-sm font-medium text-white bg-[var(--accent-red-600)] rounded-md hover:bg-[var(--accent-red-700)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-red-600)]"
                >
                  {uiStrings.tryAgainButton || "Try Again"}
                </button>
              </div>
            </div>
          </div>
        );
      case 'error-fetch':
        return (
          <div className="bg-[var(--status-red-bg)] border border-[var(--status-red)] rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <p className="font-semibold text-sm text-[var(--status-red-text)] mb-1">
                  {uiStrings.locationErrorFetch || 'GPS Location Failed'}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mb-3">
                  <strong>{uiStrings.reasonLabel || 'Reason'}:</strong> {uiStrings.locationErrorFetchReason || 'Failed to retrieve GPS coordinates. This could be due to device settings or browser limitations.'}
                </p>
                <button
                  onClick={() => fetchIpLocationData()}
                  className="mt-2 px-4 py-2 text-sm font-medium text-white bg-[var(--primary-500)] rounded-md hover:bg-[var(--primary-600)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-500)]"
                >
                  {uiStrings.useIpLocationButton || "Use IP-Based Location Instead"}
                </button>
              </div>
            </div>
          </div>
        );
      case 'error-ip-fetch':
        return (
          <div className="bg-[var(--status-red-bg)] border border-[var(--status-red)] rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">🌐❌</span>
              <div className="flex-1">
                <p className="font-semibold text-sm text-[var(--status-red-text)] mb-1">
                  {uiStrings.locationErrorIpFetch || 'IP Location Failed'}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mb-3">
                  <strong>{uiStrings.reasonLabel || 'Reason'}:</strong> {uiStrings.locationErrorIpFetchReason || 'Unable to detect location from your IP address. This might be due to VPN usage, network issues, or IP geolocation service unavailability.'}
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => fetchDeviceLocation()}
                    className="mt-2 px-4 py-2 text-sm font-medium text-white bg-[var(--primary-500)] rounded-md hover:bg-[var(--primary-600)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-500)]"
                  >
                    {uiStrings.tryGpsButton || "Try GPS Location"}
                  </button>
                  <button
                    onClick={() => fetchIpLocationData()}
                    className="mt-2 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--surface-secondary)] rounded-md hover:bg-[var(--surface-tertiary)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-500)]"
                  >
                    {uiStrings.retryButton || "Retry IP Location"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        // Fallback for unknown status - show loading state
        console.warn('[LocationSection] Unknown status:', status);
        return (
          <div className="flex items-center text-sm p-1 text-[var(--text-secondary)]">
            <LoadingSpinner className="w-4 h-4 inline mr-2" />
            <span>{uiStrings.locationStatusFetching || 'Loading location...'}</span>
            <span className="ml-2 text-xs opacity-70">(Status: {status || 'undefined'})</span>
          </div>
        );
    }
  };

  const content = renderContent();

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
        {content || (
          <div className="text-sm text-[var(--status-yellow-text)] p-4 bg-[var(--status-yellow-bg)] rounded">
            ⚠️ Location content not rendering. Status: {status || 'undefined'}, Location: {userLocation ? 'Available' : 'None'}
          </div>
        )}
      </div>
    </section>
  );
};

export default LocationSection;
