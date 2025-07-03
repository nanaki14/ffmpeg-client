import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  className = '',
}) => {
  return (
    <div
      className={`mt-4 p-3 bg-red-50 border border-red-200 rounded-md ${className}`}
    >
      <div className="flex items-center">
        <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
        <p className="text-red-600 text-sm">{message}</p>
      </div>
    </div>
  );
};
