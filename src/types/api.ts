import { ConversionSettings, FileInfo } from './index';

export interface ConversionRequest {
  file: FileInfo;
  settings: ConversionSettings;
}

export interface ConversionProgress {
  stage: 'preparing' | 'processing' | 'finalizing' | 'completed' | 'error';
  progress: number; // 0-100
  message: string;
  timeElapsed?: number; // seconds
  timeRemaining?: number; // seconds
}

export interface ConversionResult {
  success: boolean;
  outputFile?: {
    name: string;
    path: string;
    size: number;
    format: string;
  };
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  processingTime: number;
  error?: string;
}

export interface ConversionStats {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  sizeDifference: number;
  processingTime: number;
}

export type ProgressCallback = (progress: ConversionProgress) => void;

// バッチ処理用の型定義
export interface BatchConversionRequest {
  files: FileInfo[];
  settings: ConversionSettings;
}

export interface FileProgress {
  fileId: string;
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'error' | 'cancelled';
  progress: ConversionProgress;
  result?: ConversionResult;
}

export interface BatchProgress {
  totalFiles: number;
  completedFiles: number;
  currentFileIndex: number;
  overallProgress: number; // 0-100
  fileProgresses: Map<string, FileProgress>;
  startTime: number;
  estimatedTimeRemaining?: number;
}

export type BatchProgressCallback = (progress: BatchProgress) => void;

// バッチ結果に一時フォルダ情報を追加した型
export interface BatchResultsWithTempFolder extends Array<ConversionResult> {
  tempFolder?: string;
}

export interface ConversionAPI {
  convert(
    request: ConversionRequest,
    onProgress?: ProgressCallback
  ): Promise<ConversionResult>;

  convertBatch(
    request: BatchConversionRequest,
    onProgress?: BatchProgressCallback
  ): Promise<ConversionResult[]>;

  cancel(): void;

  cancelBatch(): void;

  cancelFile(fileId: string): void;

  isSupported(fileType: string): boolean;

  getEstimatedSize(
    originalSize: number,
    settings: ConversionSettings
  ): Promise<number>;

  getEstimatedBatchSize(
    files: FileInfo[],
    settings: ConversionSettings
  ): Promise<{ totalOriginalSize: number; totalEstimatedSize: number }>;

  createAndDownloadZip(filePaths: string[], tempFolder?: string): Promise<void>;
}
