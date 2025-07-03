import React from 'react';
import {
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  FileImage,
  Pause,
} from 'lucide-react';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Button } from '@/components/ui/button';
import { BatchProgress as BatchProgressType, FileProgress } from '@/types';

interface BatchProgressProps {
  batchProgress: BatchProgressType;
  onCancel?: () => void;
  onCancelFile?: (fileId: string) => void;
  showIndividualFiles?: boolean;
}

export const BatchProgress: React.FC<BatchProgressProps> = ({
  batchProgress,
  onCancel,
  onCancelFile,
  showIndividualFiles = true,
}) => {
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return minutes > 0
      ? `${minutes}分${remainingSeconds}秒`
      : `${remainingSeconds}秒`;
  };

  const getStatusIcon = (status: FileProgress['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-400" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'cancelled':
        return <Pause className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: FileProgress['status']) => {
    switch (status) {
      case 'pending':
        return '待機中';
      case 'processing':
        return '処理中';
      case 'completed':
        return '完了';
      case 'error':
        return 'エラー';
      case 'cancelled':
        return 'キャンセル';
      default:
        return '不明';
    }
  };

  const elapsedTime = (Date.now() - batchProgress.startTime) / 1000;
  const fileProgresses = Array.from(batchProgress.fileProgresses.values());

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm space-y-6">
      {/* 全体進捗 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">
            バッチ変換進捗 ({batchProgress.completedFiles}/
            {batchProgress.totalFiles})
          </h3>
          {onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
            >
              全体をキャンセル
            </Button>
          )}
        </div>

        <ProgressBar
          progress={batchProgress.overallProgress}
          color="blue"
          showText={true}
        />

        <div className="flex justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>経過時間: {formatTime(elapsedTime)}</span>
          </div>

          {batchProgress.estimatedTimeRemaining !== undefined && (
            <div>
              残り時間: {formatTime(batchProgress.estimatedTimeRemaining)}
            </div>
          )}
        </div>
      </div>

      {/* 個別ファイル進捗 */}
      {showIndividualFiles && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">ファイル別進捗</h4>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {fileProgresses.map((fileProgress) => (
              <div
                key={fileProgress.fileId}
                className="bg-gray-50 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileImage className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {fileProgress.fileName}
                      </p>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(fileProgress.status)}
                        <span className="text-sm text-gray-600">
                          {getStatusText(fileProgress.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {fileProgress.status === 'processing' && onCancelFile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCancelFile(fileProgress.fileId)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      キャンセル
                    </Button>
                  )}
                </div>

                {/* ファイル個別の進捗バー */}
                {fileProgress.status === 'processing' && (
                  <div className="space-y-2">
                    <ProgressBar
                      progress={fileProgress.progress.progress}
                      color="blue"
                      showText={false}
                      className="h-2"
                    />
                    <p className="text-xs text-gray-600">
                      {fileProgress.progress.message}
                    </p>
                  </div>
                )}

                {/* エラー時のメッセージ */}
                {(fileProgress.status === 'error' ||
                  fileProgress.status === 'cancelled') && (
                  <p className="text-xs text-red-600">
                    {fileProgress.progress.message}
                  </p>
                )}

                {/* 完了時の結果概要 */}
                {fileProgress.status === 'completed' && fileProgress.result && (
                  <div className="text-xs text-green-600">
                    完了 - 圧縮率:{' '}
                    {fileProgress.result.compressionRatio.toFixed(1)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
