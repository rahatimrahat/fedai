import React, { useState, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { useLocalizationContext } from './components/LocalizationContext.tsx';
import LanguageSelector from './components/LanguageSelector.tsx';
import ServiceStatusFooter from './components/ServiceStatusFooter.tsx';
import LoadingSpinner from './components/ui/LoadingSpinner.tsx';
import UnfurlingLeafIcon from './components/icons/UnfurlingLeafIcon.tsx';
import { useServiceStatus } from './hooks/useServiceStatus';
import { useAnalysisContext } from './components/AnalysisContext.tsx';
import BounceIn from './components/ui/BounceIn.tsx';
import { AppView } from './types';
import Modal from './components/ui/Modal.tsx';

// Lazy load heavy components
const BackendServicesDashboard = lazy(() => import('./components/BackendServicesDashboard.tsx'));
const AnalysisFlowController = lazy(() => import('./components/AnalysisFlowController.tsx'));

// Lazy load icons (only loaded when needed)
const LazyLeafIcon = lazy(() => import('./components/icons').then(mod => ({ default: mod.LeafIcon })));
const LazyAdjustmentsIcon = lazy(() => import('./components/icons').then(mod => ({ default: mod.AdjustmentsHorizontalIcon })));
const LazyExclamationIcon = lazy(() => import('./components/icons').then(mod => ({ default: mod.ExclamationTriangleIcon })));

const App: React.FC = () => {
  const { uiStrings, isLoadingTranslations } = useLocalizationContext();
  const { serviceStatuses } = useServiceStatus();
  const { appError: analysisAppError, imageFile, handleImageCleared } = useAnalysisContext();
  const [isDiagnosisStarted, setIsDiagnosisStarted] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('diagnosis');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  if (isLoadingTranslations) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--neutral-100)]">
        <LoadingSpinner className="w-12 h-12" />
      </div>
    );
  }

  const handleStartDiagnosis = () => {
    setIsDiagnosisStarted(true);
    setCurrentView('diagnosis');
  };

  const handleConfirmLeaveDiagnosis = () => {
    handleImageCleared();
    setIsDiagnosisStarted(false);
    setCurrentView('management');
    setIsConfirmModalOpen(false);
  };

  const handleCancelLeaveDiagnosis = () => {
    setIsConfirmModalOpen(false);
  };

  const toggleView = () => {
    const targetView = currentView === 'diagnosis' ? 'management' : 'diagnosis';

    if (currentView === 'diagnosis' && (isDiagnosisStarted || imageFile)) {
      setIsConfirmModalOpen(true);
    } else {
      setCurrentView(targetView);
      if (targetView === 'management') {
        handleImageCleared();
        setIsDiagnosisStarted(false);
      }
    }
  };

  const getToggleViewButtonLabel = () => {
    return currentView === 'diagnosis'
      ? uiStrings.switchToDashboardViewButton
      : uiStrings.switchToDiagnosisViewButton;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 py-3 shadow-lg bg-white dark:bg-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Suspense fallback={<div className="h-10 w-10" />}>
                <LazyLeafIcon className="h-10 w-10 text-[var(--primary-500)] self-start mt-1 sm:mt-0" />
              </Suspense>
              <div className="ml-3">
                <h1
                  style={{ fontFamily: 'Georgia, serif' }}
                  className="text-3xl sm:text-4xl font-bold text-[var(--primary-900)] tracking-tight leading-tight"
                >
                  Fedai
                </h1>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] opacity-90 -mt-1">
                  {uiStrings.tagline.split('.')[0]}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Suspense fallback={<div className="w-10 h-10" />}>
                <button
                  onClick={toggleView}
                  className="p-2.5 rounded-md hover:bg-[var(--glass-bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--primary-900)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-100)] transition-colors"
                  title={getToggleViewButtonLabel()}
                  aria-label={getToggleViewButtonLabel()}
                  role="switch"
                  aria-checked={currentView === 'management'}
                >
                  <LazyAdjustmentsIcon className="w-5 h-5" />
                </button>
              </Suspense>
              <LanguageSelector />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow py-8 sm:py-10 transition-opacity duration-300 ease-in-out">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
          {analysisAppError && currentView === 'diagnosis' && !isDiagnosisStarted && (
            <div className="card p-5 bg-[var(--status-red-bg)] border-[var(--status-red)] text-[var(--status-red-text)]">
              <strong className="font-semibold">{uiStrings.errorTitle}:</strong> {analysisAppError}
            </div>
          )}

          {currentView === 'management' && (
            <Suspense
              fallback={
                <div className="flex justify-center items-center min-h-[300px]">
                  <LoadingSpinner className="w-10 h-10" />
                </div>
              }
            >
              <BackendServicesDashboard />
            </Suspense>
          )}

          {currentView === 'diagnosis' && !isDiagnosisStarted && (
            <BounceIn>
              <div className="text-center py-12 sm:py-16 bg-glass rounded-xl shadow-xl">
                <UnfurlingLeafIcon className="w-20 h-20 text-[var(--accent-teal)] mx-auto mb-6" />
                <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-headings)] mb-4 tracking-tight">
                  {uiStrings.tagline}
                </h2>
                <p className="text-lg text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto"></p>
                <motion.button
                  onClick={handleStartDiagnosis}
                  className="btn btn-primary text-lg px-8 py-3.5 shadow-lg hover:shadow-xl transform hover:scale-105"
                  aria-label={uiStrings.startDiagnosisButton}
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
                >
                  {uiStrings.startDiagnosisButton}
                </motion.button>
              </div>
            </BounceIn>
          )}

          {currentView === 'diagnosis' && isDiagnosisStarted && (
            <Suspense
              fallback={
                <div className="flex justify-center items-center min-h-[400px]">
                  <LoadingSpinner className="w-12 h-12" />
                </div>
              }
            >
              <AnalysisFlowController />
            </Suspense>
          )}
        </div>
      </main>

      <ServiceStatusFooter serviceStatuses={serviceStatuses} />

      <Suspense fallback={null}>
        <Modal
          isOpen={isConfirmModalOpen}
          onClose={handleCancelLeaveDiagnosis}
          title={uiStrings.leaveDiagnosisConfirmationTitle}
          icon={
            <Suspense fallback={<div className="w-6 h-6" />}>
              <LazyExclamationIcon className="w-6 h-6 text-[var(--status-yellow)]" />
            </Suspense>
          }
          primaryAction={{
            label: uiStrings.confirmButtonLabel,
            onClick: handleConfirmLeaveDiagnosis,
            className:
              'btn-primary bg-[var(--status-red)] hover:bg-red-700 border-[var(--status-red)] hover:border-red-700 text-white',
            ariaLabel: uiStrings.confirmButtonLabel
          }}
          secondaryAction={{
            label: uiStrings.cancelButtonLabel,
            onClick: handleCancelLeaveDiagnosis,
            className: 'btn-secondary',
            ariaLabel: uiStrings.cancelButtonLabel
          }}
          size="sm"
        >
          <p className="text-[var(--text-primary)]">{uiStrings.leaveDiagnosisConfirmationMessage}</p>
        </Modal>
      </Suspense>
    </div>
  );
};

export default App;
