import { GoogleGenAI, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Generates a new image from a text prompt using the Imagen model.
 * @param prompt The text prompt describing the image to generate.
 * @param aspectRatio The desired aspect ratio for the generated image.
 * @returns A promise that resolves to the base64 encoded string of the generated image.
 */
export async function generateImage(prompt: string, aspectRatio: string): Promise<string> {
  try {
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
      return response.generatedImages[0].image.imageBytes;
    }

    throw new Error("AI did not return an image for generation.");
  } catch (error) {
    console.error("Error calling Gemini API for image generation:", error);
    throw new Error("Failed to generate image from AI. Please check the console for details.");
  }
}

/**
 * Edits one or more images using the Gemini API based on a text prompt.
 * @param images An array of image objects, each with base64 data and MIME type.
 * @param prompt The text prompt describing the desired edit.
 * @returns A promise that resolves to the base64 encoded string of the edited image.
 */
export async function editImage(images: { base64ImageData: string; mimeType: string }[], prompt: string): Promise<string> {
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
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          ...imageParts,
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    // The model can return multiple parts (text, image). We need to find the image part.
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.data) {
        return part.inlineData.data;
      }
    }

    throw new Error("AI did not return an image. It might have refused the request. Please try a different prompt.");
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate image from AI. Please check the console for details.");
  }
}