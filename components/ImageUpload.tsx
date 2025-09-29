
import React, { useRef } from 'react';
import UploadIcon from './icons/UploadIcon';

interface ImageUploadProps {
  onImageUpload: (file: File) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
    // Reset file input to allow uploading the same file again
    if (event.target) {
        event.target.value = '';
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
      <label
        htmlFor="file-upload"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="relative block w-full aspect-square border-2 border-dashed border-slate-600 rounded-md cursor-pointer hover:border-indigo-500 transition-colors duration-200"
      >
        <div className="flex flex-col items-center justify-center h-full text-slate-400 p-2 text-center">
            <UploadIcon />
            <span className="mt-1 text-xs font-semibold">Click or drag file</span>
        </div>
        <input
          id="file-upload"
          name="file-upload"
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="sr-only"
          accept="image/png, image/jpeg, image/webp"
        />
      </label>
  );
};

export default ImageUpload;
