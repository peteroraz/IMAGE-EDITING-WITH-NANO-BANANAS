import React, { useCallback } from 'react';
import Spinner from './icons/Spinner';
import DownloadIcon from './icons/DownloadIcon';
import SparklesIcon from './icons/SparklesIcon';
import ShareIcon from './icons/ShareIcon';
import VideoPlayer from './VideoPlayer';
import VideoEditor from './VideoEditor';
import PencilIcon from './icons/PencilIcon';

export type ExportFormat = 'image/png' | 'image/jpeg' | 'image/webp';

interface ImageDisplayProps {
  baseImageUrl: string | null;
  editedImageUrl: string | null;
  strength: number; // 0 to 1
  isLoading: boolean;
  loadingStatus?: string;
  error: string | null;
  exportFormat: ExportFormat;
  setExportFormat: (format: ExportFormat) => void;
  exportQuality: number;
  setExportQuality: (quality: number) => void;
  videoUrl: string | null;
  videoPrompt: string;
  isSelectingFrame: boolean;
  onFrameSelected: (dataUrl: string) => void;
  onCancelFrameSelection: () => void;
  onUseAsSource: (dataUrl: string) => void;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({ 
  baseImageUrl, 
  editedImageUrl, 
  strength, 
  isLoading, 
  loadingStatus,
  error,
  exportFormat,
  setExportFormat,
  exportQuality,
  setExportQuality,
  videoUrl,
  videoPrompt,
  isSelectingFrame,
  onFrameSelected,
  onCancelFrameSelection,
  onUseAsSource,
 }) => {
  const isShareSupported = typeof navigator !== 'undefined' && !!navigator.share;

  const getFinalImageBlob = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!editedImageUrl) {
        resolve(null);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      const editedImg = new Image();
      editedImg.crossOrigin = 'anonymous';
      editedImg.onload = () => {
        canvas.width = editedImg.naturalWidth;
        canvas.height = editedImg.naturalHeight;
        
        if (baseImageUrl && strength < 1) {
            const baseImg = new Image();
            baseImg.crossOrigin = 'anonymous';
            baseImg.onload = () => {
                ctx.drawImage(baseImg, 0, 0);
                ctx.globalAlpha = strength;
                ctx.drawImage(editedImg, 0, 0);
                ctx.globalAlpha = 1.0;
                canvas.toBlob(blob => resolve(blob), exportFormat, exportQuality);
            };
            baseImg.onerror = () => resolve(null);
            baseImg.src = baseImageUrl;
        } else {
            ctx.drawImage(editedImg, 0, 0);
            canvas.toBlob(blob => resolve(blob), exportFormat, exportQuality);
        }
      };
      editedImg.onerror = () => resolve(null);
      editedImg.src = editedImageUrl;
    });
  }, [baseImageUrl, editedImageUrl, strength, exportFormat, exportQuality]);

  const handleDownload = async () => {
    const blob = await getFinalImageBlob();
    if (blob) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const extension = exportFormat.split('/')[1];
      link.download = `edited-image.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleShare = async () => {
    if (!isShareSupported) return;

    const blob = await getFinalImageBlob();
    if (blob) {
        const extension = exportFormat.split('/')[1];
        const file = new File([blob], `edited-image.${extension}`, { type: exportFormat });
        try {
            await navigator.share({
                files: [file],
                title: 'AI Edited Image',
                text: 'Check out this image I created!',
            });
        } catch (err) {
            console.error('Sharing failed:', err);
        }
    }
  };


  const renderContent = () => {
    if (isSelectingFrame && videoUrl) {
        return <VideoEditor videoUrl={videoUrl} onFrameSelected={onFrameSelected} onCancel={onCancelFrameSelection} />;
    }

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400">
          <Spinner />
          <p className="mt-4 text-lg font-semibold">{loadingStatus || 'AI is working its magic...'}</p>
          <p className="text-sm">This can take a moment.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-red-400 p-4">
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl font-bold">!</span>
          </div>
          <p className="font-semibold">An Error Occurred</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      );
    }
    
    if (videoUrl) {
        return <VideoPlayer videoUrl={videoUrl} prompt={videoPrompt} />;
    }

    if (editedImageUrl) {
      return (
        <div className="flex flex-col h-full w-full">
            <h3 className="text-lg font-semibold text-slate-300 mb-4 text-center">Generated Image</h3>
            <div className="relative flex-grow flex items-center justify-center rounded-lg overflow-hidden bg-black/20">
              {baseImageUrl && (
                <img
                  src={baseImageUrl}
                  alt="Original for blending"
                  className="absolute inset-0 w-full h-full object-contain"
                />
              )}
              <img
                src={editedImageUrl}
                alt="Edited result"
                className="absolute inset-0 w-full h-full object-contain transition-opacity duration-100"
                style={{ opacity: strength }}
              />
            </div>
            
            <div className="mt-4">
              <button
                onClick={() => onUseAsSource(editedImageUrl)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-500 transition-all duration-200"
              >
                <PencilIcon />
                Edit This Image
              </button>
            </div>

            <div className="mt-4 p-4 bg-slate-900/50 rounded-lg space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="format" className="block text-sm font-medium text-slate-300 mb-2">Format</label>
                        <select 
                            id="format"
                            value={exportFormat}
                            onChange={e => setExportFormat(e.target.value as ExportFormat)}
                            className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="image/png">PNG</option>
                            <option value="image/jpeg">JPG</option>
                            <option value="image/webp">WEBP</option>
                        </select>
                    </div>
                    { (exportFormat === 'image/jpeg' || exportFormat === 'image/webp') &&
                        <div className="flex-grow">
                            <label htmlFor="quality" className="block text-sm font-medium text-slate-300 mb-2">Quality: {Math.round(exportQuality * 100)}</label>
                            <input
                                type="range"
                                id="quality"
                                min="0.1"
                                max="1"
                                step="0.01"
                                value={exportQuality}
                                onChange={(e) => setExportQuality(parseFloat(e.target.value))}
                                className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                        </div>
                    }
                </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-500 transition-all duration-200"
              >
                  <DownloadIcon />
                  Download
              </button>
              {isShareSupported && (
                 <button
                    onClick={handleShare}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-500 transition-all duration-200"
                >
                    <ShareIcon />
                    Share
                </button>
              )}
            </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center">
        <div className="w-16 h-16 text-slate-600">
            <SparklesIcon />
        </div>
        <p className="mt-4 text-lg font-semibold">Your generated media will appear here</p>
        <p className="text-sm">Use the tools on the left to get started.</p>
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