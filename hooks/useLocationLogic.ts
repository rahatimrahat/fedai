
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
    if (!isEnrichmentOnly || 
        !locationStatusMessage || 
        locationStatusMessage === uiStrings.locationPermissionDeniedUserMessage || 
        locationStatusMessage === uiStrings.locationPermissionUnavailableUserMessage) {
        setLocationStatusMessage(uiStrings.fetchingIpLocation);
    }
    
    const { location, serviceName, error } = await fetchIpLocation();
    if (location && serviceName) {
      const ipLocationWithDetail: UserLocation = {
        ...location, 
        accuracyMessage: uiStrings.locationStatusSuccessIp(location.city || 'Unknown City', location.country || 'Unknown Country', serviceName)
      };
      if (isEnrichmentOnly && userLocation?.source === 'gps') {
          setUserLocation(prevGpsLocation => ({
              ...prevGpsLocation!,
              city: ipLocationWithDetail.city,
              country: ipLocationWithDetail.country,
              countryCode: ipLocationWithDetail.countryCode,
              accuracyMessage: prevGpsLocation?.accuracyMessage || ipLocationWithDetail.accuracyMessage
          }));
      } else {
          setUserLocation(ipLocationWithDetail);
      }
      setLocationStatusMessage(uiStrings.locationIpSuccessMessage);
    } else {
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
        setLocationPermission(isDenied ? 'denied' : 'unavailable');
        
        let failureMessage = isDenied ? uiStrings.locationPermissionDeniedUserMessage : uiStrings.locationErrorGeneral;
        if (error.message && error.message.toLowerCase().includes('failed to fetch')) {
          failureMessage += ` (Network error. Check connection & console.)`;
        }
        setLocationStatusMessage(failureMessage);

        setIsLoadingLocation(false);
        fetchIpLocationData(false); 
      },
      { enableHighAccuracy: true, timeout: GEOLOCATION_HIGH_ACCURACY_TIMEOUT_MS, maximumAge: GEOLOCATION_MAXIMUM_AGE_MS }
    );
  }, [uiStrings, fetchIpLocationData]);

  useEffect(() => {
    let permissionStatusRef: PermissionStatus | null = null;

    const handlePermissionChange = () => {
      if (permissionStatusRef) {
        const newStatus = permissionStatusRef.state as LocationPermissionState;
        setLocationPermission(newStatus); 

         if (newStatus === 'granted') { 
            fetchDeviceLocation(); 
        } else if (newStatus === 'denied') {
            setLocationStatusMessage(uiStrings.locationPermissionDeniedUserMessage);
            fetchIpLocationData(false); 
        } else if (newStatus === 'prompt'){
            setLocationStatusMessage(uiStrings.locationPermissionPromptMessage);
            setUserLocation(null); 
        } else { 
            setLocationStatusMessage(uiStrings.locationPermissionUnavailableUserMessage);
            fetchIpLocationData(false); 
        }
      }
    };

    if (!navigator.permissions || !navigator.permissions.query) {
      console.warn("[Fedai Location Hook] Permissions API not supported. Assuming 'unavailable'.");
      setLocationPermission('unavailable'); 
      setLocationStatusMessage(uiStrings.locationPermissionUnavailableUserMessage); 
      fetchIpLocationData(false); 
      return;
    }

    navigator.permissions.query({ name: 'geolocation' }).then((permissionStatus) => {
      permissionStatusRef = permissionStatus;
      const currentStatus = permissionStatus.state as LocationPermissionState;
      setLocationPermission(currentStatus);

      if (currentStatus === 'granted') {
        if (!userLocation || userLocation.source !== 'gps') fetchDeviceLocation();
        else setLocationStatusMessage(uiStrings.locationGpsSuccessMessage);
      } else if (currentStatus === 'prompt') {
        setLocationStatusMessage(uiStrings.locationPermissionPromptMessage);
      } else if (currentStatus === 'denied') {
        setLocationStatusMessage(uiStrings.locationPermissionDeniedUserMessage);
        if (!userLocation || userLocation.source !== 'ip') fetchIpLocationData(false);
        else if (userLocation?.source === 'ip') setLocationStatusMessage(uiStrings.locationIpSuccessMessage); // Check userLocation exists
      } else { 
        setLocationStatusMessage(uiStrings.locationPermissionUnavailableUserMessage);
        if (!userLocation || userLocation.source !== 'ip') fetchIpLocationData(false);
        else if (userLocation?.source === 'ip') setLocationStatusMessage(uiStrings.locationIpSuccessMessage); // Check userLocation exists
      }
      permissionStatus.onchange = handlePermissionChange;
    }).catch((err) => {
        console.error('[Fedai Location Hook] Error querying geolocation permission:', err);
        setLocationPermission('unavailable');
        setLocationStatusMessage(uiStrings.locationPermissionUnavailableUserMessage);
        fetchIpLocationData(false); 
    });
    
    return () => {
      if (permissionStatusRef) {
        permissionStatusRef.onchange = null;
      }
    };
  }, [uiStrings, fetchDeviceLocation, fetchIpLocationData, userLocation]); 
  
  const requestLocationPermission = useCallback(() => {
    setLocationPermission('checking'); 
    setLocationStatusMessage(uiStrings.locationStatusFetching);
    fetchDeviceLocation(); 
  }, [uiStrings.locationStatusFetching, fetchDeviceLocation]);

  return {
    userLocation,
    locationPermission,
    locationStatusMessage,
    isLoadingLocation,
    requestLocationPermission,
    fetchIpLocationData, 
  };
}
