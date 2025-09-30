import React, { useState, useRef } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { cropImage } from '../utils/imageUtils';

interface SourceImage {
  id: string;
  dataUrl: string;
  mimeType: string;
}

interface ImageCropModalProps {
  image: SourceImage;
  onApplyCrop: (croppedDataUrl: string) => void;
  onClose: () => void;
}

const ImageCropModal: React.FC<ImageCropModalProps> = ({ image, onApplyCrop, onClose }) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const [isCropping, setIsCropping] = useState(false);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        1, // aspect ratio 1:1
        width,
        height
      ),
      width,
      height
    );
    setCrop(initialCrop);
  }

  const handleApply = async () => {
    if (completedCrop?.width && completedCrop?.height && imgRef.current) {
        setIsCropping(true);
        try {
            const croppedDataUrl = await cropImage(imgRef.current, completedCrop);
            onApplyCrop(croppedDataUrl);
        } catch(err) {
            console.error("Failed to crop image", err);
            // Optionally show an error to the user
        } finally {
            setIsCropping(false);
        }
    }
  };

  return (
    <div 
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        aria-labelledby="crop-image-title"
        role="dialog"
        aria-modal="true"
        onClick={onClose}
    >
      <div 
        className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="crop-image-title" className="text-xl font-semibold text-white mb-4">Crop Image</h2>
        <div className="flex-grow relative min-h-0 flex items-center justify-center">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              className="max-w-full max-h-[60vh]"
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={image.dataUrl}
                onLoad={onImageLoad}
                style={{ maxHeight: '60vh', objectFit: 'contain' }}
              />
            </ReactCrop>
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-500"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!completedCrop || isCropping}
            className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 disabled:bg-slate-500"
          >
            {isCropping ? 'Cropping...' : 'Apply Crop'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;