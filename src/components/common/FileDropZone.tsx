import React, { useCallback, useState } from 'react';

interface FileDropZoneProps {
  onFileSelect?: (file: File) => void;
  onFilesSelect?: (files: File[]) => void;
  accept?: string;
  maxSize?: number;
  children?: React.ReactNode;
  className?: string;
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({
  onFileSelect,
  onFilesSelect,
  accept: _accept,
  maxSize: _maxSize,
  children,
  className = '',
}) => {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        if (onFilesSelect) {
          onFilesSelect(files);
        } else if (onFileSelect) {
          onFileSelect(files[0]);
        }
      }
    },
    [onFileSelect, onFilesSelect]
  );

  return (
    <div
      className={`
        border-2 border-dashed rounded-lg transition-all cursor-pointer
        ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
        hover:border-gray-400
        ${className}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
    </div>
  );
};
