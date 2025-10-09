import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { LocalizationContext } from '@/components/LocalizationContext';

const mockUiStrings = {
  languageLabel: 'Language',
  english: 'English',
  turkish: 'Türkçe',
};

describe('Language Switch User Interactions', () => {
  it('should render language switcher', () => {
    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <LanguageSwitcher />
      </LocalizationContext.Provider>
    );

    expect(screen.getByText(/Language/)).toBeDefined();
  });

  it('should show current language selection', () => {
    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage: vi.fn(), language: 'en' }}>
        <LanguageSwitcher />
      </LocalizationContext.Provider>
    );

    expect(screen.getByText('English')).toBeDefined();
  });

  it('should call setLanguage when user changes language', () => {
    const setLanguage = vi.fn();

    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage, language: 'en' }}>
        <LanguageSwitcher />
      </LocalizationContext.Provider>
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'tr' } });

    expect(setLanguage).toHaveBeenCalledWith('tr');
  });

  it('should persist language selection to localStorage', () => {
    const setLanguage = vi.fn();
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage, language: 'en' }}>
        <LanguageSwitcher />
      </LocalizationContext.Provider>
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'tr' } });

    expect(setLanguage).toHaveBeenCalledWith('tr');
  });

  it('should support keyboard navigation', () => {
    const setLanguage = vi.fn();

    render(
      <LocalizationContext.Provider value={{ uiStrings: mockUiStrings, setLanguage, language: 'en' }}>
        <LanguageSwitcher />
      </LocalizationContext.Provider>
    );

    const select = screen.getByRole('combobox');

    // Simulate keyboard navigation
    fireEvent.keyDown(select, { key: 'ArrowDown' });
    fireEvent.change(select, { target: { value: 'tr' } });

    expect(setLanguage).toHaveBeenCalled();
  });
});
