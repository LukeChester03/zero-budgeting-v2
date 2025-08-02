export type BudgetCategoryGroup = {
  title: string;
  categories: string[];
};

export const budgetTemplate: BudgetCategoryGroup[] = [
  {
    title: "Savings & Investments",
    categories: ["Emergency Fund", "Investments", "Pension"],
  },
  {
    title: "Bills & Essentials",
    categories: [
      "Rent / Mortgage",
      "Electricity",
      "Gas",
      "Water",
      "Council Tax",
      "Internet",
      "Phone",
      "Groceries",
    ],
  },
  {
    title: "Lifestyle",
    categories: ["Subscriptions", "Dining Out", "Entertainment", "Holiday Fund"],
  },
  {
    title: "Transport",
    categories: ["Fuel", "Train/Bus Pass", "Car Insurance", "Car Maintenance"],
  },
  {
    title: "Buffer / Miscellaneous",
    categories: ["Unexpected", "Gifts", "Other"],
  },
];
