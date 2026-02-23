
import React, { useState, useCallback, useId, useRef, useEffect } from 'react';
import { editImage, generateImage, generateVideo, searchWeb, SearchResult, GroundingChunk } from './services/geminiService';
import { fileToBase64, stripDataUrlPrefix, extractFrameFromVideo } from './utils/imageUtils';
import ImageUpload from './components/ImageUpload';
import ImageDisplay, { ExportFormat } from './components/ImageDisplay';
import ImageCropModal from './components/ImageCropModal';
import SparklesIcon from './components/icons/SparklesIcon';
import Spinner from './components/icons/Spinner';
import AspectRatioSelector from './components/AspectRatioSelector';
import CropIcon from './components/icons/CropIcon';
import HistorySidebar, { HistoryItem } from './components/HistorySidebar';
import HistoryIcon from './components/icons/HistoryIcon';
import CameraCaptureModal from './components/CameraCaptureModal';
import CameraIcon from './components/icons/CameraIcon';
import FilterSelector, { Filter } from './components/FilterSelector';
import VoicePromptButton from './components/VoicePromptButton';
import ImageIcon from './components/icons/ImageIcon';
import VideoIcon from './components/icons/VideoIcon';
import CutIcon from './components/icons/CutIcon';
import FrameSelectIcon from './components/icons/FrameSelectIcon';
import SearchIcon from './components/icons/SearchIcon';
import GroundingCitations from './components/GroundingCitations';

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

const predefinedFilters: Filter[] = [
    { name: 'Vintage', prompt: 'Apply a vintage, faded film look with warm tones and slight grain.' },
    { name: 'Cyberpunk', prompt: 'Transform into a cyberpunk style with neon lights, a dark atmosphere, and futuristic elements.' },
    { name: 'Dreamy', prompt: 'Give the image a soft, ethereal, and dreamy look with glowing highlights and a gentle blur.' },
    { name: 'Noir', prompt: 'Convert to a high-contrast black and white "film noir" style with deep shadows and dramatic lighting.' },
    { name: 'Pop Art', prompt: 'Reimagine the image in a vibrant, colorful Pop Art style, like Andy Warhol.' },
];

export default function App() {
  const editPromptRef = useRef<HTMLTextAreaElement>(null);
  const [activeTab, setActiveTab] = useState<'image' | 'video' | 'search'>('image');
  
  // Image state
  const [sourceImages, setSourceImages] = useState<SourceImage[]>([]);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [baseImageForBlend, setBaseImageForBlend] = useState<string | null>(null);
  const [croppingImage, setCroppingImage] = useState<SourceImage | null>(null);
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [generationPrompt, setGenerationPrompt] = useState<string>('');
  const [useSearchGrounding, setUseSearchGrounding] = useState(false);
  const [editStrength, setEditStrength] = useState(1);
  const [generationAspectRatio, setGenerationAspectRatio] = useState<string>('1:1');
  const [editAspectRatio, setEditAspectRatio] = useState<string>('1:1');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('image/png');
  const [exportQuality, setExportQuality] = useState(0.92);

  // Video state
  const [videoGenerationPrompt, setVideoGenerationPrompt] = useState<string>('');
  const [videoSourceImage, setVideoSourceImage] = useState<SourceImage | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoGenerationStatus, setVideoGenerationStatus] = useState('');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchCitations, setSearchCitations] = useState<GroundingChunk[]>([]);

  // Video Edit State
  const [videoToEditUrl, setVideoToEditUrl] = useState<string | null>(null);
  const [videoEditPrompt, setVideoEditPrompt] = useState<string>('');
  const [frameForEditing, setFrameForEditing] = useState<SourceImage | null>(null);
  const [isSelectingFrame, setIsSelectingFrame] = useState(false);
  
  // Shared state
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryVisible, setIsHistoryVisible] = useState<boolean>(false);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [needApiKey, setNeedApiKey] = useState(false);
  
  const uniqueId = useId();
  const aspectRatios = ["1:1", "16:9", "9:16", "4:3", "3:4"];

  const checkAndPromptKey = async () => {
    // @ts-ignore
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      return true;
    }
    return true;
  };

  const handleMediaUpload = useCallback(async (file: File, target: 'image-source' | 'video-source-image' | 'video-to-edit') => {
    setError(null);
    if (target === 'video-to-edit') {
        if (!file.type.startsWith('video/')) {
            setError('Please upload a valid video file.');
            return;
        }
        const url = URL.createObjectURL(file);
        setVideoToEditUrl(url);
        setEditedImage(null);
        setGeneratedVideoUrl(null);
        setFrameForEditing(null);
        setVideoEditPrompt('');

        try {
            const { dataUrl } = await extractFrameFromVideo(file);
            setFrameForEditing({ id: `frame-${uniqueId}-${Date.now()}`, dataUrl, mimeType: 'image/jpeg' });
        } catch (err) {
            console.error(err);
            setError("Could not extract an initial frame from the video.");
        }
    } else {
        try {
            const { dataUrl, mimeType } = await fileToBase64(file);
            const newImage: SourceImage = { id: `${uniqueId}-${Date.now()}`, dataUrl, mimeType };
            if (target === 'image-source') {
                setSourceImages(prev => [...prev, newImage]);
            } else { 
                setVideoSourceImage(newImage);
            }
        } catch (err) {
            setError('Failed to load image.');
        }
    }
  }, [uniqueId]);
  
  const handleImageCapture = useCallback((dataUrl: string) => {
    const newImage: SourceImage = { id: `${uniqueId}-${Date.now()}`, dataUrl, mimeType: 'image/jpeg' };
    if (activeTab === 'image') {
      setSourceImages(prev => [...prev, newImage]);
    } else {
      setVideoSourceImage(newImage);
    }
    setIsCameraOpen(false);
  }, [uniqueId, activeTab]);

  const handleToggleSelectImage = (id: string) => {
    setSelectedImageIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) { newSet.delete(id); } else { newSet.add(id); }
      return newSet;
    });
  };
  
  const handleDeleteImage = (id: string, target: 'image-source' | 'video-source-image') => {
    if (target === 'image-source') {
      setSourceImages(prev => prev.filter(img => img.id !== id));
      setSelectedImageIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
      });
    } else {
      setVideoSourceImage(null);
    }
  };

  const handleApplyCrop = (croppedDataUrl: string) => {
    if (!croppingImage) return;
    const updateImage = (img: SourceImage) => img.id === croppingImage.id ? { ...img, dataUrl: croppedDataUrl } : img;
    
    setSourceImages(prevImages => prevImages.map(updateImage));
    if (videoSourceImage?.id === croppingImage.id) {
        setVideoSourceImage(updateImage(videoSourceImage));
    }
    if (frameForEditing?.id === croppingImage.id) {
        setFrameForEditing(updateImage(frameForEditing));
    }
    setCroppingImage(null);
  };

  const handleGenerateImage = useCallback(async () => {
    if (!generationPrompt) {
      setError('Please enter a prompt.');
      return;
    }
    if (useSearchGrounding) await checkAndPromptKey();

    setIsGenerating(true); setError(null); setEditedImage(null); setGeneratedVideoUrl(null); setVideoToEditUrl(null); setSearchCitations([]);
    try {
      const { base64, citations } = await generateImage(generationPrompt, generationAspectRatio, useSearchGrounding);
      const resultDataUrl = `data:image/png;base64,${base64}`;
      setEditedImage(resultDataUrl);
      setBaseImageForBlend(resultDataUrl);
      if (citations) setSearchCitations(citations);
      const historyItem: HistoryItem = { id: `${uniqueId}-history-${Date.now()}`, type: 'generate', prompt: generationPrompt, thumbnailUrl: resultDataUrl, sourceImageUrls: [], aspectRatio: generationAspectRatio, timestamp: new Date() };
      setHistory(prev => [historyItem, ...prev]);
    } catch (err) { 
        if (err instanceof Error && err.message === "API_KEY_ERROR") {
            setNeedApiKey(true);
        } else {
            setError(err instanceof Error ? err.message : 'An error occurred.');
        }
    } finally { setIsGenerating(false); }
  }, [generationPrompt, generationAspectRatio, useSearchGrounding, uniqueId]);

  const handleEdit = useCallback(async (promptOverride?: string) => {
    const promptToUse = promptOverride ?? editPrompt;
    const selectedImages = sourceImages.filter(img => selectedImageIds.has(img.id));
    if (selectedImages.length === 0 || !promptToUse) {
      setError('Select images and enter an edit prompt.');
      return;
    }
    setIsEditing(true); setError(null); setEditedImage(null); setGeneratedVideoUrl(null); setVideoToEditUrl(null); setSearchCitations([]);
    setBaseImageForBlend(selectedImages[0].dataUrl);
    const finalEditPrompt = `${promptToUse}. The final image should have a ${editAspectRatio} aspect ratio.`;
    try {
      const imagesToEdit = selectedImages.map(img => ({ base64ImageData: stripDataUrlPrefix(img.dataUrl), mimeType: img.mimeType }));
      const resultBase64 = await editImage(imagesToEdit, finalEditPrompt);
      const resultDataUrl = `data:image/png;base64,${resultBase64}`;
      setEditedImage(resultDataUrl);
      const historyItem: HistoryItem = { id: `${uniqueId}-history-${Date.now()}`, type: 'edit', prompt: promptToUse, thumbnailUrl: resultDataUrl, sourceImageUrls: selectedImages.map(img => img.dataUrl), aspectRatio: editAspectRatio, baseImageForBlend: selectedImages[0].dataUrl, timestamp: new Date() };
      setHistory(prev => [historyItem, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
      setBaseImageForBlend(null);
    } finally { setIsEditing(false); }
  }, [sourceImages, selectedImageIds, editPrompt, editAspectRatio, uniqueId]);

  const handleGenerateVideo = useCallback(async (prompt: string, sourceImg: SourceImage | null, isReimagined: boolean) => {
    if (!prompt) {
      setError('Enter a prompt for video.');
      return;
    }
    await checkAndPromptKey();

    setIsGeneratingVideo(true); setError(null); setEditedImage(null); setGeneratedVideoUrl(null); setVideoToEditUrl(null); setSearchCitations([]);
    try {
      const imageParam = sourceImg ? { base64ImageData: stripDataUrlPrefix(sourceImg.dataUrl), mimeType: sourceImg.mimeType } : undefined;
      const objectUrl = await generateVideo(prompt, imageParam, setVideoGenerationStatus);
      setGeneratedVideoUrl(objectUrl);
      const historyItem: HistoryItem = { id: `${uniqueId}-history-${Date.now()}`, type: 'video', prompt: prompt, thumbnailUrl: sourceImg?.dataUrl || '', sourceImageUrls: sourceImg ? [sourceImg.dataUrl] : [], aspectRatio: '16:9', timestamp: new Date(), videoUrl: objectUrl };
      setHistory(prev => [historyItem, ...prev]);
      if (isReimagined) { setFrameForEditing(null); setVideoEditPrompt(''); }
    } catch (err) {
      if (err instanceof Error && err.message === "API_KEY_ERROR") {
          setNeedApiKey(true);
      } else {
          setError(err instanceof Error ? err.message : 'An error occurred.');
      }
    } finally { setIsGeneratingVideo(false); setVideoGenerationStatus(''); }
  }, [uniqueId]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery) return;
    setIsSearching(true); setError(null); setSearchResults(null); setSearchCitations([]);
    try {
      const results = await searchWeb(searchQuery);
      setSearchResults(results);
      setSearchCitations(results.citations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed.');
    } finally { setIsSearching(false); }
  }, [searchQuery]);
  
  const handleFrameSelected = (dataUrl: string) => {
      setFrameForEditing({ id: `frame-${uniqueId}-${Date.now()}`, dataUrl, mimeType: 'image/jpeg' });
      setIsSelectingFrame(false);
  };
  
  const handleApplyFilter = (filterPrompt: string) => {
    if (selectedImageIds.size === 0) {
        setError('Select an image first.'); return;
    }
    setEditPrompt(filterPrompt);
    handleEdit(filterPrompt);
  };
  
  const handleRevert = (item: HistoryItem) => {
    setError(null);
    setIsSelectingFrame(false);
    if (item.type === 'video') {
        setActiveTab('video');
        setGeneratedVideoUrl(item.videoUrl ?? null);
        setVideoGenerationPrompt(item.prompt);
        setVideoToEditUrl(item.videoUrl ?? null);
        const sourceImgData = item.sourceImageUrls.length > 0 ? item.sourceImageUrls[0] : null;
        const sourceImg = sourceImages.find(img => img.dataUrl === sourceImgData) ?? (sourceImgData ? {id: `reverted-${item.id}`, dataUrl: sourceImgData, mimeType: 'image/png'}: null);
        setVideoSourceImage(sourceImg);
        setEditedImage(null);
        setBaseImageForBlend(null);
    } else {
        setActiveTab('image');
        setEditedImage(item.thumbnailUrl);
        setBaseImageForBlend(item.baseImageForBlend ?? null);
        setEditPrompt(item.prompt);
        setEditAspectRatio(item.aspectRatio);
        setGeneratedVideoUrl(null);
        setVideoToEditUrl(null);
    }
    setIsHistoryVisible(false);
  };
  
  const handleReEdit = (item: HistoryItem) => {
    setError(null);
    setIsSelectingFrame(false);
    if (item.type === 'video') {
        setActiveTab('video');
        setVideoGenerationPrompt(item.prompt);
        setVideoToEditUrl(item.videoUrl ?? null);
        const sourceImgData = item.sourceImageUrls.length > 0 ? item.sourceImageUrls[0] : null;
        const sourceImg = sourceImages.find(img => img.dataUrl === sourceImgData) ?? (sourceImgData ? {id: `reverted-${item.id}`, dataUrl: sourceImgData, mimeType: 'image/png'}: null);
        setVideoSourceImage(sourceImg);
    } else {
        setActiveTab('image');
        setEditPrompt(item.prompt);
        setEditAspectRatio(item.aspectRatio);
        const newSelectedIds = new Set<string>();
        // FIX: Explicitly type the Map entries to help TypeScript infer Map<string, string> and resolve the error on line 325.
        const sourceMap = new Map<string, string>(sourceImages.map(img => [img.dataUrl, img.id] as [string, string]));
        item.sourceImageUrls.forEach(url => { if (sourceMap.has(url)) newSelectedIds.add(sourceMap.get(url)!); });
        setSelectedImageIds(newSelectedIds);
    }
    setEditedImage(null); setBaseImageForBlend(null); setGeneratedVideoUrl(null);
    setIsHistoryVisible(false);
  };
  
  const handleUseAsSource = useCallback((dataUrl: string) => {
    if (!dataUrl) return;
    const newImage: SourceImage = { id: `${uniqueId}-from-generated-${Date.now()}`, dataUrl, mimeType: 'image/png' };
    setSourceImages(prev => [...prev, newImage]);
    setActiveTab('image');
    setSelectedImageIds(new Set([newImage.id]));
    setTimeout(() => { editPromptRef.current?.focus(); }, 0);
  }, [uniqueId]);

  const handleReset = useCallback(() => {
    setSourceImages([]); setSelectedImageIds(new Set()); setEditedImage(null); setBaseImageForBlend(null);
    setEditPrompt(''); setGenerationPrompt(''); setEditStrength(1); setError(null);
    setIsEditing(false); setIsGenerating(false); setGenerationAspectRatio('1:1'); setEditAspectRatio('1:1');
    setCroppingImage(null); setExportFormat('image/png'); setExportQuality(0.92); setHistory([]);
    setIsHistoryVisible(false); setVideoGenerationPrompt(''); setVideoSourceImage(null); setGeneratedVideoUrl(null);
    setIsGeneratingVideo(false); setVideoGenerationStatus(''); setVideoToEditUrl(null); setVideoEditPrompt('');
    setFrameForEditing(null); setIsSelectingFrame(false); setSearchQuery(''); setSearchResults(null); setIsSearching(false);
    setSearchCitations([]);
  }, []);
  
  const isLoading = isEditing || isGenerating || isGeneratingVideo || isSearching;
  const displayUrl = generatedVideoUrl || videoToEditUrl;

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8 flex justify-between items-center">
          <div className="w-12"></div>
          <div className="flex-1">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
              AI Media Studio
            </h1>
            <p className="mt-2 text-lg text-slate-400">
              Search, Generate and Edit photos & videos with Gemini.
            </p>
          </div>
          <button onClick={() => setIsHistoryVisible(true)} className="p-2 rounded-full hover:bg-slate-700 transition-colors" aria-label="View history">
            <HistoryIcon />
          </button>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex flex-col gap-6">
            <div className="flex border-b border-slate-700 mb-2 overflow-x-auto no-scrollbar">
              <button onClick={() => setActiveTab('image')} className={`flex items-center justify-center font-semibold py-3 px-4 -mb-px rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'image' ? 'border-b-2 border-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}><ImageIcon /> Image Tools</button>
              <button onClick={() => setActiveTab('video')} className={`flex items-center justify-center font-semibold py-3 px-4 -mb-px rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'video' ? 'border-b-2 border-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}><VideoIcon /> Video Tools</button>
              <button onClick={() => setActiveTab('search')} className={`flex items-center justify-center font-semibold py-3 px-4 -mb-px rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'search' ? 'border-b-2 border-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}><SearchIcon /> Research & Retrieval</button>
            </div>
            
            {activeTab === 'image' && (
                <>
                <div className="space-y-3"><h2 className="text-lg font-semibold text-slate-200">1. Source Images</h2><div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {sourceImages.map(img => (<div key={img.id} className="relative aspect-square group"><img src={img.dataUrl} alt="Source" className="w-full h-full object-cover rounded-md"/><div onClick={() => handleToggleSelectImage(img.id)} className={`absolute inset-0 rounded-md cursor-pointer transition-all ${selectedImageIds.has(img.id) ? 'ring-4 ring-indigo-500 ring-inset bg-black/30' : 'bg-black/50 opacity-0 group-hover:opacity-100'}`}>{selectedImageIds.has(img.id) && <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-indigo-600 border-2 border-white rounded-full flex items-center justify-center text-white">✓</div>}</div><div className="absolute top-1 right-1 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => setCroppingImage(img)} className="p-1 bg-black/60 rounded-full text-white hover:bg-indigo-500"><CropIcon /></button><button onClick={() => handleDeleteImage(img.id, 'image-source')} className="p-1 bg-black/60 rounded-full text-white hover:bg-red-500"><TrashIcon /></button></div></div>))}
                    <ImageUpload onImageUpload={(file) => handleMediaUpload(file, 'image-source')} accept="image/*" />
                    <button onClick={() => setIsCameraOpen(true)} className="relative block w-full aspect-square border-2 border-dashed border-slate-600 rounded-md cursor-pointer hover:border-indigo-500 transition-colors duration-200 flex flex-col items-center justify-center text-slate-400 p-2 text-center"><CameraIcon /><span className="mt-1 text-xs font-semibold">Use Camera</span></button>
                </div></div><hr className="border-slate-700" />
                <div className="space-y-4"><h2 className="text-lg font-semibold text-slate-200">2. Generate a New Image</h2><div className="flex gap-3"><input type="text" value={generationPrompt} onChange={(e) => setGenerationPrompt(e.target.value)} placeholder="Describe what you want to create..." className="w-full p-2 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500"/><button onClick={handleGenerateImage} disabled={isLoading || !generationPrompt} className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-500 disabled:bg-slate-600 flex items-center justify-center gap-2">{isGenerating ? <Spinner className="h-5 w-5 text-white"/> : <SparklesIcon />}</button></div><div className="flex items-center gap-4"><AspectRatioSelector label="Aspect Ratio" options={aspectRatios} value={generationAspectRatio} onChange={setGenerationAspectRatio} /><label className="flex items-center gap-2 cursor-pointer mt-7"><input type="checkbox" checked={useSearchGrounding} onChange={(e) => setUseSearchGrounding(e.target.checked)} className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-indigo-600 focus:ring-indigo-500" /> <span className="text-sm text-slate-300">Ground with Google Search</span></label></div></div><hr className="border-slate-700" />
                <div className="space-y-4"><h2 className="text-lg font-semibold text-slate-200">3. Edit Selected Images</h2><div className="relative w-full"><textarea ref={editPromptRef} value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} placeholder="Describe your edit..." className="w-full h-24 p-3 pr-12 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none" disabled={selectedImageIds.size === 0}/><VoicePromptButton onTranscript={(transcript) => setEditPrompt(prev => prev ? `${prev} ${transcript}`: transcript)} disabled={selectedImageIds.size === 0} /></div><FilterSelector filters={predefinedFilters} onApplyFilter={handleApplyFilter} disabled={isLoading || selectedImageIds.size === 0}/><AspectRatioSelector label="Output Aspect Ratio" options={aspectRatios} value={editAspectRatio} onChange={setEditAspectRatio}/><div className='space-y-2'><label className="block text-sm font-medium text-slate-300">Edit Strength: {Math.round(editStrength * 100)}%</label><input type="range" min="0" max="1" step="0.01" value={editStrength} onChange={(e) => setEditStrength(parseFloat(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" disabled={!editedImage}/></div></div>
                <div className="flex flex-col sm:flex-row gap-4 mt-auto pt-4"><button onClick={() => handleEdit()} disabled={isLoading || selectedImageIds.size === 0 || !editPrompt} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-500 disabled:bg-slate-600 transition-all duration-200">{isEditing ? <Spinner className="h-5 w-5 text-white" /> : <SparklesIcon />} {isEditing ? 'Applying Edits...' : 'Apply Edits'}</button><button onClick={handleReset} className="w-full sm:w-auto px-6 py-3 bg-slate-700 text-slate-300 font-semibold rounded-lg hover:bg-slate-600">Reset</button></div></>
            )}
            
            {activeTab === 'video' && (
              <div className="flex flex-col gap-6 h-full">
                <details open className="space-y-4 group">
                  <summary className="text-lg font-semibold text-slate-200 cursor-pointer list-none flex items-center gap-2"><span className="group-open:rotate-90 transition-transform duration-200">&#9656;</span>Generate New Video</summary>
                  <div className="pl-5 space-y-4">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 items-center">
                      {videoSourceImage && (<div key={videoSourceImage.id} className="relative aspect-square group"><img src={videoSourceImage.dataUrl} alt="Video Source" className="w-full h-full object-cover rounded-md"/><div className="absolute top-1 right-1 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => setCroppingImage(videoSourceImage)} className="p-1 bg-black/60 rounded-full text-white hover:bg-indigo-500"><CropIcon /></button><button onClick={() => handleDeleteImage(videoSourceImage.id, 'video-source-image')} className="p-1 bg-black/60 rounded-full text-white hover:bg-red-500"><TrashIcon /></button></div></div>)}
                      <ImageUpload onImageUpload={(file) => handleMediaUpload(file, 'video-source-image')} accept="image/*" />
                      <button onClick={() => setIsCameraOpen(true)} className="relative block w-full aspect-square border-2 border-dashed border-slate-600 rounded-md cursor-pointer hover:border-indigo-500 transition-colors duration-200 flex flex-col items-center justify-center text-slate-400 p-2 text-center"><CameraIcon /><span className="mt-1 text-xs font-semibold">Use Camera</span></button>
                    </div>
                    <div className="relative w-full"><textarea value={videoGenerationPrompt} onChange={(e) => setVideoGenerationPrompt(e.target.value)} placeholder="Describe the video action..." className="w-full h-24 p-3 pr-12 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none" /><VoicePromptButton onTranscript={(t) => setVideoGenerationPrompt(p => p ? `${p} ${t}` : t)} disabled={false} /></div>
                    <button onClick={() => handleGenerateVideo(videoGenerationPrompt, videoSourceImage, false)} disabled={isLoading || !videoGenerationPrompt} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-500 disabled:bg-slate-600">{isGeneratingVideo && !isSelectingFrame ? <Spinner className="h-5 w-5 text-white" /> : <VideoIcon />} {isGeneratingVideo && !isSelectingFrame ? 'Generating Video...' : 'Generate Video'}</button>
                  </div>
                </details>
                <hr className="border-slate-700" />
                <details open className="space-y-4 group">
                  <summary className="text-lg font-semibold text-slate-200 cursor-pointer list-none flex items-center gap-2"><span className="group-open:rotate-90 transition-transform duration-200">&#9656;</span>Edit a Video</summary>
                  <div className="pl-5 space-y-4">
                    <ImageUpload onImageUpload={(file) => handleMediaUpload(file, 'video-to-edit')} accept="video/mp4,video/quicktime,video/webm" label="Upload Video" />
                    {videoToEditUrl && (
                      <div className="pt-4 border-t border-slate-700 space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4 items-start">
                          {frameForEditing ? (
                            <div className="w-full sm:w-1/3 flex-shrink-0 space-y-2">
                               <div className="relative aspect-video group"><img src={frameForEditing.dataUrl} alt="Selected frame" className="w-full h-full object-cover rounded-md"/><div className="absolute top-1 right-1 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => setCroppingImage(frameForEditing)} className="p-1 bg-black/60 rounded-full text-white hover:bg-indigo-500"><CropIcon /></button><button onClick={() => setFrameForEditing(null)} className="p-1 bg-black/60 rounded-full text-white hover:bg-red-500"><TrashIcon /></button></div></div>
                               <button onClick={() => setIsSelectingFrame(true)} className="w-full text-sm py-1.5 bg-slate-700 hover:bg-slate-600 rounded-md">Change Frame</button>
                            </div>
                          ) : (
                            <button onClick={() => setIsSelectingFrame(true)} className="w-full sm:w-1/3 aspect-video flex flex-col items-center justify-center gap-2 px-6 py-3 bg-slate-900 border-2 border-dashed border-slate-600 rounded-lg hover:border-indigo-500"><FrameSelectIcon /><span>Select Frame</span></button>
                          )}
                          <div className="flex-grow w-full sm:w-2/3 space-y-4">
                            <div className="relative w-full"><textarea value={videoEditPrompt} onChange={(e) => setVideoEditPrompt(e.target.value)} placeholder="Describe effect to apply..." className="w-full h-24 p-3 pr-12 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none" /><VoicePromptButton onTranscript={(t) => setVideoEditPrompt(p => p ? `${p} ${t}` : t)} disabled={false} /></div>
                            <button onClick={() => handleGenerateVideo(videoEditPrompt, frameForEditing, true)} disabled={isLoading || !videoEditPrompt || !frameForEditing} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 disabled:bg-slate-600">{isGeneratingVideo ? <Spinner className="h-5 w-5 text-white" /> : <SparklesIcon />} Apply Effect</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </details>
                <button onClick={handleReset} className="w-full sm:w-auto px-6 py-3 bg-slate-700 text-slate-300 font-semibold rounded-lg hover:bg-slate-600 mt-auto">Reset All</button>
              </div>
            )}

            {activeTab === 'search' && (
              <div className="flex flex-col gap-6 h-full">
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-slate-200">Retrieval & Research</h2>
                  <p className="text-sm text-slate-400">Search the web for text, documents, or real-world information grounded in public data.</p>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="e.g. Find recent scientific papers on Mars..." 
                      className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    <button 
                      onClick={handleSearch} 
                      disabled={isLoading || !searchQuery}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold disabled:bg-slate-700"
                    >
                      {isSearching ? <Spinner className="h-5 w-5" /> : <SearchIcon />}
                    </button>
                  </div>
                </div>

                {searchResults && (
                  <div className="flex-grow overflow-y-auto space-y-4 bg-slate-900/30 p-4 rounded-xl border border-slate-700">
                    <div className="prose prose-invert prose-sm max-w-none text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {searchResults.text}
                    </div>
                    {searchResults.citations.length > 0 && (
                      <div className="pt-4 border-t border-slate-700">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Sources Found</h4>
                        <div className="grid grid-cols-1 gap-2">
                          {searchResults.citations.map((cite, i) => cite.web && (
                            <a key={i} href={cite.web.uri} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800/50 hover:bg-slate-700 rounded-lg text-sm flex items-center gap-3 transition-colors border border-slate-700/30">
                              <span className="w-5 h-5 flex-shrink-0 bg-indigo-500/20 text-indigo-400 rounded flex items-center justify-center font-mono text-xs">{i+1}</span>
                              <span className="truncate">{cite.web.title || cite.web.uri}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <button onClick={handleReset} className="w-full sm:w-auto px-6 py-3 bg-slate-700 text-slate-300 font-semibold rounded-lg hover:bg-slate-600 mt-auto">Clear Search</button>
              </div>
            )}
          </div>

          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex flex-col">
            <ImageDisplay
              baseImageUrl={baseImageForBlend}
              editedImageUrl={editedImage}
              strength={editStrength}
              isLoading={isLoading}
              loadingStatus={isGeneratingVideo ? videoGenerationStatus : (isSearching ? 'Searching public documents...' : '')}
              error={error}
              exportFormat={exportFormat}
              setExportFormat={setExportFormat}
              exportQuality={exportQuality}
              setExportQuality={setExportQuality}
              videoUrl={displayUrl}
              videoPrompt={videoGenerationPrompt || videoEditPrompt}
              isSelectingFrame={isSelectingFrame}
              onFrameSelected={handleFrameSelected}
              onCancelFrameSelection={() => setIsSelectingFrame(false)}
              onUseAsSource={handleUseAsSource}
            />
            {searchCitations.length > 0 && !isSelectingFrame && !isLoading && (
               <GroundingCitations citations={searchCitations} />
            )}
          </div>
        </main>
        
        {croppingImage && <ImageCropModal image={croppingImage} onApplyCrop={handleApplyCrop} onClose={() => setCroppingImage(null)} />}
        <HistorySidebar isVisible={isHistoryVisible} history={history} onRevert={handleRevert} onReEdit={handleReEdit} onClose={() => setIsHistoryVisible(false)} />
        {isCameraOpen && <CameraCaptureModal onCapture={handleImageCapture} onClose={() => setIsCameraOpen(false)} />}
        
        {needApiKey && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
             <div className="bg-slate-800 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl border border-slate-700">
               <div className="w-16 h-16 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
               </div>
               <h3 className="text-xl font-bold mb-2">API Key Required</h3>
               <p className="text-slate-400 mb-6 text-sm">To use high-quality features like Veo Video or Grounded Pro Images, you must select your own API key from a paid GCP project.</p>
               <div className="flex flex-col gap-3">
                 <button 
                  onClick={async () => {
                    // @ts-ignore
                    await window.aistudio.openSelectKey();
                    setNeedApiKey(false);
                    setError(null);
                  }}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-bold transition-all"
                 >
                   Select API Key
                 </button>
                 <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-slate-400 underline">Learn more about billing & keys</a>
                 <button onClick={() => setNeedApiKey(false)} className="py-2 text-sm text-slate-500 hover:text-white">Close</button>
               </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
