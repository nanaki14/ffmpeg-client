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

class DummyConversionAPI implements ConversionAPI {
  private isCancelled = false;
  private currentProgress: ConversionProgress | null = null;
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
      // ステージ1: 準備
      await this.updateProgress(
        {
          stage: 'preparing',
          progress: 10,
          message: 'ファイルを解析しています...',
          timeElapsed: 0,
        },
        onProgress
      );

      await this.delay(800);
      if (this.isCancelled) throw new Error('変換がキャンセルされました');

      // ステージ2: 処理中 (複数段階)
      const processingSteps = [
        { progress: 25, message: 'フォーマット変換を開始しています...' },
        { progress: 45, message: '画質調整を適用しています...' },
        { progress: 65, message: 'リサイズ処理を実行しています...' },
        { progress: 85, message: '最適化を適用しています...' },
      ];

      for (const step of processingSteps) {
        const elapsed = (Date.now() - startTime) / 1000;
        await this.updateProgress(
          {
            stage: 'processing',
            progress: step.progress,
            message: step.message,
            timeElapsed: elapsed,
            timeRemaining: this.estimateTimeRemaining(step.progress, elapsed),
          },
          onProgress
        );

        await this.delay(1000 + Math.random() * 1000); // 1-2秒のランダム遅延
        if (this.isCancelled) throw new Error('変換がキャンセルされました');
      }

      // ステージ3: 最終処理
      await this.updateProgress(
        {
          stage: 'finalizing',
          progress: 95,
          message: 'ファイルを保存しています...',
          timeElapsed: (Date.now() - startTime) / 1000,
        },
        onProgress
      );

      await this.delay(500);
      if (this.isCancelled) throw new Error('変換がキャンセルされました');

      // 圧縮結果の計算
      const compressionRatio = this.calculateCompressionRatio(
        file.size,
        settings
      );
      const compressedSize = Math.round(file.size * compressionRatio);

      // 完了
      const processingTime = (Date.now() - startTime) / 1000;
      await this.updateProgress(
        {
          stage: 'completed',
          progress: 100,
          message: '変換が完了しました！',
          timeElapsed: processingTime,
        },
        onProgress
      );

      return {
        success: true,
        outputFile: {
          name: this.generateOutputFileName(file.name, settings.format),
          path:
            '/path/to/output/' +
            this.generateOutputFileName(file.name, settings.format),
          size: compressedSize,
          format: settings.format === 'auto' ? file.type : settings.format,
        },
        originalSize: file.size,
        compressedSize,
        compressionRatio: (1 - compressionRatio) * 100, // パーセンテージ
        processingTime,
      };
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
    await this.delay(100); // API呼び出しのシミュレーション
    const compressionRatio = this.calculateCompressionRatio(
      originalSize,
      settings
    );
    return Math.round(originalSize * compressionRatio);
  }

  async getEstimatedBatchSize(
    files: Array<{ size: number }>,
    settings: ConversionSettings
  ): Promise<{ totalOriginalSize: number; totalEstimatedSize: number }> {
    await this.delay(200); // API呼び出しのシミュレーション

    const totalOriginalSize = files.reduce((sum, file) => sum + file.size, 0);
    let totalEstimatedSize = 0;

    for (const file of files) {
      const compressionRatio = this.calculateCompressionRatio(
        file.size,
        settings
      );
      totalEstimatedSize += Math.round(file.size * compressionRatio);
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
    this.currentProgress = progress;
    if (onProgress) {
      onProgress(progress);
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private estimateTimeRemaining(
    currentProgress: number,
    elapsed: number
  ): number {
    if (currentProgress <= 0) return 0;
    const totalEstimate = (elapsed / currentProgress) * 100;
    return Math.max(0, totalEstimate - elapsed);
  }

  private calculateCompressionRatio(
    originalSize: number,
    settings: ConversionSettings
  ): number {
    // 品質による圧縮率
    const qualityRatios = {
      highest: 0.9,
      high: 0.75,
      standard: 0.6,
      compressed: 0.45,
      maximum_compression: 0.3,
    };

    // リサイズによる圧縮率
    const resizeRatios = {
      original: 1,
      '1/2': 0.25,
      '1/3': 0.11,
      '1/4': 0.0625,
      '1/8': 0.015625,
    };

    // フォーマットによる圧縮率調整
    const formatRatios = {
      auto: 1,
      jpeg: 0.8,
      png: 1.1,
      webp: 0.7,
      avif: 0.6,
      gif: 0.9,
      heic: 0.65,
    };

    const qualityRatio = qualityRatios[settings.quality];
    const resizeRatio = resizeRatios[settings.resize];
    const formatRatio = formatRatios[settings.format];

    return qualityRatio * resizeRatio * formatRatio;
  }

  private generateOutputFileName(originalName: string, format: string): string {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    const extension =
      format === 'auto' ? originalName.split('.').pop() : format;
    return `${nameWithoutExt}_optimized.${extension}`;
  }
}

// シングルトンインスタンス
export const conversionApi = new DummyConversionAPI();
