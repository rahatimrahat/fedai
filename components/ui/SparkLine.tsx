// /components/ui/SparkLine.tsx
import React from 'react';

interface SparkLineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}

export const SparkLine: React.FC<SparkLineProps> = ({ data = [], width = 120, height = 40, className = '' }) => {
  if (data.length < 2) {
    return (
      <div style={{ width, height }} className={`flex items-center justify-center text-xs text-[var(--text-secondary)] ${className}`}>
        Not enough data
      </div>
    );
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min === 0 ? 1 : max - min;

  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((d - min) / range) * (height - 4) + 2; // -4 and +2 for padding
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className}>
      <polyline
        fill="none"
        stroke="var(--primary-500)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};
