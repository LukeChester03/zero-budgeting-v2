import { useCallback } from 'react';
import { useGeminiStore } from '@/lib/store-gemini';

export const useGemini = () => {
  const {
    isLoading,
    lastResponse,
    error,
    conversationHistory,
    generateResponse,
    clearConversation,
    clearError
  } = useGeminiStore();

  // Generic text generation
  const generateText = useCallback(async (prompt: string) => {
    await generateResponse(prompt);
  }, [generateResponse]);

  // Clear conversation
  const clearChat = useCallback(() => {
    clearConversation();
  }, [clearConversation]);

  // Clear error
  const clearErrorState = useCallback(() => {
    clearError();
  }, [clearError]);

  return {
    // State
    isLoading,
    lastResponse,
    error,
    conversationHistory,
    
    // Actions
    generateText,
    clearChat,
    clearError: clearErrorState,
    
    // Computed values
    hasConversation: conversationHistory.length > 0,
    userMessageCount: conversationHistory.filter(msg => msg.role === 'user').length,
    assistantMessageCount: conversationHistory.filter(msg => msg.role === 'assistant').length
  };
};
