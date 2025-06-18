
import { useState, useEffect, useCallback } from 'react';
import { type UserLocation, type LocationPermissionState } from '@/types';
import { fetchIpLocation } from '@/services/ipLocationService';
import { useLocalizationContext } from '@/components/LocalizationContext.tsx';
import { GEOLOCATION_HIGH_ACCURACY_TIMEOUT_MS, GEOLOCATION_MAXIMUM_AGE_MS } from '../constants';


export function useLocationLogic() {
  const { uiStrings } = useLocalizationContext(); 
  const [locationPermission, setLocationPermission] = useState<LocationPermissionState>('initial');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationStatusMessage, setLocationStatusMessage] = useState<string>('');
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false);

  const fetchIpLocationData = useCallback(async (isEnrichmentOnly = false) => {
    if (userLocation?.source === 'gps' && !isEnrichmentOnly) {
        return;
    }

    setIsLoadingLocation(true);
    // Message for initial IP fetch is set by the caller (useEffect)
    // Only set "fetching IP" here if it's an enrichment call and no more specific message is already present.
    if (isEnrichmentOnly &&
        (!locationStatusMessage ||
         locationStatusMessage === uiStrings.locationPermissionDeniedUserMessage ||
         locationStatusMessage === uiStrings.locationPermissionUnavailableUserMessage)) {
        setLocationStatusMessage(uiStrings.fetchingIpLocation); // Or a more specific "enriching location" message
    } else if (!isEnrichmentOnly && locationPermission === 'initial') {
        // This is the very first fetch. Caller (useEffect) sets "Fetching approximate location..."
        // No need to set here, to avoid quick flash if useEffect's message is slightly different.
    }
    
    const { location, serviceName, error } = await fetchIpLocation();
    if (location && serviceName) {
      const ipLocationWithDetail: UserLocation = {
        ...location, 
        accuracyMessage: uiStrings.locationStatusSuccessIp(location.city || 'Unknown City', location.country || 'Unknown Country', serviceName)
      };

      if (isEnrichmentOnly && userLocation?.source === 'gps') {
          // This is IP enrichment for an existing GPS location.
          setUserLocation(prevGpsLocation => ({
              ...prevGpsLocation!,
              city: ipLocationWithDetail.city,
              country: ipLocationWithDetail.country,
              countryCode: ipLocationWithDetail.countryCode,
              // Keep the GPS accuracy message as primary, but enrich data
              accuracyMessage: prevGpsLocation?.accuracyMessage
          }));
          // Do not change global status message here, GPS success message should be dominant.
      } else {
          // This is an initial IP fetch or a fallback IP fetch.
          setUserLocation(ipLocationWithDetail);
          // Now, set status message carefully based on current permission state and existing location data
          if (locationPermission === 'prompt') {
              // IP fetch succeeded while permission is 'prompt'. User may grant GPS next.
              // Message: "Approximate location found ([City, Country] via [Service]). Please respond to the browser's location permission request."
              setLocationStatusMessage(`${ipLocationWithDetail.accuracyMessage}. ${uiStrings.locationStatusAttemptingAutoFetch || uiStrings.locationPermissionPromptMessage}`);
          } else if (locationPermission === 'granted' && userLocation?.source !== 'gps') {
              // IP fetch succeeded, permission is 'granted', but we don't have GPS yet (or GPS failed after initial grant).
              // This means we are trying/should be trying to get GPS, so message indicates approximate found while fetching precise.
              // Message: "Approximate location found ([City, Country] via [Service]). Fetching precise location..."
              setLocationStatusMessage(`${ipLocationWithDetail.accuracyMessage}. ${uiStrings.locationStatusFetching}`);
          } else if (locationPermission !== 'granted' || userLocation?.source === 'gps') {
              // Case 1: Permission is NOT 'granted' (e.g., 'denied', 'unavailable', 'initial', 'checking').
              //         In this scenario, IP location is the best we can get, or it's an update to an existing IP location.
              // Case 2: Permission IS 'granted', AND we ALREADY have a GPS location (userLocation.source === 'gps').
              //         This IP fetch was likely an unnecessary fallback (if GPS is stable) or an enrichment that already happened.
              //         The primary message should remain GPS-based if GPS was successful.
              //         However, if GPS previously failed and this IP fetch is a fallback, this message is appropriate.
              // Message: "Approximate location found ([City, Country] via [Service])."
              setLocationStatusMessage(ipLocationWithDetail.accuracyMessage);
          }
          // Note on message overwriting: If userLocation.source was already 'gps' (e.g. GPS failed and this IP fetch is a fallback),
          // the last condition `userLocation?.source === 'gps'` (evaluating true if GPS data exists, regardless of its success)
          // ensures the IP accuracy message is set if this IP fetch is providing the current location.
          // This is generally fine as the GPS error handler in fetchDeviceLocation would have already set a message indicating GPS failure.
      }
    } else {
      // Error fetching IP location
      let baseErrorMessage = uiStrings.locationErrorGeneral;
      if (error && error.toLowerCase().includes('failed to fetch')) {
        baseErrorMessage = `${uiStrings.ipLocationFailed} ${uiStrings.locationErrorGeneral.toLowerCase().replace('could not determine location. p', 'P')} Please check your network settings and browser console for more details.`;
      } else if (error) {
        baseErrorMessage = `${uiStrings.ipLocationFailed}: ${error}`;
      }

      if (locationPermission === 'denied'){
        setLocationStatusMessage(`${uiStrings.locationPermissionDeniedUserMessage} ${baseErrorMessage}`);
      } else if (locationPermission === 'unavailable'){
        setLocationStatusMessage(`${uiStrings.locationPermissionUnavailableUserMessage} ${baseErrorMessage}`);
      } else {
        setLocationStatusMessage(baseErrorMessage);
      }
    }
    setIsLoadingLocation(false);
  }, [uiStrings, userLocation?.source, locationPermission, locationStatusMessage]); // userLocation.accuracyMessage removed as it creates loop


  const fetchDeviceLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationPermission('unavailable');
      setLocationStatusMessage(uiStrings.locationPermissionUnavailableUserMessage);
      fetchIpLocationData(false); 
      return;
    }
    setIsLoadingLocation(true);
    setLocationStatusMessage(uiStrings.locationStatusFetching);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          source: 'gps',
          accuracyMessage: uiStrings.locationStatusSuccessGps(position.coords.latitude, position.coords.longitude),
        };
        setUserLocation(newLocation);
        setLocationPermission('granted');
        setLocationStatusMessage(uiStrings.locationGpsSuccessMessage);
        setIsLoadingLocation(false);
        if (!newLocation.countryCode) { 
            fetchIpLocationData(true); 
        }
      },
      (error) => {
        console.error('[Fedai Location Hook] navigator.geolocation.getCurrentPosition error. Code:', error.code, 'Message:', error.message);
        const isDenied = error.code === error.PERMISSION_DENIED;
        const newPermissionState = isDenied ? 'denied' : 'unavailable';
        setLocationPermission(newPermissionState);
        
        let failureMessage = isDenied ? uiStrings.locationPermissionDeniedUserMessage : uiStrings.locationErrorGeneral;
        if (error.message && error.message.toLowerCase().includes('failed to fetch')) {
          failureMessage += ` (Network error. Check connection & console.)`; // Append network error detail
        }

        // GPS Geolocation attempt failed.
        // Check if we already have a usable IP-based location to use as a fallback.
        if (userLocation?.source === 'ip' && userLocation.accuracyMessage) {
          // Yes, we have a prior IP location. Use it and inform the user.
          if (isDenied) {
            // GPS denied by user, using existing IP data.
            failureMessage = `${uiStrings.locationPermissionDeniedUserMessage}. ${uiStrings.locationStatusPreciseDeniedUsingApproximate ? uiStrings.locationStatusPreciseDeniedUsingApproximate(userLocation.accuracyMessage) : `Using approximate: ${userLocation.accuracyMessage}`}.`;
          } else { // Other GPS error (e.g., timeout, unavailable), using existing IP data.
            failureMessage = `${uiStrings.locationErrorGeneral}. ${uiStrings.locationStatusPreciseFailedUsingApproximate ? uiStrings.locationStatusPreciseFailedUsingApproximate(userLocation.accuracyMessage) : `Using approximate: ${userLocation.accuracyMessage}`}.`;
          }
          setLocationStatusMessage(failureMessage);
          setIsLoadingLocation(false); // Stop loading, as we are using the existing IP fallback.
          // Do NOT call fetchIpLocationData(false) here, as we are relying on the IP data already fetched.
        } else {
          // No prior IP location, or it wasn't successful (e.g. userLocation is null or IP fetch failed).
          // Set a basic failure message based on GPS error, then attempt a new IP location fetch as a fallback.
          setLocationStatusMessage(failureMessage);
          setIsLoadingLocation(false); // Stop loading from GPS attempt.
          fetchIpLocationData(false); // Attempt to get at least an IP location. This will set isLoadingLocation true then false.
        }
      },
      { enableHighAccuracy: false, timeout: 3000, maximumAge: GEOLOCATION_MAXIMUM_AGE_MS } // Options for GPS
    );
  }, [uiStrings, fetchIpLocationData, userLocation]); // Added userLocation to dependency array for reacting to changes in userLocation.accuracyMessage and source.

  // Main effect for initializing location fetching and handling permission changes.
  useEffect(() => {
    let permissionStatusRef: PermissionStatus | null = null;

    // Callback for when the browser's geolocation permission state changes AFTER initial query.
    // This handles cases where the user changes permission from browser settings while the app is open.
    const handlePermissionChange = () => {
      if (permissionStatusRef) {
        const newBrowserStatus = permissionStatusRef.state as LocationPermissionState;
        setLocationPermission(newBrowserStatus); // Update our local permission state.
        setIsLoadingLocation(true); // Assume loading will start or continue due to permission change.

        if (newBrowserStatus === 'granted') {
            // Permission changed to 'granted' (e.g., user allowed it in browser settings after initially denying).
            // Attempt to fetch precise device location and enrich with IP data.
            setLocationStatusMessage(uiStrings.locationStatusFetchingPrecise || uiStrings.locationStatusFetching);
            fetchDeviceLocation();
            fetchIpLocationData(true); // true for enrichment, in case GPS is slow or lacks city/country.
        } else if (newBrowserStatus === 'denied') {
            // Permission changed to 'denied'.
            if (userLocation?.source === 'ip' && userLocation.accuracyMessage) {
                // If we already have an IP location, use that and inform the user they are now using approximate.
                setLocationStatusMessage(`${uiStrings.locationPermissionDeniedUserMessage}. ${uiStrings.locationStatusPreciseDeniedUsingApproximate ? uiStrings.locationStatusPreciseDeniedUsingApproximate(userLocation.accuracyMessage) : `Using approximate: ${userLocation.accuracyMessage}`}.`);
                setIsLoadingLocation(false); // Stop loading, using existing IP.
            } else {
                // No IP location available, set denied message and attempt to fetch IP as a fallback.
                setLocationStatusMessage(uiStrings.locationPermissionDeniedUserMessage);
                fetchIpLocationData(false); // false for primary fetch. This will manage isLoadingLocation.
            }
        } else if (newBrowserStatus === 'prompt'){
            // Permission changed to 'prompt' (e.g., user reset it from 'denied' or 'granted').
            // Clear current location and show a message prompting for interaction.
            // The main effect logic (handleStatusBasedOnIp) will then call fetchDeviceLocation if this state is encountered on load.
            // If changed while app is open, this prepares for a potential new fetch sequence.
            setLocationStatusMessage(uiStrings.locationPermissionPromptMessage);
            setUserLocation(null); // Clear previous location as its source might no longer be valid.
            setIsLoadingLocation(false); // Not actively loading until fetchDeviceLocation is called.
        } else { // 'unavailable' or other states.
            // This case handles if permission changes to 'unavailable' (e.g. location services disabled system-wide).
            if (userLocation?.source === 'ip' && userLocation.accuracyMessage) {
                // GPS unavailable, but we have IP. Use IP.
                setLocationStatusMessage(`${uiStrings.locationPermissionUnavailableUserMessage}. ${uiStrings.locationStatusPreciseUnavailableUsingApproximate ? uiStrings.locationStatusPreciseUnavailableUsingApproximate(userLocation.accuracyMessage) : `Using approximate: ${userLocation.accuracyMessage}`}.`);
                setIsLoadingLocation(false); // Stop loading, using existing IP.
            } else {
                // GPS unavailable and no IP data, set unavailable message and try fetching IP.
                setLocationStatusMessage(uiStrings.locationPermissionUnavailableUserMessage);
                fetchIpLocationData(false); // false for primary fetch. This will manage isLoadingLocation.
            }
        }
      }
    };

    // STEP 1: Handle cases where Permissions API is not supported by the browser.
    // Default to 'unavailable' state and attempt IP-based location.
    if (!navigator.permissions || !navigator.permissions.query) {
      console.warn("[Fedai Location Hook] Permissions API not supported. Defaulting to 'unavailable' and attempting IP-based location.");
      setLocationPermission('unavailable'); // Set local permission state
      setIsLoadingLocation(true); // Start loading indicator
      // Set status message indicating unavailability and attempt to fetch IP location
      setLocationStatusMessage(uiStrings.locationPermissionUnavailableUserMessage + " " + uiStrings.fetchingIpLocation);
      // Fetch IP location data; this function will manage setIsLoadingLocation(false) upon completion/failure.
      fetchIpLocationData(false);
      return; // Exit useEffect as no further permission-based logic can run.
    }

    // STEP 2: Start fetching IP-based location early (non-blocking).
    // This provides a coarse location quickly or as a fallback.
    setIsLoadingLocation(true); // Show loading indicator.
    // Set initial status message indicating that an approximate location is being fetched.
    setLocationStatusMessage(uiStrings.locationStatusFetchingApproximate || uiStrings.fetchingIpLocation);
    // Call fetchIpLocationData (false for primary fetch) and store the promise.
    // This allows chaining further actions after IP fetch completes, without blocking permission query.
    const ipFetchPromise = fetchIpLocationData(false);

    // STEP 3: Query the browser's current geolocation permission status.
    navigator.permissions.query({ name: 'geolocation' }).then((browserPermissionStatus) => {
      permissionStatusRef = browserPermissionStatus; // Store reference for listening to changes.
      const initialBrowserStatus = browserPermissionStatus.state as LocationPermissionState;
      setLocationPermission(initialBrowserStatus); // Update local permission state with the queried status.

      // STEP 4: Define logic to handle location fetching based on the initial permission status,
      // potentially after the initial IP fetch attempt has completed.
      const handleLocationFetchingBasedOnPermission = () => {
        // This function is intended to be called after ipFetchPromise resolves or rejects.
        // isLoadingLocation is managed by individual fetch calls (fetchDeviceLocation, fetchIpLocationData)
        // or set explicitly in terminal error/unavailable states.

        if (initialBrowserStatus === 'granted') {
          // Permission is already granted.
          setIsLoadingLocation(true); // Ensure loading indicator is active for GPS attempt.

          // Determine appropriate status message:
          // If IP fetch already succeeded and set a message like "Approximate found... Fetching precise...", keep it.
          // Otherwise, set a generic "Fetching precise location..." message.
          const ipMessageAlreadyShowsFetchingPrecise = userLocation?.source === 'ip' &&
                                                   locationStatusMessage.includes(userLocation.accuracyMessage || '') &&
                                                   locationStatusMessage.includes(uiStrings.locationStatusFetching);
          if (!ipMessageAlreadyShowsFetchingPrecise) {
            setLocationStatusMessage(uiStrings.locationStatusFetchingPrecise || uiStrings.locationStatusFetching);
          }

          fetchDeviceLocation(); // Attempt to get precise device location.
          fetchIpLocationData(true); // Fetch IP data for enrichment (e.g., city/country for GPS coords).

        } else if (initialBrowserStatus === 'prompt') {
          // Permission is 'prompt', meaning the user will be asked by the browser.
          setIsLoadingLocation(true); // Ensure loading indicator for this phase.

          // Determine appropriate status message:
          // If IP fetch already succeeded and set "Approximate found... Please respond...", keep it.
          // Otherwise, set "Attempting to automatically fetch location..."
          const ipMessageAlreadyShowsPromptInteraction = userLocation?.source === 'ip' &&
                                                      locationStatusMessage.includes(userLocation.accuracyMessage || '') &&
                                                      locationStatusMessage.includes(uiStrings.locationPermissionPromptMessage);
          if (!ipMessageAlreadyShowsPromptInteraction) {
            setLocationStatusMessage(uiStrings.locationStatusAttemptingAutoFetch || uiStrings.locationPermissionPromptMessage);
          }

          fetchDeviceLocation(); // This call will trigger the browser's permission prompt.
                                 // IP data for enrichment will be handled by fetchDeviceLocation's success/error callbacks.

        } else if (initialBrowserStatus === 'denied') {
          // Permission is 'denied'. User has explicitly blocked location access.
          // The ipFetchPromise has already run. fetchIpLocationData handles setting isLoadingLocation(false).
          // It also sets a message like "Permission denied. Using approximate..." if IP was found,
          // or "Permission denied. IP location failed..." if IP fetch also failed.
          // If ipFetchPromise hasn't set a message yet (e.g., it's still running somehow, though unlikely here),
          // set a base message.
          if (!locationStatusMessage.includes(uiStrings.locationPermissionDeniedUserMessage)) {
             const fallbackMessageBase = userLocation?.source === 'ip' ? (userLocation.accuracyMessage || '') : (uiStrings.locationStatusFetchingApproximate || uiStrings.fetchingIpLocation);
             setLocationStatusMessage(`${uiStrings.locationPermissionDeniedUserMessage}. ${fallbackMessageBase}`);
          }
          // isLoadingLocation will be managed by the ipFetchPromise completion.

        } else { // 'unavailable' or other states from permission query.
          // Location services might be unavailable on the device, or another error occurred during permission query.
          // Similar to 'denied', ipFetchPromise has run.
          // If ipFetchPromise hasn't set a message:
          if (!locationStatusMessage.includes(uiStrings.locationPermissionUnavailableUserMessage)) {
            const fallbackMessageBase = userLocation?.source === 'ip' ? (userLocation.accuracyMessage || '') : (uiStrings.locationStatusFetchingApproximate || uiStrings.fetchingIpLocation);
            setLocationStatusMessage(`${uiStrings.locationPermissionUnavailableUserMessage}. ${fallbackMessageBase}`);
          }
          // isLoadingLocation will be managed by the ipFetchPromise completion.
        }
      };

      // Execute the location fetching logic after the initial IP fetch attempt.
      // This ensures that IP data (or failure thereof) is potentially available when deciding further actions.
      // Using .then().catch() ensures handleLocationFetchingBasedOnPermission runs regardless of ipFetchPromise outcome.
      ipFetchPromise.then(handleLocationFetchingBasedOnPermission).catch(handleLocationFetchingBasedOnPermission);

      // STEP 5: Listen for subsequent changes to the permission status.
      browserPermissionStatus.onchange = handlePermissionChange;

    }).catch((err) => {
        // Error occurred during navigator.permissions.query itself.
        console.error('[Fedai Location Hook] Error querying geolocation permission:', err);
        setLocationPermission('unavailable'); // Assume unavailable if query fails.

        // Set a generic error message. The ipFetchPromise might still be running or might have completed.
        // If ipFetchPromise also fails, its error message might overwrite this one, which is acceptable.
        setLocationStatusMessage(uiStrings.locationPermissionUnavailableUserMessage + " " + (uiStrings.locationErrorGeneral || "Could not query permission."));

        // Ensure isLoadingLocation is eventually set to false if ipFetchPromise also fails or has failed.
        ipFetchPromise.finally(() => {
            if (isLoadingLocation) setIsLoadingLocation(false); // Only set if still true.
        });
    });
    
    // Cleanup function for the useEffect hook.
    return () => {
      if (permissionStatusRef) {
        // Remove the event listener when the component unmounts or dependencies change.
        permissionStatusRef.onchange = null;
      }
    };
  }, [uiStrings, fetchDeviceLocation, fetchIpLocationData, userLocation?.source]);
  // userLocation?.source is used to re-evaluate if the source of location changes (e.g. from IP to GPS),
  // though the primary permission flow is init-once or via direct permission status changes.
  
  return {
    userLocation,
    locationPermission,
    locationStatusMessage,
    isLoadingLocation,
    fetchIpLocationData, 
  };
}
