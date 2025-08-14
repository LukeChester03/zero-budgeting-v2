import { create } from 'zustand';
import { AIPreferences, AIAnalysisData, StoredAIPreferences, AIPreferencesSchema } from '@/lib/types/ai';
import { AIService } from '@/lib/services/ai-service';

interface AIStoreState {
  // State
  preferences: AIPreferences;
  aiAnalysis: string;
  parsedAnalysis: AIAnalysisData | null;
  hasExistingAnalysis: boolean;
  isLoading: boolean;
  error: string | null;
  currentStep: number;
  
  // Actions
  setPreferences: (preferences: AIPreferences) => void;
  updatePreference: (key: keyof AIPreferences, value: any) => void;
  setCurrentStep: (step: number) => void;
  resetPreferences: () => void;
  checkExistingAnalysis: (userId: string) => Promise<void>;
  generateAnalysis: (userId: string, monthlyIncome: number) => Promise<void>;
  updatePreferences: (userId: string, documentId: string) => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
  validateCurrentStep: () => boolean;
}

const initialPreferences: AIPreferences = {
  primaryGoal: '',
  primaryGoalOther: '',
  secondaryGoals: [],
  secondaryGoalsOther: '',
  riskTolerance: 5,
  emergencyFund: '',
  debtAmount: '',
  debtTypes: [],
  savingsPriority: '',
  investmentExperience: '',
  timeHorizon: '',
  lifestylePreferences: '',
  financialStressors: [],
  age: 25, // Default age
  familySize: 1, // Default family size
  housingCosts: '',
  transportationCosts: '',
  healthcareCosts: '',
  foodAndGroceries: '',
  entertainmentAndHobbies: '',
  currentSavings: '',
  employmentStatus: ''
};

export const useAIStore = create<AIStoreState>((set, get) => ({
  // Initial state
  preferences: initialPreferences,
  aiAnalysis: '',
  parsedAnalysis: null,
  hasExistingAnalysis: false,
  isLoading: false,
  error: null,
  currentStep: 0,

  // Actions
  setPreferences: (preferences: AIPreferences) => {
    set({ preferences });
  },

  updatePreference: (key: keyof AIPreferences, value: any) => {
    set((state) => ({
      preferences: { ...state.preferences, [key]: value }
    }));
  },

  setCurrentStep: (step: number) => {
    set({ currentStep: step });
  },

  resetPreferences: () => {
    set({
      preferences: initialPreferences,
      aiAnalysis: '',
      parsedAnalysis: null,
      hasExistingAnalysis: false,
      currentStep: 0,
      error: null
    });
  },

  validateCurrentStep: () => {
    const { currentStep, preferences } = get();
    const currentQuestion = require('../data/ai-questions').AI_QUESTIONS[currentStep];
    
    if (!currentQuestion || !currentQuestion.required) {
      return true;
    }

    const value = preferences[currentQuestion.id as keyof AIPreferences];
    
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    if (typeof value === 'number') {
      return value !== undefined && value !== null;
    }
    
    return true;
  },

  checkExistingAnalysis: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const existing = await AIService.getExistingAnalysis(userId);
      
      if (existing) {
        const hasActualAnalysis = existing.aiAnalysis && existing.aiAnalysis.trim().length > 0;
        
        set({
          preferences: existing.preferences,
          aiAnalysis: existing.aiAnalysis || '',
          hasExistingAnalysis: Boolean(hasActualAnalysis),
          parsedAnalysis: hasActualAnalysis ? 
            (() => {
              try {
                return JSON.parse(existing.aiAnalysis);
              } catch {
                return null;
              }
            })() : null
        });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to check existing analysis' 
      });
    } finally {
      set({ isLoading: false });
    }
  },

  generateAnalysis: async (userId: string, monthlyIncome: number) => {
    try {
      set({ isLoading: true, error: null });
      
      const { preferences } = get();
      const response = await AIService.generateBudgetAnalysis(preferences, monthlyIncome);
      
      if (response.success && response.data) {
        set({
          aiAnalysis: JSON.stringify(response.data),
          parsedAnalysis: response.data
        });
      } else {
        throw new Error(response.error || 'Failed to generate analysis');
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to generate analysis' 
      });
    } finally {
      set({ isLoading: false });
    }
  },

  updatePreferences: async (userId: string, documentId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const { preferences, aiAnalysis } = get();
      
      if (aiAnalysis && aiAnalysis.trim().length > 0) {
        // User has existing analysis - just update preferences
        await AIService.updatePreferences(documentId, {
          preferences,
          aiAnalysis,
          updatedAt: new Date().toISOString()
        });
      } else {
        // User has NO analysis - save preferences first, then generate analysis
        const newDocId = await AIService.savePreferencesAndAnalysis(
          userId, 
          preferences, 
          ''
        );
        
        // Generate analysis
        await get().generateAnalysis(userId, 0); // Will be updated with actual income
        
        // Update with the generated analysis
        if (get().aiAnalysis) {
          await AIService.updatePreferences(newDocId, {
            aiAnalysis: get().aiAnalysis,
            updatedAt: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update preferences' 
      });
    } finally {
      set({ isLoading: false });
    }
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  }
}));
