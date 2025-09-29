
import { GoogleGenAI, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Edits an image using the Gemini API based on a text prompt.
 * @param base64ImageData The base64 encoded image data (without the data URL prefix).
 * @param mimeType The MIME type of the image (e.g., 'image/jpeg').
 * @param prompt The text prompt describing the desired edit.
 * @returns A promise that resolves to the base64 encoded string of the edited image.
 */
export async function editImage(base64ImageData: string, mimeType: string, prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
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
