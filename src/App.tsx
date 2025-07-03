import './App.css';
import { useState } from 'react';
import { FileSelector } from '@/components/file-selector';
import { ConversionSettingsWithPresets } from '@/components/settings';
import { ToastContainer } from '@/components/common';
import { useToast } from '@/hooks/useToast';
import { FileInfo, ConversionSettingsForm } from '@/types';

function App() {
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const { toasts, removeToast, success, error } = useToast();

  const handleFileSelect = (file: FileInfo) => {
    setSelectedFile(file);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
  };

  const handleConversionSubmit = async (settings: ConversionSettingsForm) => {
    if (!selectedFile) {
      error('ファイルを選択してください');
      return;
    }

    setIsConverting(true);
    try {
      // TODO: FFmpeg変換処理を実装
      console.log('変換設定:', settings);
      console.log('ファイル:', selectedFile);

      // 仮の処理時間
      await new Promise((resolve) => setTimeout(resolve, 2000));

      success('変換が完了しました');
    } catch (err) {
      console.error('変換エラー:', err);
      error('変換に失敗しました');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          ImageOptimizer
        </h1>
        <p className="text-gray-600 text-center mb-8">FFmpeg画像最適化ツール</p>

        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              ファイル選択
            </h2>
            <FileSelector
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
              onFileRemove={handleFileRemove}
            />
          </div>

          {selectedFile && (
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                変換設定
              </h2>
              <ConversionSettingsWithPresets
                onSubmit={handleConversionSubmit}
                disabled={isConverting}
              />
            </div>
          )}
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;
