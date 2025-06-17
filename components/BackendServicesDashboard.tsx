
import React from 'react';
import { useLocalizationContext } from './LocalizationContext.tsx';
import { useServiceStatus } from '@/hooks/useServiceStatus';
import { type ServiceStatusInfo, type UiStrings } from '@/types';
import { 
    SparklesIcon, 
    GlobeEuropeAfricaIcon, 
    SunIcon, 
    MapPinIcon, 
    DocumentTextIcon,
    CheckCircleIcon, 
    ExclamationTriangleIcon, 
    ClockIcon 
} from '../icons';
import BounceIn from './ui/BounceIn.tsx';

interface ServiceDetail {
    id: string;
    titleKey: keyof UiStrings;
    icon: React.ReactNode;
    providerInfoKey: keyof UiStrings;
    apiKeyInfoKey: keyof UiStrings;
    additionalInfoKey?: keyof UiStrings;
}

const StatusIndicator: React.FC<{ service: ServiceStatusInfo | undefined, uiStrings: UiStrings }> = ({ service, uiStrings }) => {
    if (!service) {
      return (
        <div className="flex items-center text-sm text-[var(--text-secondary)]">
          <ClockIcon className="w-4 h-4 mr-1.5 opacity-70" /> {uiStrings.serviceStatusPending}
        </div>
      );
    }
  
    let iconElement: React.ReactNode;
    let textColorClass = 'text-[var(--text-secondary)]';
    let statusText = uiStrings.serviceStatusPending;
  
    switch (service.status) {
      case 'UP':
        iconElement = <CheckCircleIcon className="w-5 h-5" />;
        textColorClass = 'text-[var(--status-green)]';
        statusText = uiStrings.serviceStatusUp;
        break;
      case 'DOWN':
        iconElement = <ExclamationTriangleIcon className="w-5 h-5" />;
        textColorClass = 'text-[var(--status-red)]';
        statusText = uiStrings.serviceStatusDown;
        break;
      case 'ERROR':
        iconElement = <ExclamationTriangleIcon className="w-5 h-5" />;
        textColorClass = 'text-[var(--status-yellow)]';
        statusText = uiStrings.serviceStatusError;
        break;
      default:
        iconElement = <ClockIcon className="w-5 h-5 opacity-70" />;
        break;
    }
  
    return (
      <div className={`flex items-center text-sm font-medium ${textColorClass}`}>
        <span className="mr-1.5">{iconElement}</span>
        <span>{statusText}</span>
        {service.details && <span className="ml-1 text-xs opacity-80">({service.details})</span>}
      </div>
    );
};


const BackendServicesDashboard: React.FC = () => {
    const { uiStrings } = useLocalizationContext();
    const { serviceStatuses } = useServiceStatus();

    const services: ServiceDetail[] = [
        { 
            id: 'ai', 
            titleKey: 'aiServiceTitle', 
            icon: <SparklesIcon className="w-6 h-6" />, 
            providerInfoKey: 'geminiModelInfo', 
            apiKeyInfoKey: 'geminiKeyInfo' 
        },
        { 
            id: 'location', 
            titleKey: 'ipLocationServiceTitle', 
            icon: <GlobeEuropeAfricaIcon className="w-6 h-6" />, 
            providerInfoKey: 'ipLocationProvidersInfo', 
            apiKeyInfoKey: 'ipLocationKeyInfo' 
        },
        { 
            id: 'weather', 
            titleKey: 'weatherServiceTitle', 
            icon: <SunIcon className="w-6 h-6" />, 
            providerInfoKey: 'weatherProviderInfo', 
            apiKeyInfoKey: 'weatherKeyInfo' 
        },
        { 
            id: 'elevation', 
            titleKey: 'elevationServiceTitle', 
            icon: <MapPinIcon className="w-6 h-6" />, 
            providerInfoKey: 'elevationProvidersInfo', 
            apiKeyInfoKey: 'elevationKeyInfo' 
        },
        { 
            id: 'soil', 
            titleKey: 'soilServiceTitle', 
            icon: <DocumentTextIcon className="w-6 h-6" />, 
            providerInfoKey: 'soilProviderInfo', 
            apiKeyInfoKey: 'soilKeyInfo' 
        },
    ];

    return (
        <BounceIn>
            <div className="space-y-8">
                <h2 className="text-3xl font-bold text-[var(--text-headings)] text-center tracking-tight">
                    {uiStrings.backendDashboardTitle}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {services.map(service => {
                        const status = serviceStatuses.find(s => s.id === service.id);
                        const title = uiStrings[service.titleKey] || service.titleKey;
                        const providerInfo = uiStrings[service.providerInfoKey] || service.providerInfoKey;
                        const apiKeyInfo = uiStrings[service.apiKeyInfoKey] || service.apiKeyInfoKey;
                        const additionalInfo = service.additionalInfoKey ? uiStrings[service.additionalInfoKey] : null;

                        return (
                            <div key={service.id} className="card p-6 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center mb-3">
                                        <span className="text-[var(--primary-500)] mr-3">{service.icon}</span>
                                        <h3 className="text-xl font-semibold text-[var(--text-headings)]">{String(title)}</h3>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <p><strong className="text-[var(--text-secondary)]">{uiStrings.serviceProviderLabel}:</strong> <span className="text-[var(--text-primary)]">{String(providerInfo)}</span></p>
                                        {additionalInfo && <p><span className="text-[var(--text-primary)]">{String(additionalInfo)}</span></p>}
                                        <p><strong className="text-[var(--text-secondary)]">{uiStrings.apiKeyManagementLabel}:</strong> <span className="text-[var(--text-primary)]">{String(apiKeyInfo)}</span></p>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-[var(--glass-border)]">
                                    <strong className="text-sm text-[var(--text-secondary)] mr-2">{uiStrings.statusLabel}:</strong>
                                    <StatusIndicator service={status} uiStrings={uiStrings} />
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-8 p-4 bg-[var(--glass-bg-secondary)] border border-[var(--glass-border)] rounded-lg text-center">
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{uiStrings.howToUpdateConfigText}</p>
                </div>
            </div>
        </BounceIn>
    );
};

export default BackendServicesDashboard;
