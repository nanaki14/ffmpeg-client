import React, { useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

interface FileInputProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  buttonText?: string;
  buttonVariant?: 'default' | 'outline' | 'secondary';
  buttonSize?: 'default' | 'sm' | 'lg';
}

export const FileInput: React.FC<FileInputProps> = ({
  onFileSelect,
  accept,
  buttonText = 'ファイルを選択',
  buttonVariant = 'outline',
  buttonSize = 'sm',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
      />
      <Button
        variant={buttonVariant}
        size={buttonSize}
        onClick={handleButtonClick}
      >
        <Upload className="h-4 w-4 mr-2" />
        {buttonText}
      </Button>
    </>
  );
};
