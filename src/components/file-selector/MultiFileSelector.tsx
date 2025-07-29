import React, { useCallback, useState } from 'react';
import { Upload, X, FileImage } from 'lucide-react';
import { FileDropZone, FileInput, ErrorMessage } from '@/components/common';
import { Button } from '@/components/ui/button';
import {
  FileInfo,
  MAX_FILE_SIZE,
  SUPPORTED_FORMATS,
  SUPPORTED_EXTENSIONS,
} from '@/types';

interface MultiFileSelectorProps {
  onFilesSelect: (files: FileInfo[]) => void;
  selectedFiles: FileInfo[];
  onFileRemove: (index: number) => void;
  onClearAll: () => void;
  maxFiles?: number;
}

export const MultiFileSelector: React.FC<MultiFileSelectorProps> = ({
  onFilesSelect,
  selectedFiles,
  onFileRemove,
  onClearAll,
  maxFiles = 10,
}) => {
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: ファイルサイズが100MBを超えています`;
    }

    if (
      !SUPPORTED_FORMATS.includes(
        file.type as (typeof SUPPORTED_FORMATS)[number]
      )
    ) {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (
        !SUPPORTED_EXTENSIONS.includes(
          extension as (typeof SUPPORTED_EXTENSIONS)[number]
        )
      ) {
        return `${file.name}: 対応していないファイル形式です`;
      }
    }

    return null;
  };

  const handleFilesSelect = useCallback(
    (files: File[]) => {
      const validateFiles = (
        files: File[]
      ): { validFiles: File[]; errors: string[] } => {
        const validFiles: File[] = [];
        const errors: string[] = [];

        for (const file of files) {
          const error = validateFile(file);
          if (error) {
            errors.push(error);
          } else {
            validFiles.push(file);
          }
        }

        // 最大ファイル数チェック
        const totalFiles = selectedFiles.length + validFiles.length;
        if (totalFiles > maxFiles) {
          const allowedCount = maxFiles - selectedFiles.length;
          if (allowedCount <= 0) {
            errors.push(`最大${maxFiles}ファイルまでしか選択できません`);
            return { validFiles: [], errors };
          } else {
            errors.push(
              `最大${maxFiles}ファイルまでしか選択できません。${allowedCount}ファイルのみ追加されます。`
            );
            validFiles.splice(allowedCount);
          }
        }

        // 重複ファイルチェック
        const duplicates: string[] = [];
        const filteredFiles = validFiles.filter((file) => {
          const isDuplicate = selectedFiles.some(
            (selected) =>
              selected.name === file.name && selected.size === file.size
          );
          if (isDuplicate) {
            duplicates.push(file.name);
          }
          return !isDuplicate;
        });

        if (duplicates.length > 0) {
          errors.push(`重複ファイル: ${duplicates.join(', ')}`);
        }

        return { validFiles: filteredFiles, errors };
      };

      const { validFiles, errors } = validateFiles(files);

      if (errors.length > 0) {
        setError(errors.join('\n'));
      } else {
        setError(null);
      }

      if (validFiles.length > 0) {
        const fileInfos: FileInfo[] = validFiles.map((file) => {
          let filePath = '';
          try {
            filePath = window.webUtils?.getPathForFile(file) || '';
          } catch (error) {
            console.warn('Failed to get file path:', error);
            filePath = file.name;
          }

          return {
            name: file.name,
            path: filePath,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
          };
        });

        onFilesSelect([...selectedFiles, ...fileInfos]);
      }
    },
    [selectedFiles, onFilesSelect, maxFiles, validateFile]
  );


  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTotalSize = (): string => {
    const total = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    return formatFileSize(total);
  };

  return (
    <div className="w-full space-y-4">
      {/* ドロップゾーン */}
      <FileDropZone
        onFilesSelect={handleFilesSelect}
        accept={SUPPORTED_FORMATS.join(',')}
        maxSize={MAX_FILE_SIZE}
        className="p-8 text-center"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <Upload className="h-12 w-12 text-gray-400" />
          </div>
          <div className="text-sm text-gray-600">
            <p className="font-medium">ファイルを選択またはドロップ</p>
            <p className="text-xs text-gray-500 mt-1">
              複数ファイルを同時に選択できます（最大{maxFiles}ファイル）
            </p>
            <p className="text-xs text-gray-500">
              対応形式: JPEG, PNG, WebP, AVIF, BMP, TIFF, GIF, HEIC
            </p>
          </div>
          <div className="flex justify-center space-x-3">
            <FileInput
              onFilesSelect={handleFilesSelect}
              accept={SUPPORTED_FORMATS.join(',')}
              buttonText="ファイルを追加"
              multiple={true}
            />
          </div>
        </div>
      </FileDropZone>

      {/* エラー表示 */}
      {error && <ErrorMessage message={error} />}

      {/* 選択されたファイル一覧 */}
      {selectedFiles.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium text-gray-900">
                選択されたファイル ({selectedFiles.length}/{maxFiles})
              </h3>
              <p className="text-sm text-gray-500">
                合計サイズ: {getTotalSize()}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAll}
              className="text-red-600 hover:text-red-700"
            >
              すべて削除
            </Button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <FileImage className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFileRemove(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
