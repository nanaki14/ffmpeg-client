import React from 'react';
import {
  CheckCircle,
  XCircle,
  Download,
  FileImage,
  TrendingDown,
  Clock,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConversionResult } from '@/types';

interface BatchResultProps {
  results: ConversionResult[];
  filenames: string[];
  onDownloadZip?: () => void;
  onReset?: () => void;
}

export const BatchResult: React.FC<BatchResultProps> = ({
  results,
  filenames,
  onDownloadZip,
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

  const successfulResults = results.filter((r) => r.success);
  const failedResults = results.filter((r) => !r.success);

  const totalStats = {
    originalSize: results.reduce((sum, r) => sum + r.originalSize, 0),
    compressedSize: successfulResults.reduce(
      (sum, r) => sum + r.compressedSize,
      0
    ),
    totalProcessingTime: results.reduce((sum, r) => sum + r.processingTime, 0),
  };

  const averageCompressionRatio =
    successfulResults.length > 0
      ? successfulResults.reduce((sum, r) => sum + r.compressionRatio, 0) /
        successfulResults.length
      : 0;

  const totalSizeDifference =
    totalStats.originalSize - totalStats.compressedSize;

  return (
    <div className="space-y-6">
      {/* 全体サマリー */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          {failedResults.length === 0 ? (
            <CheckCircle className="h-6 w-6 text-green-600" />
          ) : successfulResults.length > 0 ? (
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
          ) : (
            <XCircle className="h-6 w-6 text-red-600" />
          )}
          <div>
            <h3 className="font-medium text-gray-900">バッチ変換結果</h3>
            <p className="text-sm text-gray-600">
              {successfulResults.length}件成功 / {failedResults.length}件失敗 /
              全{results.length}件
            </p>
          </div>
        </div>

        {/* 統計情報 */}
        {successfulResults.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingDown className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  平均圧縮率
                </span>
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {averageCompressionRatio.toFixed(1)}%
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <FileImage className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">
                  削減量
                </span>
              </div>
              <div className="text-2xl font-bold text-green-900">
                {formatFileSize(totalSizeDifference)}
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">
                  総処理時間
                </span>
              </div>
              <div className="text-2xl font-bold text-purple-900">
                {formatTime(totalStats.totalProcessingTime)}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">
                  成功率
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {((successfulResults.length / results.length) * 100).toFixed(1)}
                %
              </div>
            </div>
          </div>
        )}

        {/* アクション */}
        <div className="flex space-x-3">
          {successfulResults.length > 0 && onDownloadZip && (
            <Button onClick={onDownloadZip} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              ZIPでダウンロード ({successfulResults.length}件)
            </Button>
          )}
          <Button onClick={onReset} variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            新しいバッチ
          </Button>
        </div>
      </div>

      {/* 個別ファイル結果 */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h4 className="font-medium text-gray-900 mb-4">個別ファイル結果</h4>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {results.map((result, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${
                result.success
                  ? 'border-green-200 bg-green-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <h5 className="font-medium text-gray-900">
                      {filenames[index] || `ファイル ${index + 1}`}
                    </h5>
                    {result.success ? (
                      <div className="text-sm text-gray-600">
                        {formatFileSize(result.originalSize)} →{' '}
                        {formatFileSize(result.compressedSize)}
                        <span className="text-green-600 ml-2">
                          (-{result.compressionRatio.toFixed(1)}%)
                        </span>
                      </div>
                    ) : (
                      <div className="text-sm text-red-600">{result.error}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
