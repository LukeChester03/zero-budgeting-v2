"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirebaseStore } from "@/lib/store-firebase";
import { PiggyBank } from "lucide-react";

export default function TotalSavings() {
  const getTotalSaved = useFirebaseStore((state) => state.getTotalSaved);

  const totalSaved = getTotalSaved();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Saved</CardTitle>
        <PiggyBank className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">£{totalSaved.toFixed(2)}</div>
        <p className="text-xs text-muted-foreground">
          Across all your budgets
        </p>
      </CardContent>
    </Card>
  );
}
