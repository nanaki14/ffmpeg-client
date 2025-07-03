import { z } from 'zod';

export const QualityMapping = {
  highest: { value: 95, label: '最高品質' },
  high: { value: 85, label: '高品質' },
  standard: { value: 75, label: '標準' },
  compressed: { value: 65, label: '高圧縮' },
  maximum_compression: { value: 50, label: '最高圧縮' },
} as const;

export const ResizeMapping = {
  original: { ratio: 1, label: '元サイズ' },
  '1/2': { ratio: 0.5, label: '1/2' },
  '1/3': { ratio: 0.333, label: '1/3' },
  '1/4': { ratio: 0.25, label: '1/4' },
  '1/8': { ratio: 0.125, label: '1/8' },
} as const;

export const FormatMapping = {
  auto: { label: '元の形式' },
  jpeg: { label: 'JPEG' },
  png: { label: 'PNG' },
  webp: { label: 'WebP' },
  avif: { label: 'AVIF' },
  gif: { label: 'GIF' },
  heic: { label: 'HEIC' },
} as const;

export const ConversionSettingsSchema = z.object({
  quality: z.enum([
    'highest',
    'high',
    'standard',
    'compressed',
    'maximum_compression',
  ]),
  resize: z.enum(['original', '1/2', '1/3', '1/4', '1/8']),
  format: z.enum(['auto', 'jpeg', 'png', 'webp', 'avif', 'gif', 'heic']),
});

export const ConversionSettingsFormSchema = z.object({
  quality: z.enum(
    ['highest', 'high', 'standard', 'compressed', 'maximum_compression'],
    {
      required_error: '品質を選択してください',
      invalid_type_error: '無効な品質設定です',
    }
  ),
  resize: z.enum(['original', '1/2', '1/3', '1/4', '1/8'], {
    required_error: 'リサイズ設定を選択してください',
    invalid_type_error: '無効なリサイズ設定です',
  }),
  format: z.enum(['auto', 'jpeg', 'png', 'webp', 'avif', 'gif', 'heic'], {
    required_error: '出力形式を選択してください',
    invalid_type_error: '無効な出力形式です',
  }),
});

export const FileInfoSchema = z.object({
  name: z.string(),
  path: z.string(),
  size: z.number(),
  type: z.string(),
  lastModified: z.number(),
});

export type ConversionSettings = z.infer<typeof ConversionSettingsSchema>;
export type ConversionSettingsForm = z.infer<
  typeof ConversionSettingsFormSchema
>;
export type FileInfo = z.infer<typeof FileInfoSchema>;

export const SUPPORTED_FORMATS = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/bmp',
  'image/tiff',
  'image/gif',
  'image/heic',
] as const;

export const SUPPORTED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.avif',
  '.bmp',
  '.tiff',
  '.gif',
  '.heic',
] as const;

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
