import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EnvironmentalDataSection from '@/components/EnvironmentalDataSection';
import { DataContext } from '@/components/DataContext';
import { LocalizationContext } from '@/components/LocalizationContext';
import type { DataContextType, EnvironmentalData } from '@/types';

const mockUiStrings = {
  environmentalDataTitle: 'Environmental Factors',
  loading: 'Loading...',
  noDataAvailable: 'No data available',
  soilPH: 'Soil pH',
  soilOrganicCarbon: 'Organic Carbon',
  soilNitrogen: 'Nitrogen',
  soilTexture: 'Soil Texture',
  elevation: 'Elevation',
  climate: 'Climate',
  temperature: 'Temperature',
  humidity: 'Humidity',
  errorLoadingData: 'Error loading environmental data',
};

const mockEnvironmentalData: EnvironmentalData = {
  elevation: 100,
  elevationSource: 'open-elevation',
  soilPH: '6.5',
  soilOrganicCarbon: '2.5',
  soilCEC: '15',
  soilNitrogen: '0.2',
  soilSand: '40',
  soilSilt: '30',
  soilClay: '30',
  soilAWC: '0.15',
  soilSource: 'SoilGrids',
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

describe('EnvironmentalDataSection UI Tests', () => {
  it('should render environmental data section', () => {
    const mockContext = createMockDataContext({
      environmentalData: mockEnvironmentalData,
      isEnvironmentalReady: true,
    });

    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <DataContext.Provider value={mockContext}>
          <EnvironmentalDataSection />
        </DataContext.Provider>
      </LocalizationContext.Provider>
    );

    expect(screen.getByText('Environmental Factors')).toBeDefined();
  });

  it('should display soil pH value', () => {
    const mockContext = createMockDataContext({
      environmentalData: mockEnvironmentalData,
      isEnvironmentalReady: true,
    });

    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <DataContext.Provider value={mockContext}>
          <EnvironmentalDataSection />
        </DataContext.Provider>
      </LocalizationContext.Provider>
    );

    expect(screen.getByText(/6.5/)).toBeDefined();
  });

  it('should display elevation data', () => {
    const mockContext = createMockDataContext({
      environmentalData: mockEnvironmentalData,
      isEnvironmentalReady: true,
    });

    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <DataContext.Provider value={mockContext}>
          <EnvironmentalDataSection />
        </DataContext.Provider>
      </LocalizationContext.Provider>
    );

    expect(screen.getByText(/100/)).toBeDefined();
  });

  it('should show loading state when data not ready', () => {
    const mockContext = createMockDataContext({
      environmentalData: null,
      isEnvironmentalReady: false,
    });

    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <DataContext.Provider value={mockContext}>
          <EnvironmentalDataSection />
        </DataContext.Provider>
      </LocalizationContext.Provider>
    );

    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('should display soil texture breakdown', () => {
    const mockContext = createMockDataContext({
      environmentalData: mockEnvironmentalData,
      isEnvironmentalReady: true,
    });

    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <DataContext.Provider value={mockContext}>
          <EnvironmentalDataSection />
        </DataContext.Provider>
      </LocalizationContext.Provider>
    );

    expect(screen.getByText(/40/)).toBeDefined(); // Sand
    expect(screen.getByText(/30/)).toBeDefined(); // Silt/Clay
  });
});
