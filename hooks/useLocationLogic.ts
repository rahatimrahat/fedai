
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
    console.log('[FedaiDebug] useLocationLogic.fetchIpLocationData: Called. isEnrichmentOnly:', isEnrichmentOnly, 'Current userLocation:', userLocation, 'Current permission:', locationPermission);
    if (userLocation?.source === 'gps' && !isEnrichmentOnly) {
        console.log('[FedaiDebug] useLocationLogic.fetchIpLocationData: Skipping IP fetch as GPS location already exists and not enrichment.');
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
    console.log('[FedaiDebug] useLocationLogic.fetchIpLocationData: Raw IP fetch result - Location:', location, 'Service:', serviceName, 'Error:', error);

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
          // Now, set status message carefully based on current permission state
          if (locationPermission === 'prompt') {
              setLocationStatusMessage(`${ipLocationWithDetail.accuracyMessage}. ${uiStrings.locationStatusAttemptingAutoFetch || uiStrings.locationPermissionPromptMessage}`);
          } else if (locationPermission === 'granted' && userLocation?.source !== 'gps') {
              // IP succeeded, but GPS is expected (granted) but not yet successful
              setLocationStatusMessage(`${ipLocationWithDetail.accuracyMessage}. ${uiStrings.locationStatusFetching}`); // "Approximate found. Fetching precise..."
          } else if (locationPermission !== 'granted' || userLocation?.source === 'gps') {
              // If permission is not granted (denied, unavailable) or if GPS already succeeded (this IP fetch was a redundant fallback)
              // then the IP success message is the main one.
              setLocationStatusMessage(ipLocationWithDetail.accuracyMessage);
          }
          // If userLocation.source was already 'gps', this 'else' block means GPS failed and this is a fallback.
          // The accuracyMessage will be set just to the IP success.
      }
    } else {
      // Error fetching IP location
      let baseErrorMessage = uiStrings.locationErrorGeneral;
      if (error && error.toLowerCase().includes('failed to fetch')) {
        baseErrorMessage = `${uiStrings.ipLocationFailed} ${uiStrings.locationErrorGeneral.toLowerCase().replace('could not determine location. p', 'P')} Please check your network settings and browser console for more details.`;
      } else if (error) {
        baseErrorMessage = `${uiStrings.ipLocationFailed}: ${error}`;
      }

      let finalErrorMessage = baseErrorMessage;
      if (locationPermission === 'denied') {
        finalErrorMessage = `${uiStrings.locationPermissionDeniedUserMessage} ${baseErrorMessage}`;
      } else if (locationPermission === 'unavailable') {
        finalErrorMessage = `${uiStrings.locationPermissionUnavailableUserMessage} ${baseErrorMessage}`;
      }
      // No specific prefix if permission is 'initial', 'prompt', or 'granted' but IP fetch still failed.

      // Check if this IP fetch itself failed and if we should use the "all services failed" message.
      if (location == null && !isEnrichmentOnly) { // 'location' is the direct result of this fetchIpLocation() call
        if (userLocation == null) { // Check against the state variable (if nothing was successful before this)
          console.log('[FedaiDebug] useLocationLogic.fetchIpLocationData: IP fetch failed, and no prior location. Setting allServicesFailed message.');
          finalErrorMessage = uiStrings.locationAllServicesFailed;
        } else if (userLocation.source === 'gps') {
          // This case means GPS succeeded, but this IP call (likely for enrichment or an unlikely fallback) failed.
          // The GPS success message should remain. We just log the IP error and ensure loading stops.
          console.error('[FedaiDebug] useLocationLogic.fetchIpLocationData: IP enrichment/fallback failed after GPS success. Error:', error);
          setIsLoadingLocation(false); // Ensure loading stops.
          // Do not change locationStatusMessage from GPS success.
          // Log current state and return.
          console.log('[FedaiDebug] useLocationLogic.fetchIpLocationData: Final state (IP error post-GPS) - UserLocation:', userLocation, 'StatusMessage:', locationStatusMessage, 'IsLoading:', isLoadingLocation);
          return;
        }
      }
      setLocationStatusMessage(finalErrorMessage);
    }
    setIsLoadingLocation(false);
    console.log('[FedaiDebug] useLocationLogic.fetchIpLocationData: Final state - UserLocation:', userLocation, 'StatusMessage:', locationStatusMessage, 'IsLoading:', isLoadingLocation);
  }, [uiStrings, userLocation?.source, locationPermission, locationStatusMessage]); // userLocation.accuracyMessage removed as it creates loop


  const fetchDeviceLocation = useCallback(() => {
    console.log('[FedaiDebug] useLocationLogic.fetchDeviceLocation: Called.');
    if (!navigator.geolocation) {
      console.warn('[FedaiDebug] useLocationLogic.fetchDeviceLocation: Geolocation API not available.');
      setLocationPermission('unavailable');
      setLocationStatusMessage(uiStrings.locationPermissionUnavailableUserMessage);
      fetchIpLocationData(false); // Attempt IP as fallback
      return;
    }
    setIsLoadingLocation(true);
    setLocationStatusMessage(uiStrings.locationStatusFetching); // "Fetching precise location..."
    console.log('[FedaiDebug] useLocationLogic.fetchDeviceLocation: Requesting current position from browser.');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('[FedaiDebug] useLocationLogic.fetchDeviceLocation: GPS success - Position:', position);
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
        console.log('[FedaiDebug] useLocationLogic.fetchDeviceLocation: GPS Success - Final state - UserLocation:', newLocation, 'StatusMessage:', uiStrings.locationGpsSuccessMessage, 'IsLoading:', false);
        if (!newLocation.countryCode) { 
            console.log('[FedaiDebug] useLocationLogic.fetchDeviceLocation: GPS success but no country code, attempting IP enrichment.');
            fetchIpLocationData(true); 
        }
      },
      (error) => {
        console.error('[FedaiDebug] useLocationLogic.fetchDeviceLocation: GPS error - Code:', error.code, 'Message:', error.message);
        const isDenied = error.code === error.PERMISSION_DENIED;
        const newPermissionState = isDenied ? 'denied' : 'unavailable';
        setLocationPermission(newPermissionState);
        
        let failureMessage = isDenied ? uiStrings.locationPermissionDeniedUserMessage : uiStrings.locationErrorGeneral;
        if (error.message && error.message.toLowerCase().includes('failed to fetch')) {
          failureMessage += ` (Network error. Check connection & console.)`; // Append network error detail
        }

        // Check if we already have a usable IP location
        if (userLocation?.source === 'ip' && userLocation.accuracyMessage) {
          if (isDenied) {
            failureMessage = `${uiStrings.locationPermissionDeniedUserMessage}. ${uiStrings.locationStatusPreciseDeniedUsingApproximate ? uiStrings.locationStatusPreciseDeniedUsingApproximate(userLocation.accuracyMessage) : `Using approximate: ${userLocation.accuracyMessage}`}.`;
          } else { // Other GPS error
            failureMessage = `${uiStrings.locationErrorGeneral}. ${uiStrings.locationStatusPreciseFailedUsingApproximate ? uiStrings.locationStatusPreciseFailedUsingApproximate(userLocation.accuracyMessage) : `Using approximate: ${userLocation.accuracyMessage}`}.`;
          }
          setLocationStatusMessage(failureMessage);
          setIsLoadingLocation(false); // We have an IP location to fall back on, so stop loading.
          // Do not call fetchIpLocationData(false) here as we are using existing IP data.
        } else {
          // No prior IP location, or it wasn't successful. Set basic failure message.
          setLocationStatusMessage(failureMessage);
          // setIsLoadingLocation(false) is called before fetchIpLocationData to signal current phase is done.
          // fetchIpLocationData will then set it true again if it runs.
          setIsLoadingLocation(false);
          console.log('[FedaiDebug] useLocationLogic.fetchDeviceLocation: GPS Error - No prior IP. Attempting IP fallback. Final Message before IP fallback:', failureMessage);
          fetchIpLocationData(false); // Attempt to get at least an IP location.
        } else {
           console.log('[FedaiDebug] useLocationLogic.fetchDeviceLocation: GPS Error - Using existing IP. Final Message:', failureMessage, 'UserLocation:', userLocation);
        }
      },
      { enableHighAccuracy: false, timeout: 3000, maximumAge: GEOLOCATION_MAXIMUM_AGE_MS }
    );
  }, [uiStrings, fetchIpLocationData, userLocation]); // Added userLocation to deps of fetchDeviceLocation for the IP fallback logic

  useEffect(() => {
    console.log('[FedaiDebug] useLocationLogic useEffect: Initializing. Current permission state:', locationPermission, 'User location:', userLocation);
    let permissionStatusRef: PermissionStatus | null = null;

    const handlePermissionChange = () => {
      if (permissionStatusRef) {
        const newStatus = permissionStatusRef.state as LocationPermissionState;
        console.log('[FedaiDebug] useLocationLogic.handlePermissionChange: Permission changed to:', newStatus);
        setLocationPermission(newStatus); 
        setIsLoadingLocation(true); // Assume loading will start due to permission change

        if (newStatus === 'granted') {
            console.log('[FedaiDebug] useLocationLogic.handlePermissionChange: Status GRANTED. Fetching device location.');
            setLocationStatusMessage(uiStrings.locationStatusFetchingPrecise || uiStrings.locationStatusFetching);
            fetchDeviceLocation();
            fetchIpLocationData(true); // Fetch IP for enrichment in parallel
        } else if (newStatus === 'denied') {
            console.log('[FedaiDebug] useLocationLogic.handlePermissionChange: Status DENIED.');
            if (userLocation?.source === 'ip' && userLocation.accuracyMessage) {
                const deniedMessage = `${uiStrings.locationPermissionDeniedUserMessage}. ${uiStrings.locationStatusPreciseDeniedUsingApproximate ? uiStrings.locationStatusPreciseDeniedUsingApproximate(userLocation.accuracyMessage) : `Using approximate: ${userLocation.accuracyMessage}`}.`;
                setLocationStatusMessage(deniedMessage);
                console.log('[FedaiDebug] useLocationLogic.handlePermissionChange: Denied, using existing IP. Message:', deniedMessage);
                setIsLoadingLocation(false); // We have IP, not fetching further.
            } else {
                setLocationStatusMessage(uiStrings.locationPermissionDeniedUserMessage);
                console.log('[FedaiDebug] useLocationLogic.handlePermissionChange: Denied, no prior IP. Fetching IP.');
                fetchIpLocationData(false); // This will set isLoadingLocation(false)
            }
        } else if (newStatus === 'prompt'){
            console.log('[FedaiDebug] useLocationLogic.handlePermissionChange: Status PROMPT.');
            setLocationStatusMessage(uiStrings.locationPermissionPromptMessage);
            setUserLocation(null); 
            setIsLoadingLocation(false);
        } else { // 'unavailable' or other states
            console.log('[FedaiDebug] useLocationLogic.handlePermissionChange: Status UNAVAILABLE or other.');
            if (userLocation?.source === 'ip' && userLocation.accuracyMessage) {
                 const unavailableMessage = `${uiStrings.locationPermissionUnavailableUserMessage}. ${uiStrings.locationStatusPreciseUnavailableUsingApproximate ? uiStrings.locationStatusPreciseUnavailableUsingApproximate(userLocation.accuracyMessage) : `Using approximate: ${userLocation.accuracyMessage}`}.`;
                setLocationStatusMessage(unavailableMessage);
                console.log('[FedaiDebug] useLocationLogic.handlePermissionChange: Unavailable, using existing IP. Message:', unavailableMessage);
                setIsLoadingLocation(false); // We have IP, not fetching further.
            } else {
                setLocationStatusMessage(uiStrings.locationPermissionUnavailableUserMessage);
                console.log('[FedaiDebug] useLocationLogic.handlePermissionChange: Unavailable, no prior IP. Fetching IP.');
                fetchIpLocationData(false); // This will set isLoadingLocation(false)
            }
        }
        console.log('[FedaiDebug] useLocationLogic.handlePermissionChange: Final state - UserLocation:', userLocation, 'StatusMessage:', locationStatusMessage, 'IsLoading:', isLoadingLocation);
      }
    };

    // Requirement 1: Initial Coarse Location (and handling for unsupported Permissions API)
    if (!navigator.permissions || !navigator.permissions.query) {
      console.warn("[FedaiDebug] useLocationLogic: Permissions API not supported. Falling back to IP fetch only.");
      setLocationPermission('unavailable');
      setIsLoadingLocation(true);
      setLocationStatusMessage(uiStrings.locationPermissionUnavailableUserMessage + " " + uiStrings.fetchingIpLocation);
      fetchIpLocationData(false).finally(() => setIsLoadingLocation(false));
      return;
    }

    // Start fetching IP location early.
    setIsLoadingLocation(true);
    setLocationStatusMessage(uiStrings.locationStatusFetchingApproximate || uiStrings.fetchingIpLocation);
    console.log('[FedaiDebug] useLocationLogic useEffect: Attempting initial IP location fetch.');
    const ipFetchPromise = fetchIpLocationData(false);

    navigator.permissions.query({ name: 'geolocation' }).then((permissionStatus) => {
      permissionStatusRef = permissionStatus;
      const currentStatus = permissionStatus.state as LocationPermissionState;
      console.log('[FedaiDebug] useLocationLogic useEffect: Permission query result - Status:', currentStatus);
      setLocationPermission(currentStatus); // Set permission state from query

      // Logic after permission query, potentially influenced by ipFetchPromise completion.
      const handleStatusBasedOnIp = () => {
        console.log('[FedaiDebug] useLocationLogic useEffect.handleStatusBasedOnIp: Handling status:', currentStatus, 'after IP fetch attempt. Current userLocation:', userLocation, 'Message:', locationStatusMessage);
        // isLoadingLocation is managed by individual fetch calls or final error states.
        if (currentStatus === 'granted') {
          setIsLoadingLocation(true); // Ensure loading for GPS attempt
          // Message hierarchy:
          // 1. Initial: "Fetching approximate..."
          // 2. IP Success + Granted: "Approximate found. Fetching precise..." (set by fetchIpLocationData)
          // 3. If IP not yet successful OR its message wasn't #2: "Fetching precise location..."
          if (!(userLocation?.source === 'ip' && locationStatusMessage.includes(userLocation.accuracyMessage) && locationStatusMessage.includes(uiStrings.locationStatusFetching))) {
            setLocationStatusMessage(uiStrings.locationStatusFetchingPrecise || uiStrings.locationStatusFetching);
            console.log('[FedaiDebug] useLocationLogic useEffect.handleStatusBasedOnIp GRANTED: Setting status to Fetching Precise.');
          }
          console.log('[FedaiDebug] useLocationLogic useEffect.handleStatusBasedOnIp GRANTED: Attempting to fetch device location (GPS).');
          fetchDeviceLocation();
          fetchIpLocationData(true); // For enrichment
        } else if (currentStatus === 'prompt') {
          setIsLoadingLocation(true); // Ensure loading for GPS attempt via prompt
          // Message hierarchy:
          // 1. Initial: "Fetching approximate..."
          // 2. IP Success + Prompt: "Approximate found. Please respond..." (set by fetchIpLocationData)
          // 3. If IP not yet successful OR its message wasn't #2: "Attempting to auto-fetch..."
          if (!(userLocation?.source === 'ip' && locationStatusMessage.includes(userLocation.accuracyMessage) && locationStatusMessage.includes(uiStrings.locationPermissionPromptMessage))) {
            setLocationStatusMessage(uiStrings.locationStatusAttemptingAutoFetch || uiStrings.locationPermissionPromptMessage);
            console.log('[FedaiDebug] useLocationLogic useEffect.handleStatusBasedOnIp PROMPT: Setting status to Attempting Auto Fetch.');
          }
          console.log('[FedaiDebug] useLocationLogic useEffect.handleStatusBasedOnIp PROMPT: Attempting to fetch device location (GPS).');
          fetchDeviceLocation(); // Triggers prompt
        } else if (currentStatus === 'denied') {
          console.log('[FedaiDebug] useLocationLogic useEffect.handleStatusBasedOnIp DENIED: Handling denied state.');
          console.log('[FedaiDebug] useLocationLogic useEffect.handleStatusBasedOnIp DENIED: Handling denied state.');
          // If ipFetchPromise failed and userLocation is still null, fetchIpLocationData likely set locationAllServicesFailed.
          // We should only add the "Permission Denied" part if a more specific error isn't already present from IP fetch.
          if (userLocation == null && locationStatusMessage === uiStrings.locationAllServicesFailed) {
              // Already the most specific error. No change needed.
              console.log('[FedaiDebug] useLocationLogic useEffect.handleStatusBasedOnIp DENIED: locationAllServicesFailed already set, not overriding.');
          } else if (!locationStatusMessage.includes(uiStrings.locationPermissionDeniedUserMessage)) {
              const baseMsg = userLocation?.source === 'ip' ? userLocation.accuracyMessage : (uiStrings.locationStatusFetchingApproximate || uiStrings.fetchingIpLocation);
              // If userLocation is null and IP fetch failed, baseMsg might be "Fetching approximate".
              // The error from fetchIpLocationData (if it failed, possibly locationAllServicesFailed) is the source of truth.
              // This block should primarily ensure "Permission Denied" is part of the message if IP *succeeded* or is *still fetching*.
              if (userLocation?.source === 'ip' || locationStatusMessage === (uiStrings.locationStatusFetchingApproximate || uiStrings.fetchingIpLocation)) {
                   const deniedMsg = `${uiStrings.locationPermissionDeniedUserMessage}. ${baseMsg}`;
                   setLocationStatusMessage(deniedMsg);
                   console.log('[FedaiDebug] useLocationLogic useEffect.handleStatusBasedOnIp DENIED: Setting combined message:', deniedMsg);
              }
              // If userLocation is null and ipFetchPromise is resolved (meaning it failed and set its own message), we don't overwrite here.
          }
          // fetchIpLocationData (via ipFetchPromise) will call setIsLoadingLocation(false) if it was the one that failed.
        } else { // 'unavailable' or other states
          console.log('[FedaiDebug] useLocationLogic useEffect.handleStatusBasedOnIp UNAVAILABLE/OTHER: Handling state:', currentStatus);
          if (userLocation == null && locationStatusMessage === uiStrings.locationAllServicesFailed) {
              console.log('[FedaiDebug] useLocationLogic useEffect.handleStatusBasedOnIp UNAVAILABLE: locationAllServicesFailed already set, not overriding.');
          } else if (!locationStatusMessage.includes(uiStrings.locationPermissionUnavailableUserMessage)) {
              const baseMsg = userLocation?.source === 'ip' ? userLocation.accuracyMessage : (uiStrings.locationStatusFetchingApproximate || uiStrings.fetchingIpLocation);
              if (userLocation?.source === 'ip' || locationStatusMessage === (uiStrings.locationStatusFetchingApproximate || uiStrings.fetchingIpLocation)) {
                  const unavailableMsg = `${uiStrings.locationPermissionUnavailableUserMessage}. ${baseMsg}`;
                  setLocationStatusMessage(unavailableMsg);
                  console.log('[FedaiDebug] useLocationLogic useEffect.handleStatusBasedOnIp UNAVAILABLE: Setting combined message:', unavailableMsg);
              }
          }
          // fetchIpLocationData (via ipFetchPromise) will call setIsLoadingLocation(false) if it was the one that failed.
        }
        console.log('[FedaiDebug] useLocationLogic useEffect.handleStatusBasedOnIp: Final state for this handler path - UserLocation:', userLocation, 'StatusMessage:', locationStatusMessage, 'IsLoading:', isLoadingLocation);
      };

      // We don't want to block permission handling on IP fetch, but message setting might depend on it.
      // The modified fetchIpLocationData tries to set context-aware messages.
      // The logic here is a fallback or refiner for those messages.
      // No need for ipFetchPromise.finally to manage isLoadingLocation here, individual fetches do that.
      ipFetchPromise.then(handleStatusBasedOnIp).catch(handleStatusBasedOnIp); // Run regardless of IP fetch outcome initially.

      permissionStatus.onchange = handlePermissionChange;
    }).catch((err) => {
        console.error('[FedaiDebug] useLocationLogic useEffect: Error querying geolocation permission:', err);
        setLocationPermission('unavailable');
        setLocationPermission('unavailable');
        const errMsg = uiStrings.locationPermissionUnavailableUserMessage + " " + (uiStrings.locationErrorGeneral || "Could not query permission.");
        setLocationStatusMessage(errMsg);
        console.log('[FedaiDebug] useLocationLogic useEffect: Permission query catch - Setting message:', errMsg);
        ipFetchPromise.finally(() => {
            if (isLoadingLocation) {
                console.log('[FedaiDebug] useLocationLogic useEffect: Permission query catch - IP Fetch Promise finally, setting isLoadingLocation to false.');
                setIsLoadingLocation(false);
            }
        });
    });
    
    return () => {
      if (permissionStatusRef) {
        console.log('[FedaiDebug] useLocationLogic useEffect: Cleaning up permission onchange listener.');
        permissionStatusRef.onchange = null;
      }
    };
  }, [uiStrings, fetchDeviceLocation, fetchIpLocationData, userLocation?.source, locationPermission, locationStatusMessage]);
  // Added locationPermission and locationStatusMessage to useEffect deps because fetchIpLocationData depends on them,
  // and handleStatusBasedOnIp also reads them. This is to ensure these functions within useEffect
  // don't have stale closures regarding these states. This needs careful review for potential loops,
  // but given the checks inside (e.g. `if (!locationStatusMessage.includes(...))`), it might be okay.
  // userLocation (full object) was already replaced by userLocation.source.
  
  const requestLocationPermission = useCallback(() => {
    console.log('[FedaiDebug] useLocationLogic.requestLocationPermission: Called.');
    setLocationPermission('checking'); 
    setLocationStatusMessage(uiStrings.locationStatusFetching);
    fetchDeviceLocation();
    fetchIpLocationData(true); // Fetch IP for enrichment in parallel
  }, [uiStrings.locationStatusFetching, fetchDeviceLocation, fetchIpLocationData]);

  return {
    userLocation,
    locationPermission,
    locationStatusMessage,
    isLoadingLocation,
    requestLocationPermission,
    fetchIpLocationData, 
  };
}
