import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LocationSection from './LocationSection';
import { useDataContext } from './DataContext';
import { useLocalizationContext } from './LocalizationContext';

// Mock useDataContext
jest.mock('./DataContext');
const mockUseDataContext = useDataContext as jest.Mock;

// Mock useLocalizationContext
jest.mock('./LocalizationContext');
const mockUseLocalizationContext = useLocalizationContext as jest.Mock;

const mockFetchDeviceLocation = jest.fn();
const mockFetchIpLocationData = jest.fn(); // Though not directly used by buttons, good to have

const defaultUiStrings = {
  locationInfoTitle: 'Location Information',
  whyLocationImportantContent: 'Why is location important?',
  whyLocationImportantTitle: 'Location Importance',
  locationStatusCheckingPermission: 'Checking permission...',
  locationPermissionPromptMessage: 'Please share your location to get precise data.',
  locationStatusFetching: 'Fetching location...',
  locationStatusSuccessIp: (city: string, country: string, service: string) => `Approximate location: ${city}, ${country} (via ${service})`,
  locationStatusSuccessGps: (lat: number, lon: number) => `Precise location: Lat ${lat.toFixed(2)}, Lon ${lon.toFixed(2)}`,
  locationPermissionDeniedUserMessage: 'Location permission denied. Please enable it in your browser settings.',
  locationErrorGeneral: 'Could not determine location.',
  shareLocationButton: 'Share My Location',
  tryAgainButton: 'Try Again',
  ipLocationFailed: 'IP Location service failed',
  locationPermissionUnavailableUserMessage: 'Geolocation is not available in your browser.',
};

describe('LocationSection', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Default mock implementation for localization
    mockUseLocalizationContext.mockReturnValue({
      uiStrings: defaultUiStrings,
      language: 'en',
      setLanguage: jest.fn(),
    });
  });

  test('renders "Share My Location" button in "awaiting-permission" state and calls fetchDeviceLocation on click', () => {
    mockUseDataContext.mockReturnValue({
      userLocation: null,
      locationStatusMessage: 'awaiting-permission',
      locationPermission: 'prompt',
      isLoadingLocation: false,
      fetchDeviceLocation: mockFetchDeviceLocation,
      fetchIpLocationData: mockFetchIpLocationData,
      // other states needed by DataContext that LocationSection might indirectly access via useDataContext()
      weatherData: null,
      isLoadingWeather: false,
      environmentalData: null,
      isLoadingEnvironmental: false,
      isDataFullyLoaded: false,
      weatherDisplayTab: 'current',
      handleWeatherTabChange: jest.fn(),
      weatherTabCurrentRef: React.createRef<HTMLButtonElement>(),
      weatherTabRecentRef: React.createRef<HTMLButtonElement>(),
      weatherTabHistoricalRef: React.createRef<HTMLButtonElement>(),
    });

    render(<LocationSection />);

    const shareButton = screen.getByText(defaultUiStrings.shareLocationButton);
    expect(shareButton).toBeInTheDocument();
    fireEvent.click(shareButton);
    expect(mockFetchDeviceLocation).toHaveBeenCalledTimes(1);
  });

  test('renders "Try Again" button and error message in "error-fetch" state and calls fetchDeviceLocation on click', () => {
    const errorMessage = defaultUiStrings.locationErrorGeneral;
    mockUseDataContext.mockReturnValue({
      userLocation: null,
      locationStatusMessage: 'error-fetch',
      locationPermission: 'granted', // or any other, error is the key
      isLoadingLocation: false,
      fetchDeviceLocation: mockFetchDeviceLocation,
      fetchIpLocationData: mockFetchIpLocationData,
      // other states
      weatherData: null,
      isLoadingWeather: false,
      environmentalData: null,
      isLoadingEnvironmental: false,
      isDataFullyLoaded: false,
      weatherDisplayTab: 'current',
      handleWeatherTabChange: jest.fn(),
      weatherTabCurrentRef: React.createRef<HTMLButtonElement>(),
      weatherTabRecentRef: React.createRef<HTMLButtonElement>(),
      weatherTabHistoricalRef: React.createRef<HTMLButtonElement>(),
    });

    render(<LocationSection />);

    // The error message itself is part of the status paragraph
    expect(screen.getByText(errorMessage)).toBeInTheDocument();

    const tryAgainButton = screen.getByText(defaultUiStrings.tryAgainButton);
    expect(tryAgainButton).toBeInTheDocument();
    fireEvent.click(tryAgainButton);
    expect(mockFetchDeviceLocation).toHaveBeenCalledTimes(1);
  });

  test('renders "Try Again" button in "error-permission" state and calls fetchDeviceLocation on click', () => {
    mockUseDataContext.mockReturnValue({
      userLocation: null,
      locationStatusMessage: 'error-permission',
      locationPermission: 'denied',
      isLoadingLocation: false,
      fetchDeviceLocation: mockFetchDeviceLocation,
      fetchIpLocationData: mockFetchIpLocationData,
      // other states
      weatherData: null,
      isLoadingWeather: false,
      environmentalData: null,
      isLoadingEnvironmental: false,
      isDataFullyLoaded: false,
      weatherDisplayTab: 'current',
      handleWeatherTabChange: jest.fn(),
      weatherTabCurrentRef: React.createRef<HTMLButtonElement>(),
      weatherTabRecentRef: React.createRef<HTMLButtonElement>(),
      weatherTabHistoricalRef: React.createRef<HTMLButtonElement>(),
    });

    render(<LocationSection />);
    expect(screen.getByText(defaultUiStrings.locationPermissionDeniedUserMessage)).toBeInTheDocument();
    const tryAgainButton = screen.getByText(defaultUiStrings.tryAgainButton);
    expect(tryAgainButton).toBeInTheDocument();
    fireEvent.click(tryAgainButton);
    expect(mockFetchDeviceLocation).toHaveBeenCalledTimes(1);
  });

  test('renders "Try Again" button in "error-ip-fetch" state and calls fetchDeviceLocation on click', () => {
    mockUseDataContext.mockReturnValue({
      userLocation: null,
      locationStatusMessage: 'error-ip-fetch',
      locationPermission: 'prompt', // Can be any, this is a fallback error
      isLoadingLocation: false,
      fetchDeviceLocation: mockFetchDeviceLocation,
      fetchIpLocationData: mockFetchIpLocationData,
      // other states
      weatherData: null,
      isLoadingWeather: false,
      environmentalData: null,
      isLoadingEnvironmental: false,
      isDataFullyLoaded: false,
      weatherDisplayTab: 'current',
      handleWeatherTabChange: jest.fn(),
      weatherTabCurrentRef: React.createRef<HTMLButtonElement>(),
      weatherTabRecentRef: React.createRef<HTMLButtonElement>(),
      weatherTabHistoricalRef: React.createRef<HTMLButtonElement>(),
    });

    render(<LocationSection />);
    expect(screen.getByText(defaultUiStrings.locationErrorGeneral)).toBeInTheDocument();
    const tryAgainButton = screen.getByText(defaultUiStrings.tryAgainButton);
    expect(tryAgainButton).toBeInTheDocument();
    fireEvent.click(tryAgainButton);
    expect(mockFetchDeviceLocation).toHaveBeenCalledTimes(1);
  });

  test('does not render interactive buttons in "fetching-gps" state', () => {
    mockUseDataContext.mockReturnValue({
      userLocation: null,
      locationStatusMessage: 'fetching-gps',
      locationPermission: 'granted',
      isLoadingLocation: true,
      fetchDeviceLocation: mockFetchDeviceLocation,
      fetchIpLocationData: mockFetchIpLocationData,
      // ... other context values
    });

    render(<LocationSection />);
    expect(screen.queryByText(defaultUiStrings.shareLocationButton)).not.toBeInTheDocument();
    expect(screen.queryByText(defaultUiStrings.tryAgainButton)).not.toBeInTheDocument();
    expect(screen.getByText(defaultUiStrings.locationStatusFetching)).toBeInTheDocument();
  });

  test('does not render interactive buttons in "success" state', () => {
    mockUseDataContext.mockReturnValue({
      userLocation: {
        latitude: 10, longitude: 10, source: 'gps',
        accuracyMessage: defaultUiStrings.locationStatusSuccessGps(10,10)
      },
      locationStatusMessage: 'success',
      locationPermission: 'granted',
      isLoadingLocation: false,
      fetchDeviceLocation: mockFetchDeviceLocation,
      fetchIpLocationData: mockFetchIpLocationData,
      // ... other context values
    });

    render(<LocationSection />);
    expect(screen.queryByText(defaultUiStrings.shareLocationButton)).not.toBeInTheDocument();
    expect(screen.queryByText(defaultUiStrings.tryAgainButton)).not.toBeInTheDocument();
    expect(screen.getByText(defaultUiStrings.locationStatusSuccessGps(10,10))).toBeInTheDocument();
  });

   test('does not render interactive buttons in "idle" state', () => {
    mockUseDataContext.mockReturnValue({
      userLocation: null,
      locationStatusMessage: 'idle',
      locationPermission: 'prompt',
      isLoadingLocation: false,
      fetchDeviceLocation: mockFetchDeviceLocation,
      fetchIpLocationData: mockFetchIpLocationData,
      // ... other context values
    });

    render(<LocationSection />);
    expect(screen.queryByText(defaultUiStrings.shareLocationButton)).not.toBeInTheDocument();
    expect(screen.queryByText(defaultUiStrings.tryAgainButton)).not.toBeInTheDocument();
    expect(screen.getByText(defaultUiStrings.locationStatusCheckingPermission)).toBeInTheDocument(); // Idle shows checking permission
  });

  test('does not render interactive buttons in "checking-permission" state', () => {
    mockUseDataContext.mockReturnValue({
      userLocation: null,
      locationStatusMessage: 'checking-permission',
      locationPermission: 'prompt',
      isLoadingLocation: true,
      fetchDeviceLocation: mockFetchDeviceLocation,
      fetchIpLocationData: mockFetchIpLocationData,
      // ... other context values
    });

    render(<LocationSection />);
    expect(screen.queryByText(defaultUiStrings.shareLocationButton)).not.toBeInTheDocument();
    expect(screen.queryByText(defaultUiStrings.tryAgainButton)).not.toBeInTheDocument();
    expect(screen.getByText(defaultUiStrings.locationStatusCheckingPermission)).toBeInTheDocument();
  });

});
