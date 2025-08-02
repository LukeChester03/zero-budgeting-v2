"use client";

import { BudgetEntry, useBudgetStore } from "@/app/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { FaChevronDown, FaTrash, FaPiggyBank } from "react-icons/fa";
import { budgetTemplate } from "@/app/utils/template";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type Props = {
  budget: BudgetEntry;
  index: number;
};

export default function BudgetCard({ budget, index }: Props) {
  const [expanded, setExpanded] = useState(false);
  const deleteBudget = useBudgetStore((s) => s.deleteBudget);

  const savingsCategories =
    budgetTemplate.find((group) => group.title === "Savings & Investments")?.categories || [];

  const savedThisMonth = budget.allocations
    .filter((allocation) => savingsCategories.includes(allocation.category))
    .reduce((sum, item) => sum + item.amount, 0);

  const toggleExpand = () => setExpanded((prev) => !prev);

  const handleDelete = () => {
    deleteBudget(budget.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold text-primary">{budget.month}</CardTitle>
              <div className="text-lg font-semibold text-muted-foreground">
                💷 £{budget.income.toFixed(2)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <FaTrash className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Budget</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete the budget for {budget.month}? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleExpand}
                className="text-muted-foreground hover:text-foreground"
              >
                <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
                  <FaChevronDown className="h-4 w-4" />
                </motion.div>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex items-center gap-2 mb-4">
            <FaPiggyBank className="text-green-600" />
            <Badge variant="secondary" className="text-green-700 bg-green-100">
              Saved this month: £{savedThisMonth.toFixed(2)}
            </Badge>
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-2"
              >
                <Separator className="my-4" />
                <div className="space-y-2">
                  {budget.allocations.map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-1">
                      <span className="text-sm text-muted-foreground">{item.category}</span>
                      <span className="text-sm font-semibold text-foreground">
                        £{item.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
