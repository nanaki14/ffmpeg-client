import React, { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';
import {
  FileDropZone,
  FileInput,
  FileInfo,
  ErrorMessage,
} from '@/components/common';
import {
  FileInfo as FileInfoType,
  MAX_FILE_SIZE,
  SUPPORTED_FORMATS,
  SUPPORTED_EXTENSIONS,
} from '@/types';

interface FileSelectorProps {
  onFileSelect: (file: FileInfoType) => void;
  selectedFile: FileInfoType | null;
  onFileRemove: () => void;
}

export const FileSelector: React.FC<FileSelectorProps> = ({
  onFileSelect,
  selectedFile,
  onFileRemove,
}) => {
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return 'ファイルサイズが100MBを超えています';
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
        return '対応していないファイル形式です';
      }
    }

    return null;
  };

  const handleFileSelect = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);

      let filePath = '';
      try {
        filePath = window.webUtils?.getPathForFile(file) || '';
      } catch (error) {
        console.warn('Failed to get file path:', error);
        filePath = file.name; // フォールバックとしてファイル名を使用
      }

      const fileInfo: FileInfoType = {
        name: file.name,
        path: filePath,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      };
      onFileSelect(fileInfo);
    },
    [onFileSelect]
  );

  return (
    <div className="w-full max-w-md mx-auto">
      <FileDropZone
        onFileSelect={handleFileSelect}
        accept={SUPPORTED_FORMATS.join(',')}
        maxSize={MAX_FILE_SIZE}
        className={`
          p-8 text-center
          ${selectedFile ? 'border-green-500 bg-green-50' : ''}
        `}
      >
        {selectedFile ? (
          <FileInfo file={selectedFile} onRemove={onFileRemove} />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <Upload className="h-12 w-12 text-gray-400" />
            </div>
            <div className="text-sm text-gray-600">
              <p className="font-medium">ファイルを選択またはドロップ</p>
              <p className="text-xs text-gray-500 mt-1">
                対応形式: JPEG, PNG, WebP, AVIF, BMP, TIFF, GIF, HEIC
              </p>
              <p className="text-xs text-gray-500">最大サイズ: 100MB</p>
            </div>
            <FileInput
              onFileSelect={handleFileSelect}
              accept={SUPPORTED_FORMATS.join(',')}
            />
          </div>
        )}
      </FileDropZone>

      {error && <ErrorMessage message={error} />}
    </div>
  );
};
