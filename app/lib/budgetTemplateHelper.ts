// app/utils/budgetTemplateHelper.ts

import { budgetTemplate } from "../utils/template";
import type { Debt } from "@/app/lib/store";

export function getFullBudgetTemplate(debts: Debt[]) {
  // Filter debts with valid names only (optional)
  const debtCategories = debts
    .filter((d) => d.name && d.name.trim().length > 0)
    .map((d) => d.name.trim());

  // Return combined template with debts appended as a group
  return [
    ...budgetTemplate,
    {
      title: "Debts",
      categories: debtCategories,
    },
  ];
}
