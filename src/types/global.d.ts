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

  showOpenDialog: (options: {
    title?: string;
    defaultPath?: string;
    buttonLabel?: string;
    properties?: string[];
  }) => Promise<{
    canceled: boolean;
    filePaths: string[];
  }>;

  getFileStats: (filePath: string) => Promise<{
    size: number;
    exists: boolean;
    error?: string;
  }>;

  // ZIP関連
  createZip: (
    filePaths: string[],
    zipName: string
  ) => Promise<{
    success: boolean;
    zipPath?: string;
    size?: number;
    error?: string;
  }>;

  downloadZip: (
    zipPath: string,
    defaultName: string
  ) => Promise<{
    success: boolean;
    filePath?: string;
    canceled?: boolean;
    error?: string;
  }>;

  // 一時フォルダ管理
  createTempFolder: () => Promise<{
    success: boolean;
    path?: string;
    error?: string;
  }>;

  cleanupTempFolder: (tempFolder: string) => Promise<{
    success: boolean;
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
