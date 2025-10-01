
import { PixelCrop } from 'react-image-crop';

/**
 * Converts a File object to a base64 encoded data URL.
 * @param file The file to convert.
 * @returns A promise that resolves with an object containing the data URL and MIME type.
 */
export function fileToBase64(file: File): Promise<{ dataUrl: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    // Basic validation
    if (!file.type.startsWith('image/')) {
      return reject(new Error('File is not an image.'));
    }

    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        dataUrl: reader.result as string,
        mimeType: file.type,
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Strips the "data:image/jpeg;base64," prefix from a data URL string.
 * @param dataUrl The full data URL.
 * @returns The raw base64 encoded string.
 */
export function stripDataUrlPrefix(dataUrl: string): string {
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex === -1) {
    throw new Error("Invalid data URL format");
  }
  return dataUrl.substring(commaIndex + 1);
}

/**
 * Crops an image element using a canvas.
 * @param image The HTMLImageElement to crop.
 * @param crop The pixel crop dimensions from react-image-crop.
 * @returns A promise that resolves with the base64 data URL of the cropped image.
 */
export function cropImage(image: HTMLImageElement, crop: PixelCrop): Promise<string> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
    
        canvas.width = crop.width;
        canvas.height = crop.height;
    
        const ctx = canvas.getContext('2d');
    
        if (!ctx) {
            return reject(new Error('Failed to get canvas context'));
        }
    
        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            crop.width,
            crop.height
        );
        
        const mimeType = image.src.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png';
        resolve(canvas.toDataURL(mimeType));
    });
}

/**
 * Extracts a frame from a video file as a base64 data URL.
 * @param videoFile The video file.
 * @param timeInSeconds The time in the video to capture the frame from. Defaults to 0.
 * @returns A promise that resolves with an object containing the data URL and MIME type.
 */
export function extractFrameFromVideo(videoFile: File, timeInSeconds: number = 0): Promise<{ dataUrl: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return reject(new Error('Canvas context not available'));
        }

        video.onloadeddata = () => {
            // Ensure the video is ready to seek.
            video.currentTime = timeInSeconds;
        };

        video.onseeked = () => {
            // A small delay might be needed for some browsers to fully render the frame
            setTimeout(() => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const dataUrl = canvas.toDataURL('image/jpeg');
                URL.revokeObjectURL(video.src); // Clean up the object URL
                resolve({ dataUrl, mimeType: 'image/jpeg' });
            }, 100);
        };

        video.onerror = (e) => {
            URL.revokeObjectURL(video.src);
            console.error("Video loading error for frame extraction:", e);
            reject(new Error('Failed to load video for frame extraction. The file may be corrupt or in an unsupported format.'));
        };
        
        video.src = URL.createObjectURL(videoFile);
    });
}
