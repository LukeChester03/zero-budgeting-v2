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

// Available models - using the most capable option
export const GEMINI_MODELS = {
  GEMINI_2_0_FLASH: 'gemini-2.0-flash', // Latest model with PDF support
  GEMINI_1_5_FLASH: 'gemini-1.5-flash', // Fallback option
  GEMINI_PRO: 'gemini-pro', // Legacy fallback
  GEMINI_PRO_VISION: 'gemini-pro-vision'
} as const;

// Initialize the model - using the most capable available
export const geminiModel = genAI.getGenerativeModel({ 
  model: GEMINI_MODELS.GEMINI_2_0_FLASH 
});

// Text generation function - OPTIMIZED FOR COST EFFICIENCY AND JSON OUTPUT
export async function generateText(prompt: string): Promise<string> {
  try {
    const result = await geminiModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 16000, // Significantly increased for complete bank statement analysis
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

// PDF Analysis function - Direct PDF processing with Gemini
export async function analyzePDFDocument(pdfFile: File, prompt: string): Promise<string> {
  try {
    console.log('🤖 Starting PDF analysis with Gemini...');
    console.log('📁 File details:', { name: pdfFile.name, size: pdfFile.size, type: pdfFile.type });
    
    // Check file size to prevent memory issues
    const maxSize = 10 * 1024 * 1024; // 10MB limit
    if (pdfFile.size > maxSize) {
      throw new Error(`PDF file too large (${(pdfFile.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 10MB.`);
    }
    
    // Convert PDF to base64 using FileReader to avoid stack overflow
    let base64String: string;
    
    try {
      // Try FileReader first (most efficient)
      base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            // Remove the data:application/pdf;base64, prefix
            const base64 = reader.result.split(',')[1];
            resolve(base64);
          } else {
            reject(new Error('Failed to read file as base64'));
          }
        };
        reader.onerror = () => reject(new Error('File reading failed'));
        reader.readAsDataURL(pdfFile);
      });
    } catch (fileReaderError) {
      console.warn('⚠️ FileReader failed, trying alternative method...', fileReaderError);
      
      // Fallback: Use arrayBuffer with chunked processing
      const arrayBuffer = await pdfFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Process in very small chunks to avoid stack overflow
      let base64 = '';
      const chunkSize = 1024; // 1KB chunks
      
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        base64 += btoa(String.fromCharCode(...chunk));
      }
      
      base64String = base64;
    }
    
    console.log('📄 PDF converted to base64, length:', base64String.length);
    
    // Validate base64 string
    if (!base64String || base64String.length === 0) {
      throw new Error('Failed to convert PDF to base64');
    }
    
    // Use gemini-2.0-flash for PDF analysis (latest model with full PDF support)
    const visionModel = genAI.getGenerativeModel({ 
      model: GEMINI_MODELS.GEMINI_2_0_FLASH 
    });
    
    console.log('🤖 Using model:', GEMINI_MODELS.GEMINI_2_0_FLASH);
    console.log('📄 Sending PDF to Gemini...');
    
    // Generate content with PDF document with timeout protection
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('PDF analysis timeout after 180 seconds')), 180000); // Increased to 3 minutes
    });
    
    const analysisPromise = visionModel.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { 
              inlineData: {
                data: base64String,
                mimeType: "application/pdf"
              }
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 64000, // Significantly increased for comprehensive PDF analysis
        temperature: 0.1, // Low temperature for consistent analysis
        topP: 0.8,
        topK: 20,
        responseMimeType: 'application/json', // Ensure JSON output
      },
    });
    
    const result = await Promise.race([analysisPromise, timeoutPromise]) as { response: { text: () => string } };
    
    console.log('📤 Gemini response received, processing...');
    const response = await result.response;
    let analysisResult = response.text();
    
    // Clean the response to ensure it's valid JSON
    console.log('🧹 Cleaning response for JSON parsing...');
    
    // Remove any markdown formatting that might be present
    if (analysisResult.includes('```json')) {
      analysisResult = analysisResult.replace(/```json\s*/, '').replace(/\s*```/, '');
    }
    
    // Remove any leading/trailing whitespace and newlines
    analysisResult = analysisResult.trim();
    
    // Log the cleaned response for debugging
    console.log('📄 Cleaned response length:', analysisResult.length);
    console.log('📄 Response preview (first 200 chars):', analysisResult.substring(0, 200));
    console.log('📄 Response preview (last 200 chars):', analysisResult.substring(analysisResult.length - 200));
    
    console.log('✅ PDF analysis completed successfully, response length:', analysisResult.length);
    return analysisResult;
    
  } catch (error) {
    console.error('❌ Error analyzing PDF with Gemini:', error);
    console.error('❌ Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    throw new Error(`Failed to analyze PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export default genAI;
