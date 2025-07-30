import {
  ConversionAPI,
  ConversionRequest,
  ConversionResult,
  ConversionProgress,
  ProgressCallback,
  ConversionSettings,
  BatchConversionRequest,
  BatchProgress,
  BatchProgressCallback,
  FileProgress,
} from '@/types';

class FFmpegConversionAPI implements ConversionAPI {
  private isCancelled = false;
  private batchCancelled = false;
  private cancelledFiles = new Set<string>();

  async convert(
    request: ConversionRequest,
    onProgress?: ProgressCallback
  ): Promise<ConversionResult> {
    this.isCancelled = false;
    const { file, settings } = request;
    const startTime = Date.now();

    try {
      // 準備段階
      await this.updateProgress(
        {
          stage: 'preparing',
          progress: 10,
          message: 'ファイルの準備をしています...',
          timeElapsed: 0,
        },
        onProgress
      );

      if (this.isCancelled) throw new Error('変換がキャンセルされました');

      // 出力ファイルパスの決定
      const outputPath = await this.getOutputPath(file, settings);
      if (!outputPath) {
        throw new Error('出力先が選択されませんでした');
      }

      await this.updateProgress(
        {
          stage: 'processing',
          progress: 30,
          message: 'FFmpegで変換を開始しています...',
          timeElapsed: (Date.now() - startTime) / 1000,
        },
        onProgress
      );

      // 進捗更新のリスナーを設定
      const progressListener = (progress: {
        stage: string;
        message: string;
        timeElapsed?: number;
      }) => {
        if (onProgress) {
          onProgress({
            stage: 'processing',
            progress: Math.min(95, 30 + (progress.timeElapsed || 0) * 10),
            message: progress.message || '変換中...',
            timeElapsed: (Date.now() - startTime) / 1000,
          });
        }
      };

      window.electronAPI.onConversionProgress(progressListener);

      try {
        // FFmpeg実行
        const result = await window.electronAPI.convertImage(
          file.path,
          outputPath,
          {
            quality: settings.quality,
            resize: settings.resize,
            format: settings.format,
          }
        );

        if (!result.success) {
          throw new Error('FFmpeg変換に失敗しました');
        }

        // 変換完了
        await this.updateProgress(
          {
            stage: 'completed',
            progress: 100,
            message: '変換が完了しました！',
            timeElapsed: (Date.now() - startTime) / 1000,
          },
          onProgress
        );

        // 出力ファイル情報を取得
        const outputStats = await window.electronAPI.getFileStats(outputPath);
        if (!outputStats.exists) {
          throw new Error('出力ファイルが見つかりません');
        }
        const compressionRatio =
          ((file.size - outputStats.size) / file.size) * 100;

        return {
          success: true,
          outputFile: {
            name: outputPath.split('/').pop() || 'output',
            path: outputPath,
            size: outputStats.size,
            format: this.getOutputFormat(outputPath, settings.format),
          },
          originalSize: file.size,
          compressedSize: outputStats.size,
          compressionRatio,
          processingTime: (Date.now() - startTime) / 1000,
        };
      } finally {
        window.electronAPI.removeProgressListener();
      }
    } catch (error) {
      await this.updateProgress(
        {
          stage: 'error',
          progress: 0,
          message:
            error instanceof Error
              ? error.message
              : '変換中にエラーが発生しました',
          timeElapsed: (Date.now() - startTime) / 1000,
        },
        onProgress
      );

      return {
        success: false,
        originalSize: file.size,
        compressedSize: 0,
        compressionRatio: 0,
        processingTime: (Date.now() - startTime) / 1000,
        error: error instanceof Error ? error.message : '変換に失敗しました',
      };
    }
  }

  async convertBatch(
    request: BatchConversionRequest,
    onProgress?: BatchProgressCallback
  ): Promise<ConversionResult[]> {
    this.batchCancelled = false;
    this.cancelledFiles.clear();

    const { files, settings } = request;
    const results: ConversionResult[] = [];
    const fileProgresses = new Map<string, FileProgress>();
    const startTime = Date.now();

    // 初期化
    files.forEach((file, index) => {
      const fileId = `${file.name}-${index}`;
      fileProgresses.set(fileId, {
        fileId,
        fileName: file.name,
        status: 'pending',
        progress: {
          stage: 'preparing',
          progress: 0,
          message: '待機中...',
        },
      });
    });

    const updateBatchProgress = (currentIndex: number) => {
      const completedFiles = results.length;
      const overallProgress = (completedFiles / files.length) * 100;
      const elapsed = (Date.now() - startTime) / 1000;
      const estimatedTotal =
        files.length > 0
          ? (elapsed / Math.max(1, completedFiles)) * files.length
          : 0;
      const estimatedRemaining = Math.max(0, estimatedTotal - elapsed);

      const batchProgress: BatchProgress = {
        totalFiles: files.length,
        completedFiles,
        currentFileIndex: currentIndex,
        overallProgress,
        fileProgresses,
        startTime,
        estimatedTimeRemaining: estimatedRemaining,
      };

      if (onProgress) {
        onProgress(batchProgress);
      }
    };

    // 各ファイルを順次処理
    for (let i = 0; i < files.length; i++) {
      if (this.batchCancelled) break;

      const file = files[i];
      const fileId = `${file.name}-${i}`;

      if (this.cancelledFiles.has(fileId)) {
        // キャンセルされたファイルをスキップ
        const fileProgress = fileProgresses.get(fileId)!;
        fileProgress.status = 'cancelled';
        fileProgress.progress = {
          stage: 'error',
          progress: 0,
          message: 'キャンセルされました',
        };

        results.push({
          success: false,
          originalSize: file.size,
          compressedSize: 0,
          compressionRatio: 0,
          processingTime: 0,
          error: 'キャンセルされました',
        });

        updateBatchProgress(i);
        continue;
      }

      // ファイル進捗の更新
      const fileProgress = fileProgresses.get(fileId)!;
      fileProgress.status = 'processing';
      updateBatchProgress(i);

      try {
        const result = await this.convert({ file, settings }, (progress) => {
          fileProgress.progress = progress;
          updateBatchProgress(i);
        });

        fileProgress.status = result.success ? 'completed' : 'error';
        fileProgress.result = result;
        results.push(result);
      } catch (error) {
        fileProgress.status = 'error';
        fileProgress.progress = {
          stage: 'error',
          progress: 0,
          message:
            error instanceof Error ? error.message : '変換に失敗しました',
        };

        results.push({
          success: false,
          originalSize: file.size,
          compressedSize: 0,
          compressionRatio: 0,
          processingTime: 0,
          error: error instanceof Error ? error.message : '変換に失敗しました',
        });
      }

      updateBatchProgress(i);
    }

    // 最終更新
    updateBatchProgress(files.length - 1);

    return results;
  }

  cancel(): void {
    this.isCancelled = true;
  }

  cancelBatch(): void {
    this.batchCancelled = true;
    this.isCancelled = true;
  }

  cancelFile(fileId: string): void {
    this.cancelledFiles.add(fileId);
  }

  isSupported(fileType: string): boolean {
    const supportedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif',
      'image/bmp',
      'image/tiff',
      'image/gif',
      'image/heic',
    ];
    return supportedTypes.includes(fileType);
  }

  async getEstimatedSize(
    originalSize: number,
    settings: ConversionSettings
  ): Promise<number> {
    // 簡易的な推定（実際の圧縮は実行してみないと分からない）
    const compressionRatio = this.calculateEstimatedCompressionRatio(settings);
    return Math.round(originalSize * (1 - compressionRatio));
  }

  async getEstimatedBatchSize(
    files: Array<{ size: number }>,
    settings: ConversionSettings
  ): Promise<{ totalOriginalSize: number; totalEstimatedSize: number }> {
    const totalOriginalSize = files.reduce((sum, file) => sum + file.size, 0);
    let totalEstimatedSize = 0;

    for (const file of files) {
      const estimated = await this.getEstimatedSize(file.size, settings);
      totalEstimatedSize += estimated;
    }

    return {
      totalOriginalSize,
      totalEstimatedSize,
    };
  }

  private async updateProgress(
    progress: ConversionProgress,
    onProgress?: ProgressCallback
  ): Promise<void> {
    if (onProgress) {
      onProgress(progress);
    }
    // 少し待機してUI更新を確実にする
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  private async getOutputPath(
    file: { name: string },
    settings: ConversionSettings
  ): Promise<string | null> {
    const ext = this.getOutputExtension(file.name, settings.format);
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const defaultName = `${baseName}_optimized.${ext}`;

    const result = await window.electronAPI.showSaveDialog({
      title: '保存先を選択',
      defaultPath: defaultName,
      buttonLabel: '保存',
      filters: [
        { name: '画像ファイル', extensions: [ext] },
        { name: 'すべてのファイル', extensions: ['*'] },
      ],
    });

    return result.canceled ? null : result.filePath || null;
  }

  private getOutputExtension(originalName: string, format: string): string {
    if (format === 'auto') {
      const ext = originalName.split('.').pop()?.toLowerCase();
      return ext || 'jpg';
    }

    const formatMap: { [key: string]: string } = {
      jpeg: 'jpg',
      png: 'png',
      webp: 'webp',
      avif: 'avif',
      gif: 'gif',
      heic: 'heic',
    };

    return formatMap[format] || 'jpg';
  }

  private getOutputFormat(outputPath: string, requestedFormat: string): string {
    if (requestedFormat !== 'auto') {
      return requestedFormat;
    }

    const ext = outputPath.split('.').pop()?.toLowerCase();
    const extToFormat: { [key: string]: string } = {
      jpg: 'jpeg',
      jpeg: 'jpeg',
      png: 'png',
      webp: 'webp',
      avif: 'avif',
      gif: 'gif',
      heic: 'heic',
    };

    return extToFormat[ext || ''] || 'jpeg';
  }

  private calculateEstimatedCompressionRatio(
    settings: ConversionSettings
  ): number {
    // 品質による圧縮率
    const qualityRatios = {
      highest: 0.1,
      high: 0.25,
      standard: 0.4,
      compressed: 0.55,
      maximum_compression: 0.7,
    };

    // リサイズによる追加圧縮率
    const resizeRatios = {
      original: 0,
      '1/2': 0.75,
      '1/3': 0.89,
      '1/4': 0.9375,
      '1/8': 0.984375,
    };

    const qualityRatio = qualityRatios[settings.quality];
    const resizeRatio = resizeRatios[settings.resize];

    // 組み合わせた圧縮率
    return Math.min(0.95, qualityRatio + resizeRatio);
  }
}

// シングルトンインスタンス
export const conversionApi = new FFmpegConversionAPI();
