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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  LifeBuoy,
  AlertTriangle,
  DollarSign,
  Calendar,
  PieChart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFirebaseStore, Debt } from "@/lib/store-firebase";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import PaidOffDebtModal from "@/app/components/PaidOffDebtModal";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar } from "recharts";

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

// Chart colors
const CHART_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4'];

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
  const { 
    debts, 
    addDebt, 
    updateDebt, 
    deleteDebt, 
    getRepaidAmountForDebt,
    income,
    isEarning,
    budgets
  } = useFirebaseStore();

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

  // Calculate debt statistics with proper Firebase integration
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

  // Calculate debt to income ratio using actual user income
  const debtToIncomeRatio = useMemo(() => {
    if (!income || income <= 0) return 0;
    // Debt-to-income ratio should be monthly debt payments / monthly income
    return (debtStats.totalMonthlyRepayment / income) * 100;
  }, [debtStats.totalMonthlyRepayment, income]);

  // Calculate debt health score
  const calculateDebtHealthScore = () => {
    if (debts.length === 0) return 100;

    const interestScore = Math.max(0, 100 - debtStats.averageInterestRate * 2);
    const ratioScore = Math.max(0, 100 - debtToIncomeRatio);
    const diversityScore = debts.length <= 3 ? 100 : Math.max(0, 100 - (debts.length - 3) * 10);
    
    return Math.round((interestScore * 0.4) + (ratioScore * 0.4) + (diversityScore * 0.2));
  };

  // Calculate debt-free date
  const calculateDebtFreeDate = () => {
    if (debts.length === 0) return null;

    // Use the actual remaining debt instead of total debt
    const remainingDebt = totalRemainingDebt;
    const totalMonthlyRepayment = debtStats.totalMonthlyRepayment;

    if (totalMonthlyRepayment <= 0 || remainingDebt <= 0) return null;

    // Calculate months needed to pay off remaining debt
    const monthsToDebtFree = Math.ceil(remainingDebt / totalMonthlyRepayment);
    
    // Create debt-free date
    const debtFreeDate = new Date();
    debtFreeDate.setMonth(debtFreeDate.getMonth() + monthsToDebtFree);

    return debtFreeDate;
  };

  // Calculate remaining debt for each debt
  const debtsWithRepaymentData = useMemo(() => {
    return debts.map(debt => {
      const repaidAmount = getRepaidAmountForDebt(debt.name);
      const remainingAmount = Math.max(0, debt.totalAmount - repaidAmount);
      const repaymentProgress = debt.totalAmount > 0 ? (repaidAmount / debt.totalAmount) * 100 : 0;
      
      // Calculate actual remaining months based on remaining debt and monthly payment
      const actualRemainingMonths = debt.monthlyRepayment > 0 
        ? Math.ceil(remainingAmount / debt.monthlyRepayment)
        : debt.months; // Fallback to original months if no monthly payment
      
      return {
        ...debt,
        repaidAmount,
        remainingAmount,
        repaymentProgress,
        actualRemainingMonths
      };
    });
  }, [debts, getRepaidAmountForDebt]);

  // Calculate total remaining debt
  const totalRemainingDebt = useMemo(() => {
    return debtsWithRepaymentData.reduce((sum, debt) => sum + debt.remainingAmount, 0);
  }, [debtsWithRepaymentData]);

  // Calculate debt reduction timeline from past budgets
  const debtReductionTimeline = useMemo(() => {
    // Get past budgets and calculate debt reduction over time
    const pastBudgets = budgets.filter(budget => 
      new Date(budget.month) < new Date()
    ).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    if (pastBudgets.length === 0) {
      return debts.map((debt, index) => ({
        name: debt.name,
        remainingDebt: debt.totalAmount,
        month: new Date().toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
      }));
    }

    // Calculate debt reduction for each past budget
    return pastBudgets.map((budget, index) => {
      const debtAllocations = budget.allocations.filter(allocation => 
        allocation.category === 'debt' && allocation.amount > 0
      );
      
      const totalDebtReduction = debtAllocations.reduce((sum, allocation) => sum + allocation.amount, 0);
      const remainingDebt = Math.max(0, debtStats.totalDebt - (totalDebtReduction * (index + 1)));
      
      return {
        name: new Date(budget.month).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
        remainingDebt: Math.round(remainingDebt),
        debtReduction: totalDebtReduction,
        month: budget.month
      };
    });
  }, [budgets, debtStats.totalDebt, debts]);

  // Chart data for overview section - based on proven financial health metrics
  const chartData = useMemo(() => {
    // 2. Debt Priority Matrix (Bar Chart) - Shows which debts to pay off first
    const debtPriorityMatrix = debts.map((debt, index) => ({
      name: debt.name,
      priorityScore: debt.interestRate * debt.totalAmount / 10000, // Priority score
      interestRate: debt.interestRate,
      balance: debt.totalAmount,
      color: debt.interestRate > 10 ? '#EF4444' : debt.interestRate > 5 ? '#F59E0B' : '#10B981'
    })).sort((a, b) => b.priorityScore - a.priorityScore);

    // 3. Interest Cost Analysis (Bar Chart) - Shows interest costs by debt
    const interestCostAnalysis = debts.map((debt, index) => {
      const totalInterestCost = (debt.interestRate / 100) * debt.totalAmount * (debt.months / 12);
      const monthlyInterestCost = totalInterestCost / debt.months;
      
      return {
        name: debt.name,
        totalInterestCost: Math.round(totalInterestCost),
        monthlyInterestCost: Math.round(monthlyInterestCost),
        interestRate: debt.interestRate,
        color: debt.interestRate > 10 ? '#EF4444' : debt.interestRate > 5 ? '#F59E0B' : '#10B981'
      };
    }).sort((a, b) => b.totalInterestCost - a.totalInterestCost);

    // 4. Financial Health Dashboard (Multiple metrics in one view)
    const financialHealthMetrics = [
      {
        name: "Debt-to-Income",
        value: debtToIncomeRatio,
        recommended: 36, // Recommended max
        unit: "%",
        status: debtToIncomeRatio <= 36 ? "Good" : debtToIncomeRatio <= 43 ? "Moderate" : "High"
      },
      {
        name: "Avg Interest Rate",
        value: debtStats.averageInterestRate,
        recommended: 5, // Target low rate
        unit: "%",
        status: debtStats.averageInterestRate <= 5 ? "Good" : debtStats.averageInterestRate <= 10 ? "Moderate" : "High"
      },
      {
        name: "Monthly Payments",
        value: debtStats.totalMonthlyRepayment,
        recommended: income * 0.36, // 36% of income
        unit: "£",
        status: debtStats.totalMonthlyRepayment <= income * 0.36 ? "Good" : debtStats.totalMonthlyRepayment <= income * 0.43 ? "Moderate" : "High"
      },
      {
        name: "Debt Count",
        value: debts.length,
        recommended: 3, // Recommended max
        unit: "",
        status: debts.length <= 3 ? "Good" : debts.length <= 5 ? "Moderate" : "High"
      }
    ];

    return {
      debtPaymentTrend: debtReductionTimeline,
      debtPriorityMatrix,
      repaymentProgress: interestCostAnalysis,
      financialHealthMetrics
    };
  }, [debts, debtsWithRepaymentData, debtToIncomeRatio, debtStats, income, debtReductionTimeline]);

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
  const debtHealthScore = calculateDebtHealthScore();

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
          <div className="relative container mx-auto px-4 sm:px-6 py-12 sm:py-24">
            <motion.div variants={itemVariants} className="text-center mb-8 sm:mb-12">
              <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
                <PiggyBank className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-primary">
                  Debt Management
                </h1>
              </div>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-6 sm:mb-8 px-4">
                Track your debts, monitor repayment progress, and work towards financial freedom
              </p>
            </motion.div>
            
            {/* Hero Cards */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                <CardContent className="p-4 sm:p-6 text-center">
                  <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 sm:mb-3 text-blue-600" />
                  <h3 className="text-lg sm:text-2xl font-bold text-blue-600 mb-1">£{totalRemainingDebt.toLocaleString()}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Debt</p>
                </CardContent>
              </Card>

              <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                <CardContent className="p-4 sm:p-6 text-center">
                  <Target className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 sm:mb-3 text-green-600" />
                  <h3 className="text-lg sm:text-2xl font-bold text-green-600 mb-1">£{totalRemainingDebt.toLocaleString()}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Debt Left to Repay</p>
                </CardContent>
              </Card>

              <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                <CardContent className="p-4 sm:p-6 text-center">
                  <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 sm:mb-3 text-purple-600" />
                  <h3 className="text-lg sm:text-2xl font-bold text-purple-600 mb-1">{debtToIncomeRatio.toFixed(1)}%</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Debt to Income</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        <div className="container mx-auto px-4 sm:px-6 pb-8 sm:pb-12">
          {/* Tabs Section */}
          <motion.div variants={itemVariants} className="mt-8 sm:mt-12">
            <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
              <TabsList className="grid w-full grid-cols-3 h-auto sm:h-10">
                <TabsTrigger value="overview" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Overview</span>
                  <span className="sm:hidden">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="my-debts" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <PiggyBank className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">My Debts</span>
                  <span className="sm:hidden">Debts</span>
                </TabsTrigger>
                <TabsTrigger value="debt-breakdown" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <PieChart className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Debt Breakdown</span>
                  <span className="sm:hidden">Breakdown</span>
                </TabsTrigger>
              </TabsList>

              {/* My Debts Tab */}
              <TabsContent value="my-debts" className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h2 className="text-xl sm:text-2xl font-bold">My Debts</h2>
                  <Button
                    onClick={() => setIsAddDebtModalOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-white w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Debt
                  </Button>
                </div>

                {debtsWithRepaymentData.length === 0 ? (
                  <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                    <CardContent className="p-8 text-center">
                      <PiggyBank className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-xl font-semibold mb-2">No Debts Added</h3>
                      <p className="text-muted-foreground mb-4">
                        You&apos;re currently debt-free! Add your first debt to start tracking your repayment journey.
                      </p>
                      <Button onClick={() => setIsAddDebtModalOpen(true)} className="bg-primary hover:bg-primary/90">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Debt
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4 sm:space-y-6">
                    {debtsWithRepaymentData.map((debt) => (
                      <Card key={debt.id} className="bg-white/80 backdrop-blur-sm border-primary/20 hover:shadow-lg transition-shadow w-full">
                        <CardHeader className="pb-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className={cn("p-2 rounded-full", DEBT_TYPES[debt.debtType as keyof typeof DEBT_TYPES].color)}>
                                {DEBT_TYPES[debt.debtType as keyof typeof DEBT_TYPES].icon}
                              </div>
                              <div>
                                <CardTitle className="text-lg sm:text-xl">{debt.name}</CardTitle>
                                <p className="text-xs sm:text-sm text-muted-foreground">{DEBT_TYPES[debt.debtType as keyof typeof DEBT_TYPES].label}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditDebt(debt)}
                                className="text-xs sm:text-sm"
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDebtToDelete(debt.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4 sm:space-y-6">
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-xs sm:text-sm">
                            <div>
                              <p className="text-muted-foreground">Original Amount</p>
                              <p className="font-semibold text-base sm:text-lg">£{debt.totalAmount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Remaining Amount</p>
                              <p className="font-semibold text-base sm:text-lg text-green-600">£{debt.remainingAmount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Monthly Payment</p>
                              <p className="font-semibold text-base sm:text-lg">£{debt.monthlyRepayment.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Interest Rate</p>
                              <p className="font-semibold text-base sm:text-lg">{debt.interestRate}%</p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex justify-between text-xs sm:text-sm">
                              <span>Repayment Progress</span>
                              <span>{Math.round(debt.repaymentProgress)}%</span>
                            </div>
                            <Progress 
                              value={debt.repaymentProgress} 
                              className="h-2 sm:h-3"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>£{debt.repaidAmount.toLocaleString()} paid</span>
                              <span>{debt.actualRemainingMonths} months remaining</span>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePaidOffDebtClick(debt)}
                              className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 flex-1 text-xs sm:text-sm"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark as Paid Off
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4 sm:space-y-6">
                <h2 className="text-xl sm:text-2xl font-bold">Overview</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Financial Graph 4: Financial Health Dashboard */}
                  <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                        Financial Health Dashboard
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Key metrics for debt management success
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {chartData.financialHealthMetrics.length > 0 ? (
                        <div className="space-y-3 sm:space-y-4">
                          {chartData.financialHealthMetrics.map((metric, index) => (
                            <div key={metric.name} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-xs sm:text-sm font-medium">{metric.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs sm:text-sm font-bold">
                                    {metric.unit === "£" ? `£${metric.value.toFixed(0)}` : 
                                     metric.name === "Debt Count" ? metric.value.toFixed(0) : 
                                     metric.value.toFixed(1)}{metric.unit === "£" ? "" : metric.unit}
                                  </span>
                                  <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
                                    metric.status === "Good" ? "bg-green-100 text-green-800" :
                                    metric.status === "Moderate" ? "bg-yellow-100 text-yellow-800" :
                                    "bg-red-100 text-red-800"
                                  }`}>
                                    {metric.status}
                                  </span>
                                </div>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                                <div 
                                  className={`h-1.5 sm:h-2 rounded-full ${
                                    metric.status === "Good" ? "bg-green-500" :
                                    metric.status === "Moderate" ? "bg-yellow-500" :
                                    "bg-red-500"
                                  }`}
                                  style={{ 
                                    width: `${Math.min(100, (metric.value / metric.recommended) * 100)}%` 
                                  }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Recommended: {metric.unit === "£" ? `£${metric.recommended.toFixed(0)}` : 
                                metric.name === "Debt Count" ? metric.recommended.toFixed(0) : 
                                metric.recommended.toFixed(1)}{metric.unit === "£" ? "" : metric.unit}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 sm:py-12">
                          <Target className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground opacity-50" />
                          <h3 className="text-base sm:text-lg font-semibold mb-2">No Health Data</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                            Add debts to see financial health metrics
                          </p>
                          <Button onClick={() => setIsAddDebtModalOpen(true)} size="sm">
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Add Debt
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Debt Summary Card */}
                  <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <PieChart className="h-4 w-4 sm:h-5 sm:w-5" />
                        Debt Summary
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Overview of your current debt situation
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {debts.length > 0 ? (
                        <div className="space-y-4 sm:space-y-6">
                          {/* Key Statistics */}
                          <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <div className="text-center p-2 sm:p-3 rounded-lg bg-blue-500/10">
                              <p className="text-lg sm:text-2xl font-bold text-blue-600">{debts.length}</p>
                              <p className="text-xs text-muted-foreground">Active Debts</p>
                            </div>
                            <div className="text-center p-2 sm:p-3 rounded-lg bg-green-500/10">
                              <p className="text-lg sm:text-2xl font-bold text-green-600">£{totalRemainingDebt.toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">Remaining</p>
                            </div>
                          </div>

                          {/* Debt Types Breakdown */}
                          <div className="space-y-2 sm:space-y-3">
                            <h4 className="text-xs sm:text-sm font-semibold text-muted-foreground">Debt Types</h4>
                            <div className="space-y-1.5 sm:space-y-2">
                              {Object.entries(DEBT_TYPES).map(([type, { label, icon, color }]) => {
                                const typeDebts = debts.filter(debt => debt.debtType === type);
                                if (typeDebts.length === 0) return null;
                                
                                const totalAmount = typeDebts.reduce((sum, debt) => sum + debt.totalAmount, 0);
                                const percentage = (totalAmount / debtStats.totalDebt) * 100;
                                
                                return (
                                  <div key={type} className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                      <div className={cn("p-1 rounded", color)}>
                                        {icon}
                                      </div>
                                      <span className="text-xs sm:text-sm font-medium">{label}</span>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xs sm:text-sm font-semibold">£{totalAmount.toLocaleString()}</p>
                                      <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Interest Rate Distribution */}
                          <div className="space-y-2 sm:space-y-3">
                            <h4 className="text-xs sm:text-sm font-semibold text-muted-foreground">Interest Rates</h4>
                            <div className="space-y-1.5 sm:space-y-2">
                              {debts
                                .sort((a, b) => b.interestRate - a.interestRate)
                                .slice(0, 3)
                                .map((debt) => (
                                  <div key={debt.id} className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                      <div className={cn(
                                        "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full",
                                        debt.interestRate > 10 ? "bg-red-500" : 
                                        debt.interestRate > 5 ? "bg-yellow-500" : "bg-green-500"
                                      )} />
                                      <span className="text-xs sm:text-sm font-medium">{debt.name}</span>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xs sm:text-sm font-semibold">{debt.interestRate}%</p>
                                      <p className="text-xs text-muted-foreground">£{debt.totalAmount.toLocaleString()}</p>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="pt-3 sm:pt-4 border-t">
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setIsAddDebtModalOpen(true)}
                                className="flex-1 text-xs sm:text-sm"
                              >
                                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                Add Debt
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="flex-1 text-xs sm:text-sm"
                              >
                                <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                View All
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 sm:py-12">
                          <PieChart className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground opacity-50" />
                          <h3 className="text-base sm:text-lg font-semibold mb-2">No Debts Added</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                            Start tracking your debts to see detailed insights
                          </p>
                          <Button onClick={() => setIsAddDebtModalOpen(true)} size="sm">
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Add Your First Debt
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Useful Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <Card className="bg-white/80 backdrop-blur-sm border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                        Debt-Free Date
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {debtFreeDate ? (
                        <div className="text-center">
                          <div className="text-lg sm:text-2xl font-bold text-green-600 mb-2">
                            {debtFreeDate.toLocaleDateString('en-GB', { 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                            {Math.ceil((debtFreeDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30.44))} months away
                          </p>
                          <div className="text-xs text-muted-foreground">
                            Based on £{debtStats.totalMonthlyRepayment.toFixed(0)} monthly payments
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <p className="text-sm">Unable to calculate</p>
                          <p className="text-xs mt-1">Add debts and set monthly payments</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur-sm border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Calculator className="h-4 w-4 sm:h-5 sm:w-5" />
                        Total Interest
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-lg sm:text-2xl font-bold text-red-600 mb-2">
                          £{debtStats.totalInterest.toFixed(0)}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Total interest to be paid</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Debt Breakdown Tab */}
              <TabsContent value="debt-breakdown" className="space-y-6">
                <h2 className="text-2xl font-bold">Debt Breakdown</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Interest-Related Debts Card */}
                  <Card className="bg-white/80 backdrop-blur-sm border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Interest-Bearing Debts
                      </CardTitle>
                      <CardDescription>
                        Debts with interest rates that cost you money
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {debts.some(debt => debt.interestRate > 0) ? (
                        <div className="space-y-3">
                          {debts
                            .filter(debt => debt.interestRate > 0)
                            .sort((a, b) => b.interestRate - a.interestRate)
                            .map((debt) => (
                              <div key={debt.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                                <div>
                                  <span className="text-sm font-medium">{debt.name}</span>
                                  <p className="text-xs text-muted-foreground">£{debt.totalAmount.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm font-bold text-red-600">{debt.interestRate}%</span>
                                  <p className="text-xs text-muted-foreground">
                                    £{((debt.interestRate / 100) * debt.totalAmount * (debt.months / 12)).toFixed(0)} interest
                                  </p>
                                </div>
                              </div>
                            ))}
                          <div className="mt-4 p-3 bg-red-100 rounded-lg">
                            <p className="text-sm font-semibold text-red-800">
                              Total Interest Cost: £{debtStats.totalInterest.toFixed(0)}
                            </p>
                            <p className="text-xs text-red-600">
                              This is money you&apos;ll pay in addition to your principal
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-4">
                          <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                          <h3 className="text-lg font-semibold mb-2">No Interest-Bearing Debts</h3>
                          <p className="text-sm text-muted-foreground">
                            You don&apos;t have any debts with interest rates. This is great for your financial health!
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Debt Health Score Card */}
                  <Card className="bg-white/80 backdrop-blur-sm border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Debt Health Score
                      </CardTitle>
                      <CardDescription>
                        Overall assessment of your debt situation
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center mb-6">
                        <div className="text-4xl font-bold text-primary mb-2">{debtHealthScore}</div>
                        <div className="text-sm text-muted-foreground">Health Score</div>
                        <div className="mt-2">
                          {debtHealthScore >= 80 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Excellent
                            </span>
                          ) : debtHealthScore >= 60 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Good
                            </span>
                          ) : debtHealthScore >= 40 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              Moderate
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Needs Attention
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Interest Management</span>
                          <span className="font-semibold">{Math.round(debtStats.averageInterestRate)}% avg</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Debt to Income</span>
                          <span className="font-semibold">{debtToIncomeRatio.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Debt Diversity</span>
                          <span className="font-semibold">{debts.length} debts</span>
                        </div>
                      </div>

                      <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <p className="text-sm font-semibold text-primary mb-1">Health Assessment</p>
                        <p className="text-xs text-muted-foreground">
                          {debtHealthScore >= 80 ? "Excellent debt health! Keep up the good work." :
                           debtHealthScore >= 60 ? "Good debt management. Consider paying off high-interest debts first." :
                           debtHealthScore >= 40 ? "Moderate debt situation. Focus on reducing high-interest debts." :
                           "Needs attention. Consider debt consolidation or financial counseling."}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Debt Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-white/80 backdrop-blur-sm border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-sm">Monthly Debt Payments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">£{debtStats.totalMonthlyRepayment.toFixed(0)}</div>
                        <p className="text-xs text-muted-foreground">per month</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur-sm border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-sm">Average Interest Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{Math.round(debtStats.averageInterestRate)}%</div>
                        <p className="text-xs text-muted-foreground">across all debts</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur-sm border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-sm">Average Repayment Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{Math.round(debtStats.averageMonths)}</div>
                        <p className="text-xs text-muted-foreground">months remaining</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>

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
        </div>
      </motion.div>
    </div>
  );
}
