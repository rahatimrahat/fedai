# Fedai Testing Guide

Comprehensive guide for testing the Fedai application.

## Table of Contents

1. [Overview](#overview)
2. [Test Infrastructure](#test-infrastructure)
3. [Running Tests](#running-tests)
4. [Test Categories](#test-categories)
5. [Writing Tests](#writing-tests)
6. [Best Practices](#best-practices)
7. [CI/CD Integration](#cicd-integration)

## Overview

Fedai uses **Vitest** as the testing framework with **React Testing Library** for component tests. The test suite covers:

- ✅ Service provider integrations
- ✅ UI components
- ✅ User interactions
- ✅ End-to-end workflows

## Test Infrastructure

### Tools & Libraries

- **Vitest**: Fast unit test framework
- **React Testing Library**: Component testing utilities
- **@testing-library/jest-dom**: Custom matchers
- **jsdom**: Browser environment simulation

### Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Run with coverage report
npm run test:coverage

# Run in watch mode (auto-rerun on changes)
npm run test:watch
```

### Category-Specific Tests

```bash
# Service provider tests only
npm run test:services

# UI component tests only
npm run test:components

# User interaction tests only
npm run test:interactions

# End-to-end tests only
npm run test:e2e
```

### Advanced Usage

```bash
# Run specific test file
npm test -- weatherService.test.ts

# Run tests matching pattern
npm test -- --grep="Location"

# Run with verbose output
npm test -- --reporter=verbose

# Run with specific timeout
npm test -- --timeout=10000
```

## Test Categories

### 1. Service Provider Tests (`__tests__/services/`)

**Purpose**: Validate external API integrations and error handling

**Files:**
- `weatherService.test.ts` - Open-Meteo weather API
- `elevationService.test.ts` - Open-Elevation API
- `ipLocationService.test.ts` - IP geolocation services
- `soilService.test.ts` - SoilGrids API (via proxy)
- `geminiService.test.ts` - AI provider status

**Test Scenarios:**
```typescript
✅ Successful API responses
✅ HTTP errors (404, 500, 429)
✅ Network failures
✅ Timeout handling
✅ Invalid response formats
✅ Rate limiting
```

**Example:**
```typescript
it('should handle weather service HTTP errors', async () => {
  (global.fetch as any).mockResolvedValueOnce({
    ok: false,
    status: 500,
  });

  const result = await testWeatherService();

  expect(result.status).toBe('DOWN');
  expect(result.details).toContain('HTTP error');
});
```

### 2. UI Component Tests (`__tests__/components/`)

**Purpose**: Ensure components render correctly and handle state changes

**Files:**
- `LocationSection.test.tsx` - Location display and controls
- `AnalysisResultsSection.test.tsx` - Disease analysis results
- `EnvironmentalDataSection.test.tsx` - Environmental data display

**Test Scenarios:**
```typescript
✅ Initial render
✅ Loading states
✅ Error states
✅ Success states with data
✅ User interactions (clicks, inputs)
✅ Conditional rendering
✅ Accessibility (ARIA labels)
```

**Example:**
```typescript
it('should display location details when successful', () => {
  const mockContext = createMockDataContext({
    locationStatusMessage: 'success',
    userLocation: {
      latitude: 40.7128,
      longitude: -74.0060,
      city: 'New York',
      country: 'USA',
      source: 'gps',
    },
  });

  render(
    <LocalizationContext.Provider value={{ uiStrings: mockUiStrings }}>
      <DataContext.Provider value={mockContext}>
        <LocationSection />
      </DataContext.Provider>
    </LocalizationContext.Provider>
  );

  expect(screen.getByText(/New York/)).toBeDefined();
  expect(screen.getByText(/GPS/)).toBeDefined();
});
```

### 3. User Interaction Tests (`__tests__/interactions/`)

**Purpose**: Validate user workflows and form interactions

**Files:**
- `imageUpload.test.tsx` - Image upload validation
- `languageSwitch.test.tsx` - Language switching
- `aiProviderSelection.test.tsx` - AI settings management

**Test Scenarios:**
```typescript
✅ File upload and validation
✅ Form input validation
✅ Button states (enabled/disabled)
✅ Error messages
✅ Success feedback
✅ Settings persistence (localStorage)
✅ Keyboard navigation
```

**Example:**
```typescript
it('should validate file size on upload', async () => {
  const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', {
    type: 'image/jpeg'
  });

  render(<ImageUploadSection maxFileSize={10 * 1024 * 1024} />);

  const input = document.querySelector('input[type="file"]');
  Object.defineProperty(input, 'files', {
    value: [largeFile],
  });
  fireEvent.change(input);

  await waitFor(() => {
    expect(screen.getByText(/too large/i)).toBeDefined();
  });
});
```

### 4. End-to-End Tests (`__tests__/e2e/`)

**Purpose**: Test complete user journeys and system integration

**Files:**
- `completeAnalysisFlow.test.tsx` - Full analysis workflow
- `multiLanguageFlow.test.tsx` - Multi-language support
- `serviceStatusMonitoring.test.tsx` - Service health monitoring

**Test Scenarios:**
```typescript
✅ Complete user journey (location → analysis)
✅ Error recovery and retries
✅ Permission handling
✅ Multi-language switching
✅ Service degradation scenarios
✅ Real-time status updates
```

**Example:**
```typescript
it('should complete full user flow from location to analysis', async () => {
  // Mock all APIs
  (global.fetch as any).mockImplementation((url: string) => {
    if (url.includes('/api/ip-location')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          latitude: 40.7128,
          longitude: -74.0060,
          city: 'New York',
        }),
      });
    }
    // ... other mocks
  });

  render(<App />);

  // Wait for location
  await waitFor(() => {
    expect(screen.getByText(/New York/)).toBeDefined();
  });

  // Upload image
  const file = new File(['plant'], 'plant.jpg', { type: 'image/jpeg' });
  const input = document.querySelector('input[type="file"]');
  fireEvent.change(input);

  // Analyze
  const analyzeButton = screen.getByText(/Analyze/i);
  fireEvent.click(analyzeButton);

  await waitFor(() => {
    expect(screen.getByText(/Analyzing/i)).toBeDefined();
  });
});
```

## Writing Tests

### Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Feature Name', () => {
  beforeEach(() => {
    // Reset mocks and state before each test
    vi.clearAllMocks();
  });

  it('should do something specific', async () => {
    // Arrange: Set up test data and mocks
    const mockData = { ... };

    // Act: Perform the action
    const result = await functionUnderTest(mockData);

    // Assert: Verify the outcome
    expect(result).toBe(expectedValue);
  });
});
```

### Mocking Fetch API

```typescript
global.fetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

it('should fetch data successfully', async () => {
  (global.fetch as any).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ data: 'value' }),
  });

  const result = await fetchData();

  expect(global.fetch).toHaveBeenCalledWith(expectedUrl);
  expect(result).toEqual({ data: 'value' });
});
```

### Mocking Context Providers

```typescript
const mockContext = {
  userLocation: { latitude: 40, longitude: -74 },
  weatherData: null,
  fetchDeviceLocation: vi.fn(),
};

render(
  <DataContext.Provider value={mockContext}>
    <YourComponent />
  </DataContext.Provider>
);
```

### Testing Async Operations

```typescript
it('should handle async operations', async () => {
  render(<AsyncComponent />);

  // Wait for element to appear
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeDefined();
  }, { timeout: 5000 });
});
```

## Best Practices

### 1. Test Naming

```typescript
// ✅ Good: Descriptive and clear
it('should display error message when API returns 500')

// ❌ Bad: Vague
it('should work')
```

### 2. Arrange-Act-Assert Pattern

```typescript
it('should calculate total correctly', () => {
  // Arrange
  const items = [10, 20, 30];

  // Act
  const total = calculateTotal(items);

  // Assert
  expect(total).toBe(60);
});
```

### 3. Test Isolation

```typescript
beforeEach(() => {
  // Reset everything before each test
  vi.clearAllMocks();
  localStorage.clear();
});
```

### 4. Avoid Implementation Details

```typescript
// ✅ Good: Test behavior
expect(screen.getByText('Submit')).toBeDefined();

// ❌ Bad: Test implementation
expect(component.state.submitButtonText).toBe('Submit');
```

### 5. Use Realistic Test Data

```typescript
// ✅ Good: Realistic data
const mockLocation = {
  latitude: 40.7128,
  longitude: -74.0060,
  city: 'New York',
  country: 'USA',
};

// ❌ Bad: Meaningless data
const mockLocation = {
  latitude: 1,
  longitude: 2,
  city: 'A',
  country: 'B',
};
```

### 6. Test Error Paths

```typescript
it('should handle network errors gracefully', async () => {
  (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

  const result = await testService();

  expect(result.status).toBe('DOWN');
  expect(result.details).toContain('Network error');
});
```

## Coverage Goals

### Target Coverage

- **Service Providers**: 90%+
- **UI Components**: 85%+
- **User Interactions**: 80%+
- **E2E Flows**: Critical paths

### Checking Coverage

```bash
npm run test:coverage
```

Output:
```
File                     | % Stmts | % Branch | % Funcs | % Lines
-------------------------|---------|----------|---------|--------
services/weatherService  |   92.5  |   88.3   |  100.0  |  91.7
components/LocationSect  |   87.2  |   82.1   |   95.0  |  86.5
```

## CI/CD Integration

### Pre-commit Hook

Tests run automatically before commits:

```json
// .husky/pre-commit
npm test
```

### GitHub Actions

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
```

## Troubleshooting

### Tests Timeout

```typescript
// Increase timeout for slow operations
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeDefined();
}, { timeout: 10000 });
```

### Mock Not Working

```typescript
// Ensure mocks are cleared
beforeEach(() => {
  vi.clearAllMocks();
});

// Check mock implementation
console.log((global.fetch as any).mock.calls);
```

### Component Not Rendering

```typescript
// Ensure all required providers are present
render(
  <LocalizationContext.Provider value={mockLocalization}>
    <DataContext.Provider value={mockData}>
      <YourComponent />
    </DataContext.Provider>
  </LocalizationContext.Provider>
);
```

### Async Issues

```typescript
// Use act() for state updates
import { act } from '@testing-library/react';

await act(async () => {
  fireEvent.click(button);
});
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

## Getting Help

If you encounter issues:

1. Check existing tests for examples
2. Read error messages carefully
3. Consult the documentation links above
4. Ask in team discussions
