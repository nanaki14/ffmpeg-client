# CLAUDE.md

## 設計

#### アプリケーション名

ImageOptimizer - FFmpeg画像最適化ツール

#### 目的

FFmpegを使用した画像の最適化・変換を直感的なGUIで行えるデスクトップアプリケーション

#### 対応OS

- macOS 10.15+

#### 技術スタック

フレームワーク: Electron
フロントエンド: React + TypeScript + Vite
スタイリング: Tailwind CSS + shadcn/ui
フォーム: React Hook Form + Zod
データ永続化: localStorage
状態管理: redux-toolkit + redux-persist
画像処理: FFmpeg（バイナリ同梱）
テスト: Vitest + React Testing Library

### 機能要件

画像の圧縮およびリサイズを行うアプリーケーション
現在は画像の編集や動画には非対応

#### コア機能

##### ファイル選択・ドラッグ&ドロップ

単一ファイル選択機能
ドラッグ&ドロップ対応
対応形式: JPEG, PNG, WEBP, AVIF, BMP, TIFF, GIF, HEIC

##### 画像最適化設定

品質設定: 選択式（最高品質、高品質、標準、高圧縮、最高圧縮）
リサイズ: 選択式（元サイズ、1/2、1/3、1/4、1/8）
フォーマット変換: 選択式（JPEG, PNG, WEBP, AVIF, GIF, HEIC）
プリセット: Web用

##### 変換処理

リアルタイム進捗表示
変換キャンセル機能
バッチ処理（複数ファイル）

##### プレビュー機能

Before/After比較表示
ファイルサイズ比較
圧縮率表示

#### 追加機能（Phase 2）

変換履歴
カスタムプリセット保存
エクスポート先フォルダ指定

### UI/UX設計

```typescript
// 品質設定のマッピング
const QualityMapping = {
  highest: { value: 95, label: '最高品質' },
  high: { value: 85, label: '高品質' },
  standard: { value: 75, label: '標準' },
  compressed: { value: 65, label: '高圧縮' },
  maximum_compression: { value: 50, label: '最高圧縮' }
} as const;

// リサイズ比率のマッピング
const ResizeMapping = {
  original: { ratio: 1, label: '元サイズ' },
  '1/2': { ratio: 0.5, label: '1/2' },
  '1/3': { ratio: 0.333, label: '1/3' },
  '1/4': { ratio: 0.25, label: '1/4' },
  '1/8': { ratio: 0.125, label: '1/8' }
} as const;

// フォーマットマッピング（autoは実行時に入力画像の形式に変換）
const FormatMapping = {
  auto: { label: '元の形式' },
  jpeg: { label: 'JPEG' },
  png: { label: 'PNG' },
  webp: { label: 'WebP' },
  avif: { label: 'AVIF' },
  gif: { label: 'GIF' },
  heic: { label: 'HEIC' }
} as const;
```

```typescript
type ConversionSettings = z.infer<typeof ConversionSettingsSchema>;
type FileInfo = z.infer<typeof FileInfoSchema>;
```

### バリデーションルール

品質: 事前定義された5段階から選択
リサイズ比率: 事前定義された5種類から選択
ファイル形式: 対応する4フォーマット + auto（元形式維持）から選択
ファイルサイズ: 最大100MB
ファイル拡張子: jpg, jpeg, png, webp, avif, bmp, tiff のみ
デフォルト動作: format='auto'の場合、入力画像と同じ拡張子で出力

### エラーハンドリング

#### エラー分類

ファイル関連: 非対応形式、ファイル破損、アクセス権限
設定関連: 無効なパラメータ、設定値範囲外
変換関連: FFmpegエラー、出力先書き込み失敗
システム関連: メモリ不足、ディスク容量不足

#### エラー表示

shadcn/ui Alertコンポーネント使用
トースト通知での軽微なエラー
モーダルでの重要エラー

### テストカバレッジ目標

重要な機能: 95%以上
UI コンポーネント: 不要

### テストファイルの配置

対象ファイルがあるディレクトリに`__tests__`ディレクトリを作成し、その中にテストファイルを配置する。
