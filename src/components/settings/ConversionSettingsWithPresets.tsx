import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConversionSettingsV2 } from './ConversionSettingsV2';
import { PresetSelector } from './PresetSelector';
import { ConversionSettingsForm } from '@/types';

interface ConversionSettingsWithPresetsProps {
  onSubmit: (data: ConversionSettingsForm) => void;
  defaultValues?: Partial<ConversionSettingsForm>;
  disabled?: boolean;
}

export const ConversionSettingsWithPresets: React.FC<
  ConversionSettingsWithPresetsProps
> = ({
  onSubmit,
  defaultValues = {
    quality: 'standard',
    resize: 'original',
    format: 'auto',
  },
  disabled = false,
}) => {
  const [currentSettings, setCurrentSettings] =
    useState<Partial<ConversionSettingsForm>>(defaultValues);
  const [activeTab, setActiveTab] = useState('preset');

  const handlePresetSelect = (preset: ConversionSettingsForm) => {
    setCurrentSettings(preset);
    setActiveTab('custom'); // プリセット選択後はカスタム設定タブに移動
  };

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preset">プリセット選択</TabsTrigger>
          <TabsTrigger value="custom">詳細設定</TabsTrigger>
        </TabsList>

        <TabsContent value="preset" className="mt-6">
          <PresetSelector
            onPresetSelect={handlePresetSelect}
            disabled={disabled}
          />
        </TabsContent>

        <TabsContent value="custom" className="mt-6">
          <ConversionSettingsV2
            onSubmit={onSubmit}
            defaultValues={currentSettings}
            disabled={disabled}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
