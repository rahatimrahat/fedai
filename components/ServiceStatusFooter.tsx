
import React from 'react';
import { type ServiceStatusInfo } from '../types';
import { CheckCircleIcon, ExclamationTriangleIcon, ClockIcon } from '../icons'; 
import { useLocalizationContext } from './LocalizationContext.tsx';
// Tooltip is not directly used in ServiceStatusFooter, but keeping for consistency if it were.
// If it's truly unused, this import can be removed.
// import Tooltip from './ui/Tooltip.tsx'; // Example if Tooltip were used here

interface ServiceStatusFooterProps {
  serviceStatuses: ServiceStatusInfo[];
}

const StatusIndicator: React.FC<{ status: ServiceStatusInfo['status'], details?: string, statusText: string }> = ({ status, details, statusText }) => {
  let iconElement: React.ReactNode;
  let pulseClass = 'shadow-pulse-blue'; 
  let iconColorClass = 'text-[var(--status-blue)]';
  let titleText = statusText;

  if (details) {
    titleText += ` - ${details}`;
  }

  switch (status) {
    case 'UP':
      iconElement = <CheckCircleIcon className="w-4 h-4" />;
      pulseClass = 'shadow-pulse-green'; 
      iconColorClass = 'text-[var(--status-green)]';
      break;
    case 'DOWN':
      iconElement = <ExclamationTriangleIcon className="w-4 h-4" />;
      pulseClass = 'shadow-pulse-red';
      iconColorClass = 'text-[var(--status-red)]';
      break;
    case 'ERROR':
      iconElement = <ExclamationTriangleIcon className="w-4 h-4" />; 
      pulseClass = 'shadow-pulse-yellow';
      iconColorClass = 'text-[var(--status-yellow)]';
      break;
    case 'PENDING':
    default:
      iconElement = <ClockIcon className="w-4 h-4" />;
      pulseClass = 'shadow-pulse-blue';
      iconColorClass = 'text-[var(--status-blue)]';
      break;
  }

  return (
    <div className="relative flex items-center group">
      <div 
        className={`w-5 h-5 rounded-full mr-1.5 flex items-center justify-center ${pulseClass} ${iconColorClass}`}
        aria-hidden="true"
        // style={{} as React.CSSProperties} // Removed empty style prop
      >
        {iconElement}
      </div>
      <div 
        className="opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 delay-100
                   absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 px-3 py-2 
                   bg-glass text-[var(--text-primary)] text-xs rounded-md shadow-xl whitespace-nowrap z-20"
        role="tooltip"
      >
        {titleText}
        <svg className="absolute text-[var(--glass-bg-primary)] h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255">
            <polygon className="fill-current" points="0,0 127.5,127.5 255,0"/>
        </svg>
      </div>
    </div>
  );
};


const ServiceStatusFooter: React.FC<ServiceStatusFooterProps> = ({ serviceStatuses }) => {
  const { uiStrings } = useLocalizationContext();
  if (serviceStatuses.length === 0 && !uiStrings.dataSourceDisclaimer) return null;

  const getStatusText = (statusKey: ServiceStatusInfo['status']): string => {
    switch (statusKey) {
      case 'UP': return uiStrings.serviceStatusUp;
      case 'DOWN': return uiStrings.serviceStatusDown;
      case 'ERROR': return uiStrings.serviceStatusError;
      case 'PENDING': return uiStrings.serviceStatusPending;
      default: return statusKey;
    }
  };

  return (
    <footer className="py-6 mt-10 text-center bg-glass"> 
      <p className="text-sm text-[var(--text-secondary)] opacity-90 px-4">{uiStrings.allRightsReserved}</p>
      
      {uiStrings.dataSourceDisclaimer && (
        <p className="text-xs text-[var(--text-secondary)] opacity-80 mt-2 px-6 max-w-2xl mx-auto">
          {uiStrings.dataSourceDisclaimer}
        </p>
      )}

      {serviceStatuses.length > 0 && (
        <div className="mt-4 pt-4 pb-1 text-[var(--text-primary)] border-t border-[var(--glass-border)] mx-auto max-w-5xl"> 
          <div className="px-2 sm:px-4 lg:px-6">
            <p className="text-sm font-medium mb-2.5 text-center text-[var(--text-secondary)] opacity-90">{uiStrings.serviceStatusTitle}:</p>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5">
              {serviceStatuses.map(service => {
                const serviceName = uiStrings[service.displayNameKey as keyof typeof uiStrings] || service.displayNameKey;
                const statusText = getStatusText(service.status);
                return (
                  <div key={service.id} className="flex items-center text-xs">
                    <StatusIndicator status={service.status} details={service.details} statusText={statusText} />
                    <span className="text-[var(--text-primary)] opacity-90">{String(serviceName)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default ServiceStatusFooter;
