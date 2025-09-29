
import React, { useState, useCallback, useId } from 'react';
import { editImage, generateImage } from './services/geminiService';
import { fileToBase64, stripDataUrlPrefix } from './utils/imageUtils';
import ImageUpload from './components/ImageUpload';
import ImageDisplay from './components/ImageDisplay';
import SparklesIcon from './components/icons/SparklesIcon';
import Spinner from './components/icons/Spinner';

interface SourceImage {
  id: string;
  dataUrl: string;
  mimeType: string;
}

const TrashIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
    </svg>
);


export default function App() {
  const [sourceImages, setSourceImages] = useState<SourceImage[]>([]);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [baseImageForBlend, setBaseImageForBlend] = useState<string | null>(null);

  const [editPrompt, setEditPrompt] = useState<string>('');
  const [generationPrompt, setGenerationPrompt] = useState<string>('');
  const [editStrength, setEditStrength] = useState(1);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const uniqueId = useId();

  const handleImageUpload = useCallback(async (file: File) => {
    setError(null);
    try {
      const { dataUrl, mimeType } = await fileToBase64(file);
      const newImage: SourceImage = { id: `${uniqueId}-${Date.now()}`, dataUrl, mimeType };
      setSourceImages(prev => [...prev, newImage]);
    } catch (err) {
      setError('Failed to load image. Please try another file.');
    }
  }, [uniqueId]);

  const handleToggleSelectImage = (id: string) => {
    setSelectedImageIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };
  
  const handleDeleteImage = (id: string) => {
    setSourceImages(prev => prev.filter(img => img.id !== id));
    setSelectedImageIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
    });
  };

  const handleGenerateImage = useCallback(async () => {
    if (!generationPrompt) {
      setError('Please enter a prompt to generate an image.');
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const resultBase64 = await generateImage(generationPrompt);
      const newImage: SourceImage = {
        id: `${uniqueId}-${Date.now()}`,
        dataUrl: `data:image/png;base64,${resultBase64}`,
        mimeType: 'image/png'
      };
      setSourceImages(prev => [...prev, newImage]);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during image generation.');
    } finally {
      setIsGenerating(false);
    }
  }, [generationPrompt, uniqueId]);

  const handleEdit = useCallback(async () => {
    const selectedImages = sourceImages.filter(img => selectedImageIds.has(img.id));
    if (selectedImages.length === 0 || !editPrompt) {
      setError('Please select at least one image and provide an editing prompt.');
      return;
    }

    setIsEditing(true);
    setError(null);
    setEditedImage(null);
    setBaseImageForBlend(selectedImages[0].dataUrl); // Use first selected image for blend base

    try {
      const imagesToEdit = selectedImages.map(img => ({
        base64ImageData: stripDataUrlPrefix(img.dataUrl),
        mimeType: img.mimeType
      }));
      const resultBase64 = await editImage(imagesToEdit, editPrompt);
      setEditedImage(`data:image/png;base64,${resultBase64}`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during editing.');
      setBaseImageForBlend(null);
    } finally {
      setIsEditing(false);
    }
  }, [sourceImages, selectedImageIds, editPrompt]);
  
  const handleReset = useCallback(() => {
    setSourceImages([]);
    setSelectedImageIds(new Set());
    setEditedImage(null);
    setBaseImageForBlend(null);
    setEditPrompt('');
    setGenerationPrompt('');
    setEditStrength(1);
    setError(null);
    setIsEditing(false);
    setIsGenerating(false);
  }, []);
  
  const isLoading = isEditing || isGenerating;

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
            AI Photo Editor
          </h1>
          <p className="mt-2 text-lg text-slate-400">
            Generate, combine, and edit photos with Gemini.
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Control Panel */}
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex flex-col gap-6">
            
            {/* Step 1: Source Images */}
            <div className="space-y-3">
                <h2 className="text-lg font-semibold text-slate-200">1. Add Source Images</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {sourceImages.map(img => (
                        <div key={img.id} className="relative aspect-square group">
                            <img src={img.dataUrl} alt="Source" className="w-full h-full object-cover rounded-md"/>
                            <div 
                                onClick={() => handleToggleSelectImage(img.id)}
                                className={`absolute inset-0 rounded-md cursor-pointer transition-all ${selectedImageIds.has(img.id) ? 'ring-4 ring-indigo-500 ring-inset bg-black/30' : 'bg-black/50 opacity-0 group-hover:opacity-100'}`}
                            >
                                {selectedImageIds.has(img.id) && <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-indigo-600 border-2 border-white rounded-full flex items-center justify-center text-white">✓</div>}
                            </div>
                            <button onClick={() => handleDeleteImage(img.id)} className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-red-500 transition-opacity opacity-0 group-hover:opacity-100"><TrashIcon /></button>
                        </div>
                    ))}
                    <ImageUpload onImageUpload={handleImageUpload} />
                </div>
            </div>

            <hr className="border-slate-700" />
            
            {/* Step 2: Generate New Image */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-200">2. Generate a New Image (Optional)</h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={generationPrompt}
                  onChange={(e) => setGenerationPrompt(e.target.value)}
                  placeholder="e.g., 'a majestic blue lion'"
                  className="w-full p-2 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
                />
                <button onClick={handleGenerateImage} disabled={isLoading || !generationPrompt} className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-500 disabled:bg-slate-600 flex items-center justify-center gap-2">
                  {isGenerating ? <Spinner/> : <SparklesIcon />}
                </button>
              </div>
            </div>

            <hr className="border-slate-700" />

            {/* Step 3: Edit */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-200">3. Edit Selected Images</h2>
              <textarea
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="Select images above and describe your edit here, e.g., 'add a wizard hat to the cat'"
                className="w-full h-24 p-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-colors duration-200 resize-none"
                disabled={selectedImageIds.size === 0}
              />
              <div className='space-y-2'>
                <label htmlFor="strength" className="block text-sm font-medium text-slate-300">Edit Strength: {Math.round(editStrength * 100)}%</label>
                <input
                    type="range"
                    id="strength"
                    min="0"
                    max="1"
                    step="0.01"
                    value={editStrength}
                    onChange={(e) => setEditStrength(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    disabled={!editedImage}
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-auto pt-4">
              <button
                onClick={handleEdit}
                disabled={isLoading || selectedImageIds.size === 0 || !editPrompt}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isEditing ? <Spinner /> : <SparklesIcon />}
                {isEditing ? 'Applying Edits...' : 'Apply Edits'}
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
              baseImageUrl={baseImageForBlend}
              editedImageUrl={editedImage}
              strength={editStrength}
              isLoading={isLoading}
              error={error}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
