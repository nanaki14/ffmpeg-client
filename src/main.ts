import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';
import { existsSync, statSync, copyFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';

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

interface ProgressInfo {
  stage: string;
  message: string;
  timeElapsed: number;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const createWindow = (): void => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, 'index.html'));
  }
};

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// FFmpeg変換機能
ipcMain.handle(
  'convert-image',
  async (
    event,
    inputPath: string,
    outputPath: string,
    options: ConversionOptions
  ) => {
    return new Promise((resolve, reject) => {
      const handleConversion = async (): Promise<void> => {
        try {
          // PNG形式の場合は専用最適化を試行
          const outputExt = outputPath.split('.').pop()?.toLowerCase();
          if (outputExt === 'png') {
            const optimizedResult = await optimizePngWithExternalTools(
              inputPath,
              outputPath,
              options
            );
            if (optimizedResult.success) {
              resolve(optimizedResult);
              return;
            }
            // 外部ツールが失敗した場合はFFmpegにフォールバック
            console.log('PNG外部ツール最適化に失敗、FFmpegにフォールバック');
          }

          // FFmpegのコマンドライン引数を構築
          const args = buildFFmpegArgs(inputPath, outputPath, options);

          console.log('FFmpeg command:', 'ffmpeg', args.join(' '));

          const ffmpeg = spawn('/opt/homebrew/bin/ffmpeg', args);

          let stderr = '';

          ffmpeg.stdout.on('data', (data) => {
            console.log(`FFmpeg stdout: ${data}`);
          });

          ffmpeg.stderr.on('data', (data) => {
            stderr += data.toString();
            console.log(`FFmpeg stderr: ${data}`);

            // 進捗情報の解析と送信
            const progress = parseFFmpegProgress(data.toString());
            if (progress) {
              event.sender.send('conversion-progress', progress);
            }
          });

          ffmpeg.on('close', (code) => {
            if (code === 0) {
              // 成功時の結果情報
              const result = {
                success: true,
                outputPath,
                outputExists: existsSync(outputPath),
              };
              resolve(result);
            } else {
              reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`));
            }
          });

          ffmpeg.on('error', (error) => {
            reject(new Error(`FFmpeg spawn error: ${error.message}`));
          });
        } catch (error) {
          reject(error);
        }
      };

      handleConversion().catch(reject);
    });
  }
);

// ファイル保存ダイアログ
ipcMain.handle('show-save-dialog', async (event, options) => {
  const mainWindow = BrowserWindow.fromWebContents(event.sender);
  if (!mainWindow) {
    throw new Error('Main window not found');
  }

  return await dialog.showSaveDialog(mainWindow, options);
});

// ファイル情報取得
ipcMain.handle('get-file-stats', async (_, filePath: string) => {
  try {
    const stats = statSync(filePath);
    return {
      size: stats.size,
      exists: true,
    };
  } catch (error) {
    return {
      size: 0,
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// FFmpegコマンドライン引数の構築
function buildFFmpegArgs(
  inputPath: string,
  outputPath: string,
  options: ConversionOptions
): string[] {
  const args = ['-i', inputPath];

  // 上書き確認を無効化
  args.push('-y');

  // ストリーム処理を明示的に指定（コピーを避ける）
  args.push('-map', '0:v:0');

  // メタデータを除去してサイズ削減
  args.push('-map_metadata', '-1');

  // 出力形式を検出
  const outputExt = outputPath.split('.').pop()?.toLowerCase();
  const inputExt = inputPath.split('.').pop()?.toLowerCase();

  // フォーマット別の最適化設定
  applyFormatSpecificSettings(args, outputExt, options, inputExt);

  // リサイズ設定
  if (options.resize && options.resize !== 'original') {
    const scaleMap: { [key: string]: string } = {
      '1/2': 'iw/2:ih/2',
      '1/3': 'iw/3:ih/3',
      '1/4': 'iw/4:ih/4',
      '1/8': 'iw/8:ih/8',
    };

    if (scaleMap[options.resize]) {
      const scaleFilter = `scale=${scaleMap[options.resize]}`;
      // 既存のフィルターがあるかチェック
      const vfIndex = args.findIndex((arg) => arg === '-vf');
      if (vfIndex !== -1) {
        args[vfIndex + 1] += `,${scaleFilter}`;
      } else {
        args.push('-vf', scaleFilter);
      }
    }
  }

  args.push(outputPath);

  return args;
}

// フォーマット別の最適化設定を適用
function applyFormatSpecificSettings(
  args: string[],
  outputExt: string | undefined,
  options: ConversionOptions,
  inputExt: string | undefined
): void {
  const quality = options.quality || 'standard';

  switch (outputExt) {
    case 'jpg':
    case 'jpeg': {
      // JPEG最適化
      args.push('-codec:v', 'mjpeg');
      const jpegQuality = getJpegQuality(quality);
      args.push('-q:v', jpegQuality.toString());
      // ハフマンテーブル最適化で更なる圧縮
      args.push('-huffman', 'optimal');
      // 色空間を最適化
      args.push('-pix_fmt', 'yuv420p');
      break;
    }

    case 'png': {
      // PNG최적화 - より効果的な圧縮設定
      args.push('-codec:v', 'png');

      const pngCompression = getPngCompression(quality);
      args.push('-compression_level', pngCompression.toString());

      // PNG専用最適化オプション
      args.push('-pred', 'mixed'); // 予測モードで圧縮率向上

      // 高圧縮設定では色数を制限してサイズ削減
      if (quality === 'compressed' || quality === 'maximum_compression') {
        // 16bit深度を8bitに制限（大幅なサイズ削減）
        args.push('-pix_fmt', 'rgb24');
      }

      // メタデータの完全削除
      args.push('-map_metadata', '-1');
      break;
    }

    case 'webp': {
      // WebP最適化
      args.push('-codec:v', 'libwebp');
      const webpQuality = getWebpQuality(quality);
      args.push('-q:v', webpQuality.toString());
      // WebP専用設定
      args.push('-lossless', quality === 'highest' ? '1' : '0');
      if (quality !== 'highest') {
        args.push('-preset', 'photo');
        args.push('-method', '6'); // 最高品質の圧縮方法
        args.push('-pix_fmt', 'yuv420p');
      }
      break;
    }

    case 'avif': {
      // AVIF最適化
      args.push('-codec:v', 'libaom-av1');
      const avifCrf = getAvifCrf(quality);
      args.push('-crf', avifCrf.toString());
      args.push('-cpu-used', '4'); // 速度と品質のバランス
      args.push('-pix_fmt', 'yuv420p');
      break;
    }

    case 'heic': {
      // HEIC最適化（可能な場合）
      args.push('-codec:v', 'libx265');
      const heicCrf = getHeicCrf(quality);
      args.push('-crf', heicCrf.toString());
      args.push('-preset', 'medium');
      args.push('-pix_fmt', 'yuv420p');
      break;
    }

    default:
      // デフォルト設定（元の形式を維持）
      if (inputExt === outputExt || options.format === 'auto') {
        // 同じ形式の場合も必ず再圧縮を行い、サイズを削減
        if (inputExt === 'jpg' || inputExt === 'jpeg') {
          args.push('-codec:v', 'mjpeg');
          const jpegQuality = getJpegQuality(quality);
          args.push('-q:v', jpegQuality.toString());
          args.push('-huffman', 'optimal');
          args.push('-pix_fmt', 'yuv420p');
        } else if (inputExt === 'png') {
          args.push('-codec:v', 'png');
          const pngCompression = getPngCompression(quality);
          args.push('-compression_level', pngCompression.toString());

          // PNG専用最適化オプション
          args.push('-pred', 'mixed'); // 予測モードで圧縮率向上

          // 高圧縮設定では色数を制限してサイズ削減
          if (quality === 'compressed' || quality === 'maximum_compression') {
            // 16bit深度を8bitに制限（大幅なサイズ削減）
            args.push('-pix_fmt', 'rgb24');
          }
        } else {
          // その他の形式では汎用的な圧縮を適用
          const defaultQuality = getJpegQuality(quality);
          args.push('-q:v', defaultQuality.toString());
          args.push('-pix_fmt', 'yuv420p');
        }
      }
      break;
  }
}

// JPEG品質マッピング（1-31、低い値ほど高品質）
function getJpegQuality(quality: string): number {
  const qualityMap: { [key: string]: number } = {
    highest: 3, // 約95%品質、軽微な圧縮
    high: 8, // 約85%品質
    standard: 12, // 約75%品質、確実にサイズ削減
    compressed: 18, // 約65%品質
    maximum_compression: 28, // 約50%品質、大幅圧縮
  };
  return qualityMap[quality] || 12;
}

// PNG圧縮レベル（0-9、高い値ほど高圧縮）
function getPngCompression(quality: string): number {
  const compressionMap: { [key: string]: number } = {
    highest: 6, // 品質重視でも圧縮効果を向上
    high: 7, // バランス良く圧縮
    standard: 8, // 標準でより強い圧縮
    compressed: 9, // 最高圧縮レベル
    maximum_compression: 9, // 最高圧縮レベル
  };
  return compressionMap[quality] || 8;
}

// WebP品質（0-100、高い値ほど高品質）
function getWebpQuality(quality: string): number {
  const qualityMap: { [key: string]: number } = {
    highest: 95,
    high: 85,
    standard: 75,
    compressed: 65,
    maximum_compression: 50,
  };
  return qualityMap[quality] || 75;
}

// AVIF CRF値（0-63、低い値ほど高品質）
function getAvifCrf(quality: string): number {
  const crfMap: { [key: string]: number } = {
    highest: 18,
    high: 25,
    standard: 32,
    compressed: 40,
    maximum_compression: 50,
  };
  return crfMap[quality] || 32;
}

// HEIC CRF値（0-51、低い値ほど高品質）
function getHeicCrf(quality: string): number {
  const crfMap: { [key: string]: number } = {
    highest: 18,
    high: 23,
    standard: 28,
    compressed: 35,
    maximum_compression: 45,
  };
  return crfMap[quality] || 28;
}

// FFmpeg進捗情報の解析
function parseFFmpegProgress(stderr: string): ProgressInfo | null {
  // FFmpegの進捗情報は通常stderrに出力される
  // time=00:00:01.23 などの形式で進捗が報告される
  const timeMatch = stderr.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const seconds = parseInt(timeMatch[3]);
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;

    return {
      stage: 'processing',
      message: '変換中...',
      timeElapsed: totalSeconds,
    };
  }

  return null;
}

// PNG専用最適化関数
async function optimizePngWithExternalTools(
  inputPath: string,
  outputPath: string,
  options: ConversionOptions
): Promise<ConversionResult> {
  return new Promise((resolve) => {
    // まずFFmpegで基本的な変換を行う
    const tempPath = join(tmpdir(), `temp_${Date.now()}.png`);
    const basicArgs = [
      '-i',
      inputPath,
      '-y',
      '-codec:v',
      'png',
      '-compression_level',
      '9',
      '-pred',
      'mixed',
    ];

    // 高圧縮設定では色深度を制限
    if (
      options.quality === 'compressed' ||
      options.quality === 'maximum_compression'
    ) {
      basicArgs.push('-pix_fmt', 'rgb24');
    }

    // リサイズ設定
    if (options.resize && options.resize !== 'original') {
      const scaleMap: { [key: string]: string } = {
        '1/2': 'iw/2:ih/2',
        '1/3': 'iw/3:ih/3',
        '1/4': 'iw/4:ih/4',
        '1/8': 'iw/8:ih/8',
      };

      if (scaleMap[options.resize]) {
        basicArgs.push('-vf', `scale=${scaleMap[options.resize]}`);
      }
    }

    basicArgs.push(tempPath);

    console.log('PNG基本変換:', 'ffmpeg', basicArgs.join(' '));

    const ffmpeg = spawn('/opt/homebrew/bin/ffmpeg', basicArgs);

    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        console.log('PNG基本変換に失敗');
        resolve({ success: false });
        return;
      }

      // pngquant等の外部ツールを試行（利用可能な場合）
      tryPngQuantOptimization(tempPath, outputPath, options)
        .then((success) => {
          // 一時ファイルをクリーンアップ
          if (existsSync(tempPath)) {
            unlinkSync(tempPath);
          }

          if (success) {
            resolve({
              success: true,
              outputPath,
              outputExists: existsSync(outputPath),
            });
          } else {
            // 外部ツールが失敗した場合は基本変換結果をコピー
            if (existsSync(tempPath)) {
              copyFileSync(tempPath, outputPath);
              resolve({
                success: true,
                outputPath,
                outputExists: existsSync(outputPath),
              });
            } else {
              resolve({ success: false });
            }
          }
        })
        .catch(() => {
          // エラー時も基本変換結果をコピー
          if (existsSync(tempPath)) {
            copyFileSync(tempPath, outputPath);
            if (existsSync(tempPath)) {
              unlinkSync(tempPath);
            }
            resolve({
              success: true,
              outputPath,
              outputExists: existsSync(outputPath),
            });
          } else {
            resolve({ success: false });
          }
        });
    });

    ffmpeg.on('error', () => {
      resolve({ success: false });
    });
  });
}

// pngquant最適化を試行
async function tryPngQuantOptimization(
  inputPath: string,
  outputPath: string,
  options: ConversionOptions
): Promise<boolean> {
  return new Promise((resolve) => {
    // pngquantの存在確認
    const pngquant = spawn('which', ['pngquant']);

    pngquant.on('close', (code) => {
      if (code !== 0) {
        console.log('pngquantが利用できません');
        resolve(false);
        return;
      }

      // pngquantで最適化実行
      const qualityMap: { [key: string]: string } = {
        highest: '85-95',
        high: '75-90',
        standard: '65-85',
        compressed: '50-75',
        maximum_compression: '25-60',
      };

      const quality = qualityMap[options.quality] || '65-85';
      const pngQuantArgs = [
        '--quality',
        quality,
        '--output',
        outputPath,
        inputPath,
      ];

      console.log('pngquant最適化:', 'pngquant', pngQuantArgs.join(' '));

      const pngQuantProcess = spawn('pngquant', pngQuantArgs);

      pngQuantProcess.on('close', (code) => {
        resolve(code === 0);
      });

      pngQuantProcess.on('error', () => {
        resolve(false);
      });
    });

    pngquant.on('error', () => {
      resolve(false);
    });
  });
}
