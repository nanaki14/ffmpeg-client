import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface OptionCardProps {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  selected: boolean;
  onSelect: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export const OptionCard: React.FC<OptionCardProps> = ({
  value,
  label,
  description,
  icon,
  selected,
  onSelect,
  disabled = false,
  className = '',
}) => {
  return (
    <div
      className={cn(
        'relative p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md',
        selected
          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
          : 'border-gray-200 hover:border-gray-300',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={() => !disabled && onSelect(value)}
    >
      {selected && (
        <div className="absolute top-2 right-2">
          <Check className="h-5 w-5 text-blue-600" />
        </div>
      )}

      <div className="flex items-start space-x-3">
        {icon && (
          <div
            className={cn(
              'flex-shrink-0 mt-1',
              selected ? 'text-blue-600' : 'text-gray-400'
            )}
          >
            {icon}
          </div>
        )}

        <div className="flex-1">
          <h3
            className={cn(
              'font-medium',
              selected ? 'text-blue-900' : 'text-gray-900'
            )}
          >
            {label}
          </h3>
          {description && (
            <p
              className={cn(
                'text-sm mt-1',
                selected ? 'text-blue-700' : 'text-gray-500'
              )}
            >
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

interface OptionCardGroupProps {
  name: string;
  value: string;
  options: Array<{
    value: string;
    label: string;
    description?: string;
    icon?: React.ReactNode;
  }>;
  onChange: (value: string) => void;
  columns?: 1 | 2 | 3;
  className?: string;
  disabled?: boolean;
}

export const OptionCardGroup: React.FC<OptionCardGroupProps> = ({
  name,
  value,
  options,
  onChange,
  columns = 2,
  className = '',
  disabled = false,
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  };

  return (
    <RadioGroup
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      className={cn('grid gap-3', gridCols[columns], className)}
    >
      {options.map((option) => (
        <div key={option.value}>
          <RadioGroupItem
            value={option.value}
            id={option.value}
            className="sr-only"
          />
          <Label
            htmlFor={option.value}
            className={cn(
              'relative p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md block',
              value === option.value
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {value === option.value && (
              <div className="absolute top-2 right-2">
                <Check className="h-5 w-5 text-blue-600" />
              </div>
            )}
            <div className="flex items-start space-x-3">
              {option.icon && (
                <div
                  className={cn(
                    'flex-shrink-0 mt-1',
                    value === option.value ? 'text-blue-600' : 'text-gray-400'
                  )}
                >
                  {option.icon}
                </div>
              )}
              <div className="flex-1">
                <h3
                  className={cn(
                    'font-medium',
                    value === option.value ? 'text-blue-900' : 'text-gray-900'
                  )}
                >
                  {option.label}
                </h3>
                {option.description && (
                  <p
                    className={cn(
                      'text-sm mt-1',
                      value === option.value ? 'text-blue-700' : 'text-gray-500'
                    )}
                  >
                    {option.description}
                  </p>
                )}
              </div>
            </div>
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
};
