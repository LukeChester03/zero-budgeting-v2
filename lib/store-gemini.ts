import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateText } from './gemini';

interface GeminiState {
  // State
  isLoading: boolean;
  lastResponse: string | null;
  error: string | null;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  
  // Actions
  generateResponse: (prompt: string) => Promise<void>;
  clearConversation: () => void;
  clearError: () => void;
}

export const useGeminiStore = create<GeminiState>()(
  persist(
    (set, get) => ({
      // Initial state
      isLoading: false,
      lastResponse: null,
      error: null,
      conversationHistory: [],

      // Generate generic response
      generateResponse: async (prompt: string) => {
        set({ isLoading: true, error: null });
        
        try {
          // Add user message to conversation
          const userMessage = {
            role: 'user' as const,
            content: prompt,
            timestamp: new Date()
          };
          
          const currentHistory = get().conversationHistory;
          set({ 
            conversationHistory: [...currentHistory, userMessage]
          });

          // Generate response
          const response = await generateText(prompt);
          
          // Add assistant response to conversation
          const assistantMessage = {
            role: 'assistant' as const,
            content: response,
            timestamp: new Date()
          };
          
          set({ 
            lastResponse: response,
            conversationHistory: [...get().conversationHistory, assistantMessage],
            isLoading: false
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to generate response',
            isLoading: false 
          });
        }
      },

      // Clear conversation history
      clearConversation: () => {
        set({ 
          conversationHistory: [],
          lastResponse: null,
          error: null
        });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: "gemini-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        conversationHistory: state.conversationHistory,
        lastResponse: state.lastResponse
      })
    }
  )
);

// Helper function for localStorage
function createJSONStorage<T>(getStorage: () => Storage) {
  return {
    getItem: (name: string) => {
      const str = getStorage().getItem(name);
      if (!str) return null;
      try {
        return JSON.parse(str);
      } catch {
        return null;
      }
    },
    setItem: (name: string, value: T) => {
      getStorage().setItem(name, JSON.stringify(value));
    },
    removeItem: (name: string) => getStorage().removeItem(name),
  };
}
