
import React from 'react';
import { useLocalizationContext } from '../LocalizationContext.tsx'; // For labels
import Tooltip from './Tooltip.tsx'; // For potential tooltips on segments

interface SoilTextureVisualizerProps {
  sand?: string; // Percentage string e.g., "60%"
  silt?: string; // Percentage string e.g., "30%"
  clay?: string; // Percentage string e.g., "10%"
  height?: number; // Height of the bar in pixels
}

const SoilTextureVisualizer: React.FC<SoilTextureVisualizerProps> = ({
  sand,
  silt,
  clay,
  height = 20,
}) => {
  const { uiStrings } = useLocalizationContext();

  const parsePercent = (value?: string): number => {
    if (!value) return 0;
    return parseFloat(value.replace('%', '')) || 0;
  };

  const sandPercent = parsePercent(sand);
  const siltPercent = parsePercent(silt);
  const clayPercent = parsePercent(clay);

  const totalPercent = sandPercent + siltPercent + clayPercent;

  // Normalize if total is not 100, though ideally input should sum to 100
  const normSand = totalPercent > 0 ? (sandPercent / totalPercent) * 100 : sandPercent > 0 ? 100 : 0;
  const normSilt = totalPercent > 0 ? (siltPercent / totalPercent) * 100 : siltPercent > 0 ? 100 : 0;
  const normClay = totalPercent > 0 ? (clayPercent / totalPercent) * 100 : clayPercent > 0 ? 100 : 0;
  
  // If all are zero, don't render the bar itself, maybe a placeholder?
  if (sandPercent === 0 && siltPercent === 0 && clayPercent === 0) {
    return <p className="text-xs text-[var(--text-secondary)] italic">{uiStrings.soilTextureLabel}: N/A</p>;
  }

  const segments = [
    { percent: normSand, color: 'bg-yellow-400 dark:bg-yellow-600', label: uiStrings.soilSandLabel, rawValue: sand || 'N/A' },
    { percent: normSilt, color: 'bg-orange-400 dark:bg-orange-600', label: uiStrings.soilSiltLabel, rawValue: silt || 'N/A' },
    { percent: normClay, color: 'bg-red-500 dark:bg-red-700', label: uiStrings.soilClayLabel, rawValue: clay || 'N/A' },
  ].filter(segment => segment.percent > 0);

  return (
    <div className="my-2">
      <p className="text-sm font-medium text-[var(--text-primary)] mb-1.5">{uiStrings.soilTextureLabel}:</p>
      <div className="flex w-full rounded-md overflow-hidden border border-[var(--glass-border)]" style={{ height: `${height}px` }} role="img" aria-label={`Soil texture: Sand ${sandPercent}%, Silt ${siltPercent}%, Clay ${clayPercent}%`}>
        {segments.map((segment, index) => (
          <Tooltip key={index} content={`${segment.label}: ${segment.rawValue}`} position="top">
            <div
              className={`${segment.color} transition-all duration-300 ease-in-out`}
              style={{ width: `${segment.percent}%` }}
              aria-label={`${segment.label} ${segment.percent.toFixed(0)}%`}
            />
          </Tooltip>
        ))}
      </div>
      <div className="flex justify-between text-xs text-[var(--text-secondary)] mt-1.5 px-0.5">
         {segments.map((segment, index) => (
            <span key={index} className="flex items-center">
              <span className={`w-2.5 h-2.5 rounded-sm ${segment.color} mr-1.5`}></span>
              {segment.label}: {segment.rawValue}
            </span>
         ))}
      </div>
    </div>
  );
};

export default SoilTextureVisualizer;
