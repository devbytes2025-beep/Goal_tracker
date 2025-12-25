import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || ''; // In a real app, strict env handling

export const getMotivationalQuote = async (): Promise<string> => {
  if (!apiKey) return "Believe in yourself and all that you are.";
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Generate a short, powerful, modern motivational quote for a habit tracker user. Just the quote text, no authors.",
    });
    return response.text || "Keep pushing forward.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Consistecy is the key to success.";
  }
};
