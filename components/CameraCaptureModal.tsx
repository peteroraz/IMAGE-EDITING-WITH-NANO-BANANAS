
import React, { useRef, useEffect, useState, useCallback } from 'react';
import Spinner from './icons/Spinner';

interface CameraCaptureModalProps {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}

const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mediaStream: MediaStream;
    const openCamera = async () => {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Could not access camera. Please check permissions and try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    openCamera();
    
    return () => {
      // Cleanup: stop all tracks on component unmount
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  const handleCanPlay = () => {
    setIsLoading(false);
  };

  const handleCapture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        onCapture(dataUrl);
      }
    }
  }, [onCapture]);
  
  const handleClose = useCallback(() => {
      if (stream) {
          stream.getTracks().forEach(track => track.stop());
      }
      onClose();
  }, [stream, onClose]);


  return (
    <div 
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        aria-labelledby="camera-capture-title"
        role="dialog"
        aria-modal="true"
        onClick={handleClose}
    >
      <div 
        className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="camera-capture-title" className="text-xl font-semibold text-white mb-4">Capture Image</h2>
        <div className="flex-grow relative min-h-0 flex items-center justify-center bg-black rounded-md overflow-hidden">
          {isLoading && <Spinner />}
          {error && <p className="text-red-400 p-4 text-center">{error}</p>}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onCanPlay={handleCanPlay}
            className={`w-full h-auto transition-opacity duration-300 ${isLoading || error ? 'opacity-0' : 'opacity-100'}`}
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <div className="flex justify-between items-center gap-4 mt-6">
          <p className="text-sm text-slate-400">Position yourself in the frame</p>
          <div className="flex gap-4">
            <button
                onClick={handleClose}
                className="px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-500"
            >
                Cancel
            </button>
            <button
                onClick={handleCapture}
                disabled={isLoading || !!error}
                className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 disabled:bg-slate-500"
            >
                Capture
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraCaptureModal;
