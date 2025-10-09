import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LocationSection from '@/components/LocationSection';
import { DataContext } from '@/components/DataContext';
import { LocalizationContext } from '@/components/LocalizationContext';
import type { DataContextType } from '@/types';

const mockUiStrings = {
  locationInfoTitle: 'Location Information',
  locationStatusCheckingPermission: 'Checking permission...',
  locationStatusFetching: 'Fetching location...',
  locationPermissionTitle: 'Location Permission Required',
  locationPermissionPromptMessage: 'We need your location to provide accurate plant health analysis.',
  shareLocationButton: 'Share My Location',
  locationPermissionDenied: 'Location Access Blocked',
  locationPermissionDeniedUserMessage: 'Cannot access your location.',
  locationPermissionDeniedReason: 'Browser location permission denied.',
  reasonLabel: 'Reason',
  tryAgainButton: 'Try Again',
  locationErrorFetch: 'GPS Location Failed',
  locationErrorFetchReason: 'Failed to retrieve GPS coordinates.',
  useIpLocationButton: 'Use IP-Based Location Instead',
  locationErrorIpFetch: 'IP Location Failed',
  locationErrorIpFetchReason: 'Unable to detect location from your IP address.',
  tryGpsButton: 'Try GPS Location',
  retryButton: 'Retry IP Location',
  locationSuccessInfo: 'Weather and soil data will be loaded based on this location.',
  locationUnknown: 'Unknown Location',
  whyLocationImportantContent: 'Location helps provide accurate environmental data.',
  whyLocationImportantTitle: 'Why location is important',
};

const createMockDataContext = (overrides: Partial<DataContextType> = {}): DataContextType => ({
  userLocation: null,
  locationStatusMessage: 'idle',
  locationPermission: 'prompt',
  weatherData: null,
  environmentalData: null,
  isLocationReady: false,
  isWeatherReady: false,
  isEnvironmentalReady: false,
  fetchDeviceLocation: vi.fn(),
  fetchIpLocationData: vi.fn(),
  ...overrides,
} as DataContextType);

describe('LocationSection UI Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render location section with title', () => {
    const mockContext = createMockDataContext();

    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <DataContext.Provider value={mockContext}>
          <LocationSection />
        </DataContext.Provider>
      </LocalizationContext.Provider>
    );

    expect(screen.getByText('Location Information')).toBeDefined();
  });

  it('should show loading state when checking permission', () => {
    const mockContext = createMockDataContext({
      locationStatusMessage: 'checking-permission',
    });

    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <DataContext.Provider value={mockContext}>
          <LocationSection />
        </DataContext.Provider>
      </LocalizationContext.Provider>
    );

    expect(screen.getByText('Checking permission...')).toBeDefined();
  });

  it('should show permission prompt with share button', () => {
    const mockContext = createMockDataContext({
      locationStatusMessage: 'awaiting-permission',
    });

    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <DataContext.Provider value={mockContext}>
          <LocationSection />
        </DataContext.Provider>
      </LocalizationContext.Provider>
    );

    expect(screen.getByText('Location Permission Required')).toBeDefined();
    expect(screen.getByText('Share My Location')).toBeDefined();
  });

  it('should call fetchDeviceLocation when share button clicked', async () => {
    const fetchDeviceLocation = vi.fn();
    const mockContext = createMockDataContext({
      locationStatusMessage: 'awaiting-permission',
      fetchDeviceLocation,
    });

    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <DataContext.Provider value={mockContext}>
          <LocationSection />
        </DataContext.Provider>
      </LocalizationContext.Provider>
    );

    const shareButton = screen.getByText('Share My Location');
    fireEvent.click(shareButton);

    expect(fetchDeviceLocation).toHaveBeenCalledOnce();
  });

  it('should display location details when successful', () => {
    const mockContext = createMockDataContext({
      locationStatusMessage: 'success',
      userLocation: {
        latitude: 40.7128,
        longitude: -74.0060,
        city: 'New York',
        country: 'USA',
        source: 'gps',
        timestamp: new Date().toISOString(),
        accuracyMessage: 'High accuracy',
      },
    });

    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <DataContext.Provider value={mockContext}>
          <LocationSection />
        </DataContext.Provider>
      </LocalizationContext.Provider>
    );

    expect(screen.getByText(/New York/)).toBeDefined();
    expect(screen.getByText(/USA/)).toBeDefined();
    expect(screen.getByText(/40.7128/)).toBeDefined();
    expect(screen.getByText(/GPS/)).toBeDefined();
  });

  it('should show error message when permission denied', () => {
    const mockContext = createMockDataContext({
      locationStatusMessage: 'error-permission',
      locationPermission: 'denied',
    });

    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <DataContext.Provider value={mockContext}>
          <LocationSection />
        </DataContext.Provider>
      </LocalizationContext.Provider>
    );

    expect(screen.getByText('Location Access Blocked')).toBeDefined();
    expect(screen.getByText(/Browser location permission denied/)).toBeDefined();
    expect(screen.getByText('Try Again')).toBeDefined();
  });

  it('should show fallback button when GPS fails', () => {
    const fetchIpLocationData = vi.fn();
    const mockContext = createMockDataContext({
      locationStatusMessage: 'error-fetch',
      fetchIpLocationData,
    });

    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <DataContext.Provider value={mockContext}>
          <LocationSection />
        </DataContext.Provider>
      </LocalizationContext.Provider>
    );

    expect(screen.getByText('GPS Location Failed')).toBeDefined();

    const ipButton = screen.getByText('Use IP-Based Location Instead');
    fireEvent.click(ipButton);

    expect(fetchIpLocationData).toHaveBeenCalledOnce();
  });

  it('should show IP source badge when using IP location', () => {
    const mockContext = createMockDataContext({
      locationStatusMessage: 'success',
      userLocation: {
        latitude: 40.7128,
        longitude: -74.0060,
        city: 'New York',
        country: 'USA',
        source: 'ip',
        timestamp: new Date().toISOString(),
      },
    });

    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <DataContext.Provider value={mockContext}>
          <LocationSection />
        </DataContext.Provider>
      </LocalizationContext.Provider>
    );

    expect(screen.getByText(/IP/)).toBeDefined();
  });
});
