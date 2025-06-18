
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
          setIsLoadingLocation(false); // Stop loading, then try a fallback IP fetch.
          fetchIpLocationData(false); // Attempt to get at least an IP location.
        }
      },
      { enableHighAccuracy: false, timeout: 3000, maximumAge: GEOLOCATION_MAXIMUM_AGE_MS }
    );
  }, [uiStrings, fetchIpLocationData]);

  useEffect(() => {
    let permissionStatusRef: PermissionStatus | null = null;

    const handlePermissionChange = () => {
      if (permissionStatusRef) {
        const newStatus = permissionStatusRef.state as LocationPermissionState;
        setLocationPermission(newStatus); 
        setIsLoadingLocation(true); // Assume loading will start due to permission change

        if (newStatus === 'granted') {
            // User changed permission to granted
            setLocationStatusMessage(uiStrings.locationStatusFetchingPrecise || uiStrings.locationStatusFetching);
            fetchDeviceLocation();
            fetchIpLocationData(true); // Fetch IP for enrichment in parallel
        } else if (newStatus === 'denied') {
            // User changed permission to denied
            if (userLocation?.source === 'ip' && userLocation.accuracyMessage) {
                setLocationStatusMessage(`${uiStrings.locationPermissionDeniedUserMessage}. ${uiStrings.locationStatusPreciseDeniedUsingApproximate ? uiStrings.locationStatusPreciseDeniedUsingApproximate(userLocation.accuracyMessage) : `Using approximate: ${userLocation.accuracyMessage}`}.`);
                setIsLoadingLocation(false); // We have IP, not fetching further.
            } else {
                setLocationStatusMessage(uiStrings.locationPermissionDeniedUserMessage);
                fetchIpLocationData(false); // This will set isLoadingLocation(false)
            }
        } else if (newStatus === 'prompt'){
            // User changed to prompt; clear location and show prompt message.
            // The main useEffect logic would handle auto-fetching if the component re-evaluates.
            // For now, similar to original logic but ensure loading is false.
            setLocationStatusMessage(uiStrings.locationPermissionPromptMessage);
            setUserLocation(null); 
            setIsLoadingLocation(false);
        } else { // 'unavailable' or other states
            if (userLocation?.source === 'ip' && userLocation.accuracyMessage) {
                setLocationStatusMessage(`${uiStrings.locationPermissionUnavailableUserMessage}. ${uiStrings.locationStatusPreciseUnavailableUsingApproximate ? uiStrings.locationStatusPreciseUnavailableUsingApproximate(userLocation.accuracyMessage) : `Using approximate: ${userLocation.accuracyMessage}`}.`);
                setIsLoadingLocation(false); // We have IP, not fetching further.
            } else {
                setLocationStatusMessage(uiStrings.locationPermissionUnavailableUserMessage);
                fetchIpLocationData(false); // This will set isLoadingLocation(false)
            }
        }
      }
    };

    // Requirement 1: Initial Coarse Location (and handling for unsupported Permissions API)
    if (!navigator.permissions || !navigator.permissions.query) {
      console.warn("[Fedai Location Hook] Permissions API not supported. Assuming 'unavailable'.");
      setLocationPermission('unavailable');
      setIsLoadingLocation(true);
      setLocationStatusMessage(uiStrings.locationPermissionUnavailableUserMessage + " " + uiStrings.fetchingIpLocation);
      fetchIpLocationData(false).finally(() => setIsLoadingLocation(false));
      return;
    }

    // Start fetching IP location early.
    setIsLoadingLocation(true);
    // Use a more specific message for initial IP fetch.
    setLocationStatusMessage(uiStrings.locationStatusFetchingApproximate || uiStrings.fetchingIpLocation);
    const ipFetchPromise = fetchIpLocationData(false);

    navigator.permissions.query({ name: 'geolocation' }).then((permissionStatus) => {
      permissionStatusRef = permissionStatus;
      const currentStatus = permissionStatus.state as LocationPermissionState;
      setLocationPermission(currentStatus); // Set permission state from query

      // Logic after permission query, potentially influenced by ipFetchPromise completion.
      const handleStatusBasedOnIp = () => {
        // This function is called after ipFetchPromise resolves or immediately if not waiting.
        // isLoadingLocation is managed by individual fetch calls or final error states.
        if (currentStatus === 'granted') {
          setIsLoadingLocation(true); // Ensure loading for GPS attempt
          // Message hierarchy:
          // 1. Initial: "Fetching approximate..."
          // 2. IP Success + Granted: "Approximate found. Fetching precise..." (set by fetchIpLocationData)
          // 3. If IP not yet successful OR its message wasn't #2: "Fetching precise location..."
          if (!(userLocation?.source === 'ip' && locationStatusMessage.includes(userLocation.accuracyMessage) && locationStatusMessage.includes(uiStrings.locationStatusFetching))) {
            setLocationStatusMessage(uiStrings.locationStatusFetchingPrecise || uiStrings.locationStatusFetching);
          }
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
          }
          fetchDeviceLocation(); // Triggers prompt
        } else if (currentStatus === 'denied') {
          // IP fetch has run. Its success/failure message (possibly combined) should be set by fetchIpLocationData.
          // If fetchIpLocationData hasn't finished or set a message, use a generic one.
          if (!locationStatusMessage.includes(uiStrings.locationPermissionDeniedUserMessage)) {
             const baseMsg = userLocation?.source === 'ip' ? userLocation.accuracyMessage : (uiStrings.locationStatusFetchingApproximate || uiStrings.fetchingIpLocation);
             setLocationStatusMessage(`${uiStrings.locationPermissionDeniedUserMessage}. ${baseMsg}`);
          }
          // fetchIpLocationData will call setIsLoadingLocation(false)
        } else { // 'unavailable' or other states
          if (!locationStatusMessage.includes(uiStrings.locationPermissionUnavailableUserMessage)) {
            const baseMsg = userLocation?.source === 'ip' ? userLocation.accuracyMessage : (uiStrings.locationStatusFetchingApproximate || uiStrings.fetchingIpLocation);
            setLocationStatusMessage(`${uiStrings.locationPermissionUnavailableUserMessage}. ${baseMsg}`);
          }
          // fetchIpLocationData will call setIsLoadingLocation(false)
        }
      };

      // We don't want to block permission handling on IP fetch, but message setting might depend on it.
      // The modified fetchIpLocationData tries to set context-aware messages.
      // The logic here is a fallback or refiner for those messages.
      // No need for ipFetchPromise.finally to manage isLoadingLocation here, individual fetches do that.
      ipFetchPromise.then(handleStatusBasedOnIp).catch(handleStatusBasedOnIp); // Run regardless of IP fetch outcome initially.

      permissionStatus.onchange = handlePermissionChange;
    }).catch((err) => {
        console.error('[Fedai Location Hook] Error querying geolocation permission:', err);
        setLocationPermission('unavailable');
        // IP fetch might be ongoing or finished.
        // Set a generic error and let IP fetch's own error handling take over if it also fails.
        setLocationStatusMessage(uiStrings.locationPermissionUnavailableUserMessage + " " + (uiStrings.locationErrorGeneral || "Could not query permission."));
        ipFetchPromise.finally(() => {
            // Ensure loading is false if both permission query and IP fetch fail.
            // If IP fetch is still running, it will manage its own isLoadingLocation.
            // If it already failed, this ensures it's false.
            if (isLoadingLocation) setIsLoadingLocation(false);
        });
    });
    
    return () => {
      if (permissionStatusRef) {
        permissionStatusRef.onchange = null;
      }
    };
  }, [uiStrings, fetchDeviceLocation, fetchIpLocationData, userLocation?.source]); // Changed userLocation to userLocation.source
  
  const requestLocationPermission = useCallback(() => {
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
