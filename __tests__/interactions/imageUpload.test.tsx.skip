import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImageUploadSection from '@/components/ImageUploadSection';
import { LocalizationContext } from '@/components/LocalizationContext';

const mockUiStrings = {
  imageUploadTitle: 'Upload Plant Image',
  dragAndDropHint: 'Drag and drop or click to upload',
  uploadButton: 'Upload Image',
  removeButton: 'Remove Image',
  analyzeButton: 'Analyze',
  analyzing: 'Analyzing...',
  fileTooLarge: 'File too large',
  invalidFileType: 'Invalid file type',
  uploadSuccess: 'Image uploaded successfully',
};

describe('Image Upload User Interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow user to click upload area', () => {
    const onImageChange = vi.fn();

    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <ImageUploadSection onImageChange={onImageChange} onAnalyze={vi.fn()} />
      </LocalizationContext.Provider>
    );

    const uploadArea = screen.getByText(/Drag and drop/);
    expect(uploadArea).toBeDefined();
  });

  it('should validate file size on upload', async () => {
    const onImageChange = vi.fn();
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });

    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <ImageUploadSection onImageChange={onImageChange} onAnalyze={vi.fn()} maxFileSize={10 * 1024 * 1024} />
      </LocalizationContext.Provider>
    );

    const input = screen.getByLabelText(/upload/i) || document.querySelector('input[type="file"]');

    if (input) {
      Object.defineProperty(input, 'files', {
        value: [largeFile],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText(/too large/i)).toBeDefined();
      });
    }
  });

  it('should validate file type on upload', async () => {
    const onImageChange = vi.fn();
    const invalidFile = new File(['content'], 'document.pdf', { type: 'application/pdf' });

    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <ImageUploadSection onImageChange={onImageChange} onAnalyze={vi.fn()} acceptedTypes={['image/jpeg', 'image/png']} />
      </LocalizationContext.Provider>
    );

    const input = document.querySelector('input[type="file"]');

    if (input) {
      Object.defineProperty(input, 'files', {
        value: [invalidFile],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText(/invalid file type/i)).toBeDefined();
      });
    }
  });

  it('should show preview after valid image upload', async () => {
    const onImageChange = vi.fn();
    const validFile = new File(['image'], 'plant.jpg', { type: 'image/jpeg' });

    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <ImageUploadSection onImageChange={onImageChange} onAnalyze={vi.fn()} />
      </LocalizationContext.Provider>
    );

    const input = document.querySelector('input[type="file"]');

    if (input) {
      Object.defineProperty(input, 'files', {
        value: [validFile],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(onImageChange).toHaveBeenCalled();
      });
    }
  });

  it('should allow user to remove uploaded image', async () => {
    const onImageChange = vi.fn();
    const onRemove = vi.fn();

    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <ImageUploadSection
          onImageChange={onImageChange}
          onAnalyze={vi.fn()}
          onRemove={onRemove}
          hasImage={true}
        />
      </LocalizationContext.Provider>
    );

    const removeButton = screen.getByText('Remove Image');
    fireEvent.click(removeButton);

    expect(onRemove).toHaveBeenCalledOnce();
  });

  it('should disable analyze button when no image', () => {
    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <ImageUploadSection onImageChange={vi.fn()} onAnalyze={vi.fn()} hasImage={false} />
      </LocalizationContext.Provider>
    );

    const analyzeButton = screen.getByText('Analyze');
    expect(analyzeButton).toHaveProperty('disabled', true);
  });

  it('should enable analyze button when image is uploaded', () => {
    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <ImageUploadSection onImageChange={vi.fn()} onAnalyze={vi.fn()} hasImage={true} />
      </LocalizationContext.Provider>
    );

    const analyzeButton = screen.getByText('Analyze');
    expect(analyzeButton).toHaveProperty('disabled', false);
  });

  it('should show loading state during analysis', () => {
    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <ImageUploadSection onImageChange={vi.fn()} onAnalyze={vi.fn()} hasImage={true} isAnalyzing={true} />
      </LocalizationContext.Provider>
    );

    expect(screen.getByText('Analyzing...')).toBeDefined();
  });
});
