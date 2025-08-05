"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  PiggyBank,
  TrendingUp,
  Target,
  BarChart3,
  CheckCircle,
  Plus,
  Calculator,
  Trash2,
  Umbrella,
  Car,
  Home,
  LifeBuoy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFirebaseStore, Debt } from "@/lib/store-firebase";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import PaidOffDebtModal from "@/app/components/PaidOffDebtModal";

// Debt type icons and labels
const DEBT_TYPES = {
  "credit-card": { icon: <PiggyBank className="h-4 w-4" />, label: "Credit Card", color: "text-red-500" },
  "personal-loan": { icon: <Umbrella className="h-4 w-4" />, label: "Personal Loan", color: "text-blue-500" },
  "mortgage": { icon: <Home className="h-4 w-4" />, label: "Mortgage", color: "text-green-500" },
  "car-loan": { icon: <Car className="h-4 w-4" />, label: "Car Loan", color: "text-purple-500" },
  "student-loan": { icon: <LifeBuoy className="h-4 w-4" />, label: "Student Loan", color: "text-orange-500" },
  "other": { icon: <Umbrella className="h-4 w-4" />, label: "Other", color: "text-gray-500" },
} as const;

// Priority colors
const PRIORITY_COLORS = {
  high: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-green-100 text-green-800 border-green-200",
} as const;

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 200, damping: 25 },
  },
} as const;

interface DebtFormData {
  name: string;
  totalAmount: string;
  months: string;
  interestRate: string;
  startDate: string;
  debtType: keyof typeof DEBT_TYPES;
  priority: keyof typeof PRIORITY_COLORS;
  notes: string;
  endDate: string;
}

export default function LoansPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { debts, addDebt, updateDebt, deleteDebt } = useFirebaseStore();

  // State
  const [isAddDebtModalOpen, setIsAddDebtModalOpen] = useState(false);
  const [isEditDebtModalOpen, setIsEditDebtModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [debtToDelete, setDebtToDelete] = useState<string | null>(null);
  const [isPaidOffDebtModalOpen, setIsPaidOffDebtModalOpen] = useState(false);
  const [paidOffDebtModal, setPaidOffDebtModal] = useState<{
    debtName: string;
    interestSaved: number;
    monthlyPayment: number;
    totalAmount: number;
  } | null>(null);

  // Form state
  const [formData, setFormData] = useState<DebtFormData>({
    name: "",
    totalAmount: "",
    months: "",
    interestRate: "",
    startDate: "",
    debtType: "credit-card",
    priority: "medium",
    notes: "",
    endDate: "",
  });

  const [formErrors, setFormErrors] = useState<Partial<DebtFormData>>({});

  // Calculate debt statistics
  const debtStats = useMemo(() => {
    const totalDebt = debts.reduce((sum, debt) => sum + debt.totalAmount, 0);
    const totalMonthlyRepayment = debts.reduce((sum, debt) => sum + debt.monthlyRepayment, 0);
    const totalInterest = debts.reduce((sum, debt) => {
      const totalInterestForDebt = (debt.interestRate / 100) * debt.totalAmount * (debt.months / 12);
      return sum + totalInterestForDebt;
    }, 0);

    const averageInterestRate = debts.length > 0 
      ? debts.reduce((sum, debt) => sum + debt.interestRate, 0) / debts.length 
      : 0;

    const totalMonths = debts.reduce((sum, debt) => sum + debt.months, 0);
    const averageMonths = debts.length > 0 ? totalMonths / debts.length : 0;

    return {
      totalDebt,
      totalMonthlyRepayment,
      totalInterest,
      averageInterestRate,
      averageMonths,
      debtCount: debts.length,
    };
  }, [debts]);

  // Calculate repayment efficiency score
  const calculateRepaymentEfficiencyScore = () => {
    if (debts.length === 0) return 0;

    const totalDebt = debtStats.totalDebt;
    const totalMonthlyRepayment = debtStats.totalMonthlyRepayment;
    const averageInterestRate = debtStats.averageInterestRate;

    // Calculate efficiency based on multiple factors
    const debtToIncomeRatio = totalDebt / (totalMonthlyRepayment * 12); // Simplified income calculation
    const interestEfficiency = Math.max(0, 100 - averageInterestRate * 2); // Lower interest = higher efficiency
    const repaymentSpeed = Math.min(100, (totalMonthlyRepayment / totalDebt) * 1000); // Higher repayment = higher efficiency

    const efficiencyScore = (interestEfficiency * 0.4) + (repaymentSpeed * 0.4) + (Math.max(0, 100 - debtToIncomeRatio * 100) * 0.2);
    return Math.round(Math.max(0, Math.min(100, efficiencyScore)));
  };

  // Calculate debt-free date
  const calculateDebtFreeDate = () => {
    if (debts.length === 0) return null;

    const totalMonthlyRepayment = debtStats.totalMonthlyRepayment;
    const totalDebt = debtStats.totalDebt;

    if (totalMonthlyRepayment <= 0) return null;

    const monthsToDebtFree = Math.ceil(totalDebt / totalMonthlyRepayment);
    const debtFreeDate = new Date();
    debtFreeDate.setMonth(debtFreeDate.getMonth() + monthsToDebtFree);

    return debtFreeDate;
  };

  const validateForm = (): boolean => {
    const errors: Partial<DebtFormData> = {};

    if (!formData.name.trim()) {
      errors.name = "Debt name is required";
    }

    if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) {
      errors.totalAmount = "Valid total amount is required";
    }

    if (!formData.months || parseInt(formData.months) <= 0) {
      errors.months = "Valid number of months is required";
    }

    if (!formData.interestRate || parseFloat(formData.interestRate) < 0) {
      errors.interestRate = "Valid interest rate is required";
    }

    if (!formData.startDate) {
      errors.startDate = "Start date is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const debtData = {
        name: formData.name.trim(),
        totalAmount: parseFloat(formData.totalAmount),
        months: parseInt(formData.months),
        interestRate: parseFloat(formData.interestRate),
        startDate: formData.startDate,
        debtType: formData.debtType,
        priority: formData.priority,
        notes: formData.notes.trim(),
        monthlyRepayment: parseFloat(formData.totalAmount) / parseInt(formData.months),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (editingDebt) {
        await updateDebt(editingDebt.id, debtData);
        toast({
          title: "Success",
          description: "Debt updated successfully!",
        });
      } else {
        await addDebt(debtData);
        toast({
          title: "Success",
          description: "Debt added successfully!",
        });
      }

      resetForm();
      setFormErrors({});
      setIsAddDebtModalOpen(false);
    } catch (error: unknown) {
      console.error("Error:", error instanceof Error ? error.message : String(error));
      toast({
        title: "Error",
        description: "Failed to save debt. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditDebt = (debt: Debt) => {
    setEditingDebt(debt);
    setFormData({
      name: debt.name,
      totalAmount: debt.totalAmount.toString(),
      months: debt.months.toString(),
      interestRate: debt.interestRate.toString(),
      startDate: debt.startDate,
              debtType: debt.debtType as keyof typeof DEBT_TYPES,
        priority: debt.priority as keyof typeof PRIORITY_COLORS,
      notes: debt.notes || "",
      endDate: debt.endDate || "",
    });
    setIsEditDebtModalOpen(true);
  };

  const handleDeleteDebt = async (debtId: string) => {
    try {
      await deleteDebt(debtId);
      setDebtToDelete(null);
      toast({
        title: "Success",
        description: "Debt deleted successfully!",
      });
    } catch (error: unknown) {
      console.error("Error:", error instanceof Error ? error.message : String(error));
      toast({
        title: "Error",
        description: "Failed to delete debt. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePaidOffDebtClick = (debt: Debt) => {
    const interestSaved = (debt.interestRate / 100) * debt.totalAmount * (debt.months / 12);
    setPaidOffDebtModal({
      debtName: debt.name,
      interestSaved,
      monthlyPayment: debt.monthlyRepayment,
      totalAmount: debt.totalAmount,
    });
    setIsPaidOffDebtModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      totalAmount: "",
      months: "",
      interestRate: "",
      startDate: "",
      debtType: "credit-card",
      priority: "medium",
      notes: "",
      endDate: "",
    });
    setEditingDebt(null);
  };

  const debtFreeDate = calculateDebtFreeDate();
  const efficiencyScore = calculateRepaymentEfficiencyScore();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to access your debt management</h1>
          <p className="text-muted-foreground">You need to be logged in to view and manage your debts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-4 py-8"
      >
        <motion.div variants={itemVariants} className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
            <PiggyBank className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold text-primary">
              Debt Management
            </h1>
          </div>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Track your debts, monitor repayment progress, and work towards financial freedom
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => setIsAddDebtModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-3 text-sm sm:text-base"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Debt
            </Button>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Debt List */}
          <motion.div variants={itemVariants} className="lg:col-span-8">
            {debts.length === 0 ? (
              <Card className="col-span-2 md:col-span-4 bg-background/80 backdrop-blur-sm border-primary/20">
                <CardContent className="p-4 sm:p-8 text-center">
                  <PiggyBank className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">No Debts Added</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">
                    You&apos;re currently debt-free! Add your first debt to start tracking your repayment journey.
                  </p>
                  <Button onClick={() => setIsAddDebtModalOpen(true)} className="bg-primary hover:bg-primary/90 text-xs sm:text-sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Debt
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {debts.map((debt) => (
                  <motion.div
                    key={debt.id}
                    variants={itemVariants}
                    className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200"
                  >
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={cn("p-2 rounded-full", DEBT_TYPES[debt.debtType as keyof typeof DEBT_TYPES].color)}>
                              {DEBT_TYPES[debt.debtType as keyof typeof DEBT_TYPES].icon}
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{debt.name}</h3>
                              <p className="text-sm text-muted-foreground">{DEBT_TYPES[debt.debtType as keyof typeof DEBT_TYPES].label}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Total Amount</p>
                              <p className="font-semibold">£{debt.totalAmount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Monthly Payment</p>
                              <p className="font-semibold">£{debt.monthlyRepayment.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Interest Rate</p>
                              <p className="font-semibold">{debt.interestRate}%</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Remaining</p>
                              <p className="font-semibold">{debt.months} months</p>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Repayment Progress</span>
                              <span>{Math.round(((debt.totalAmount - (debt.monthlyRepayment * debt.months)) / debt.totalAmount) * 100)}%</span>
                            </div>
                            <Progress 
                              value={Math.max(0, Math.min(100, ((debt.totalAmount - (debt.monthlyRepayment * debt.months)) / debt.totalAmount) * 100))} 
                              className="h-2"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditDebt(debt)}
                            className="text-xs"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePaidOffDebtClick(debt)}
                            className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 text-xs"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Paid Off
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDebtToDelete(debt.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Right Column - Statistics */}
          <motion.div variants={itemVariants} className="lg:col-span-4">
            <div className="space-y-6">
              {/* Summary Stats */}
              <Card className="bg-white/80 backdrop-blur-sm border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Debt Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">£{debtStats.totalDebt.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Total Debt</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">£{debtStats.totalMonthlyRepayment.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">Monthly Payment</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">£{debtStats.totalInterest.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">Total Interest</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{debtStats.debtCount}</p>
                      <p className="text-xs text-muted-foreground">Active Debts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Repayment Efficiency */}
              <Card className="bg-white/80 backdrop-blur-sm border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Repayment Efficiency
                  </CardTitle>
                  <CardDescription>
                    How efficiently you&apos;re paying off your debts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <div className="text-4xl font-bold text-primary mb-2">{efficiencyScore}</div>
                    <div className="text-sm text-muted-foreground">Efficiency Score</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Interest Management</span>
                      <span className="font-semibold">{Math.round(debtStats.averageInterestRate)}% avg</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Repayment Speed</span>
                      <span className="font-semibold">{Math.round((debtStats.totalMonthlyRepayment / debtStats.totalDebt) * 100)}% of debt/month</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Debt-Free Date */}
              <Card className="bg-white/80 backdrop-blur-sm border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Debt-Free Date
                  </CardTitle>
                  <CardDescription>
                    When you&apos;ll be debt-free
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {debtFreeDate ? (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 mb-2">
                        {debtFreeDate.toLocaleDateString('en-GB', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {Math.ceil((debtFreeDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30))} months away
                      </p>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <p>Unable to calculate</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Interest Analysis */}
              <Card className="bg-white/80 backdrop-blur-sm border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Interest Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {debts.some(debt => debt.interestRate > 0) ? (
                    <div className="space-y-3">
                      {debts
                        .filter(debt => debt.interestRate > 0)
                        .sort((a, b) => b.interestRate - a.interestRate)
                        .map((debt) => (
                          <div key={debt.id} className="flex justify-between items-center p-2 bg-red-50 rounded">
                            <span className="text-sm font-medium">{debt.name}</span>
                            <span className="text-sm font-bold text-red-600">{debt.interestRate}%</span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <h3 className="text-base sm:text-lg font-semibold mb-2">No Interest-Bearing Debts</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                        You don&apos;t have any debts with interest rates. This is great for your financial health!
                      </p>
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <p className="font-semibold text-green-700">No Interest-Bearing Debts</p>
                        <p className="text-sm text-muted-foreground">Great news! You have no debts with interest charges.</p>
                        <p className="text-xs text-muted-foreground mt-2">This means you&apos;re not losing money to interest payments.</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>

        {/* Add/Edit Debt Modal */}
        <Dialog open={isAddDebtModalOpen || isEditDebtModalOpen} onOpenChange={(open) => {
          if (!open) {
            setIsAddDebtModalOpen(false);
            setIsEditDebtModalOpen(false);
            resetForm();
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingDebt ? "Edit Debt" : "Add New Debt"}</DialogTitle>
              <DialogDescription>
                {editingDebt ? "Update your debt information" : "Enter the details of your debt"}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Debt Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Credit Card, Car Loan"
                  className={formErrors.name ? "border-red-500" : ""}
                />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalAmount">Total Amount (£)</Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    step="0.01"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                    placeholder="0.00"
                    className={formErrors.totalAmount ? "border-red-500" : ""}
                  />
                  {formErrors.totalAmount && <p className="text-red-500 text-xs mt-1">{formErrors.totalAmount}</p>}
                </div>
                <div>
                  <Label htmlFor="months">Months Remaining</Label>
                  <Input
                    id="months"
                    type="number"
                    value={formData.months}
                    onChange={(e) => setFormData({ ...formData, months: e.target.value })}
                    placeholder="12"
                    className={formErrors.months ? "border-red-500" : ""}
                  />
                  {formErrors.months && <p className="text-red-500 text-xs mt-1">{formErrors.months}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="interestRate">Interest Rate (%)</Label>
                  <Input
                    id="interestRate"
                    type="number"
                    step="0.01"
                    value={formData.interestRate}
                    onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                    placeholder="0.00"
                    className={formErrors.interestRate ? "border-red-500" : ""}
                  />
                  {formErrors.interestRate && <p className="text-red-500 text-xs mt-1">{formErrors.interestRate}</p>}
                </div>
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className={formErrors.startDate ? "border-red-500" : ""}
                  />
                  {formErrors.startDate && <p className="text-red-500 text-xs mt-1">{formErrors.startDate}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="debtType">Debt Type</Label>
                  <Select value={formData.debtType} onValueChange={(value) => setFormData({ ...formData, debtType: value as keyof typeof DEBT_TYPES })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DEBT_TYPES).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as keyof typeof PRIORITY_COLORS })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRIORITY_COLORS).map(([key]) => (
                        <SelectItem key={key} value={key}>
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes about this debt"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setIsAddDebtModalOpen(false);
                  setIsEditDebtModalOpen(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingDebt ? "Update Debt" : "Add Debt"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <AlertDialog open={!!debtToDelete} onOpenChange={(open) => !open && setDebtToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Debt</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this debt? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => debtToDelete && handleDeleteDebt(debtToDelete)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Paid Off Debt Modal */}
        {paidOffDebtModal && (
          <PaidOffDebtModal
            isOpen={isPaidOffDebtModalOpen}
            onClose={() => {
              setIsPaidOffDebtModalOpen(false);
              setPaidOffDebtModal(null);
            }}
            debtName={paidOffDebtModal.debtName}
            interestSaved={paidOffDebtModal.interestSaved}
            monthlyPayment={paidOffDebtModal.monthlyPayment}
            totalAmount={paidOffDebtModal.totalAmount}
          />
        )}
      </motion.div>
    </div>
  );
}
