
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
