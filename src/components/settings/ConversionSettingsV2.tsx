import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Form,
  FormItem,
  FormLabel,
  FormMessage,
  FormField,
  FormControl,
} from '@/components/ui/form';
import { Slider } from '@/components/ui/slider';
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
  FormatMapping,
} from '@/types';

interface ConversionSettingsV2Props {
  onSubmit: (data: ConversionSettingsForm) => void;
  defaultValues?: Partial<ConversionSettingsForm>;
  disabled?: boolean;
}

export const ConversionSettingsV2: React.FC<ConversionSettingsV2Props> = ({
  onSubmit,
  defaultValues = {
    quality: 'high',
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
    formState: { errors: _errors, isSubmitting: _isSubmitting },
  } = form;

  const qualityOptions = [
    'maximum_compression',
    'compressed',
    'standard',
    'high',
    'highest',
  ];

  const qualityLabels = {
    maximum_compression: '最高圧縮',
    compressed: '高圧縮',
    standard: '標準',
    high: '高品質',
    highest: '最高品質',
  };

  const qualityDescriptions = {
    maximum_compression: 'ファイルサイズ最小（品質: 50%）',
    compressed: 'バランス重視（品質: 65%）',
    standard: '一般的な用途（品質: 75%）',
    high: '高画質重視（品質: 85%）',
    highest: '最高画質（品質: 95%）',
  };

  const getQualitySliderValue = (quality: string) => {
    return qualityOptions.indexOf(quality);
  };

  const getQualityFromSliderValue = (value: number) => {
    return qualityOptions[value];
  };

  const resizeOptions = [
    { value: 'original', label: '元サイズ', description: 'サイズを変更しない' },
    { value: '1/2', label: '1/2', description: '50%に縮小' },
    { value: '1/3', label: '1/3', description: '33%に縮小' },
    { value: '1/4', label: '1/4', description: '25%に縮小' },
    { value: '1/8', label: '1/8', description: '12.5%に縮小' },
  ];

  const formatOptions = Object.entries(FormatMapping).map(([key, value]) => ({
    value: key,
    label: value.label,
    description: getFormatDescription(key),
  }));

  function getFormatDescription(format: string): string {
    const descriptions = {
      auto: '入力画像と同じ形式で出力',
      jpeg: '写真に最適、圧縮率が高い',
      png: '透明度対応、可逆圧縮',
      webp: '最新形式、高効率圧縮',
      avif: '次世代形式、最高効率',
      gif: 'アニメーション対応',
      heic: 'Apple形式、高効率',
    };
    return descriptions[format as keyof typeof descriptions] || '';
  }

  const handleFormSubmit = (data: ConversionSettingsForm) => {
    onSubmit(data);
  };

  // リアルタイム設定変更を通知
  React.useEffect(() => {
    const subscription = form.watch((data) => {
      if (data.quality && data.resize && data.format) {
        onSubmit(data as ConversionSettingsForm);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onSubmit]);

  return (
    <Form {...form}>
      <div className="space-y-8">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
          {/* 品質設定 */}
          <div>
            <FormField
              control={control}
              name="quality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>画質設定 *</FormLabel>
                  <div className="space-y-4">
                    <div className="px-3">
                      <Slider
                        value={[getQualitySliderValue(field.value)]}
                        onValueChange={(value) =>
                          field.onChange(getQualityFromSliderValue(value[0]))
                        }
                        max={4}
                        min={0}
                        step={1}
                        className="w-full"
                        disabled={disabled}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 px-3">
                      <span>最高圧縮</span>
                      <span>高圧縮</span>
                      <span>標準</span>
                      <span>高品質</span>
                      <span>最高品質</span>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-gray-900">
                        {
                          qualityLabels[
                            field.value as keyof typeof qualityLabels
                          ]
                        }
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {
                          qualityDescriptions[
                            field.value as keyof typeof qualityDescriptions
                          ]
                        }
                      </div>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* リサイズ設定 */}
            <FormField
              control={control}
              name="resize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>サイズ設定 *</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={disabled}
                    >
                      <SelectTrigger className="w-full text-left">
                        <SelectValue placeholder="サイズを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {resizeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="font-medium">{option.label}</div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* フォーマット設定 */}
            <FormField
              control={control}
              name="format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>出力形式 *</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={disabled}
                    >
                      <SelectTrigger className="w-full text-left">
                        <SelectValue placeholder="出力形式を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {formatOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="font-medium">{option.label}</div>
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
        </form>
      </div>
    </Form>
  );
};
