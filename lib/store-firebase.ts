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
  overBudgetReason?: string;
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
  endDate?: string; // Optional end date for debt repayment
  isActive: boolean;
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

export interface BudgetTemplate {
  id: string;
  userId: string;
  title: string;
  categories: string[];
  sections?: { title: string; categories: string[] }[];
  isDefault: boolean;
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
  budgetTemplates: BudgetTemplate[];
  income: number;
  isEarning: boolean;
  customCategoriesBySection: { [section: string]: string[] };
  
  // Firebase subscriptions
  unsubscribeBudget: (() => void) | null;
  unsubscribeDebts: (() => void) | null;
  unsubscribeGoals: (() => void) | null;
  unsubscribeCustomCategories: (() => void) | null;
  unsubscribeBudgetTemplates: (() => void) | null;
  
  // Actions
  setUser: (user: User | null) => Promise<void>;
  setUserProfile: (profile: UserProfile | null) => void;
  setUserStats: (stats: UserStats | null) => void;
  setIncome: (income: number) => void;
  setIsEarning: (isEarning: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  saveIncome: (income: number, isEarning: boolean) => Promise<void>;
  
  // Budget actions
  addBudget: (budget: Omit<Budget, 'id' | 'userId'>) => Promise<{ id: string }>;
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
  
  // Budget Template actions
  addBudgetTemplate: (template: Omit<BudgetTemplate, 'id' | 'userId'>) => Promise<void>;
  updateBudgetTemplate: (id: string, template: Partial<BudgetTemplate>) => Promise<void>;
  deleteBudgetTemplate: (id: string) => Promise<void>;
  getBudgetTemplates: () => BudgetTemplate[];
  
  // Computed values
  getTotalSaved: () => number;
  getTotalMonthlyDebtRepayments: () => number;
  getRepaidAmountForDebt: (debtName: string) => number;
  getBudgetTotal: (allocations: Allocation[]) => number;
  getBudgetRemaining: (allocations: Allocation[], income: number) => number;
  getCustomCategories: (section: string) => string[];
  addCustomCategory: (section: string, name: string) => Promise<void>;
  removeCustomCategory: (section: string, name: string) => Promise<void>;
  getSavedAmountForGoal: (goalTitle: string) => number;
  allocateGoalContributions: (budget: Omit<Budget, 'id' | 'userId'>) => Promise<void>;
  allocateDebtPayments: (budget: Omit<Budget, 'id' | 'userId'>) => Promise<void>;
  
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
      budgetTemplates: [],
      income: 0,
      isEarning: true,
      customCategoriesBySection: {},
      unsubscribeBudget: null,
      unsubscribeDebts: null,
      unsubscribeGoals: null,
      unsubscribeCustomCategories: null,
      unsubscribeBudgetTemplates: null,

      // Auth actions
      setUser: async (user) => {
        set({ user });
        if (user) {
          try {
            console.log('Loading user profile for:', user.uid);
            
            // Always ensure user profile exists in database
            let userProfile = await userService.getUserProfile(user.uid);
            
            if (!userProfile) {
              console.log('No user profile found, creating one...');
              // User exists in Firebase Auth but not in database, create profile
              try {
                await userService.createUserProfile(user);
                console.log('User profile created for existing Firebase user');
                // Get the newly created profile
                userProfile = await userService.getUserProfile(user.uid);
              } catch (createError) {
                console.error('Error creating user profile for existing user:', createError);
              }
            }
            
            if (userProfile) {
              console.log('User profile loaded:', userProfile);
              const income = userProfile.monthlyIncome || 0;
              const isEarning = userProfile.isEarning !== false; // Default to true unless explicitly false
              
              console.log('Setting income from profile:', { income, isEarning });
              set({ 
                income,
                isEarning
              });
            } else {
              console.log('Using default values for user');
              set({ 
                income: 0,
                isEarning: true
              });
            }
            
            // Ensure default budget templates exist
            try {
              await userService.initializeDefaultBudgetTemplates(user.uid);
              console.log('Default budget templates ensured for user:', user.uid);
            } catch (templateError) {
              console.error('Error ensuring default budget templates:', templateError);
            }
            
            // Initialize Firebase listeners immediately
            console.log('Initializing Firebase listeners for user:', user.uid);
            get().initializeFirebaseListeners();
          } catch (error) {
            console.error('Error loading user profile:', error);
            // Still initialize listeners even if profile loading fails
            console.log('Initializing Firebase listeners after profile load error');
            get().initializeFirebaseListeners();
          }
        } else {
          console.log('User logged out, cleaning up');
          get().cleanupFirebaseListeners();
          set({ 
            budgets: [], 
            debts: [], 
            goals: [], 
            userProfile: null, 
            userStats: null,
            customCategoriesBySection: {},
            income: 0, // Reset income to 0 when user is not authenticated
            isEarning: true
          });
        }
      },

      setUserProfile: (profile) => set({ userProfile: profile }),
      setUserStats: (stats) => set({ userStats: stats }),
      setIncome: (income) => set({ income }),
      setIsEarning: (isEarning: boolean) => set({ isEarning }),
      setIsLoading: (isLoading: boolean) => set({ isLoading }),
      
      saveIncome: async (income, isEarning) => {
        const { user } = get();
        if (!user) {
          throw new Error("User not authenticated");
        }
        
        console.log('saveIncome called with:', { income, isEarning, userId: user.uid });
        
        try {
          // Update the store first
          set({ income, isEarning });
          console.log('Store updated with income:', { income, isEarning });
          
          // Save to user profile in Firestore
          console.log('Attempting to update user profile in Firestore...');
          await userService.updateUserProfile(user.uid, { 
            monthlyIncome: income,
            isEarning: isEarning 
          });
          
          console.log('Income saved successfully to Firestore:', { income, isEarning });
        } catch (error) {
          console.error('Error saving income:', error);
          // Revert store changes on error
          set({ income: get().income, isEarning: get().isEarning });
          throw error;
        }
      },

      // Budget actions
      addBudget: async (budget) => {
        const { user } = get();
        if (!user) throw new Error("User not authenticated");
        
        const budgetData = {
          ...budget,
          userId: user.uid
        };
        
        const budgetId = await firestoreUtils.create(COLLECTIONS.BUDGETS, budgetData);
        return { id: budgetId };
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
          userId: user.uid,
          isActive: true
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

      // Budget Template actions
      addBudgetTemplate: async (template) => {
        const { user } = get();
        if (!user) throw new Error("User not authenticated");

        const templateData = {
          ...template,
          userId: user.uid
        };

        await firestoreUtils.create(COLLECTIONS.BUDGET_TEMPLATES, templateData);
      },

      updateBudgetTemplate: async (id, template) => {
        await firestoreUtils.update(COLLECTIONS.BUDGET_TEMPLATES, id, template);
      },

      deleteBudgetTemplate: async (id) => {
        await firestoreUtils.delete(COLLECTIONS.BUDGET_TEMPLATES, id);
      },

      getBudgetTemplates: () => {
        return get().budgetTemplates;
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

        // Calculate repaid amount based on budget allocations
        const totalRepaid = budgets.reduce((total, budget) => {
          const debtAllocation = budget.allocations.find(alloc => alloc.category === debtName);
          return total + (debtAllocation?.amount || 0);
        }, 0);

        return Math.min(totalRepaid, debt.totalAmount);
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
        const { user, customCategoriesBySection, budgetTemplates } = get();
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
          
          // Save to Firebase custom categories
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
          
          // Update budget template for this section
          const existingTemplate = budgetTemplates.find(t => t.title === section);
          if (existingTemplate) {
            // Update existing template
            await firestoreUtils.update(COLLECTIONS.BUDGET_TEMPLATES, existingTemplate.id, {
              categories: [...existingTemplate.categories, name]
            });
          } else {
            // Create new template for this section
            await firestoreUtils.create(COLLECTIONS.BUDGET_TEMPLATES, {
              userId: user.uid,
              title: section,
              categories: [name],
              isDefault: false
            });
          }
        }
      },

      removeCustomCategory: async (section, name) => {
        const { user, customCategoriesBySection, budgetTemplates } = get();
        if (!user) throw new Error("User not authenticated");
        
        const existingCategories = customCategoriesBySection[section] || [];
        const updatedCategories = existingCategories.filter(cat => cat !== name);
        
        // Update local state
        set({
          customCategoriesBySection: {
            ...customCategoriesBySection,
            [section]: updatedCategories
          }
        });
        
        // Save to Firebase custom categories
        try {
          await firestoreUtils.update(COLLECTIONS.CUSTOM_CATEGORIES, user.uid, {
            categories: {
              ...customCategoriesBySection,
              [section]: updatedCategories
            }
          });
        } catch (error) {
          console.error('Error removing custom category:', error);
          throw error;
        }
        
        // Update budget template for this section
        const existingTemplate = budgetTemplates.find(t => t.title === section);
        if (existingTemplate) {
          const updatedTemplateCategories = existingTemplate.categories.filter(cat => cat !== name);
          await firestoreUtils.update(COLLECTIONS.BUDGET_TEMPLATES, existingTemplate.id, {
            categories: updatedTemplateCategories
          });
        }
      },

      getSavedAmountForGoal: (goalTitle) => {
        const { budgets } = get();
        return budgets.reduce((total, budget) => {
          // Look for exact matches first
          const exactMatch = budget.allocations.find(
            allocation => allocation.category === goalTitle
          );
          
          if (exactMatch) {
            return total + exactMatch.amount;
          }
          
          // If no exact match, look for partial matches
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

      allocateDebtPayments: async (budget) => {
        const { user, debts } = get();
        if (!user) throw new Error("User not authenticated");
        
        const activeDebts = debts.filter(debt => debt.isActive);
        let updatedAllocations = [...budget.allocations];
        
        // Add debt payments to allocations
        activeDebts.forEach(debt => {
          const existingAllocation = updatedAllocations.find(alloc => alloc.category === debt.name);
          if (existingAllocation) {
            existingAllocation.amount += debt.monthlyRepayment;
          } else {
            updatedAllocations.push({
              category: debt.name,
              amount: debt.monthlyRepayment
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

        // Subscribe to budget templates
        const unsubscribeBudgetTemplates = firestoreUtils.subscribe<BudgetTemplate>(
          COLLECTIONS.BUDGET_TEMPLATES,
          (templates) => set({ budgetTemplates: templates }),
          user.uid
        );

        set({
          unsubscribeBudget,
          unsubscribeDebts,
          unsubscribeGoals,
          unsubscribeCustomCategories,
          unsubscribeBudgetTemplates
        });
      },

      cleanupFirebaseListeners: () => {
        const { unsubscribeBudget, unsubscribeDebts, unsubscribeGoals, unsubscribeCustomCategories, unsubscribeBudgetTemplates } = get();
        
        if (unsubscribeBudget) unsubscribeBudget();
        if (unsubscribeDebts) unsubscribeDebts();
        if (unsubscribeGoals) unsubscribeGoals();
        if (unsubscribeCustomCategories) unsubscribeCustomCategories();
        if (unsubscribeBudgetTemplates) unsubscribeBudgetTemplates();
        
        set({
          unsubscribeBudget: null,
          unsubscribeDebts: null,
          unsubscribeGoals: null,
          unsubscribeCustomCategories: null,
          unsubscribeBudgetTemplates: null
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
  onAuthStateChanged(auth, async (user) => {
    await useFirebaseStore.getState().setUser(user);
    useFirebaseStore.getState().setIsLoading(false);
  });
} 