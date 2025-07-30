import './App.css';
import { useState } from 'react';
import { Settings } from 'lucide-react';
import { MultiFileSelector } from '@/components/file-selector';
import { ConversionSettingsV2 } from '@/components/settings';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { BatchProgress, BatchResult } from '@/components/conversion';
import { Toaster } from '@/components/ui/sonner';
import { useToast } from '@/hooks/useToast';
import { conversionApi } from '@/services/conversionApi';
import {
  FileInfo,
  ConversionSettingsForm,
  ConversionResult as ResultType,
  BatchProgress as BatchProgressType,
  BatchResultsWithTempFolder,
} from '@/types';

type AppStage = 'select' | 'settings' | 'converting' | 'result';

function App() {
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const [stage, setStage] = useState<AppStage>('select');
  const [batchProgress, setBatchProgress] = useState<BatchProgressType | null>(
    null
  );
  const [batchResults, setBatchResults] = useState<ResultType[]>([]);
  const [globalSettings, setGlobalSettings] = useState<ConversionSettingsForm>({
    quality: 'high',
    resize: 'original',
    format: 'auto',
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { success, error } = useToast();

  const handleFilesSelect = (files: FileInfo[]) => {
    setSelectedFiles(files);
  };

  const handleFileRemove = (index?: number) => {
    if (index !== undefined) {
      const newFiles = selectedFiles.filter((_, i) => i !== index);
      setSelectedFiles(newFiles);
      // ファイルがなくなってもselect状態を維持
    }
    setBatchProgress(null);
    setBatchResults([]);
  };

  const handleClearAllFiles = () => {
    setSelectedFiles([]);
    setBatchProgress(null);
    setBatchResults([]);
  };

  const handleSettingsChange = (settings: ConversionSettingsForm) => {
    setGlobalSettings(settings);
  };

  const getSettingsDisplayText = () => {
    const qualityLabels = {
      maximum_compression: '最高圧縮',
      compressed: '高圧縮',
      standard: '標準',
      high: '高品質',
      highest: '最高品質',
    };
    const resizeLabels = {
      original: '元サイズ',
      '1/2': '1/2',
      '1/3': '1/3',
      '1/4': '1/4',
      '1/8': '1/8',
    };
    const formatLabels = {
      auto: '元の形式',
      jpeg: 'JPEG',
      png: 'PNG',
      webp: 'WebP',
      avif: 'AVIF',
      gif: 'GIF',
      heic: 'HEIC',
    };

    return `${qualityLabels[globalSettings.quality as keyof typeof qualityLabels]} / ${resizeLabels[globalSettings.resize as keyof typeof resizeLabels]} / ${formatLabels[globalSettings.format as keyof typeof formatLabels]}`;
  };

  const handleConversionStart = async () => {
    if (selectedFiles.length === 0) {
      error('ファイルを選択してください');
      return;
    }

    setStage('converting');
    setBatchProgress(null);
    setBatchResults([]);

    try {
      const results = await conversionApi.convertBatch(
        { files: selectedFiles, settings: globalSettings },
        (batchProgressUpdate) => {
          setBatchProgress(batchProgressUpdate);
        }
      );

      setBatchResults(results);
      setStage('result');

      const successCount = results.filter((r) => r.success).length;
      if (successCount === results.length) {
        success(`すべてのファイル（${successCount}件）の変換が完了しました`);
      } else {
        const failedCount = results.length - successCount;
        success(`${successCount}件成功、${failedCount}件失敗`);
      }
    } catch (err) {
      console.error('バッチ変換エラー:', err);
      error('バッチ変換に失敗しました');
      setStage('select');
    }
  };

  const handleCancel = () => {
    conversionApi.cancelBatch();
    setStage('select');
    setBatchProgress(null);
  };

  const handleCancelFile = (fileId: string) => {
    conversionApi.cancelFile(fileId);
  };

  const handleDownloadZip = async () => {
    const successfulResults = batchResults.filter((r) => r.success);

    if (successfulResults.length === 0) {
      error('ダウンロード可能なファイルがありません');
      return;
    }

    try {
      // 成功したファイルのパスを収集
      const filePaths = successfulResults
        .filter((result) => result.outputFile?.path)
        .map((result) => result.outputFile!.path);

      if (filePaths.length === 0) {
        error('ダウンロード可能なファイルパスが見つかりません');
        return;
      }

      // 一時フォルダのパスを取得
      const tempFolder = (batchResults as BatchResultsWithTempFolder)
        .tempFolder;

      // ZIP作成とダウンロード（conversionApiを使用）
      await conversionApi.createAndDownloadZip(filePaths, tempFolder);

      success(`${successfulResults.length}ファイルのZIPをダウンロードしました`);
    } catch (err) {
      console.error('ZIP ダウンロードエラー:', err);
      if (err instanceof Error && err.message.includes('キャンセル')) {
        // キャンセルされた場合は何もしない
      } else {
        error('ZIP ダウンロードに失敗しました');
      }
    }
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setStage('select');
    setBatchProgress(null);
    setBatchResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              ImageOptimizer
            </h1>
            <p className="text-gray-600">FFmpeg画像最適化ツール</p>
          </div>
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                設定
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>変換設定</DialogTitle>
              </DialogHeader>
              <ConversionSettingsV2
                onSubmit={handleSettingsChange}
                defaultValues={globalSettings}
                disabled={false}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="text-center mb-6 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">現在の設定</p>
          <p className="font-medium text-gray-800">
            {getSettingsDisplayText()}
          </p>
        </div>

        <div className="space-y-8">
          {/* ファイル選択 */}
          {stage === 'select' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                ファイル選択
              </h2>
              <MultiFileSelector
                onFilesSelect={handleFilesSelect}
                selectedFiles={selectedFiles}
                onFileRemove={handleFileRemove}
                onClearAll={handleClearAllFiles}
                maxFiles={10}
              />
            </div>
          )}

          {/* 変換開始ボタン */}
          {stage === 'select' && selectedFiles.length > 0 && (
            <div className="flex justify-center">
              <Button
                onClick={handleConversionStart}
                size="lg"
                className="px-8 py-3"
              >
                変換開始（{selectedFiles.length}ファイル）
              </Button>
            </div>
          )}

          {/* 変換中 */}
          {stage === 'converting' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                変換中
              </h2>
              {batchProgress && (
                <BatchProgress
                  batchProgress={batchProgress}
                  onCancel={handleCancel}
                  onCancelFile={handleCancelFile}
                  showIndividualFiles={true}
                />
              )}
            </div>
          )}

          {/* 変換結果 */}
          {stage === 'result' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                変換結果
              </h2>
              {batchResults.length > 0 && (
                <BatchResult
                  results={batchResults}
                  filenames={selectedFiles.map((f) => f.name)}
                  onDownloadZip={handleDownloadZip}
                  onReset={handleReset}
                />
              )}
            </div>
          )}
        </div>
      </div>
      <Toaster />
    </div>
  );
}

export default App;
