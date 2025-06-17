// /components/WeatherDataSkeleton.tsx
import React from 'react';

const WeatherDataSkeleton: React.FC = () => {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="flex items-center space-x-4">
        <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
      </div>
      <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg pt-2"></div>
    </div>
  );
};

export default WeatherDataSkeleton;
