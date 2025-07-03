import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Settings,
  Zap,
  Image,
  Maximize2,
  FileImage,
  Smartphone,
  Monitor,
  Tablet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormField, OptionCardGroup } from '@/components/common';
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

  const qualityOptions = [
    {
      value: 'maximum_compression',
      label: '最高圧縮',
      description: 'ファイルサイズ最小（品質: 50%）',
      icon: <Zap className="h-5 w-5" />,
    },
    {
      value: 'compressed',
      label: '高圧縮',
      description: 'バランス重視（品質: 65%）',
      icon: <Settings className="h-5 w-5" />,
    },
    {
      value: 'standard',
      label: '標準',
      description: '一般的な用途（品質: 75%）',
      icon: <Image className="h-5 w-5" />,
    },
    {
      value: 'high',
      label: '高品質',
      description: '高画質重視（品質: 85%）',
      icon: <FileImage className="h-5 w-5" />,
    },
    {
      value: 'highest',
      label: '最高品質',
      description: '最高画質（品質: 95%）',
      icon: <Maximize2 className="h-5 w-5" />,
    },
  ];

  const resizeOptions = [
    {
      value: 'original',
      label: '元サイズ',
      description: 'サイズを変更しない',
      icon: <Monitor className="h-5 w-5" />,
    },
    {
      value: '1/2',
      label: '1/2サイズ',
      description: '50%に縮小',
      icon: <Tablet className="h-5 w-5" />,
    },
    {
      value: '1/3',
      label: '1/3サイズ',
      description: '33%に縮小',
      icon: <Smartphone className="h-5 w-5" />,
    },
    {
      value: '1/4',
      label: '1/4サイズ',
      description: '25%に縮小',
      icon: <Smartphone className="h-5 w-5" />,
    },
    {
      value: '1/8',
      label: '1/8サイズ',
      description: '12.5%に縮小（サムネイル）',
      icon: <Smartphone className="h-5 w-5" />,
    },
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

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
        {/* 品質設定 */}
        <div>
          <Controller
            name="quality"
            control={control}
            render={({ field }) => (
              <FormField
                label="画質設定"
                id="quality"
                error={errors.quality}
                required
              >
                <OptionCardGroup
                  name="quality"
                  value={field.value}
                  options={qualityOptions}
                  onChange={field.onChange}
                  columns={2}
                  disabled={disabled}
                />
              </FormField>
            )}
          />
        </div>

        {/* リサイズ設定 */}
        <div>
          <Controller
            name="resize"
            control={control}
            render={({ field }) => (
              <FormField
                label="サイズ設定"
                id="resize"
                error={errors.resize}
                required
              >
                <OptionCardGroup
                  name="resize"
                  value={field.value}
                  options={resizeOptions}
                  onChange={field.onChange}
                  columns={2}
                  disabled={disabled}
                />
              </FormField>
            )}
          />
        </div>

        {/* フォーマット設定 */}
        <div>
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
                <OptionCardGroup
                  name="format"
                  value={field.value}
                  options={formatOptions}
                  onChange={field.onChange}
                  columns={3}
                  disabled={disabled}
                />
              </FormField>
            )}
          />
        </div>

        {/* 送信ボタン */}
        <div className="flex justify-end pt-6 border-t">
          <Button
            type="submit"
            disabled={disabled || isSubmitting}
            className="px-8 py-3 text-lg"
            size="lg"
          >
            {isSubmitting ? '処理中...' : '変換開始'}
          </Button>
        </div>
      </form>
    </div>
  );
};
