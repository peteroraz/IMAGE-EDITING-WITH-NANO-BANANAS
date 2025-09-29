
import React, { useRef } from 'react';
import UploadIcon from './icons/UploadIcon';

interface ImageUploadProps {
  onImageUpload: (file: File) => void;
  previewUrl: string | null;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUpload, previewUrl }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
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

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <label
        htmlFor="file-upload"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="relative block w-full h-64 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors duration-200"
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Original preview"
            className="w-full h-full object-contain rounded-lg"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <UploadIcon />
            <span className="mt-2 font-semibold">Click to upload or drag & drop</span>
            <span className="text-sm">PNG, JPG, or WEBP</span>
          </div>
        )}
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
      {previewUrl && (
        <button 
            onClick={triggerFileInput} 
            className="mt-4 w-full text-center py-2 px-4 border border-slate-600 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors">
            Change Image
        </button>
      )}
    </div>
  );
};

export default ImageUpload;
