import { create } from "zustand";
import { persist } from "zustand/middleware";
import { firestoreUtils, COLLECTIONS } from "@/lib/firestore";
import { useFirebaseStore } from "@/lib/store-firebase";
import { db } from "@/lib/firebase"; // Added for test delete operation
import { doc, getDoc, deleteDoc } from "firebase/firestore"; // Added for test delete operation

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
  addStatement: (statement: BankStatement) => Promise<BankStatement>;
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
          
          // Check if statement with same fileName and bank already exists to prevent duplicates
          const existingStatements = await firestoreUtils.getWhere(
            COLLECTIONS.BANK_STATEMENTS,
            'fileName',
            '==',
            statement.fileName
          );
          
          const duplicateExists = existingStatements.some((existing: any) => 
            existing.bank === statement.bank && 
            existing.accountType === statement.accountType
          );
          
          if (duplicateExists) {
            console.warn('⚠️ Duplicate statement detected:', statement.fileName);
            throw new Error('A statement with this filename and bank already exists');
          }
          
          // Save the statement to Firebase and get the Firebase document ID
          const firebaseId = await firestoreUtils.create(COLLECTIONS.BANK_STATEMENTS, {
            ...statement,
            userId: useFirebaseStore.getState().user?.uid || 'unknown'
          });
          
          // Create a new statement object with the Firebase document ID
          const statementWithFirebaseId = {
            ...statement,
            id: firebaseId, // Use the Firebase document ID
            transactions: statement.transactions.map(transaction => ({
              ...transaction,
              statementId: firebaseId // Update transaction statementId with Firebase ID
            }))
          };
          
          // Update local state with the statement that has the correct Firebase ID
          set((state) => ({
            statements: [...state.statements, statementWithFirebaseId],
          }));
          
          console.log('✅ Statement saved successfully to Firebase and local state with ID:', firebaseId);
          return statementWithFirebaseId; // Return the saved statement
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
          console.log('📊 Firebase statement IDs:', statements.map((s: any) => ({ 
            firebaseId: s.id, 
            fileName: s.fileName,
            bank: s.bank 
          })));
          
          // Fix any ID mismatches by ensuring local statements use Firebase IDs
          const fixedStatements = statements.map((firebaseStatement: any) => {
            // Check if we have a local statement with the same fileName and bank
            const localStatement = get().statements.find(s => 
              s.fileName === firebaseStatement.fileName && 
              s.bank === firebaseStatement.bank
            );
            
            if (localStatement && localStatement.id !== firebaseStatement.id) {
              console.log('🔧 Fixing ID mismatch:', {
                fileName: firebaseStatement.fileName,
                oldLocalId: localStatement.id,
                newFirebaseId: firebaseStatement.id
              });
            }
            
            // Always use the Firebase ID
            return {
              ...firebaseStatement,
              id: firebaseStatement.id // Ensure we use the Firebase document ID
            };
          });
          
          // Update local state with corrected IDs
          set({ 
            statements: fixedStatements as BankStatement[],
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
          console.log('🗑️ Starting delete operation for statement ID:', id);
          console.log('🗑️ Current statements in local state:', get().statements.map(s => ({ 
            localId: s.id, 
            fileName: s.fileName,
            bank: s.bank 
          })));
          
          // Find the statement in local state to get more details
          const localStatement = get().statements.find(s => s.id === id);
          if (localStatement) {
            console.log('🗑️ Found local statement:', {
              localId: localStatement.id,
              fileName: localStatement.fileName,
              bank: localStatement.bank
            });
          } else {
            console.warn('⚠️ Statement not found in local state with ID:', id);
          }
          
          // Try to find the statement in Firebase by fileName and bank if the ID doesn't match
          let firebaseId = id;
          if (localStatement) {
            try {
              const firebaseStatements = await firestoreUtils.getWhere(
                COLLECTIONS.BANK_STATEMENTS,
                'fileName',
                '==',
                localStatement.fileName
              );
              
              const matchingFirebaseStatement = firebaseStatements.find((s: any) => 
                s.bank === localStatement.bank && 
                s.accountType === localStatement.accountType
              );
              
              if (matchingFirebaseStatement && (matchingFirebaseStatement as any).id !== id) {
                console.log('🔧 Found Firebase statement with different ID:', {
                  fileName: localStatement.fileName,
                  localId: id,
                  firebaseId: (matchingFirebaseStatement as any).id
                });
                firebaseId = (matchingFirebaseStatement as any).id;
              }
            } catch (searchError) {
              console.warn('⚠️ Could not search Firebase for matching statement:', searchError);
            }
          }
          
          // Verify the statement exists before deletion
          console.log('🔄 About to check if statement exists in Firebase with ID:', firebaseId);
          const existingStatement = await firestoreUtils.get(COLLECTIONS.BANK_STATEMENTS, firebaseId);
          console.log('🔄 Firebase get result:', existingStatement);
          
          if (!existingStatement) {
            console.warn('⚠️ Statement not found in Firebase, may have been already deleted');
            console.warn('⚠️ Attempted to delete ID:', firebaseId);
            
            // Try to get all documents to see what's actually in the collection
            try {
              const allDocs = await firestoreUtils.getAll(COLLECTIONS.BANK_STATEMENTS);
              console.warn('⚠️ All documents in collection:', allDocs.map((doc: any) => ({ 
                id: doc.id, 
                fileName: doc.fileName,
                bank: doc.bank 
              })));
              
              // Check if our target document is actually there
              const targetDoc = allDocs.find((doc: any) => doc.id === firebaseId);
              if (targetDoc) {
                console.error('❌ CONTRADICTION: Document exists in getAll but not in get!');
                console.error('❌ Target document found:', targetDoc);
              } else {
                console.warn('⚠️ Document truly not found in collection');
              }
            } catch (getAllError) {
              console.error('❌ Could not get all documents:', getAllError);
            }
            
            // Still remove from local state if it doesn't exist in Firebase
            set((state) => ({
              statements: state.statements.filter((statement) => statement.id !== id),
            }));
            return;
          }
          
          console.log('🗑️ Found statement in Firebase:', existingStatement);
          console.log('🗑️ Statement details:', {
            id: (existingStatement as any).id,
            fileName: (existingStatement as any).fileName,
            bank: (existingStatement as any).bank,
            userId: (existingStatement as any).userId
          });
          
          // Delete the statement from Firebase
          console.log('🗑️ Attempting to delete from Firebase collection:', COLLECTIONS.BANK_STATEMENTS);
          console.log('🗑️ Using Firebase ID for deletion:', firebaseId);
          
          // Test: Try to get the document reference first
          try {
            const docRef = doc(db, COLLECTIONS.BANK_STATEMENTS, firebaseId);
            console.log('🗑️ Document reference created:', docRef.path);
            
            // Check if document exists before deletion
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              console.log('🗑️ Document confirmed to exist before deletion');
            } else {
              console.warn('⚠️ Document does not exist before deletion attempt');
            }
          } catch (refError) {
            console.warn('⚠️ Could not create document reference:', refError);
          }
          
          // Try the firestoreUtils.delete first
          try {
            await firestoreUtils.delete(COLLECTIONS.BANK_STATEMENTS, firebaseId);
            console.log('✅ firestoreUtils.delete operation completed');
          } catch (utilsDeleteError) {
            console.error('❌ firestoreUtils.delete failed:', utilsDeleteError);
          }
          
          // Test: Try direct Firebase delete as fallback
          try {
            const directDocRef = doc(db, COLLECTIONS.BANK_STATEMENTS, firebaseId);
            await deleteDoc(directDocRef);
            console.log('✅ Direct Firebase delete also completed');
          } catch (directDeleteError) {
            console.warn('⚠️ Direct Firebase delete failed:', directDeleteError);
          }
          
          // Immediately check if the document still exists
          console.log('🔄 Immediately checking if document still exists after deletion...');
          const immediateCheck = await firestoreUtils.get(COLLECTIONS.BANK_STATEMENTS, firebaseId);
          console.log('🔄 Immediate check result:', immediateCheck);
          
          if (immediateCheck) {
            console.warn('⚠️ Document still exists immediately after deletion attempt');
          } else {
            console.log('✅ Document successfully deleted (immediate check)');
          }
          
          // Also delete any associated analysis
          try {
            // Find analyses that reference this statement
            const analyses = await firestoreUtils.getWhere(
              COLLECTIONS.BANK_STATEMENT_ANALYSES,
              'statementId',
              '==',
              firebaseId
            );
            
            console.log('🗑️ Found associated analyses:', analyses.length);
            
            // Delete each associated analysis
            for (const analysis of analyses) {
              console.log('🗑️ Deleting associated analysis:', (analysis as any).id);
              await firestoreUtils.delete(COLLECTIONS.BANK_STATEMENT_ANALYSES, (analysis as any).id);
            }
            
            console.log(`✅ Deleted ${analyses.length} associated analyses`);
          } catch (analysisError) {
            console.warn('⚠️ Could not delete associated analyses:', analysisError);
            // Don't fail the entire deletion if analysis deletion fails
          }
          
          // Verify deletion was successful by checking if it still exists
          console.log('🔄 Verifying deletion...');
          console.log('🔄 Checking collection:', COLLECTIONS.BANK_STATEMENTS);
          console.log('🔄 Checking for document ID:', firebaseId);
          
          const verifyDeletion = await firestoreUtils.get(COLLECTIONS.BANK_STATEMENTS, firebaseId);
          if (verifyDeletion) {
            console.error('❌ VERIFICATION FAILED: Statement still exists in Firebase after deletion attempt');
            console.error('❌ Remaining statement data:', verifyDeletion);
            
            // Try to get all documents in the collection to see what's there
            try {
              const allDocs = await firestoreUtils.getAll(COLLECTIONS.BANK_STATEMENTS);
              console.error('❌ All documents in collection:', allDocs.map((doc: any) => ({ id: doc.id, fileName: doc.fileName })));
            } catch (getAllError) {
              console.error('❌ Could not get all documents:', getAllError);
            }
            
            throw new Error('Statement still exists in Firebase after deletion attempt');
          }
          
          console.log('✅ Verification successful - statement no longer exists in Firebase');
          
          // Update local state only after successful Firebase deletion
          set((state) => ({
            statements: state.statements.filter((statement) => statement.id !== id),
          }));
          
          console.log('✅ Local state updated, remaining statements:', get().statements.length);
          
          // Force a refresh from Firebase to ensure state consistency
          console.log('🔄 Forcing refresh from Firebase...');
          setTimeout(async () => {
            try {
              await get().loadStatements();
              console.log('✅ State refreshed from Firebase after deletion');
            } catch (refreshError) {
              console.warn('⚠️ Could not refresh state after deletion:', refreshError);
            }
          }, 100);
          
          console.log('✅ Statement deleted successfully from Firebase and local state');
        } catch (error) {
          console.error('❌ FAILED TO DELETE STATEMENT:', error);
          console.error('❌ Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : 'No stack trace'
          });
          throw new Error(`Failed to delete statement: ${error instanceof Error ? error.message : 'Unknown error'}`);
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