import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormField,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const form = useForm<ConversionSettingsForm>({
    resolver: zodResolver(ConversionSettingsFormSchema),
    defaultValues,
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

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
    <Form {...form}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={control}
            name="quality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>品質 *</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      className={errors.quality ? 'border-red-500' : ''}
                    >
                      <SelectValue placeholder="品質を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {qualityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="resize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>リサイズ *</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      className={errors.resize ? 'border-red-500' : ''}
                    >
                      <SelectValue placeholder="リサイズを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {resizeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="format"
            render={({ field }) => (
              <FormItem>
                <FormLabel>出力形式 *</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      className={errors.format ? 'border-red-500' : ''}
                    >
                      <SelectValue placeholder="出力形式を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {formatOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
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
    </Form>
  );
};
