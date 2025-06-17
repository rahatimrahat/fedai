
import React from 'react';
import { type UiStrings, type PipelineStep, PipelineStepId } from '../types';
import { CheckCircleIcon, ClockIcon, ChevronRightIcon } from '../icons'; 
import { useLocalizationContext } from './LocalizationContext.tsx';
// BounceIn is used for the overlay in AnalysisFlowController.tsx, not directly here.
// However, if PipelineVisualization itself needed animation, BounceIn would be imported.
// For now, keeping imports minimal to what's directly used or passed by ref.

interface StepBadgeProps {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  isCompleted: boolean;
  isFirst: boolean;
  isLast: boolean;
}

const StepBadge: React.FC<StepBadgeProps> = ({ label, icon, isActive, isCompleted, isFirst, isLast }) => {
  let baseStyle = 'bg-[var(--glass-bg-secondary)] ring-[var(--glass-border)] text-[var(--text-secondary)]';
  let iconColor = 'text-[var(--text-secondary)]';
  let statusIcon = <ClockIcon className="w-4 h-4 text-[var(--text-secondary)] opacity-70" />; 

  if (isActive) {
    baseStyle = 'bg-[var(--accent-teal)] bg-opacity-30 ring-2 ring-[var(--accent-teal)] text-[var(--accent-teal)] shadow-lg';
    iconColor = 'text-[var(--accent-teal)]'; 
    statusIcon = <div className="w-3.5 h-3.5 rounded-full bg-[var(--accent-teal)] animate-pulse"></div>;
  } else if (isCompleted) {
    baseStyle = 'bg-[var(--primary-100)] bg-opacity-60 ring-1 ring-[var(--primary-100)] text-[var(--primary-900)] opacity-90';
    iconColor = 'text-[var(--primary-500)]';
    statusIcon = <CheckCircleIcon className="w-5 h-5 text-[var(--primary-500)]" />; 
  }

  return (
    <div className="flex items-center">
      {!isFirst && (
        <ChevronRightIcon className={`w-7 h-7 mx-1 sm:mx-2 ${isCompleted || isActive ? 'text-[var(--primary-100)] opacity-90' : 'text-[var(--glass-border)] opacity-50'}`} />
      )}
      <div 
        className={`flex items-center py-3 px-4 sm:py-3.5 sm:px-5 rounded-lg ring-1 shadow-md transition-all duration-300 ${baseStyle} ${isActive ? 'ring-offset-2 ring-offset-[var(--glass-bg-primary)]' : ''}`}
        aria-current={isActive ? 'step' : undefined}
      >
        <div className={`mr-2.5 sm:mr-3 ${iconColor} opacity-95 text-xl sm:text-2xl`}>{icon}</div>
        <span className="text-base sm:text-lg font-semibold tracking-tight">{label}</span>
        <div className="ml-2.5 sm:ml-3">{statusIcon}</div>
      </div>
    </div>
  );
};


interface PipelineVisualizationProps {
  steps: PipelineStep[];
  currentStepId: PipelineStepId | null;
}

const PipelineVisualization = React.forwardRef<HTMLDivElement, PipelineVisualizationProps>(
  ({ steps, currentStepId }, ref) => {
    const { uiStrings } = useLocalizationContext();
    
    // No filtering needed anymore as the conditional step is removed
    const currentStepIndex = currentStepId ? steps.findIndex(step => step.id === currentStepId) : -1;
        
    const activeStepDetails = currentStepId ? steps.find(step => step.id === currentStepId) : null;
    let progressText = uiStrings.analyzingButton || "Analysis in Progress...";
    if (activeStepDetails) {
      const label = (uiStrings[activeStepDetails.labelKey as keyof UiStrings] || activeStepDetails.labelKey) as string;
      progressText = `${label} (${currentStepIndex + 1}/${steps.length})`;
    }


    if (!currentStepId) return null;

    return (
      <div 
        ref={ref} 
        tabIndex={-1} 
        className="bg-glass p-6 sm:p-8 rounded-xl shadow-xl max-w-3xl w-full mx-auto overflow-y-auto outline-none" 
        style={{ maxHeight: 'calc(100vh - 4rem)'}}
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="pipeline-title"
        aria-describedby="pipeline-progress-description pipeline-step-message" 
      >
          <h3 id="pipeline-title" className="text-xl sm:text-2xl font-bold text-[var(--text-headings)] mb-6 sm:mb-8 text-center">
              {uiStrings.analyzingButton || "Analysis in Progress..."}
          </h3>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {steps.map((step, index) => {
            const stepLabel = (uiStrings[step.labelKey as keyof UiStrings] || step.labelKey) as string;
            const isStepActive = step.id === currentStepId;
            const isStepCompleted = currentStepIndex > -1 && index < currentStepIndex;

            return (
              <StepBadge
                key={step.id}
                label={stepLabel}
                icon={step.icon}
                isActive={isStepActive}
                isCompleted={isStepCompleted}
                isFirst={index === 0}
                isLast={index === steps.length - 1}
              />
            );
          })}
        </div>
        {currentStepId === PipelineStepId.AI_ANALYSIS && (
          <p id="pipeline-step-message" className="text-center text-sm text-[var(--text-secondary)] mt-6 px-2">
            {uiStrings.aiAnalysisInProgressMessage}
          </p>
        )}
        <p id="pipeline-progress-description" className="sr-only">
          {`Analysis progress: ${progressText}. Current step is ${activeStepDetails ? (uiStrings[activeStepDetails.labelKey as keyof UiStrings] || activeStepDetails.labelKey) : 'unknown'}.`}
        </p>
      </div>
    );
  }
);
PipelineVisualization.displayName = "PipelineVisualization";


export default PipelineVisualization;
