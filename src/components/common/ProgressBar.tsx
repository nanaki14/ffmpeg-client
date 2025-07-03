import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
  showText?: boolean;
  color?: 'blue' | 'green' | 'red' | 'yellow';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className = '',
  showText = true,
  color = 'blue',
}) => {
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600',
  };

  const safeProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={cn('w-full', className)}>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={cn(
            'h-2.5 rounded-full transition-all duration-300 ease-out',
            colorClasses[color]
          )}
          style={{ width: `${safeProgress}%` }}
        />
      </div>
      {showText && (
        <div className="text-sm text-gray-600 mt-1 text-center">
          {Math.round(safeProgress)}%
        </div>
      )}
    </div>
  );
};
