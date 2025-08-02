import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
  category: string;
}

export interface Invoice {
  id: string;
  vendor: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  totalAmount: number;
  notes?: string;
  items: InvoiceItem[];
  createdAt: string;
}

interface InvoiceStore {
  invoices: Invoice[];
  addInvoice: (invoice: Invoice) => void;
  deleteInvoice: (id: string) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  getInvoicesByDateRange: (startDate: string, endDate: string) => Invoice[];
  getInvoicesByCategory: (category: string) => Invoice[];
  getTotalSpendingByCategory: (category: string, startDate?: string, endDate?: string) => number;
  getSpendingByVendor: (vendor: string) => number;
  getMonthlySpending: (year: number, month: number) => number;
}

export const useInvoiceStore = create<InvoiceStore>()(
  persist(
    (set, get) => ({
      invoices: [],

      addInvoice: (invoice: Invoice) =>
        set((state) => ({
          invoices: [...state.invoices, invoice],
        })),

      deleteInvoice: (id: string) =>
        set((state) => ({
          invoices: state.invoices.filter((invoice) => invoice.id !== id),
        })),

      updateInvoice: (id: string, updates: Partial<Invoice>) =>
        set((state) => ({
          invoices: state.invoices.map((invoice) =>
            invoice.id === id ? { ...invoice, ...updates } : invoice
          ),
        })),

      getInvoicesByDateRange: (startDate: string, endDate: string) => {
        const { invoices } = get();
        return invoices.filter(
          (invoice) => invoice.date >= startDate && invoice.date <= endDate
        );
      },

      getInvoicesByCategory: (category: string) => {
        const { invoices } = get();
        return invoices.filter((invoice) =>
          invoice.items.some((item) => item.category === category)
        );
      },

      getTotalSpendingByCategory: (category: string, startDate?: string, endDate?: string) => {
        const { invoices } = get();
        let filteredInvoices = invoices;

        if (startDate && endDate) {
          filteredInvoices = invoices.filter(
            (invoice) => invoice.date >= startDate && invoice.date <= endDate
          );
        }

        return filteredInvoices.reduce((total, invoice) => {
          const categoryItems = invoice.items.filter((item) => item.category === category);
          return total + categoryItems.reduce((sum, item) => sum + item.amount, 0);
        }, 0);
      },

      getSpendingByVendor: (vendor: string) => {
        const { invoices } = get();
        return invoices
          .filter((invoice) => invoice.vendor.toLowerCase().includes(vendor.toLowerCase()))
          .reduce((total, invoice) => total + invoice.totalAmount, 0);
      },

      getMonthlySpending: (year: number, month: number) => {
        const { invoices } = get();
        const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
        const endDate = `${year}-${month.toString().padStart(2, "0")}-31`;

        return invoices
          .filter((invoice) => invoice.date >= startDate && invoice.date <= endDate)
          .reduce((total, invoice) => total + invoice.totalAmount, 0);
      },
    }),
    {
      name: "invoice-storage",
    }
  )
); 