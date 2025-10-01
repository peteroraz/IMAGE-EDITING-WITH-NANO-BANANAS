import React from 'react';
import DownloadIcon from './icons/DownloadIcon';
import ShareIcon from './icons/ShareIcon';

interface VideoPlayerProps {
  videoUrl: string;
  prompt: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, prompt }) => {
  const isShareSupported = typeof navigator !== 'undefined' && !!navigator.share;
  
  const handleDownload = async () => {
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `generated-video.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleShare = async () => {
    if (!isShareSupported) return;
    try {
        const response = await fetch(videoUrl);
        const blob = await response.blob();
        const file = new File([blob], 'generated-video.mp4', { type: 'video/mp4' });
        await navigator.share({
            files: [file],
            title: 'AI Generated Video',
            text: `Check out this video I generated with the prompt: "${prompt}"`,
        });
    } catch (err) {
        console.error('Sharing failed:', err);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <h3 className="text-lg font-semibold text-slate-300 mb-4 text-center">Generated Video</h3>
      <div className="relative flex-grow flex items-center justify-center rounded-lg overflow-hidden bg-black/20">
        <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
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
};

export default VideoPlayer;
