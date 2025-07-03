import React from 'react';
import {
  CheckCircle,
  XCircle,
  Download,
  FileImage,
  TrendingDown,
  Clock,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConversionResult as ResultType } from '@/types';

interface ConversionResultProps {
  result: ResultType;
  onDownload?: () => void;
  onReset?: () => void;
}

export const ConversionResult: React.FC<ConversionResultProps> = ({
  result,
  onDownload,
  onReset,
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return minutes > 0
      ? `${minutes}分${remainingSeconds}秒`
      : `${remainingSeconds}秒`;
  };

  if (!result.success) {
    return (
      <div className="bg-white border border-red-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <XCircle className="h-6 w-6 text-red-600" />
          <div>
            <h3 className="font-medium text-red-900">変換に失敗しました</h3>
            <p className="text-sm text-red-600">{result.error}</p>
          </div>
        </div>

        <div className="flex justify-center">
          <Button onClick={onReset} variant="outline">
            最初からやり直す
          </Button>
        </div>
      </div>
    );
  }

  const sizeDifference = result.originalSize - result.compressedSize;

  return (
    <div className="bg-white border border-green-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center space-x-3 mb-6">
        <CheckCircle className="h-6 w-6 text-green-600" />
        <div>
          <h3 className="font-medium text-green-900">変換が完了しました！</h3>
          <p className="text-sm text-green-600">
            ファイルの最適化が正常に完了しました
          </p>
        </div>
      </div>

      {/* ファイル情報 */}
      {result.outputFile && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3 mb-3">
            <FileImage className="h-5 w-5 text-gray-600" />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">
                {result.outputFile.name}
              </h4>
              <p className="text-sm text-gray-500">
                {formatFileSize(result.outputFile.size)} •{' '}
                {result.outputFile.format.toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 統計情報 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingDown className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">圧縮率</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {result.compressionRatio.toFixed(1)}%
          </div>
          <div className="text-xs text-blue-600">
            {formatFileSize(sizeDifference)} 削減
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">処理時間</span>
          </div>
          <div className="text-2xl font-bold text-green-900">
            {formatTime(result.processingTime)}
          </div>
        </div>
      </div>

      {/* ファイルサイズ比較 */}
      <div className="space-y-3 mb-6">
        <h4 className="font-medium text-gray-900">サイズ比較</h4>

        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-gray-600">元のファイル</span>
          <span className="font-medium">
            {formatFileSize(result.originalSize)}
          </span>
        </div>

        <div className="flex items-center justify-between py-2 border-t">
          <span className="text-sm text-gray-600">最適化後</span>
          <span className="font-medium text-green-600">
            {formatFileSize(result.compressedSize)}
          </span>
        </div>

        <div className="flex items-center justify-between py-2 border-t font-medium">
          <span className="text-gray-900">削減量</span>
          <span className="text-green-600">
            -{formatFileSize(sizeDifference)}
          </span>
        </div>
      </div>

      {/* アクション */}
      <div className="flex space-x-3">
        <Button onClick={onDownload} className="flex-1">
          <Download className="h-4 w-4 mr-2" />
          ダウンロード
        </Button>
        <Button onClick={onReset} variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          新しいファイル
        </Button>
      </div>
    </div>
  );
};
