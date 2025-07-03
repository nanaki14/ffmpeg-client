import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { FormField, Select } from '@/components/common';
import {
  ConversionSettingsForm,
  ConversionSettingsFormSchema,
  QualityMapping,
  ResizeMapping,
  FormatMapping,
} from '@/types';

interface ConversionSettingsProps {
  onSubmit: (data: ConversionSettingsForm) => void;
  defaultValues?: Partial<ConversionSettingsForm>;
  disabled?: boolean;
}

export const ConversionSettings: React.FC<ConversionSettingsProps> = ({
  onSubmit,
  defaultValues = {
    quality: 'standard',
    resize: 'original',
    format: 'auto',
  },
  disabled = false,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ConversionSettingsForm>({
    resolver: zodResolver(ConversionSettingsFormSchema),
    defaultValues,
  });

  const qualityOptions = Object.entries(QualityMapping).map(([key, value]) => ({
    value: key,
    label: value.label,
  }));

  const resizeOptions = Object.entries(ResizeMapping).map(([key, value]) => ({
    value: key,
    label: value.label,
  }));

  const formatOptions = Object.entries(FormatMapping).map(([key, value]) => ({
    value: key,
    label: value.label,
  }));

  const handleFormSubmit = (data: ConversionSettingsForm) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Controller
          name="quality"
          control={control}
          render={({ field }) => (
            <FormField
              label="品質"
              id="quality"
              error={errors.quality}
              required
            >
              <Select
                id="quality"
                value={field.value}
                options={qualityOptions}
                onChange={field.onChange}
                placeholder="品質を選択"
                error={!!errors.quality}
              />
            </FormField>
          )}
        />

        <Controller
          name="resize"
          control={control}
          render={({ field }) => (
            <FormField
              label="リサイズ"
              id="resize"
              error={errors.resize}
              required
            >
              <Select
                id="resize"
                value={field.value}
                options={resizeOptions}
                onChange={field.onChange}
                placeholder="リサイズを選択"
                error={!!errors.resize}
              />
            </FormField>
          )}
        />

        <Controller
          name="format"
          control={control}
          render={({ field }) => (
            <FormField
              label="出力形式"
              id="format"
              error={errors.format}
              required
            >
              <Select
                id="format"
                value={field.value}
                options={formatOptions}
                onChange={field.onChange}
                placeholder="出力形式を選択"
                error={!!errors.format}
              />
            </FormField>
          )}
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={disabled || isSubmitting}
          className="px-8"
        >
          {isSubmitting ? '処理中...' : '変換開始'}
        </Button>
      </div>
    </form>
  );
};
