
import { GoogleGenAI, Modality, type GroundingChunk } from "@google/genai";

export { type GroundingChunk };

// Note: For gemini-3-pro-image-preview and veo-3.1-fast-generate-preview, 
// we'll instantiate fresh to ensure we use the user-selected key if applicable.
// FIX: Always use a clean initialization with process.env.API_KEY as the only source.
const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export interface SearchResult {
  text: string;
  citations: GroundingChunk[];
}

/**
 * Searches the web for information using Gemini 3 Flash.
 */
export async function searchWeb(prompt: string): Promise<SearchResult> {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "No summary available.";
    const citations = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { text, citations };
  } catch (error) {
    console.error("Error calling Gemini API for search:", error);
    throw new Error("Failed to retrieve search results. Please try again.");
  }
}

/**
 * Generates a new image, optionally using Google Search for grounding.
 */
export async function generateImage(prompt: string, aspectRatio: string, useSearch: boolean = false): Promise<{ base64: string; citations?: GroundingChunk[] }> {
  const ai = getAI();
  try {
    if (useSearch) {
      // High-quality generation with search grounding uses Pro model
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: { aspectRatio: aspectRatio as any, imageSize: "1K" },
          // FIX: Use 'googleSearch' specifically for gemini-3-pro-image-preview.
          tools: [{ googleSearch: {} }],
        },
      });

      let base64 = "";
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            base64 = part.inlineData.data;
            break;
          }
        }
      }
      
      const citations = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      
      if (!base64) throw new Error("AI did not return an image.");
      return { base64, citations };
    } else {
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: aspectRatio,
        },
      });

      if (response.generatedImages && response.generatedImages.length > 0) {
        return { base64: response.generatedImages[0].image.imageBytes };
      }
    }

    throw new Error("AI did not return an image for generation.");
  } catch (error) {
    console.error("Error calling Gemini API for image generation:", error);
    if (error instanceof Error && error.message.includes("Requested entity was not found")) {
        throw new Error("API_KEY_ERROR");
    }
    throw new Error("Failed to generate image from AI.");
  }
}

/**
 * Edits images using Gemini 2.5 Flash Image.
 */
export async function editImage(images: { base64ImageData: string; mimeType: string }[], prompt: string): Promise<string> {
  const ai = getAI();
  if (images.length === 0) {
    throw new Error("At least one image must be provided for editing.");
  }

  try {
    const imageParts = images.map(image => ({
      inlineData: {
        data: image.base64ImageData,
        mimeType: image.mimeType,
      },
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [ ...imageParts, { text: prompt } ],
      },
      // FIX: Removed unnecessary responseModalities config to adhere to simpler prompt-based generation content for images.
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }

    throw new Error("AI did not return an image.");
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to edit image.");
  }
}

/**
 * Generates a video using Veo 3.1.
 */
export async function generateVideo(
  prompt: string,
  image: { base64ImageData: string; mimeType: string } | undefined,
  onStatusUpdate: (status: string) => void
): Promise<string> {
  const ai = getAI();
  try {
    onStatusUpdate('Preparing video request...');
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      image: image ? { imageBytes: image.base64ImageData, mimeType: image.mimeType } : undefined,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    onStatusUpdate('Generating video... this may take a few minutes.');
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      onStatusUpdate('Still working on your video...');
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (!downloadLink) throw new Error("No download link returned.");

    onStatusUpdate('Downloading generated video...');
    // FIX: Using process.env.GEMINI_API_KEY directly in fetch as required by Veo generation instructions.
    const response = await fetch(downloadLink, {
      method: 'GET',
      headers: {
        'x-goog-api-key': process.env.GEMINI_API_KEY as string,
      },
    });
    const videoBlob = await response.blob();
    onStatusUpdate('');
    return URL.createObjectURL(videoBlob);
  } catch (error) {
    console.error("Error generating video:", error);
    onStatusUpdate('');
    if (error instanceof Error && error.message.includes("Requested entity was not found")) {
        throw new Error("API_KEY_ERROR");
    }
    throw new Error("Video generation failed.");
  }
}
