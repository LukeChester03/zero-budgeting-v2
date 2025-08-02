import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  addStatement: (statement: BankStatement) => void;
  deleteStatement: (id: string) => void;
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

      addStatement: (statement: BankStatement) =>
        set((state) => ({
          statements: [...state.statements, statement],
        })),

      deleteStatement: (id: string) =>
        set((state) => ({
          statements: state.statements.filter((statement) => statement.id !== id),
        })),

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