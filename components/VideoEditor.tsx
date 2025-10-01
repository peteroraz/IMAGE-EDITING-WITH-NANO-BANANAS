import React, { useRef, useState, useEffect } from 'react';
import FrameSelectIcon from './icons/FrameSelectIcon';

interface VideoEditorProps {
  videoUrl: string;
  onFrameSelected: (dataUrl: string) => void;
  onCancel: () => void;
}

const VideoEditor: React.FC<VideoEditorProps> = ({ videoUrl, onFrameSelected, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => setDuration(video.duration);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };
  
  const handleCaptureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        onFrameSelected(dataUrl);
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full w-full">
      <h3 className="text-lg font-semibold text-slate-300 mb-4 text-center">Select a Frame</h3>
      <div className="relative flex-grow flex items-center justify-center rounded-lg overflow-hidden bg-black/20">
        <video ref={videoRef} src={videoUrl} controls className="w-full h-full object-contain" />
        <canvas ref={canvasRef} className="hidden" />
      </div>
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-slate-400">{formatTime(currentTime)}</span>
            <input
                type="range"
                min="0"
                max={duration || 0}
                step="0.01"
                value={currentTime}
                onChange={handleScrubberChange}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <span className="text-sm font-mono text-slate-400">{formatTime(duration)}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={onCancel}
            className="w-full px-6 py-3 bg-slate-700 text-slate-300 font-semibold rounded-lg hover:bg-slate-600 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleCaptureFrame}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-500 transition-all duration-200"
          >
            <FrameSelectIcon />
            Use This Frame
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoEditor;
