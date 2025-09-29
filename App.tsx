
import React, { useState, useCallback } from 'react';
import { editImage } from './services/geminiService';
import { fileToBase64, stripDataUrlPrefix } from './utils/imageUtils';
import ImageUpload from './components/ImageUpload';
import ImageDisplay from './components/ImageDisplay';
import SparklesIcon from './components/icons/SparklesIcon';

interface OriginalImageInfo {
  dataUrl: string;
  mimeType: string;
}

export default function App() {
  const [originalImage, setOriginalImage] = useState<OriginalImageInfo | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = useCallback(async (file: File) => {
    setError(null);
    setEditedImage(null);
    try {
      const { dataUrl, mimeType } = await fileToBase64(file);
      setOriginalImage({ dataUrl, mimeType });
    } catch (err) {
      setError('Failed to load image. Please try another file.');
      setOriginalImage(null);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!originalImage || !prompt) {
      setError('Please upload an image and provide a prompt.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setEditedImage(null);

    try {
      const base64Data = stripDataUrlPrefix(originalImage.dataUrl);
      const resultBase64 = await editImage(base64Data, originalImage.mimeType, prompt);
      setEditedImage(`data:image/png;base64,${resultBase64}`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, prompt]);
  
  const handleReset = useCallback(() => {
    setOriginalImage(null);
    setEditedImage(null);
    setPrompt('');
    setError(null);
    setIsLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
            AI Photo Editor
          </h1>
          <p className="mt-2 text-lg text-slate-400">
            Edit photos with the power of Gemini's nano-banana model.
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Control Panel */}
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex flex-col gap-6">
            <ImageUpload onImageUpload={handleImageUpload} previewUrl={originalImage?.dataUrl ?? null} />
            
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-slate-300 mb-2">
                Editing Prompt
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'make the cat wear a wizard hat' or 'change the background to a futuristic city'"
                className="w-full h-28 p-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 resize-none"
                disabled={!originalImage}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-auto pt-4">
              <button
                onClick={handleSubmit}
                disabled={!originalImage || !prompt || isLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-200"
              >
                <SparklesIcon />
                {isLoading ? 'Generating...' : 'Generate'}
              </button>
              <button
                onClick={handleReset}
                className="w-full sm:w-auto px-6 py-3 bg-slate-700 text-slate-300 font-semibold rounded-lg hover:bg-slate-600 transition-colors duration-200"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Display Panel */}
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
            <ImageDisplay
              imageUrl={editedImage}
              isLoading={isLoading}
              error={error}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
