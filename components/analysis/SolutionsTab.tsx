import React from 'react';
import { type DiseaseInfo, type SolutionDetail } from '@/types';
import { useLocalizationContext } from '../LocalizationContext';
import BounceIn from '../ui/BounceIn';
import { InformationCircleIcon, AcademicCapIcon, SparklesIcon, BeakerIcon, EyeIcon, AdjustmentsHorizontalIcon } from '../icons'; // Assuming these are correctly imported

// Helper: Moved getIconForSolutionType and SolutionTypePill into SolutionsTab as they are specific to it.
const getIconForSolutionType = (type: SolutionDetail['type']): React.ReactNode => {
  const iconClass = "w-4 h-4 mr-1.5 inline-block";
  switch (type) {
    case 'cultural': return <AcademicCapIcon className={iconClass} />;
    case 'biological': return <SparklesIcon className={iconClass} />;
    case 'chemical_general': return <BeakerIcon className={iconClass} />;
    case 'observation': return <EyeIcon className={iconClass} />;
    case 'preventive': return <AcademicCapIcon className={iconClass} style={{ transform: 'scaleX(-1)'}}/>;
    case 'fertilizer_adjustment': return <AdjustmentsHorizontalIcon className={iconClass} />;
    default: return null;
  }
};

const SolutionTypePill: React.FC<{ type: SolutionDetail['type'] }> = ({ type }) => {
  const { uiStrings } = useLocalizationContext();
  let text = '';
  let pillClass = 'pill-default';
  const icon = getIconForSolutionType(type);

  switch (type) {
    case 'cultural': text = uiStrings.solutionTypeCultural; pillClass = 'pill-cultural'; break;
    case 'biological': text = uiStrings.solutionTypeBiological; pillClass = 'pill-biological'; break;
    case 'chemical_general': text = uiStrings.solutionTypeChemicalGeneral; pillClass = 'pill-chemical'; break;
    case 'observation': text = uiStrings.solutionTypeObservation; pillClass = 'pill-observation'; break;
    case 'preventive': text = uiStrings.solutionTypePreventive; pillClass = 'pill-preventive'; break;
    case 'fertilizer_adjustment': text = uiStrings.solutionTypeFertilizerAdjustment; pillClass = 'pill-fertilizer'; break;
    default: text = type;
  }

  return (
    <span className={`${pillClass} pill-base flex items-center`}>
      {icon}
      {text}
    </span>
  );
};

const SolutionItemCard: React.FC<{ solution: SolutionDetail, isFirst: boolean }> = ({ solution, isFirst }) => {
  const { uiStrings } = useLocalizationContext();

  const getLocalizedBudget = (budgetKeyword?: string) => {
    if (!budgetKeyword) return uiStrings.solutionEstimatedBudgetUnknown;
    switch (budgetKeyword.toUpperCase()) {
      case 'BUDGET_LOW': return uiStrings.solutionEstimatedBudgetLow;
      case 'BUDGET_MEDIUM': return uiStrings.solutionEstimatedBudgetMedium;
      case 'BUDGET_HIGH': return uiStrings.solutionEstimatedBudgetHigh;
      default: return uiStrings.solutionEstimatedBudgetUnknown;
    }
  };

  return (
    <div className={`px-0.5 py-1 ${!isFirst ? 'solution-item-separator' : ''}`}>
      <div
        className="p-4 rounded-lg transition-all duration-200 hover:shadow-md hover:border-[var(--border-color-soft)] h-full flex flex-col bg-[var(--glass-bg-secondary)] border border-[var(--glass-border)]"
      >
        <div className="mb-2.5">
          <SolutionTypePill type={solution.type} />
        </div>
        <div className="text-[var(--text-primary)] text-base leading-relaxed flex-grow mb-2">
            {solution.description}
        </div>
        {solution.applicationNotes && (
          <div className="text-sm text-[var(--text-secondary)] mt-2">
            <strong className="font-medium text-[var(--text-primary)]">{uiStrings.applicationNotesLabel}:</strong> {solution.applicationNotes}
          </div>
        )}
        {solution.type === 'chemical_general' && solution.exampleBrands && solution.exampleBrands.length > 0 && (
          <div className="mt-2">
            <p className="text-sm font-medium text-[var(--text-primary)]">{uiStrings.solutionExampleBrandsLabel}:</p>
            <ul className="list-disc list-inside ml-4 text-sm text-[var(--text-secondary)] space-y-0.5">
              {solution.exampleBrands.map((brand, i) => <li key={i}>{brand}</li>)}
            </ul>
          </div>
        )}
        {solution.estimatedBudget && (
          <p className="text-sm text-[var(--text-secondary)] mt-1.5">
            <strong className="font-medium text-[var(--text-primary)]">{uiStrings.solutionEstimatedBudgetLabel}:</strong> {getLocalizedBudget(solution.estimatedBudget)}
          </p>
        )}
      </div>
    </div>
  );
};

interface SolutionsTabProps {
  result: DiseaseInfo;
}

const SolutionsTab: React.FC<SolutionsTabProps> = ({ result }) => {
  const { uiStrings } = useLocalizationContext();
  const solutions = result.structuredSolutions || [];
  const hasChemicalSolution = solutions.some(s => s.type === 'chemical_general');
  const hasFertilizerSolution = solutions.some(s => s.type === 'fertilizer_adjustment');

  return (
    <BounceIn key="solutions-tab-content">
      {solutions.length > 0 ? (
        <div className="space-y-0 py-1">
          {solutions.map((solution, index) => (
             <SolutionItemCard
                key={index}
                solution={solution}
                isFirst={index === 0}
              />
          ))}
        </div>
      ) : (
        <div className="text-center p-4 bg-[var(--glass-bg-secondary)] rounded-lg border border-[var(--glass-border)]">
          <InformationCircleIcon className="w-10 h-10 text-[var(--status-blue-text)] mx-auto mb-2" />
          <p className="text-md font-semibold text-[var(--text-headings)] mb-1">
            {uiStrings.noSpecificSolutionsFoundTitle}
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            {uiStrings.noSpecificSolutionsFoundMessage}
          </p>
        </div>
      )}
      {hasChemicalSolution && (
        <div className="mt-4 p-4 bg-[var(--status-red-bg)] border border-[var(--status-red)] rounded-lg text-sm text-[var(--status-red-text)] leading-relaxed">
          <p><strong className="font-semibold">{uiStrings.consultLocalExperts.split('.')[0]}.</strong> {uiStrings.consultLocalExperts.substring(uiStrings.consultLocalExperts.indexOf('.') + 1).trim()}</p>
        </div>
      )}
      {hasFertilizerSolution && (
         <div className="mt-4 p-4 bg-[var(--status-yellow-bg)] border border-[var(--status-yellow)] rounded-lg text-sm text-[var(--status-yellow-text)] leading-relaxed">
           <p><strong className="font-semibold">{uiStrings.consultLocalExpertsSoil.split('.')[0]}.</strong> {uiStrings.consultLocalExpertsSoil.substring(uiStrings.consultLocalExpertsSoil.indexOf('.') + 1).trim()}</p>
         </div>
      )}
    </BounceIn>
  );
};

export default SolutionsTab;
