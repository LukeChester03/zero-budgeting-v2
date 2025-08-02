"use client";

import React, { useState, useEffect } from "react";
import { useBudgetStore } from "@/app/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, Plus, Save, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface DebtInput {
  id: string;
  name: string;
  totalAmount: string;
  months: string;
}

interface DebtRepayment {
  id: string;
  name: string;
  totalAmount: number;
  months: number;
  repaidAmount: number;
}

const rowVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, y: 10, transition: { duration: 0.25, ease: "easeIn" } },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function DebtsForm() {
  const debts = useBudgetStore((s) => s.debts);
  const budgets = useBudgetStore((s) => s.budgets);
  const addDebt = useBudgetStore((s) => s.addDebt);
  const updateDebt = useBudgetStore((s) => s.updateDebt);
  const removeDebt = useBudgetStore((s) => s.removeDebt);
  const income = useBudgetStore((s) => s.income);
  const getRepaidAmountForDebt = useBudgetStore((s) => s.getRepaidAmountForDebt);

  // Initialize local state for debt creation
  const [localDebts, setLocalDebts] = useState<DebtInput[]>(
    debts.map((d) => ({
      id: d.id,
      name: d.name,
      totalAmount: d.totalAmount.toString(),
      months: d.months.toString(),
    }))
  );

  // State for repayment tracking with calculated repaidAmount
  const [repaymentDebts, setRepaymentDebts] = useState<DebtRepayment[]>([]);

  useEffect(() => {
    // Sync debt creation form if debts updated externally
    setLocalDebts(
      debts.map((d) => ({
        id: d.id,
        name: d.name,
        totalAmount: d.totalAmount.toString(),
        months: d.months.toString(),
      }))
    );

    // Sync repayment tracking, calculate repaidAmount from past budgets
    const updatedRepaymentDebts = debts
      .filter((d) => d.totalAmount > 0 && d.months > 0)
      .map((d) => {
        const repaidAmount = getRepaidAmountForDebt(d.name);
        return {
          id: d.id,
          name: d.name,
          totalAmount: d.totalAmount,
          months: d.months,
          repaidAmount,
        };
      });
    setRepaymentDebts(updatedRepaymentDebts);
  }, [debts, budgets, getRepaidAmountForDebt]);

  const addNewDebtRow = (): void => {
    setLocalDebts((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", totalAmount: "", months: "" },
    ]);
  };

  const handleDebtChange = (
    id: string,
    field: keyof Omit<DebtInput, "id">,
    value: string
  ): void => {
    setLocalDebts((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  };

  const handleSaveDebts = (): void => {
    localDebts.forEach(({ id, name, totalAmount, months }) => {
      const amtNum = parseFloat(totalAmount);
      const monthsNum = parseInt(months);

      if (name.trim() && amtNum > 0 && monthsNum > 0) {
        const existing = debts.find((d) => d.id === id);
        if (existing) {
          updateDebt(id, {
            name: name.trim(),
            totalAmount: amtNum,
            months: monthsNum,
          });
        } else {
          addDebt({
            name: name.trim(),
            totalAmount: amtNum,
            months: monthsNum,
          });
        }
      }
    });
  };

  const handleRemoveDebt = (id: string): void => {
    removeDebt(id);
    setLocalDebts((prev) => prev.filter((d) => d.id !== id));
  };

  // Calculate total monthly repayments
  const totalMonthlyRepayments = localDebts.reduce((acc, d) => {
    const amt = parseFloat(d.totalAmount);
    const mths = parseInt(d.months);
    if (amt > 0 && mths > 0) {
      return acc + amt / mths;
    }
    return acc;
  }, 0);

  // Calculate total remaining debt
  const totalRemainingDebt = repaymentDebts.reduce((acc, d) => {
    return acc + (d.totalAmount - d.repaidAmount);
  }, 0);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Add Debts Section */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
      >
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-semibold text-center">
              Add Your Debts
            </CardTitle>
            <p className="text-center text-muted-foreground max-w-xl mx-auto">
              Enter each debt with the total amount owed and repayment period.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="grid grid-cols-[2.5fr_1.3fr_1.3fr_1.5fr_auto] gap-4 mb-3 font-semibold text-muted-foreground border-b border-border pb-2 text-sm">
                  <div>Debt Name</div>
                  <div>Total Amount (£)</div>
                  <div>Months to Repay</div>
                  <div>Monthly Repayment (£)</div>
                  <div></div>
                </div>

                <AnimatePresence initial={false}>
                  {localDebts.map(({ id, name, totalAmount, months }) => {
                    const amt = parseFloat(totalAmount);
                    const mths = parseInt(months);
                    const monthlyRepayment = amt > 0 && mths > 0 ? amt / mths : 0;

                    return (
                      <motion.div
                        key={id}
                        variants={rowVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                        className="grid grid-cols-[2.5fr_1.3fr_1.3fr_1.5fr_auto] gap-4 items-center py-3 border-b border-border last:border-b-0"
                      >
                        <Input
                          type="text"
                          placeholder="e.g. Car Loan"
                          value={name}
                          onChange={(e) => handleDebtChange(id, "name", e.target.value)}
                          className="border-border focus:ring-primary"
                          aria-label="Debt name"
                          spellCheck={false}
                          autoComplete="off"
                        />
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          placeholder="0.00"
                          value={totalAmount}
                          onChange={(e) => handleDebtChange(id, "totalAmount", e.target.value)}
                          className="border-border focus:ring-primary"
                          aria-label="Total amount owed"
                        />
                        <Input
                          type="number"
                          min={1}
                          placeholder="12"
                          value={months}
                          onChange={(e) => handleDebtChange(id, "months", e.target.value)}
                          className="border-border focus:ring-primary"
                          aria-label="Months to repay"
                        />
                        <div
                          className="px-4 py-2 text-foreground font-semibold select-none"
                          aria-live="polite"
                          aria-atomic="true"
                        >
                          £{monthlyRepayment.toFixed(2)}
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Debt</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove this debt? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleRemoveDebt(id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-center gap-4">
              <Button
                onClick={addNewDebtRow}
                variant="outline"
                className="flex-1 md:flex-none"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Debt
              </Button>
              <Button
                onClick={handleSaveDebts}
                className="flex-1 md:flex-none bg-primary hover:bg-primary/90"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Debts
              </Button>
            </div>

            <Card className="bg-primary/10 border-primary/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    Total Monthly Repayments: £{totalMonthlyRepayments.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Your monthly income: <span className="font-semibold">£{income.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </motion.section>

      {/* Repayment Tracking Section */}
      <AnimatePresence>
        {repaymentDebts.length > 0 && (
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <Card className="shadow-lg border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="text-3xl font-semibold text-center flex items-center justify-center gap-2">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                  Track Your Progress
                </CardTitle>
                <p className="text-center text-muted-foreground max-w-xl mx-auto">
                  This section shows your repayment progress based on your past budgets.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="overflow-x-auto">
                  <div className="min-w-[700px]">
                    <div className="grid grid-cols-[2fr_1.2fr_1.2fr_1.2fr_1.2fr_1.2fr] gap-4 mb-3 font-semibold text-muted-foreground border-b border-green-300 pb-2 text-sm">
                      <div>Debt Name</div>
                      <div>Total Amount (£)</div>
                      <div>Monthly Payment (£)</div>
                      <div>Amount Repaid (£)</div>
                      <div>Amount Left (£)</div>
                      <div>Progress</div>
                    </div>

                    <AnimatePresence initial={false}>
                      {repaymentDebts.map((debt) => {
                        const monthlyPayment = debt.totalAmount / debt.months;
                        const amountLeft = debt.totalAmount - debt.repaidAmount;
                        const progressPercentage = (debt.repaidAmount / debt.totalAmount) * 100;

                        return (
                          <motion.div
                            key={debt.id}
                            variants={rowVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            layout
                            className="grid grid-cols-[2fr_1.2fr_1.2fr_1.2fr_1.2fr_1.2fr] gap-4 items-center py-4 border-b border-green-100 last:border-b-0"
                          >
                            <div className="font-semibold text-foreground select-none">{debt.name}</div>
                            <div className="text-muted-foreground font-medium select-none">
                              £{debt.totalAmount.toFixed(2)}
                            </div>
                            <div className="text-muted-foreground font-medium select-none">
                              £{monthlyPayment.toFixed(2)}
                            </div>
                            <div className="font-semibold text-foreground select-none">
                              £{debt.repaidAmount.toFixed(2)}
                            </div>
                            <div className="font-semibold text-foreground select-none">
                              £{amountLeft.toFixed(2)}
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{progressPercentage.toFixed(1)}%</span>
                                <Badge variant={amountLeft <= 0 ? "default" : "secondary"}>
                                  {amountLeft <= 0 ? "Complete!" : "In Progress"}
                                </Badge>
                              </div>
                              <Progress value={Math.min(progressPercentage, 100)} className="h-2" />
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>

                <Card className="bg-green-100 border-green-400">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-800">
                        Total Remaining Debt: £{totalRemainingDebt.toFixed(2)}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {totalRemainingDebt <= 0 && repaymentDebts.length > 0 && (
                  <motion.div
                    className="p-6 bg-gradient-to-r from-green-400 to-emerald-400 text-white rounded-lg font-bold text-center text-xl shadow-lg"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  >
                    🎉 Congratulations! You're debt-free! 🎉
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
