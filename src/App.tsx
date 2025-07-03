import './App.css';
import { useState } from 'react';
import { FileSelector, MultiFileSelector } from '@/components/file-selector';
import { ConversionSettingsWithPresets } from '@/components/settings';
import {
  ConversionProgress,
  ConversionResult,
  BatchProgress,
  BatchResult,
} from '@/components/conversion';
import { ToastContainer } from '@/components/common';
import { useToast } from '@/hooks/useToast';
import { conversionApi } from '@/services/conversionApi';
import {
  FileInfo,
  ConversionSettingsForm,
  ConversionProgress as ProgressType,
  ConversionResult as ResultType,
  BatchProgress as BatchProgressType,
} from '@/types';

type AppStage = 'select' | 'settings' | 'converting' | 'result';
type ConversionMode = 'single' | 'batch';

function App() {
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const [conversionMode, setConversionMode] =
    useState<ConversionMode>('single');
  const [stage, setStage] = useState<AppStage>('select');
  const [progress, setProgress] = useState<ProgressType | null>(null);
  const [batchProgress, setBatchProgress] = useState<BatchProgressType | null>(
    null
  );
  const [result, setResult] = useState<ResultType | null>(null);
  const [batchResults, setBatchResults] = useState<ResultType[]>([]);
  const { toasts, removeToast, success, error } = useToast();

  const handleFileSelect = (file: FileInfo) => {
    setSelectedFile(file);
    setConversionMode('single');
    setStage('settings');
  };

  const handleFilesSelect = (files: FileInfo[]) => {
    setSelectedFiles(files);
    setConversionMode('batch');
    setStage('settings');
  };

  const handleFileRemove = (index?: number) => {
    if (conversionMode === 'single') {
      setSelectedFile(null);
    } else if (index !== undefined) {
      const newFiles = selectedFiles.filter((_, i) => i !== index);
      setSelectedFiles(newFiles);
      if (newFiles.length === 0) {
        setStage('select');
      }
    }
    setProgress(null);
    setBatchProgress(null);
    setResult(null);
    setBatchResults([]);
  };

  const handleClearAllFiles = () => {
    setSelectedFiles([]);
    setStage('select');
    setBatchProgress(null);
    setBatchResults([]);
  };

  const handleConversionSubmit = async (settings: ConversionSettingsForm) => {
    if (conversionMode === 'single') {
      if (!selectedFile) {
        error('ファイルを選択してください');
        return;
      }

      setStage('converting');
      setProgress(null);
      setResult(null);

      try {
        const result = await conversionApi.convert(
          { file: selectedFile, settings },
          (progressUpdate) => {
            setProgress(progressUpdate);
          }
        );

        setResult(result);
        setStage('result');

        if (result.success) {
          success('変換が完了しました');
        } else {
          error(result.error || '変換に失敗しました');
        }
      } catch (err) {
        console.error('変換エラー:', err);
        error('変換に失敗しました');
        setStage('settings');
      }
    } else {
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
    }
  };

  const handleCancel = () => {
    if (conversionMode === 'single') {
      conversionApi.cancel();
    } else {
      conversionApi.cancelBatch();
    }
    setStage('settings');
    setProgress(null);
    setBatchProgress(null);
  };

  const handleCancelFile = (fileId: string) => {
    conversionApi.cancelFile(fileId);
  };

  const handleDownload = () => {
    if (result?.outputFile) {
      // 実際の実装では、ここでファイルダウンロードを行う
      success(`${result.outputFile.name} をダウンロードしました`);
    }
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
    setSelectedFile(null);
    setSelectedFiles([]);
    setConversionMode('single');
    setStage('select');
    setProgress(null);
    setBatchProgress(null);
    setResult(null);
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
          {/* モード選択 */}
          {stage === 'select' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                変換モード選択
              </h2>
              <div className="flex space-x-4 mb-6">
                <button
                  onClick={() => setConversionMode('single')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    conversionMode === 'single'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  単一ファイル
                </button>
                <button
                  onClick={() => setConversionMode('batch')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    conversionMode === 'batch'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  バッチ処理
                </button>
              </div>
            </div>
          )}

          {/* ファイル選択段階 */}
          {(stage === 'select' || stage === 'settings') && (
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                ファイル選択
              </h2>
              {conversionMode === 'single' ? (
                <FileSelector
                  onFileSelect={handleFileSelect}
                  selectedFile={selectedFile}
                  onFileRemove={() => handleFileRemove()}
                />
              ) : (
                <MultiFileSelector
                  onFilesSelect={handleFilesSelect}
                  selectedFiles={selectedFiles}
                  onFileRemove={handleFileRemove}
                  onClearAll={handleClearAllFiles}
                  maxFiles={10}
                />
              )}
            </div>
          )}

          {/* 設定段階 */}
          {stage === 'settings' &&
            ((conversionMode === 'single' && selectedFile) ||
              (conversionMode === 'batch' && selectedFiles.length > 0)) && (
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-4">
                  変換設定
                </h2>
                <ConversionSettingsWithPresets
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
              {conversionMode === 'single' && progress ? (
                <ConversionProgress
                  progress={progress}
                  onCancel={handleCancel}
                  showCancel={true}
                />
              ) : conversionMode === 'batch' && batchProgress ? (
                <BatchProgress
                  batchProgress={batchProgress}
                  onCancel={handleCancel}
                  onCancelFile={handleCancelFile}
                  showIndividualFiles={true}
                />
              ) : null}
            </div>
          )}

          {/* 結果段階 */}
          {stage === 'result' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                変換結果
              </h2>
              {conversionMode === 'single' && result ? (
                <ConversionResult
                  result={result}
                  onDownload={handleDownload}
                  onReset={handleReset}
                />
              ) : conversionMode === 'batch' && batchResults.length > 0 ? (
                <BatchResult
                  results={batchResults}
                  filenames={selectedFiles.map((f) => f.name)}
                  onDownloadAll={handleDownloadAll}
                  onDownloadFile={handleDownloadFile}
                  onReset={handleReset}
                />
              ) : null}
            </div>
          )}
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;
