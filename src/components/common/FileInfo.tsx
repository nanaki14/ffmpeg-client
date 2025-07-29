import React from 'react';
import { Button } from '@/components/ui/button';
import { FileImage, X } from 'lucide-react';
import { FileInfo as FileInfoType } from '@/types';

interface FileInfoProps {
  file: FileInfoType;
  onRemove: () => void;
  showRemoveButton?: boolean;
}

export const FileInfo: React.FC<FileInfoProps> = ({
  file,
  onRemove,
  showRemoveButton = true,
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center">
        <FileImage className="h-12 w-12 text-green-600" />
      </div>
      <div className="text-sm text-gray-600">
        <p className="font-medium">{file.name}</p>
        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
        {file.path && (
          <p className="text-xs text-gray-400 truncate" title={file.path}>
            {file.path}
          </p>
        )}
      </div>
      {showRemoveButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="mt-2"
        >
          <X className="h-4 w-4 mr-2" />
          削除
        </Button>
      )}
    </div>
  );
};
