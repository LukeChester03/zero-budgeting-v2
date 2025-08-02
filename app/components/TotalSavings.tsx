"use client";

import { useBudgetStore } from "@/app/lib/store";
import { budgetTemplate } from "@/app/utils/template";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PiggyBank } from "lucide-react";

export default function TotalSavings() {
  const totalSaved = useBudgetStore((state) => {
    const savingsCategories =
      budgetTemplate.find((group) => group.title === "Savings & Investments")?.categories || [];

    return state.budgets.reduce((sum, budget) => {
      const savingsInBudget = budget.allocations
        .filter((allocation) => savingsCategories.includes(allocation.category))
        .reduce((total, allocation) => total + allocation.amount, 0);

      return sum + savingsInBudget;
    }, 0);
  });

  return (
    <Card className="bg-primary/10 border-primary/20 shadow-lg">
      <CardContent className="p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <PiggyBank className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg text-primary">Total Saved</CardTitle>
        </div>
        <div className="text-3xl font-bold text-primary">£{totalSaved.toFixed(2)}</div>
        <div className="text-sm text-muted-foreground mt-1">
          Across all budgets
        </div>
      </CardContent>
    </Card>
  );
}
