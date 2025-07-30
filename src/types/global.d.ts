interface WebUtils {
  getPathForFile: (file: File) => string;
}

interface ConversionOptions {
  quality:
    | 'highest'
    | 'high'
    | 'standard'
    | 'compressed'
    | 'maximum_compression';
  resize: 'original' | '1/2' | '1/3' | '1/4' | '1/8';
  format: 'auto' | 'jpeg' | 'png' | 'webp' | 'avif' | 'gif' | 'heic';
}

interface ConversionResult {
  success: boolean;
  outputPath?: string;
  outputExists?: boolean;
}

interface ElectronAPI {
  // FFmpeg変換関連
  convertImage: (
    inputPath: string,
    outputPath: string,
    options: ConversionOptions
  ) => Promise<ConversionResult>;

  // ファイル操作関連
  showSaveDialog: (options: {
    title?: string;
    defaultPath?: string;
    buttonLabel?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }) => Promise<{
    canceled: boolean;
    filePath?: string;
  }>;

  getFileStats: (filePath: string) => Promise<{
    size: number;
    exists: boolean;
    error?: string;
  }>;

  // 進捗更新の受信
  onConversionProgress: (
    callback: (progress: {
      stage: string;
      message: string;
      timeElapsed?: number;
    }) => void
  ) => void;

  removeProgressListener: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    webUtils: WebUtils;
  }
}

export {};
