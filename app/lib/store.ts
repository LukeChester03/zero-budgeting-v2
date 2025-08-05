import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";

export type CategoryAllocation = {
  category: string;
  amount: number;
};

export interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  months: number;
  monthlyRepayment: number;
  interestRate: number;
  startDate: string;
  debtType: "credit-card" | "personal-loan" | "mortgage" | "car-loan" | "student-loan" | "other";
  priority: "high" | "medium" | "low";
  notes?: string;
}

export interface Goal {
  id: string;
  title: string;
  saved: number;
  target: number;
  iconKey: "emergency" | "vacation" | "car" | "home" | "piggy";
}

export type BudgetEntry = {
  id: string;
  month: string;
  income: number;
  allocations: CategoryAllocation[];
};

interface BudgetState {
  budgets: BudgetEntry[];
  income: number;
  customCategoriesBySection: { [section: string]: string[] };
  incomeLocked: boolean;
  debts: Debt[];
  goals: Goal[];

  deleteBudget: (id: string) => void;
  addBudget: (entry: BudgetEntry) => void;
  updateIncome: (amount: number) => void;
  getBudgetTotal: (allocations: CategoryAllocation[]) => number;
  getBudgetRemaining: (allocations: CategoryAllocation[], income: number) => number;
  getTotalSaved: () => number;
  setIncomeLocked: (locked: boolean) => void;
  addCustomCategory: (section: string, name: string) => void;
  getCustomCategories: (section: string) => string[];
  addDebt: (debt: Omit<Debt, "id" | "monthlyRepayment">) => void;
  updateDebt: (id: string, data: Partial<Omit<Debt, "id" | "monthlyRepayment">>) => void;
  removeDebt: (id: string) => void;
  getTotalMonthlyDebtRepayments: () => number;
  getRepaidAmountForDebt: (debtName: string) => number;
  addGoal: (goal: Omit<Goal, "id" | "saved">) => void;
  updateGoal: (id: string, data: Partial<Omit<Goal, "id">>) => void;
  deleteGoal: (id: string) => void;
  getSavedAmountForGoal: (goalTitle: string) => number;
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      budgets: [],
      income: 0,
      customCategoriesBySection: {},
      incomeLocked: false,
      debts: [],
      goals: [],

      setIncomeLocked: (locked) => set({ incomeLocked: locked }),

      addBudget: (entry) => {
        console.log("Adding budget:", entry);
        set((state) => ({
          budgets: [...state.budgets, entry],
        }));
      },

      updateIncome: (amount) => set(() => ({ income: amount })),

      deleteBudget: (id: string) =>
        set((state) => ({
          budgets: state.budgets.filter((b) => b.id !== id),
        })),

      getBudgetTotal: (allocs) => allocs.reduce((s, a) => s + a.amount, 0),

      getBudgetRemaining: (allocs, income) => {
        const total = get().getBudgetTotal(allocs);
        return income - total;
      },

      getTotalSaved: () => {
        const budgets = get().budgets;
        const savingsCategories = ["Emergency Fund", "Safety Net", "Foundation", "Investments", "Pension"];
        
        return budgets.reduce((sum, budget) => {
          const savingsAmount = budget.allocations
            .filter(alloc => savingsCategories.includes(alloc.category))
            .reduce((total, alloc) => total + alloc.amount, 0);
          return sum + savingsAmount;
        }, 0);
      },

      addCustomCategory: (section, name) =>
        set((state) => {
          const current = state.customCategoriesBySection[section] || [];
          if (current.includes(name)) return state;
          return {
            customCategoriesBySection: {
              ...state.customCategoriesBySection,
              [section]: [...current, name],
            },
          };
        }),

      getCustomCategories: (section) => get().customCategoriesBySection[section] || [],

      addDebt: (debt) =>
        set((state) => {
          const monthlyRepayment = debt.months > 0 ? debt.totalAmount / debt.months : 0;
          return {
            debts: [...state.debts, { 
              id: uuidv4(), 
              monthlyRepayment,
              ...debt 
            }],
          };
        }),

      updateDebt: (id, data) =>
        set((state) => {
          const debts = state.debts.map((d) => {
            if (d.id === id) {
              const updated = { ...d, ...data };
              const months = data.months ?? d.months;
              const totalAmount = data.totalAmount ?? d.totalAmount;
              updated.monthlyRepayment = months > 0 ? totalAmount / months : 0;
              return updated;
            }
            return d;
          });
          return { debts };
        }),

      removeDebt: (id) => set((state) => ({ debts: state.debts.filter((d) => d.id !== id) })),

      getTotalMonthlyDebtRepayments: () =>
        get().debts.reduce((sum, debt) => sum + debt.monthlyRepayment, 0),

      getRepaidAmountForDebt: (debtName: string) => {
        const budgets = get().budgets;
        let totalRepaid = 0;
        const target = debtName.trim().toLowerCase();

        budgets.forEach((budget) => {
          budget.allocations.forEach((alloc) => {
            if (alloc.category.trim().toLowerCase() === target) {
              totalRepaid += alloc.amount;
            }
          });
        });

        return totalRepaid;
      },

      addGoal: (goal) =>
        set((state) => ({
          goals: [...state.goals, { id: crypto.randomUUID(), saved: 0, ...goal }],
        })),

      updateGoal: (id, data) =>
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? { ...g, ...data } : g)),
        })),

      deleteGoal: (id) =>
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        })),

      getSavedAmountForGoal: (goalTitle: string) => {
        const budgets = get().budgets;
        let totalSaved = 0;
        const target = goalTitle.trim().toLowerCase();

        budgets.forEach((budget) => {
          budget.allocations.forEach((alloc) => {
            if (alloc.category.trim().toLowerCase() === target) {
              totalSaved += alloc.amount;
            }
          });
        });

        return totalSaved;
      },
    }),
    {
      name: "budget-storage",
    }
  )
);
