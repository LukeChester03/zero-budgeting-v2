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
  resetPreferencesOnly: () => void;
  checkExistingAnalysis: (userId: string) => Promise<void>;
  generateAnalysis: (userId: string, monthlyIncome: number, debts?: any[], bankStatements?: any[], statementAnalyses?: any[]) => Promise<void>;
  updatePreferences: (userId: string, documentId: string) => Promise<void>;
  createAutomatedBudget: (userId: string, monthlyIncome: number) => Promise<{ success: boolean; budgetId?: string; error?: string }>;
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
  debtConfirmation: '',
  goalsConfirmation: '',
  savingsPriority: '',
  investmentExperience: '',
  timeHorizon: '',
  lifestylePreferences: '',
  financialStressors: [],
  age: 25, // Default age
  familySize: 1, // Default family size
  housingType: '',
  housingCosts: 0,
  utilitiesIncluded: [],
  separateUtilities: [],
  transportationType: '',
  transportationCosts: 0,
  healthcareType: '',
  healthcareCosts: 0,
  foodAndGroceries: 0,
  subscriptions: [],
  entertainmentAndHobbies: 0,
  shoppingAndPersonal: 0,
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

  resetPreferencesOnly: () => {
    // Reset only preferences, preserve analysis if it exists
    const { aiAnalysis, parsedAnalysis, hasExistingAnalysis } = get();
    set({
      preferences: initialPreferences,
      currentStep: 0,
      error: null,
      // Keep existing analysis
      aiAnalysis: aiAnalysis || '',
      parsedAnalysis: parsedAnalysis || null,
      hasExistingAnalysis: hasExistingAnalysis || false
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
      
      const response = await AIService.getExistingAnalysis(userId);
      
      console.log('🔍 AI Store - Response received:', response);
      console.log('🔍 AI Store - Response keys:', response ? Object.keys(response) : 'No response');
      console.log('🔍 AI Store - aiAnalysis field:', response?.aiAnalysis);
      console.log('🔍 AI Store - aiAnalysis type:', typeof response?.aiAnalysis);
      console.log('🔍 AI Store - aiAnalysis length:', response?.aiAnalysis?.length);
      console.log('🔍 AI Store - aiAnalysis is empty string:', response?.aiAnalysis === '');
      console.log('🔍 AI Store - aiAnalysis trim length:', response?.aiAnalysis?.trim()?.length);
      
      // Check for alternative field names
      if (response) {
        console.log('🔍 AI Store - All response fields:');
        Object.entries(response).forEach(([key, value]) => {
          console.log(`  ${key}:`, value, `(type: ${typeof value})`);
        });
      }
      
      // Check if we have a valid response with AI analysis
      const aiAnalysisField = response?.aiAnalysis;
      const hasValidAnalysis = response && 
        aiAnalysisField && 
        typeof aiAnalysisField === 'string' && 
        aiAnalysisField.trim().length > 0;
      
      console.log('🔍 AI Store - AI Analysis field found:', aiAnalysisField);
      console.log('🔍 AI Store - Has valid analysis:', hasValidAnalysis);
      
      if (hasValidAnalysis) {
        // Parse the AI analysis if it exists
        let parsedAnalysis = null;
        try {
          if (aiAnalysisField) {
            parsedAnalysis = JSON.parse(aiAnalysisField);
          }
        } catch (parseError) {
          console.error('Failed to parse AI analysis:', parseError);
        }
        
        set({
          preferences: response.preferences || initialPreferences,
          aiAnalysis: aiAnalysisField,
          parsedAnalysis: parsedAnalysis,
          hasExistingAnalysis: true
        });
      } else {
        set({
          preferences: initialPreferences,
          aiAnalysis: '',
          parsedAnalysis: null,
          hasExistingAnalysis: false
        });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to check existing analysis',
        preferences: initialPreferences,
        aiAnalysis: '',
        parsedAnalysis: null,
        hasExistingAnalysis: false
      });
    } finally {
      set({ isLoading: false });
    }
  },

  generateAnalysis: async (userId: string, monthlyIncome: number, debts: any[] = [], bankStatements: any[] = [], statementAnalyses: any[] = []) => {
    try {
      set({ isLoading: true, error: null });
      
      const { preferences } = get();
      
      // Use debts passed from the hook
      console.log('🔍 Processing debts for AI analysis...');
      const activeDebts = debts.filter(debt => debt.isActive);
      
      console.log('📊 Active debts found:', activeDebts.length);
      activeDebts.forEach(debt => {
        console.log(`  - ${debt.name}: £${debt.monthlyRepayment}/month (Total: £${debt.totalAmount})`);
      });
      
      // Log bank statement data
      console.log('🏦 Bank statements available:', bankStatements.length);
      bankStatements.forEach(statement => {
        console.log(`  - ${statement.fileName}: ${statement.bank} (${statement.totalTransactions} transactions)`);
      });
      
      // Log statement analyses
      console.log('📊 Statement analyses available:', statementAnalyses.length);
      statementAnalyses.forEach(analysis => {
        console.log(`  - ${analysis.bankName}: Score ${analysis.financialHealth.score}/100, Spending £${analysis.summary.totalSpending}`);
      });
      
      const response = await AIService.generateBudgetAnalysis(preferences, monthlyIncome, activeDebts, bankStatements, statementAnalyses);
      
      if (response.success && response.data) {
        const analysisString = JSON.stringify(response.data);
        set({
          aiAnalysis: analysisString,
          parsedAnalysis: response.data
        });
        
        // Save the generated analysis to Firebase
        console.log('💾 Saving generated analysis to Firebase...');
        let existing = await AIService.getExistingAnalysis(userId);
        
        if (!existing) {
          // Create initial document if it doesn't exist
          console.log('🆕 No existing document found, creating initial preferences document...');
          const docId = await AIService.createInitialPreferences(userId, preferences);
          existing = { id: docId, userId, preferences, aiAnalysis: '', createdAt: '', updatedAt: '' };
        }
        
        if (existing) {
          await AIService.saveGeneratedAnalysis(existing.id, analysisString);
          console.log('✅ Analysis saved to Firebase');
        } else {
          throw new Error('Failed to create or find document for saving analysis');
        }
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
      
      console.log('💾 Updating preferences in AIService...');
      console.log('📊 Preferences to update:', preferences);
      console.log('📄 AI Analysis:', aiAnalysis);
      
      await AIService.updatePreferences(documentId, {
        preferences,
        aiAnalysis,
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Preferences updated successfully');
      
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update preferences' 
      });
    } finally {
      set({ isLoading: false });
    }
  },

  createAutomatedBudget: async (userId: string, monthlyIncome: number) => {
    try {
      set({ isLoading: true, error: null });
      
      // Need preferences and parsedAnalysis to create the budget
      const { preferences, parsedAnalysis } = get();
      
      if (!parsedAnalysis) {
        throw new Error('No AI analysis available. Please complete the questionnaire first.');
      }
      
      console.log('🤖 Creating automated budget from AI analysis...');
      console.log('👤 User ID:', userId);
      console.log('💰 Monthly Income:', monthlyIncome);
      console.log('📊 Preferences:', preferences);
      console.log('📄 Parsed Analysis:', parsedAnalysis);
      
      const result = await AIService.createAutomatedBudget(userId, monthlyIncome, preferences, parsedAnalysis);
      
      if (result.success) {
        console.log('✅ Automated budget created successfully:', result.budgetId);
        return { success: true, budgetId: result.budgetId };
      } else {
        console.error('❌ Failed to create automated budget:', result.error);
        return { success: false, error: result.error || 'Failed to create automated budget' };
      }
      
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create automated budget' };
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
