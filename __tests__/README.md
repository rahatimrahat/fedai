# Fedai Test Suite

Comprehensive testing suite for the Fedai plant health analysis application.

## Test Structure

```
__tests__/
├── services/              # Service provider integration tests
│   ├── weatherService.test.ts
│   ├── elevationService.test.ts
│   ├── ipLocationService.test.ts
│   ├── soilService.test.ts
│   └── geminiService.test.ts
├── components/            # UI component tests
│   ├── LocationSection.test.tsx
│   ├── AnalysisResultsSection.test.tsx
│   └── EnvironmentalDataSection.test.tsx
├── interactions/          # User interaction tests
│   ├── imageUpload.test.tsx
│   ├── languageSwitch.test.tsx
│   └── aiProviderSelection.test.tsx
├── e2e/                   # End-to-end flow tests
│   ├── completeAnalysisFlow.test.tsx
│   ├── multiLanguageFlow.test.tsx
│   └── serviceStatusMonitoring.test.tsx
└── README.md
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run specific test file
```bash
npm test -- weatherService.test.ts
```

### Run tests with coverage
```bash
npm test -- --coverage
```

### Run only service provider tests
```bash
npm test -- __tests__/services
```

### Run only UI component tests
```bash
npm test -- __tests__/components
```

### Run only interaction tests
```bash
npm test -- __tests__/interactions
```

### Run only E2E tests
```bash
npm test -- __tests__/e2e
```

## Test Categories

### 1. Service Provider Integration Tests (`services/`)

Tests external API integrations and service health checks:

- **Weather Service**: Open-Meteo API integration
- **Elevation Service**: Open-Elevation API integration
- **IP Location Service**: IP geolocation API integration
- **Soil Service**: SoilGrids API via backend proxy
- **Gemini Service**: AI provider status checks

**Coverage:**
- ✅ Successful API responses
- ✅ HTTP error handling (404, 500, 429)
- ✅ Network errors and timeouts
- ✅ Invalid response formats
- ✅ Rate limiting

### 2. UI Component Tests (`components/`)

Tests React component rendering and behavior:

- **LocationSection**: Location display and error states
- **AnalysisResultsSection**: Disease info display
- **EnvironmentalDataSection**: Environmental data visualization

**Coverage:**
- ✅ Component rendering
- ✅ Loading states
- ✅ Error states
- ✅ Success states with data
- ✅ User actions (buttons, inputs)
- ✅ Accessibility (ARIA labels)

### 3. User Interaction Tests (`interactions/`)

Tests user workflows and interactions:

- **Image Upload**: File validation and upload flow
- **Language Switch**: Multi-language support
- **AI Provider Selection**: Settings and configuration

**Coverage:**
- ✅ File upload and validation
- ✅ File size limits
- ✅ File type validation
- ✅ Language switching
- ✅ Settings persistence (localStorage)
- ✅ Form validation
- ✅ API key management

### 4. End-to-End Tests (`e2e/`)

Tests complete user flows:

- **Complete Analysis Flow**: Full workflow from location to analysis
- **Multi-Language Flow**: Language switching with analysis
- **Service Status Monitoring**: Real-time status updates

**Coverage:**
- ✅ Complete user journey
- ✅ Location → Weather → Soil → Analysis
- ✅ Error recovery and retries
- ✅ Permission handling
- ✅ Service degradation scenarios

## Test Quality Metrics

### Test Coverage Goals
- **Service Providers**: 90%+ coverage
- **UI Components**: 85%+ coverage
- **User Interactions**: 80%+ coverage
- **E2E Flows**: Critical paths covered

### Performance Benchmarks
- Unit tests: < 100ms per test
- Integration tests: < 500ms per test
- E2E tests: < 5s per scenario

## Writing New Tests

### Service Provider Test Template

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { testYourService } from '@/services/yourService';

global.fetch = vi.fn();

describe('Your Service Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully test service', async () => {
    // Mock response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'value' }),
    });

    const result = await testYourService();

    expect(result.status).toBe('UP');
  });
});
```

### Component Test Template

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import YourComponent from '@/components/YourComponent';

describe('YourComponent Tests', () => {
  it('should render component', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeDefined();
  });
});
```

## Continuous Integration

Tests run automatically on:
- Every commit (pre-commit hook)
- Pull requests
- Main branch pushes

## Troubleshooting

### Tests timing out
Increase timeout in test:
```typescript
await waitFor(() => {
  // assertions
}, { timeout: 10000 });
```

### Mock not working
Ensure mocks are cleared:
```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

### Component not rendering
Check for missing context providers:
```typescript
render(
  <LocalizationContext.Provider value={mockContext}>
    <YourComponent />
  </LocalizationContext.Provider>
);
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
