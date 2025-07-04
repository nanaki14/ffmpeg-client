import './App.css';
import { useState } from 'react';
import { MultiFileSelector } from '@/components/file-selector';
import { ConversionSettingsV2 } from '@/components/settings';
import {
  BatchProgress,
  BatchResult,
} from '@/components/conversion';
import { Toaster } from '@/components/ui/sonner';
import { useToast } from '@/hooks/useToast';
import { conversionApi } from '@/services/conversionApi';
import {
  FileInfo,
  ConversionSettingsForm,
  ConversionResult as ResultType,
  BatchProgress as BatchProgressType,
} from '@/types';

type AppStage = 'select' | 'settings' | 'converting' | 'result';

function App() {
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const [stage, setStage] = useState<AppStage>('select');
  const [batchProgress, setBatchProgress] = useState<BatchProgressType | null>(
    null
  );
  const [batchResults, setBatchResults] = useState<ResultType[]>([]);
  const { success, error } = useToast();


  const handleFilesSelect = (files: FileInfo[]) => {
    setSelectedFiles(files);
    setStage('settings');
  };

  const handleFileRemove = (index?: number) => {
    if (index !== undefined) {
      const newFiles = selectedFiles.filter((_, i) => i !== index);
      setSelectedFiles(newFiles);
      if (newFiles.length === 0) {
        setStage('select');
      }
    }
    setBatchProgress(null);
    setBatchResults([]);
  };

  const handleClearAllFiles = () => {
    setSelectedFiles([]);
    setStage('select');
    setBatchProgress(null);
    setBatchResults([]);
  };

  const handleConversionSubmit = async (settings: ConversionSettingsForm) => {
    if (selectedFiles.length === 0) {
      error('ファイルを選択してください');
      return;
    }

    setStage('converting');
    setBatchProgress(null);
    setBatchResults([]);

    try {
      const results = await conversionApi.convertBatch(
        { files: selectedFiles, settings },
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
      setStage('settings');
    }
  };

  const handleCancel = () => {
    conversionApi.cancelBatch();
    setStage('settings');
    setBatchProgress(null);
  };

  const handleCancelFile = (fileId: string) => {
    conversionApi.cancelFile(fileId);
  };


  const handleDownloadAll = () => {
    const successfulResults = batchResults.filter((r) => r.success);
    success(
      `${successfulResults.length}ファイルをまとめてダウンロードしました`
    );
  };

  const handleDownloadFile = (index: number) => {
    const result = batchResults[index];
    if (result?.success && result.outputFile) {
      success(`${result.outputFile.name} をダウンロードしました`);
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
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          ImageOptimizer
        </h1>
        <p className="text-gray-600 text-center mb-8">FFmpeg画像最適化ツール</p>

        <div className="space-y-8">

          {/* ファイル選択段階 */}
          {(stage === 'select' || stage === 'settings') && (
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

          {/* 設定段階 */}
          {stage === 'settings' && selectedFiles.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                変換設定
              </h2>
              <ConversionSettingsV2
                onSubmit={handleConversionSubmit}
                disabled={false}
              />
            </div>
          )}

          {/* 変換中段階 */}
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

          {/* 結果段階 */}
          {stage === 'result' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                変換結果
              </h2>
              {batchResults.length > 0 && (
                <BatchResult
                  results={batchResults}
                  filenames={selectedFiles.map((f) => f.name)}
                  onDownloadAll={handleDownloadAll}
                  onDownloadFile={handleDownloadFile}
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
