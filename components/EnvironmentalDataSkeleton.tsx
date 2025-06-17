// /components/EnvironmentalDataSkeleton.tsx
import React from 'react';

const EnvironmentalDataSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="space-y-3">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
      </div>
      <div className="space-y-3 pt-4">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
      </div>
    </div>
  );
};

export default EnvironmentalDataSkeleton;
