import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { firestoreUtils, COLLECTIONS } from "./firestore";
import { auth } from "./firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { userService, type UserProfile, type UserStats } from "./user-service";

// Types
export interface Budget {
  id: string;
  userId: string;
  month: string;
  income: number;
  allocations: Allocation[];
  createdAt?: any;
  updatedAt?: any;
}

export interface Allocation {
  category: string;
  amount: number;
}

export interface Debt {
  id: string;
  userId: string;
  name: string;
  totalAmount: number;
  months: number;
  interestRate: number;
  startDate: string;
  debtType: string;
  priority: string;
  notes?: string;
  monthlyRepayment: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  target: number;
  saved: number;
  iconKey: string;
  targetMonth: string; // Format: "YYYY-MM"
  targetYear: number;
  monthlyContribution: number;
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}

interface FirebaseStore {
  // Auth state
  user: User | null;
  userProfile: UserProfile | null;
  userStats: UserStats | null;
  isLoading: boolean;
  
  // Data
  budgets: Budget[];
  debts: Debt[];
  goals: Goal[];
  income: number;
  isEarning: boolean;
  customCategoriesBySection: { [section: string]: string[] };
  
  // Firebase subscriptions
  unsubscribeBudget: (() => void) | null;
  unsubscribeDebts: (() => void) | null;
  unsubscribeGoals: (() => void) | null;
  unsubscribeCustomCategories: (() => void) | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setUserStats: (stats: UserStats | null) => void;
  setIncome: (income: number) => void;
  setIsEarning: (isEarning: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  
  // Budget actions
  addBudget: (budget: Omit<Budget, 'id' | 'userId'>) => Promise<void>;
  updateBudget: (id: string, budget: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  
  // Debt actions
  addDebt: (debt: Omit<Debt, 'id' | 'userId'>) => Promise<void>;
  updateDebt: (id: string, debt: Partial<Debt>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  
  // Goal actions
  addGoal: (goal: Omit<Goal, 'id' | 'userId' | 'saved' | 'targetYear' | 'monthlyContribution' | 'isActive'>) => Promise<void>;
  updateGoal: (id: string, goal: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  
  // Computed values
  getTotalSaved: () => number;
  getTotalMonthlyDebtRepayments: () => number;
  getRepaidAmountForDebt: (debtName: string) => number;
  getBudgetTotal: (allocations: Allocation[]) => number;
  getBudgetRemaining: (allocations: Allocation[], income: number) => number;
  getCustomCategories: (section: string) => string[];
  addCustomCategory: (section: string, name: string) => void;
  getSavedAmountForGoal: (goalTitle: string) => number;
  allocateGoalContributions: (budget: Omit<Budget, 'id' | 'userId'>) => Promise<void>;
  
  // Initialize Firebase listeners
  initializeFirebaseListeners: () => void;
  cleanupFirebaseListeners: () => void;
}

export const useFirebaseStore = create<FirebaseStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      userProfile: null,
      userStats: null,
      isLoading: true,
      budgets: [],
      debts: [],
      goals: [],
      income: 0,
      isEarning: true,
      customCategoriesBySection: {},
      unsubscribeBudget: null,
      unsubscribeDebts: null,
      unsubscribeGoals: null,
      unsubscribeCustomCategories: null,

      // Auth actions
      setUser: (user) => {
        set({ user });
        if (user) {
          get().initializeFirebaseListeners();
        } else {
          get().cleanupFirebaseListeners();
          set({ 
            budgets: [], 
            debts: [], 
            goals: [], 
            userProfile: null, 
            userStats: null,
            customCategoriesBySection: {}
          });
        }
      },

      setUserProfile: (profile) => set({ userProfile: profile }),
      setUserStats: (stats) => set({ userStats: stats }),
      setIncome: (income) => set({ income }),
      setIsEarning: (isEarning: boolean) => set({ isEarning }),
      setIsLoading: (isLoading: boolean) => set({ isLoading }),

      // Budget actions
      addBudget: async (budget) => {
        const { user } = get();
        if (!user) throw new Error("User not authenticated");
        
        const budgetData = {
          ...budget,
          userId: user.uid
        };
        
        await firestoreUtils.create(COLLECTIONS.BUDGETS, budgetData);
      },

      updateBudget: async (id, budget) => {
        await firestoreUtils.update(COLLECTIONS.BUDGETS, id, budget);
      },

      deleteBudget: async (id) => {
        await firestoreUtils.delete(COLLECTIONS.BUDGETS, id);
      },

      // Debt actions
      addDebt: async (debt) => {
        const { user } = get();
        if (!user) throw new Error("User not authenticated");
        
        const debtData = {
          ...debt,
          userId: user.uid
        };
        
        await firestoreUtils.create(COLLECTIONS.DEBTS, debtData);
      },

      updateDebt: async (id, debt) => {
        await firestoreUtils.update(COLLECTIONS.DEBTS, id, debt);
      },

      deleteDebt: async (id) => {
        await firestoreUtils.delete(COLLECTIONS.DEBTS, id);
      },

      // Goal actions
      addGoal: async (goal) => {
        const { user } = get();
        if (!user) throw new Error("User not authenticated");
        
        // Calculate monthly contribution based on target and months remaining
        const targetDate = new Date(goal.targetMonth + "-01");
        const currentDate = new Date();
        const monthsRemaining = Math.max(1, (targetDate.getFullYear() - currentDate.getFullYear()) * 12 + 
          (targetDate.getMonth() - currentDate.getMonth()));
        
        const monthlyContribution = goal.target / monthsRemaining;
        
        const goalData = {
          ...goal,
          userId: user.uid,
          saved: 0,
          targetYear: targetDate.getFullYear(),
          monthlyContribution,
          isActive: true
        };
        
        await firestoreUtils.create(COLLECTIONS.GOALS, goalData);
      },

      updateGoal: async (id, goal) => {
        await firestoreUtils.update(COLLECTIONS.GOALS, id, goal);
      },

      deleteGoal: async (id) => {
        await firestoreUtils.delete(COLLECTIONS.GOALS, id);
      },

      // Computed values
      getTotalSaved: () => {
        const { budgets } = get();
        return budgets.reduce((total, budget) => {
          const savingsAllocations = budget.allocations.filter(
            allocation => 
              allocation.category.toLowerCase().includes('savings') ||
              allocation.category.toLowerCase().includes('emergency') ||
              allocation.category.toLowerCase().includes('investment') ||
              allocation.category.toLowerCase().includes('pension') ||
              allocation.category.toLowerCase().includes('goal')
          );
          return total + savingsAllocations.reduce((sum, alloc) => sum + alloc.amount, 0);
        }, 0);
      },

      getTotalMonthlyDebtRepayments: () => {
        const { debts } = get();
        return debts.reduce((total, debt) => total + debt.monthlyRepayment, 0);
      },

      getRepaidAmountForDebt: (debtName) => {
        const { budgets, debts } = get();
        const debt = debts.find(d => d.name === debtName);
        if (!debt) return 0;

        const startDate = new Date(debt.startDate);
        const totalMonths = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
        
        return Math.min(totalMonths * debt.monthlyRepayment, debt.totalAmount);
      },

      getBudgetTotal: (allocations) => {
        return allocations.reduce((total, allocation) => total + allocation.amount, 0);
      },

      getBudgetRemaining: (allocations, income) => {
        const total = get().getBudgetTotal(allocations);
        return income - total;
      },

      getCustomCategories: (section) => {
        const { customCategoriesBySection } = get();
        return customCategoriesBySection[section] || [];
      },

      addCustomCategory: async (section, name) => {
        const { user, customCategoriesBySection } = get();
        if (!user) throw new Error("User not authenticated");
        
        const existingCategories = customCategoriesBySection[section] || [];
        if (!existingCategories.includes(name)) {
          const newCategories = [...existingCategories, name];
          
          // Update local state
          set({
            customCategoriesBySection: {
              ...customCategoriesBySection,
              [section]: newCategories
            }
          });
          
          // Save to Firebase
          try {
            await firestoreUtils.update(COLLECTIONS.CUSTOM_CATEGORIES, user.uid, {
              categories: {
                ...customCategoriesBySection,
                [section]: newCategories
              }
            });
          } catch (error) {
            // If document doesn't exist, create it
            await firestoreUtils.create(COLLECTIONS.CUSTOM_CATEGORIES, {
              userId: user.uid,
              categories: {
                [section]: newCategories
              }
            });
          }
        }
      },

      getSavedAmountForGoal: (goalTitle) => {
        const { budgets } = get();
        return budgets.reduce((total, budget) => {
          const goalAllocations = budget.allocations.filter(
            allocation => {
              const categoryLower = allocation.category.toLowerCase();
              const goalTitleLower = goalTitle.toLowerCase();
              return categoryLower.includes(goalTitleLower) || 
                     goalTitleLower.includes(categoryLower) ||
                     (goalTitleLower.includes('emergency') && categoryLower.includes('emergency')) ||
                     (goalTitleLower.includes('vacation') && categoryLower.includes('vacation')) ||
                     (goalTitleLower.includes('car') && categoryLower.includes('car')) ||
                     (goalTitleLower.includes('home') && categoryLower.includes('home'));
            }
          );
          return total + goalAllocations.reduce((sum, alloc) => sum + alloc.amount, 0);
        }, 0);
      },

      allocateGoalContributions: async (budget) => {
        const { user, goals } = get();
        if (!user) throw new Error("User not authenticated");
        
        const activeGoals = goals.filter(goal => goal.isActive);
        let updatedAllocations = [...budget.allocations];
        
        // Add goal contributions to allocations
        activeGoals.forEach(goal => {
          const existingAllocation = updatedAllocations.find(alloc => alloc.category === goal.title);
          if (existingAllocation) {
            existingAllocation.amount += goal.monthlyContribution;
          } else {
            updatedAllocations.push({
              category: goal.title,
              amount: goal.monthlyContribution
            });
          }
        });
        
        // Update the budget with new allocations
        const updatedBudget = {
          ...budget,
          allocations: updatedAllocations
        };
        
        // Save to Firebase
        await firestoreUtils.create(COLLECTIONS.BUDGETS, {
          ...updatedBudget,
          userId: user.uid
        });
      },

      // Firebase listeners
      initializeFirebaseListeners: () => {
        const { user } = get();
        if (!user) return;

        // Cleanup existing listeners
        get().cleanupFirebaseListeners();

        // Load user profile and stats
        const loadUserData = async () => {
          try {
            const [profile, stats] = await Promise.all([
              userService.getUserProfile(user.uid),
              userService.getUserStats(user.uid)
            ]);
            
            set({ userProfile: profile, userStats: stats });
          } catch (error) {
            console.error('Error loading user data:', error);
          }
        };

        loadUserData();

        // Subscribe to budgets
        const unsubscribeBudget = firestoreUtils.subscribe<Budget>(
          COLLECTIONS.BUDGETS,
          (budgets) => set({ budgets }),
          user.uid
        );

        // Subscribe to debts
        const unsubscribeDebts = firestoreUtils.subscribe<Debt>(
          COLLECTIONS.DEBTS,
          (debts) => set({ debts }),
          user.uid
        );

        // Subscribe to goals
        const unsubscribeGoals = firestoreUtils.subscribe<Goal>(
          COLLECTIONS.GOALS,
          (goals) => set({ goals }),
          user.uid
        );

        // Subscribe to custom categories
        const unsubscribeCustomCategories = firestoreUtils.subscribe<{categories: {[section: string]: string[]}}>(
          COLLECTIONS.CUSTOM_CATEGORIES,
          (customCategoriesDocs) => {
            if (customCategoriesDocs.length > 0) {
              set({ customCategoriesBySection: customCategoriesDocs[0].categories || {} });
            }
          },
          user.uid
        );

        set({
          unsubscribeBudget,
          unsubscribeDebts,
          unsubscribeGoals,
          unsubscribeCustomCategories
        });
      },

      cleanupFirebaseListeners: () => {
        const { unsubscribeBudget, unsubscribeDebts, unsubscribeGoals, unsubscribeCustomCategories } = get();
        
        if (unsubscribeBudget) unsubscribeBudget();
        if (unsubscribeDebts) unsubscribeDebts();
        if (unsubscribeGoals) unsubscribeGoals();
        if (unsubscribeCustomCategories) unsubscribeCustomCategories();
        
        set({
          unsubscribeBudget: null,
          unsubscribeDebts: null,
          unsubscribeGoals: null,
          unsubscribeCustomCategories: null
        });
      }
    }),
    {
      name: "firebase-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        income: state.income,
        user: state.user
      })
    }
  )
);

// Initialize auth listener only on client side
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, (user) => {
    useFirebaseStore.getState().setUser(user);
    useFirebaseStore.getState().setIsLoading(false);
  });
} 