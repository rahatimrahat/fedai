import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnalysisResultsSection from '@/components/AnalysisResultsSection';
import { LocalizationContext } from '@/components/LocalizationContext';
import type { DiseaseInfo } from '@/types';

const mockUiStrings = {
  analysisResultsTitle: 'Analysis Results',
  noAnalysisYet: 'No analysis yet',
  uploadImagePrompt: 'Upload an image to get started',
  diagnosisLabel: 'Diagnosis',
  confidenceLabel: 'Confidence',
  recommendedActionsLabel: 'Recommended Actions',
  additionalNotesLabel: 'Additional Notes',
  loading: 'Loading...',
};

const mockDiseaseInfo: DiseaseInfo = {
  diseaseName: 'Powdery Mildew',
  description: 'A fungal disease affecting leaves',
  severity: 'moderate',
  confidence: 85,
  symptoms: ['White powdery spots', 'Leaf distortion'],
  causes: ['High humidity', 'Poor air circulation'],
  recommendedActions: ['Apply fungicide', 'Improve ventilation'],
  preventiveMeasures: ['Regular inspection', 'Proper spacing'],
  additionalNotes: 'Monitor closely for spread',
  affectedPlantParts: ['leaves', 'stems'],
  environmentalFactors: {
    temperature: 'Moderate temperatures favor development',
    humidity: 'High humidity increases risk',
  },
};

describe('AnalysisResultsSection UI Tests', () => {
  it('should render empty state when no analysis', () => {
    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <AnalysisResultsSection analysisResult={null} isAnalyzing={false} />
      </LocalizationContext.Provider>
    );

    expect(screen.getByText('No analysis yet')).toBeDefined();
    expect(screen.getByText('Upload an image to get started')).toBeDefined();
  });

  it('should show loading state when analyzing', () => {
    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <AnalysisResultsSection analysisResult={null} isAnalyzing={true} />
      </LocalizationContext.Provider>
    );

    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('should display disease name and confidence', () => {
    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <AnalysisResultsSection analysisResult={mockDiseaseInfo} isAnalyzing={false} />
      </LocalizationContext.Provider>
    );

    expect(screen.getByText('Powdery Mildew')).toBeDefined();
    expect(screen.getByText(/85/)).toBeDefined();
  });

  it('should display recommended actions list', () => {
    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <AnalysisResultsSection analysisResult={mockDiseaseInfo} isAnalyzing={false} />
      </LocalizationContext.Provider>
    );

    expect(screen.getByText(/Apply fungicide/)).toBeDefined();
    expect(screen.getByText(/Improve ventilation/)).toBeDefined();
  });

  it('should display severity indicator', () => {
    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <AnalysisResultsSection analysisResult={mockDiseaseInfo} isAnalyzing={false} />
      </LocalizationContext.Provider>
    );

    // Moderate severity should be visible
    expect(screen.getByText(/moderate/i)).toBeDefined();
  });

  it('should handle high severity with appropriate styling', () => {
    const highSeverityDisease = { ...mockDiseaseInfo, severity: 'high' as const };

    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <AnalysisResultsSection analysisResult={highSeverityDisease} isAnalyzing={false} />
      </LocalizationContext.Provider>
    );

    expect(screen.getByText(/high/i)).toBeDefined();
  });

  it('should display additional notes when present', () => {
    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <AnalysisResultsSection analysisResult={mockDiseaseInfo} isAnalyzing={false} />
      </LocalizationContext.Provider>
    );

    expect(screen.getByText(/Monitor closely/)).toBeDefined();
  });
});
