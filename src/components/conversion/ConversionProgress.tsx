import React from 'react';
import { Loader2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Button } from '@/components/ui/button';
import { ConversionProgress as ProgressType } from '@/types';

interface ConversionProgressProps {
  progress: ProgressType;
  onCancel?: () => void;
  showCancel?: boolean;
}

export const ConversionProgress: React.FC<ConversionProgressProps> = ({
  progress,
  onCancel,
  showCancel = true,
}) => {
  const getStageIcon = () => {
    switch (progress.stage) {
      case 'preparing':
      case 'processing':
      case 'finalizing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
    }
  };

  const getStageColor = (): 'blue' | 'green' | 'red' | 'yellow' => {
    switch (progress.stage) {
      case 'completed':
        return 'green';
      case 'error':
        return 'red';
      default:
        return 'blue';
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return minutes > 0
      ? `${minutes}分${remainingSeconds}秒`
      : `${remainingSeconds}秒`;
  };

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <div className="flex items-center space-x-3 mb-4">
        {getStageIcon()}
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">
            {progress.stage === 'preparing' && '準備中'}
            {progress.stage === 'processing' && '変換中'}
            {progress.stage === 'finalizing' && '完了処理中'}
            {progress.stage === 'completed' && '変換完了'}
            {progress.stage === 'error' && 'エラー'}
          </h3>
          <p className="text-sm text-gray-600">{progress.message}</p>
        </div>
      </div>

      <div className="space-y-3">
        <ProgressBar
          progress={progress.progress}
          color={getStageColor()}
          showText={true}
        />

        <div className="flex justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>
              経過時間:{' '}
              {progress.timeElapsed ? formatTime(progress.timeElapsed) : '0秒'}
            </span>
          </div>

          {progress.timeRemaining !== undefined &&
            progress.stage !== 'completed' && (
              <div>残り時間: {formatTime(progress.timeRemaining)}</div>
            )}
        </div>

        {showCancel &&
          onCancel &&
          progress.stage !== 'completed' &&
          progress.stage !== 'error' && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={onCancel}
                className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
              >
                変換をキャンセル
              </Button>
            </div>
          )}
      </div>
    </div>
  );
};
