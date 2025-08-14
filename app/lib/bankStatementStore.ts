import { create } from "zustand";
import { persist } from "zustand/middleware";
import { firestoreUtils, COLLECTIONS } from "@/lib/firestore";
import { useFirebaseStore } from "@/lib/store-firebase";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "debit" | "credit";
  category: string;
  bank: string;
  accountType: string;
  statementId: string;
}

export interface BankStatement {
  id: string;
  fileName: string;
  bank: string;
  accountType: string;
  uploadDate: string;
  startDate: string;
  endDate: string;
  totalTransactions: number;
  totalDebits: number;
  totalCredits: number;
  transactions: Transaction[];
}

interface BankStatementStore {
  statements: BankStatement[];
  isLoading: boolean;
  addStatement: (statement: BankStatement) => Promise<void>;
  deleteStatement: (id: string) => Promise<void>;
  loadStatements: () => Promise<void>;
  updateTransactionCategory: (transactionId: string, category: string) => void;
  getTransactionsByDateRange: (startDate: string, endDate: string) => Transaction[];
  getTransactionsByCategory: (category: string) => Transaction[];
  getTotalSpendingByCategory: (category: string, startDate?: string, endDate?: string) => number;
  getMonthlySpending: (year: number, month: number) => number;
  getSpendingByVendor: (vendor: string) => number;
  getUncategorizedTransactions: () => Transaction[];
  getCategorySuggestions: (description: string) => string[];
}

export const useBankStatementStore = create<BankStatementStore>()(
  persist(
    (set, get) => ({
      statements: [],
      isLoading: false,

      addStatement: async (statement: BankStatement) => {
        try {
          console.log('💾 Saving statement to Firebase:', statement.id);
          
          // Save the statement to Firebase
          await firestoreUtils.create(COLLECTIONS.BANK_STATEMENTS, {
            ...statement,
            userId: useFirebaseStore.getState().user?.uid || 'unknown'
          });
          
          // Update local state
          set((state) => ({
            statements: [...state.statements, statement],
          }));
          
          console.log('✅ Statement saved successfully to Firebase and local state');
        } catch (error) {
          console.error('❌ Failed to save statement to Firebase:', error);
          throw new Error('Failed to save statement');
        }
      },

      loadStatements: async () => {
        try {
          set({ isLoading: true });
          console.log('📥 Loading statements from Firebase...');
          
          const userId = useFirebaseStore.getState().user?.uid;
          if (!userId) {
            console.warn('⚠️ No user ID available, skipping Firebase load');
            set({ isLoading: false });
            return;
          }
          
          // Load statements from Firebase
          const statements = await firestoreUtils.getWhere(
            COLLECTIONS.BANK_STATEMENTS,
            'userId',
            '==',
            userId
          );
          
          console.log(`✅ Loaded ${statements.length} statements from Firebase`);
          
          // Update local state
          set({ 
            statements: statements as BankStatement[],
            isLoading: false 
          });
        } catch (error) {
          console.error('❌ Failed to load statements from Firebase:', error);
          set({ isLoading: false });
          throw new Error('Failed to load statements');
        }
      },

      deleteStatement: async (id: string) => {
        try {
          console.log('🗑️ Deleting statement from Firebase:', id);
          
          // Delete the statement from Firebase
          await firestoreUtils.delete(COLLECTIONS.BANK_STATEMENTS, id);
          
          // Also delete any associated analysis
          try {
            // Find analyses that reference this statement
            const analyses = await firestoreUtils.getWhere(
              COLLECTIONS.BANK_STATEMENT_ANALYSES,
              'statementId',
              '==',
              id
            );
            
            // Delete each associated analysis
            for (const analysis of analyses) {
              console.log('🗑️ Deleting associated analysis:', analysis.id);
              await firestoreUtils.delete(COLLECTIONS.BANK_STATEMENT_ANALYSES, analysis.id);
            }
            
            console.log(`✅ Deleted ${analyses.length} associated analyses`);
          } catch (analysisError) {
            console.warn('⚠️ Could not delete associated analyses:', analysisError);
          }
          
          // Update local state
          set((state) => ({
            statements: state.statements.filter((statement) => statement.id !== id),
          }));
          
          console.log('✅ Statement deleted successfully from Firebase and local state');
        } catch (error) {
          console.error('❌ Failed to delete statement from Firebase:', error);
          throw new Error('Failed to delete statement');
        }
      },

      updateTransactionCategory: (transactionId: string, category: string) =>
        set((state) => ({
          statements: state.statements.map((statement) => ({
            ...statement,
            transactions: statement.transactions.map((transaction) =>
              transaction.id === transactionId ? { ...transaction, category } : transaction
            ),
          })),
        })),

      getTransactionsByDateRange: (startDate: string, endDate: string) => {
        const { statements } = get();
        return statements.flatMap((statement) =>
          statement.transactions.filter(
            (transaction) => transaction.date >= startDate && transaction.date <= endDate
          )
        );
      },

      getTransactionsByCategory: (category: string) => {
        const { statements } = get();
        return statements.flatMap((statement) =>
          statement.transactions.filter((transaction) => transaction.category === category)
        );
      },

      getTotalSpendingByCategory: (category: string, startDate?: string, endDate?: string) => {
        const { statements } = get();
        let transactions = statements.flatMap((statement) => statement.transactions);

        if (startDate && endDate) {
          transactions = transactions.filter(
            (transaction) => transaction.date >= startDate && transaction.date <= endDate
          );
        }

        return transactions
          .filter((transaction) => transaction.category === category && transaction.type === "debit")
          .reduce((total, transaction) => total + Math.abs(transaction.amount), 0);
      },

      getMonthlySpending: (year: number, month: number) => {
        const { statements } = get();
        const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
        const endDate = `${year}-${month.toString().padStart(2, "0")}-31`;

        return statements
          .flatMap((statement) => statement.transactions)
          .filter(
            (transaction) =>
              transaction.date >= startDate &&
              transaction.date <= endDate &&
              transaction.type === "debit"
          )
          .reduce((total, transaction) => total + Math.abs(transaction.amount), 0);
      },

      getSpendingByVendor: (vendor: string) => {
        const { statements } = get();
        return statements
          .flatMap((statement) => statement.transactions)
          .filter(
            (transaction) =>
              transaction.description.toLowerCase().includes(vendor.toLowerCase()) &&
              transaction.type === "debit"
          )
          .reduce((total, transaction) => total + Math.abs(transaction.amount), 0);
      },

      getUncategorizedTransactions: () => {
        const { statements } = get();
        return statements
          .flatMap((statement) => statement.transactions)
          .filter((transaction) => transaction.category === "Uncategorized");
      },

      getCategorySuggestions: (description: string) => {
        const { statements } = get();
        const allTransactions = statements.flatMap((statement) => statement.transactions);
        
        // Find similar descriptions and return their categories
        const similarTransactions = allTransactions.filter((transaction) =>
          transaction.description.toLowerCase().includes(description.toLowerCase()) ||
          description.toLowerCase().includes(transaction.description.toLowerCase())
        );

        const categoryCounts = similarTransactions.reduce((acc, transaction) => {
          if (transaction.category !== "Uncategorized") {
            acc[transaction.category] = (acc[transaction.category] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        return Object.entries(categoryCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([category]) => category);
      },
    }),
    {
      name: "bank-statement-storage",
    }
  )
); 