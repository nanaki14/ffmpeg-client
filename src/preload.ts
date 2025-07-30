import {
  contextBridge,
  webUtils,
  ipcRenderer,
  IpcRendererEvent,
} from 'electron';

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

interface SaveDialogOptions {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
}

interface SaveDialogResult {
  canceled: boolean;
  filePath?: string;
}

interface FileStats {
  size: number;
  exists: boolean;
  error?: string;
}

interface ProgressInfo {
  stage: string;
  message: string;
  timeElapsed?: number;
}

contextBridge.exposeInMainWorld('electronAPI', {
  // FFmpeg変換関連
  convertImage: (
    inputPath: string,
    outputPath: string,
    options: ConversionOptions
  ): Promise<ConversionResult> =>
    ipcRenderer.invoke('convert-image', inputPath, outputPath, options),

  // ファイル操作関連
  showSaveDialog: (options: SaveDialogOptions): Promise<SaveDialogResult> =>
    ipcRenderer.invoke('show-save-dialog', options),

  getFileStats: (filePath: string): Promise<FileStats> =>
    ipcRenderer.invoke('get-file-stats', filePath),

  // 進捗更新の受信
  onConversionProgress: (callback: (progress: ProgressInfo) => void): void => {
    ipcRenderer.on(
      'conversion-progress',
      (_: IpcRendererEvent, progress: ProgressInfo) => callback(progress)
    );
  },

  removeProgressListener: (): void => {
    ipcRenderer.removeAllListeners('conversion-progress');
  },
});

contextBridge.exposeInMainWorld('webUtils', {
  getPathForFile: (file: File): string => {
    return webUtils.getPathForFile(file);
  },
});
