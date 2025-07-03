import React from 'react';
import { Monitor, Smartphone, Globe, Image, Zap } from 'lucide-react';
import { OptionCardGroup } from '@/components/common';
import { ConversionSettingsForm } from '@/types';

interface PresetOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  settings: ConversionSettingsForm;
}

interface PresetSelectorProps {
  onPresetSelect: (preset: ConversionSettingsForm) => void;
  disabled?: boolean;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  onPresetSelect,
  disabled = false,
}) => {
  const presets: PresetOption[] = [
    {
      id: 'web',
      name: 'Web用',
      description: 'Webサイト向けの最適化設定',
      icon: <Globe className="h-5 w-5" />,
      settings: {
        quality: 'standard',
        resize: '1/2',
        format: 'webp',
      },
    },
    {
      id: 'mobile',
      name: 'モバイル用',
      description: 'スマートフォン向けの軽量設定',
      icon: <Smartphone className="h-5 w-5" />,
      settings: {
        quality: 'compressed',
        resize: '1/3',
        format: 'webp',
      },
    },
    {
      id: 'desktop',
      name: 'デスクトップ用',
      description: 'PC向けの高品質設定',
      icon: <Monitor className="h-5 w-5" />,
      settings: {
        quality: 'high',
        resize: 'original',
        format: 'auto',
      },
    },
    {
      id: 'print',
      name: '印刷用',
      description: '印刷物向けの最高品質設定',
      icon: <Image className="h-5 w-5" />,
      settings: {
        quality: 'highest',
        resize: 'original',
        format: 'png',
      },
    },
    {
      id: 'thumbnail',
      name: 'サムネイル用',
      description: '小さなプレビュー画像',
      icon: <Zap className="h-5 w-5" />,
      settings: {
        quality: 'standard',
        resize: '1/8',
        format: 'jpeg',
      },
    },
  ];

  const handlePresetSelect = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      onPresetSelect(preset.settings);
    }
  };

  const presetOptions = presets.map((preset) => ({
    value: preset.id,
    label: preset.name,
    description: preset.description,
    icon: preset.icon,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          プリセットから選択
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          用途に合わせて最適化された設定を選択できます
        </p>
      </div>

      <OptionCardGroup
        name="preset"
        value=""
        options={presetOptions}
        onChange={handlePresetSelect}
        columns={2}
        disabled={disabled}
      />
    </div>
  );
};
