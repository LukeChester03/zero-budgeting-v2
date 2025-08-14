import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BankStatementAnalysis, OverallAnalysis } from "@/lib/types/ai";
import { firestoreUtils, COLLECTIONS } from "@/lib/firestore";
import { useFirebaseStore } from "@/lib/store-firebase";
import { bankStatementAnalysis } from "@/lib/services/ai-budget-integration";

interface BankStatementAnalysisStore {
  // State
  statementAnalyses: BankStatementAnalysis[];
  overallAnalysis: OverallAnalysis | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addStatementAnalysis: (analysis: Omit<BankStatementAnalysis, 'id'>) => Promise<string>;
  updateStatementAnalysis: (id: string, analysis: Partial<BankStatementAnalysis>) => Promise<void>;
  deleteStatementAnalysis: (id: string) => Promise<void>;
  getStatementAnalysis: (statementId: string) => BankStatementAnalysis | null;
  
  setOverallAnalysis: (analysis: OverallAnalysis | null) => void;
  clearOverallAnalysis: () => void;
  generateOverallAnalysis: () => Promise<void>;
  
  // Computed values
  getLatestAnalysis: () => BankStatementAnalysis | null;
  getAnalysesByDateRange: (startDate: string, endDate: string) => BankStatementAnalysis[];
  getAnalysesByCategory: (category: string) => BankStatementAnalysis[];
  
  // Firebase operations
  loadAnalyses: () => Promise<void>;
  saveOverallAnalysis: (analysis: OverallAnalysis) => Promise<void>;
}

export const useBankStatementAnalysisStore = create<BankStatementAnalysisStore>()(
  persist(
    (set, get) => ({
      // Initial state
      statementAnalyses: [],
      overallAnalysis: null,
      isLoading: false,
      error: null,

      // Add new statement analysis
      addStatementAnalysis: async (analysis) => {
        try {
          set({ isLoading: true, error: null });
          
          const user = useFirebaseStore.getState().user;
          if (!user) throw new Error("User not authenticated");
          
          const analysisData = {
            ...analysis,
            userId: user.uid,
            analysisDate: new Date().toISOString(),
          };
          
          console.log('💾 Creating analysis in Firebase:', analysisData);
          const id = await firestoreUtils.create(COLLECTIONS.BANK_STATEMENT_ANALYSES, analysisData);
          console.log('✅ Analysis created with ID:', id);
          
          // Update local state
          const newAnalysis = { ...analysisData, id };
          set((state) => ({
            statementAnalyses: [...state.statementAnalyses, newAnalysis],
            isLoading: false
          }));
          
          console.log('✅ Local state updated with new analysis');
          return id;
        } catch (error) {
          console.error('❌ Error adding analysis:', error);
          set({ 
            error: error instanceof Error ? error.message : "Failed to add analysis",
            isLoading: false 
          });
          throw error;
        }
      },

      // Update existing analysis
      updateStatementAnalysis: async (id, analysis) => {
        try {
          set({ isLoading: true, error: null });
          
          await firestoreUtils.update(COLLECTIONS.BANK_STATEMENT_ANALYSES, id, analysis);
          
          // Update local state
          set((state) => ({
            statementAnalyses: state.statementAnalyses.map(a => 
              a.id === id ? { ...a, ...analysis } : a
            ),
            isLoading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to update analysis",
            isLoading: false 
          });
          throw error;
        }
      },

      // Delete analysis
      deleteStatementAnalysis: async (id) => {
        try {
          set({ isLoading: true, error: null });
          
          await firestoreUtils.delete(COLLECTIONS.BANK_STATEMENT_ANALYSES, id);
          
          // Update local state
          set((state) => ({
            statementAnalyses: state.statementAnalyses.filter(a => a.id !== id),
            isLoading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to delete analysis",
            isLoading: false 
          });
          throw error;
        }
      },

      // Get analysis by statement ID
      getStatementAnalysis: (statementId) => {
        const { statementAnalyses } = get();
        return statementAnalyses.find(a => a.statementId === statementId) || null;
      },

      // Set overall analysis
      setOverallAnalysis: (analysis) => {
        set({ overallAnalysis: analysis });
      },

      // Clear overall analysis
      clearOverallAnalysis: () => {
        set({ overallAnalysis: null });
      },

      // Generate overall analysis
      generateOverallAnalysis: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const user = useFirebaseStore.getState().user;
          if (!user) throw new Error("User not authenticated");
          
          const { statementAnalyses } = get();
          
          if (statementAnalyses.length === 0) {
            throw new Error("No bank statements available for analysis. Please upload at least one statement first.");
          }
          
          // Get user's monthly income from Firebase
          const monthlyIncome = useFirebaseStore.getState().income;
          
          // Call the real AI service to generate overall analysis
          const overallAnalysis = await bankStatementAnalysis.generateOverallAnalysis(statementAnalyses, user.uid);
          
          // Enhance the analysis with income data
          if (monthlyIncome > 0) {
            overallAnalysis.totalIncome = monthlyIncome;
            
            // Update spending trends with income data
            overallAnalysis.spendingTrends = overallAnalysis.spendingTrends.map(trend => ({
              ...trend,
              monthlyIncome,
              percentageOfIncome: trend.spending > 0 ? (trend.spending / monthlyIncome) * 100 : 0,
              savingsRate: monthlyIncome > 0 ? ((monthlyIncome - trend.spending) / monthlyIncome) * 100 : 0
            }));
          }
          
          // Save to Firebase
          const savedAnalysis = await firestoreUtils.create(COLLECTIONS.OVERALL_ANALYSES, {
            ...overallAnalysis,
            userId: user.uid
          });
          
          // Update the overallAnalysis with the saved ID
          const finalAnalysis = { ...overallAnalysis, id: savedAnalysis };
          
          // Update local state
          set({ overallAnalysis: finalAnalysis, isLoading: false });
          
          console.log('✅ Overall analysis generated and saved successfully');
          
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to generate overall analysis",
            isLoading: false 
          });
          throw error;
        }
      },

      // Get latest analysis
      getLatestAnalysis: () => {
        const { statementAnalyses } = get();
        if (statementAnalyses.length === 0) return null;
        
        return statementAnalyses.sort((a, b) => 
          new Date(b.analysisDate).getTime() - new Date(a.analysisDate).getTime()
        )[0];
      },

      // Get analyses by date range
      getAnalysesByDateRange: (startDate, endDate) => {
        const { statementAnalyses } = get();
        return statementAnalyses.filter(analysis => 
          analysis.analysisDate >= startDate && analysis.analysisDate <= endDate
        );
      },

      // Get analyses by category
      getAnalysesByCategory: (category) => {
        const { statementAnalyses } = get();
        return statementAnalyses.filter(analysis =>
          analysis.categoryBreakdown.some(cat => cat.category === category)
        );
      },

      // Load analyses from Firebase
      loadAnalyses: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const user = useFirebaseStore.getState().user;
          if (!user) {
            console.log('❌ No user found, cannot load analyses');
            return;
          }
          
          console.log('🔄 Loading analyses for user:', user.uid);
          
          // Load statement analyses
          const analyses = await firestoreUtils.getWhere<BankStatementAnalysis>(
            COLLECTIONS.BANK_STATEMENT_ANALYSES,
            'userId',
            '==',
            user.uid
          );
          
          console.log('📊 Loaded statement analyses:', analyses.length);
          
          // Load overall analysis
          const overallAnalyses = await firestoreUtils.getWhere<OverallAnalysis>(
            COLLECTIONS.OVERALL_ANALYSES,
            'userId',
            '==',
            user.uid
          );
          
          console.log('📊 Loaded overall analyses:', overallAnalyses.length);
          
          set({
            statementAnalyses: analyses,
            overallAnalysis: overallAnalyses[0] || null,
            isLoading: false
          });
          
          console.log('✅ Analyses loaded successfully');
        } catch (error) {
          console.error('❌ Error loading analyses:', error);
          set({ 
            error: error instanceof Error ? error.message : "Failed to load analyses",
            isLoading: false 
          });
        }
      },

      // Save overall analysis to Firebase
      saveOverallAnalysis: async (analysis) => {
        try {
          set({ isLoading: true, error: null });
          
          const user = useFirebaseStore.getState().user;
          if (!user) throw new Error("User not authenticated");
          
          if (analysis.id && analysis.id !== 'overall-analysis-id') {
            // Update existing
            await firestoreUtils.update(COLLECTIONS.OVERALL_ANALYSES, analysis.id, analysis);
          } else {
            // Create new
            const id = await firestoreUtils.create(COLLECTIONS.OVERALL_ANALYSES, {
              ...analysis,
              userId: user.uid
            });
            analysis.id = id;
          }
          
          set({ overallAnalysis: analysis, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to save overall analysis",
            isLoading: false 
          });
          throw error;
        }
      }
    }),
    {
      name: "bank-statement-analysis-storage",
      partialize: (state) => ({
        statementAnalyses: state.statementAnalyses,
        overallAnalysis: state.overallAnalysis
      })
    }
  )
);
