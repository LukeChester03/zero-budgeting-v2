// Gemini API Configuration and Service
// COST OPTIMIZATION STRATEGY:
// - Only call API once per user when saving new preferences
// - Store analysis in Firebase to avoid repeated API calls
// - Use gemini-1.5-flash (cheapest available model)
// - Limit output tokens and control generation parameters
// - Optimize for JSON output to reduce token usage
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini with API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

// Available models - using the cheapest option
export const GEMINI_MODELS = {
  GEMINI_1_5_FLASH: 'gemini-1.5-flash', // Cheapest model
  GEMINI_PRO: 'gemini-pro', // Fallback if needed
  GEMINI_PRO_VISION: 'gemini-pro-vision'
} as const;

// Initialize the model - using the cheapest available
export const geminiModel = genAI.getGenerativeModel({ 
  model: GEMINI_MODELS.GEMINI_1_5_FLASH 
});

// Text generation function - OPTIMIZED FOR COST EFFICIENCY AND JSON OUTPUT
export async function generateText(prompt: string): Promise<string> {
  try {
    const result = await geminiModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 2000, // Increased to allow complete JSON responses
        temperature: 0.1, // Very low temperature for consistent JSON formatting
        topP: 0.8, // Slightly relaxed for better completion
        topK: 20, // Increased vocabulary for better JSON generation
        responseMimeType: 'application/json', // Ensure JSON output
      },
    });
    
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating text with Gemini:', error);
    throw new Error('Failed to generate text');
  }
}

export default genAI;
