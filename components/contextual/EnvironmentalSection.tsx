
import React from 'react';
import { useDataContext } from '../DataContext.tsx';
import { useLocalizationContext } from '../LocalizationContext.tsx';
import { 
    BeakerIcon, 
    InformationCircleIcon, 
    DropletIcon, 
    AdjustmentsHorizontalIcon, 
    ArchiveBoxIcon, 
    GlobeAltIcon, 
    SparklesIcon as NitrogenIcon, 
    ExclamationTriangleIcon
} from '../icons';
import LoadingSpinner from '../ui/LoadingSpinner.tsx'; 
import Tooltip from '../ui/Tooltip.tsx'; 
import BounceIn from '../ui/BounceIn.tsx'; 
import EnvironmentalDataSkeleton from '../EnvironmentalDataSkeleton.tsx';
import SoilTextureVisualizer from '../ui/SoilTextureVisualizer.tsx'; 
import { type UiStrings } from '../../types';


const SoilMetricItem: React.FC<{icon: React.ReactNode, label: string, value?: string, selectedLanguageCode: string}> = ({icon, label, value, selectedLanguageCode}) => {
    const formatSoilValue = (val?: string) => {
        if (!val) return 'N/A';
        const parts = val.match(/([\d.,-]+)(.*)/);
        if (parts && parts.length === 3) {
            const num = parseFloat(parts[1].replace(/,/g, ''));
            const unit = parts[2].trim();
            if (isNaN(num)) return val;
            return `${num.toLocaleString(selectedLanguageCode, {minimumFractionDigits: unit.toLowerCase() === '%' ? 0 : 1, maximumFractionDigits: 1})} ${unit}`;
        }
        return val;
    };
    if (!value) return null;
    return (
        <p className="flex items-center ml-2">
            <span className="w-5 h-5 mr-2 text-[var(--primary-500)] opacity-80">{icon}</span>
            <strong>{label}:</strong>
            <span className="ml-1.5">{formatSoilValue(value)}</span>
        </p>
    );
};


const EnvironmentalSection: React.FC = () => {
  const { environmentalData, isLoadingEnvironmental, retryFetch } = useDataContext();
  const { uiStrings, selectedLanguage } = useLocalizationContext();

  const renderEnvironmentalDataContent = () => {
    if (isLoadingEnvironmental && !environmentalData) return <EnvironmentalDataSkeleton />;
    
    // Prioritize displaying specific error messages
    if (environmentalData?.error) {
        return (
             <div className="flex flex-col items-center justify-center text-center p-4 h-full bg-[var(--status-red-bg)] rounded-lg border border-[var(--status-red)]">
                <ExclamationTriangleIcon className="w-12 h-12 text-[var(--status-red-text)] mb-3" />
                <p className="text-md font-semibold text-[var(--status-red-text)]">{uiStrings.errorTitle}</p>
                {/* Using a generic message for soil data errors as specific error details might be too technical or already part of environmentalData.error string from the service */}
                <p className="text-sm text-[var(--status-red-text)] opacity-90 mt-1 mb-3">{uiStrings.soilDataErrorGeneral || "Could not retrieve soil data. Please check your connection or try again."}</p>
                <button
                  onClick={retryFetch}
                  className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary-500)] rounded-md hover:bg-[var(--primary-600)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-500)] transition-colors"
                  aria-label="Retry fetching environmental data"
                >
                  {uiStrings.retry || 'Retry'}
                </button>
            </div>
        );
    }

    const noEnvData = !environmentalData || (!environmentalData.elevation && !environmentalData.soilPH && !environmentalData.soilOrganicCarbon && !environmentalData.soilCEC && !environmentalData.soilNitrogen && !environmentalData.soilSand && !environmentalData.soilSilt && !environmentalData.soilClay && !environmentalData.soilAWC);

    if (noEnvData && !isLoadingEnvironmental) {
        // Specific message if SoilGrids indicates no data for the location
        if (environmentalData?.source === 'SoilGrids (NoDataAtLocation)') {
            return (
                <div className="flex flex-col items-center justify-center text-center p-4 h-full bg-[var(--glass-bg-secondary)] rounded-lg border border-[var(--glass-border)]">
                    <ExclamationTriangleIcon className="w-12 h-12 text-[var(--status-yellow-text)] mb-3" />
                    <p className="text-md font-semibold text-[var(--text-headings)]">{uiStrings.soilDataNotAvailableForLocationTitle || "Soil Data Not Available"}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">{uiStrings.soilDataNotAvailableForLocation || "Soil data is not available for this specific location from our provider."}</p>
                </div>
            );
        }
        // Fallback general unavailable message
        return (
            <div className="flex flex-col items-center justify-center text-center p-4 h-full bg-[var(--glass-bg-secondary)] rounded-lg border border-[var(--glass-border)]">
                <ExclamationTriangleIcon className="w-12 h-12 text-[var(--status-yellow-text)] mb-3" />
                <p className="text-md font-semibold text-[var(--text-headings)]">{uiStrings.environmentalDataUnavailable}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">{uiStrings.envDataUnavailableNoLocation}</p>
            </div>
        );
    }
        
    const timestamp = environmentalData?.dataTimestamp ? new Date(environmentalData.dataTimestamp).toLocaleString(selectedLanguage.code, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'}) : '';
    
    return (
      <BounceIn className="text-sm text-[var(--text-primary)] space-y-2">
        {isLoadingEnvironmental && <EnvironmentalDataSkeleton /> }
        {!isLoadingEnvironmental && environmentalData?.elevation && 
            <SoilMetricItem icon={<BeakerIcon />} label={uiStrings.elevation} value={environmentalData.elevation} selectedLanguageCode={selectedLanguage.code} />
        }
        
        {!isLoadingEnvironmental && (environmentalData?.soilPH || environmentalData?.soilOrganicCarbon || environmentalData?.soilCEC || environmentalData?.soilNitrogen || environmentalData?.soilSand || environmentalData?.soilSilt || environmentalData?.soilClay || environmentalData?.soilAWC) && (
          <div className="space-y-1.5">
            <p className="font-semibold text-base mb-1">{uiStrings.soilData}:</p>
            <SoilMetricItem icon={<AdjustmentsHorizontalIcon />} label={uiStrings.soilPH} value={environmentalData.soilPH} selectedLanguageCode={selectedLanguage.code} />
            <SoilMetricItem icon={<ArchiveBoxIcon />} label={uiStrings.soilOrganicCarbon} value={environmentalData.soilOrganicCarbon} selectedLanguageCode={selectedLanguage.code} />
            <SoilMetricItem icon={<GlobeAltIcon />} label={uiStrings.soilCEC} value={environmentalData.soilCEC} selectedLanguageCode={selectedLanguage.code} />
            <SoilMetricItem icon={<NitrogenIcon />} label={uiStrings.soilNitrogen} value={environmentalData.soilNitrogen} selectedLanguageCode={selectedLanguage.code} />
            
            <SoilTextureVisualizer 
                sand={environmentalData.soilSand}
                silt={environmentalData.soilSilt}
                clay={environmentalData.soilClay}
            />
            <SoilMetricItem icon={<DropletIcon />} label={uiStrings.soilAWCLabel} value={environmentalData.soilAWC} selectedLanguageCode={selectedLanguage.code} />
            <p className="text-xs text-[var(--text-secondary)] opacity-80 ml-2 pt-1.5">{uiStrings.soilDataSourceNote}</p>
          </div>
        )}
        {!isLoadingEnvironmental && timestamp && !noEnvData && <p className="text-xs text-[var(--text-secondary)] opacity-80 mt-3">{uiStrings.environmentalDataLastUpdated}: {timestamp}</p>}
      </BounceIn>
    );
  };

  return (
    <BounceIn className="md:col-span-1">
       <section className="card p-6 h-full flex flex-col">
          <div className="flex items-center mb-4">
              <BeakerIcon className="w-6 h-6 text-[var(--primary-500)] mr-3"/>
              <h2 className="text-xl font-semibold text-[var(--text-headings)] flex items-center">
                {uiStrings.environmentalFactorsTitle}
                <Tooltip content={uiStrings.whyEnvironmentalDataImportantContent} position="top" idSuffix="env-info-tooltip">
                  <InformationCircleIcon className="w-5 h-5 ml-2 text-[var(--text-secondary)] hover:text-[var(--accent-teal)] cursor-help" aria-label={uiStrings.whyEnvironmentalDataImportantTitle} />
                </Tooltip>
              </h2>
          </div>
          <div className="flex-grow">
            {renderEnvironmentalDataContent()}
          </div>
      </section>
    </BounceIn>
  );
};

export default EnvironmentalSection;
