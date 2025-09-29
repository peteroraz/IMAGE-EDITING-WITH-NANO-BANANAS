
import React from 'react';
import Spinner from './icons/Spinner';
import DownloadIcon from './icons/DownloadIcon';
import SparklesIcon from './icons/SparklesIcon';

interface ImageDisplayProps {
  imageUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({ imageUrl, isLoading, error }) => {
  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'edited-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400">
          <Spinner />
          <p className="mt-4 text-lg font-semibold">AI is working its magic...</p>
          <p className="text-sm">This can take a moment.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-red-400 p-4">
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">!</span>
          </div>
          <p className="font-semibold">An Error Occurred</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      );
    }

    if (imageUrl) {
      return (
        <div className="flex flex-col h-full">
            <h3 className="text-lg font-semibold text-slate-300 mb-4 text-center">Generated Image</h3>
            <div className="flex-grow flex items-center justify-center rounded-lg overflow-hidden bg-black/20">
              <img
                src={imageUrl}
                alt="Edited result"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <button
                onClick={handleDownload}
                className="mt-4 w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-500 transition-all duration-200"
            >
                <DownloadIcon />
                Download
            </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center">
        <div className="w-16 h-16 text-slate-600">
            <SparklesIcon />
        </div>
        <p className="mt-4 text-lg font-semibold">Your edited image will appear here</p>
        <p className="text-sm">Upload an image and write a prompt to get started.</p>
      </div>
    );
  };

  return (
    <div className="w-full h-full min-h-[400px] flex items-center justify-center">
      {renderContent()}
    </div>
  );
};

export default ImageDisplay;
