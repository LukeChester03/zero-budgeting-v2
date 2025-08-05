"use client";

import React, { useMemo, useState } from "react";
import { motion, Variants } from "framer-motion";
import { useFirebaseStore } from "@/lib/store-firebase";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CreditCard, 
  TrendingUp, 
  AlertTriangle, 
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  BarChart3,
  Calculator,
  Plus,
  Eye,
  Trash2,
  Edit,
  Target,
  AlertCircle,
  CheckCircle,
  CreditCard as CreditCardIcon,
  Car,
  GraduationCap,
  Home,
  FileText,
  Zap,
  Shield,
  TrendingDown,
  CalendarDays,
  Percent,
  Timer,
  Lightbulb
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useToast } from "@/hooks/use-toast";
import PaidOffDebtModal from "@/app/components/PaidOffDebtModal";

interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  months: number;
  interestRate: number;
  startDate: string;
  debtType: keyof typeof DEBT_TYPES;
  priority: keyof typeof PRIORITY_COLORS;
  notes?: string;
  monthlyRepayment: number;
  endDate?: string;
}

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 200, damping: 25 },
  },
};

// Debt type icons and labels
const DEBT_TYPES = {
  "credit-card": { icon: <CreditCardIcon className="h-4 w-4" />, label: "Credit Card", color: "text-red-500" },
  "personal-loan": { icon: <FileText className="h-4 w-4" />, label: "Personal Loan", color: "text-blue-500" },
  "mortgage": { icon: <Home className="h-4 w-4" />, label: "Mortgage", color: "text-green-500" },
  "car-loan": { icon: <Car className="h-4 w-4" />, label: "Car Loan", color: "text-purple-500" },
  "student-loan": { icon: <GraduationCap className="h-4 w-4" />, label: "Student Loan", color: "text-orange-500" },
  "other": { icon: <FileText className="h-4 w-4" />, label: "Other", color: "text-gray-500" },
} as const;

// Priority colors
const PRIORITY_COLORS = {
  high: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-green-100 text-green-800 border-green-200",
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
  const debts = useFirebaseStore((s) => s.debts);
  const budgets = useFirebaseStore((s) => s.budgets);
  const income = useFirebaseStore((s) => s.income);
  const addDebt = useFirebaseStore((s) => s.addDebt);
  const updateDebt = useFirebaseStore((s) => s.updateDebt);
  const deleteDebt = useFirebaseStore((s) => s.deleteDebt);
  const getRepaidAmountForDebt = useFirebaseStore((s) => s.getRepaidAmountForDebt);
  const { toast } = useToast();

  // Form state
  const [isAddDebtModalOpen, setIsAddDebtModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [debtForm, setDebtForm] = useState<DebtFormData>({
    name: "",
    totalAmount: "",
    months: "",
    interestRate: "",
    startDate: new Date().toISOString().split('T')[0],
    debtType: "other",
    priority: "medium",
    notes: "",
    endDate: new Date().toISOString().split('T')[0],
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [paidOffDebtModal, setPaidOffDebtModal] = useState<{
    isOpen: boolean;
    debtName: string;
    monthlyPayment: number;
    totalAmount: number;
    interestSaved: number;
  }>({
    isOpen: false,
    debtName: "",
    monthlyPayment: 0,
    totalAmount: 0,
    interestSaved: 0
  });

  // Calculate comprehensive debt data
  const debtData = useMemo(() => {
    const totalDebt = debts.reduce((sum, debt) => sum + debt.totalAmount, 0);
    const totalMonthlyPayments = debts.reduce((sum, debt) => sum + debt.monthlyRepayment, 0);
    const totalRepaid = debts.reduce((sum, debt) => sum + getRepaidAmountForDebt(debt.name), 0);
    const totalRemaining = totalDebt - totalRepaid;
    const debtToIncomeRatio = income > 0 ? (totalMonthlyPayments / income) * 100 : 0;
    
         // Calculate total interest paid
     const totalInterest = debts.reduce((sum, debt) => {
       const repaidAmount = getRepaidAmountForDebt(debt.name);
       const remainingAmount = debt.totalAmount - repaidAmount;
       const interestRate = debt.interestRate || 0;
       const monthlyInterest = (interestRate / 100) / 12;
       const totalInterestPaid = repaidAmount * monthlyInterest * (debt.months / 2); // Rough estimate
       return sum + totalInterestPaid;
     }, 0);

    // Calculate debt by type
    const debtByType = debts.reduce((acc, debt) => {
      const type = debt.debtType;
      if (!acc[type]) acc[type] = 0;
      acc[type] += debt.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    // Calculate priority breakdown
    const priorityBreakdown = debts.reduce((acc, debt) => {
      const priority = debt.priority;
      if (!acc[priority]) acc[priority] = 0;
      acc[priority] += debt.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    // Calculate debt progress
    const debtProgress = debts.map(debt => {
      const repaidAmount = getRepaidAmountForDebt(debt.name);
      const remainingAmount = debt.totalAmount - repaidAmount;
      const progress = (repaidAmount / debt.totalAmount) * 100;
      const monthsRemaining = remainingAmount > 0 ? Math.ceil(remainingAmount / debt.monthlyRepayment) : 0;
      
      return {
        ...debt,
        repaidAmount,
        remainingAmount,
        progress,
        monthsRemaining,
        isComplete: remainingAmount <= 0
      };
    });

    // Prepare chart data
    const debtReductionData = budgets.slice(-6).map(budget => {
      const totalDebtAtTime = debts.reduce((sum, debt) => {
        const startDate = new Date(debt.startDate);
        const budgetDate = new Date(budget.month);
        if (budgetDate >= startDate) {
          const monthsSinceStart = Math.max(0, (budgetDate.getFullYear() - startDate.getFullYear()) * 12 + 
                                 (budgetDate.getMonth() - startDate.getMonth()));
          const expectedRepaid = Math.min(monthsSinceStart * debt.monthlyRepayment, debt.totalAmount);
          const remainingDebt = Math.max(0, debt.totalAmount - expectedRepaid);
          return sum + remainingDebt;
        }
        return sum + debt.totalAmount;
      }, 0);
      
      const totalRepaidAtTime = totalDebt - totalDebtAtTime;
      
      return {
        month: budget.month,
        totalDebt: totalDebtAtTime,
        remainingDebt: totalDebtAtTime,
        repaidAmount: totalRepaidAtTime
      };
    });

    // Prepare debt type chart data
    const debtTypeChartData = Object.entries(debtByType)
      .filter(([type, amount]) => amount > 0) // Only include debts with amounts
      .map(([type, amount]) => {
        const debtType = DEBT_TYPES[type as keyof typeof DEBT_TYPES];
        const label = debtType?.label || type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ');
        return {
          name: label,
          value: amount,
          percentage: (amount / totalDebt) * 100,
          color: debtType?.color || 'text-gray-500'
        };
      });

    // Prepare priority chart data
    const priorityChartData = Object.entries(priorityBreakdown).map(([priority, amount]) => ({
      name: `${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority`,
      value: amount,
      percentage: (amount / totalDebt) * 100,
      color: priority === 'high' ? 'text-red-500' : priority === 'medium' ? 'text-yellow-500' : 'text-green-500'
    }));

    // Prepare debt-to-income trend data
    const debtToIncomeTrendData = budgets.slice(-6).map(budget => {
      const totalMonthlyPaymentsAtTime = debts.reduce((sum, debt) => {
        const startDate = new Date(debt.startDate);
        const budgetDate = new Date(budget.month);
        const endDate = debt.endDate ? new Date(debt.endDate) : null;
        
        // Check if debt is active at this time
        if (budgetDate >= startDate && (!endDate || budgetDate <= endDate)) {
          return sum + debt.monthlyRepayment;
        }
        return sum;
      }, 0);
      
      const debtToIncomeRatioAtTime = budget.income > 0 ? (totalMonthlyPaymentsAtTime / budget.income) * 100 : 0;
      
      return {
        month: budget.month,
        debtToIncomeRatio: debtToIncomeRatioAtTime,
        targetRatio: 20 // Recommended target
      };
    });

    // Prepare interest impact data
    const interestImpactData = debts.map(debt => {
      const repaidAmount = getRepaidAmountForDebt(debt.name);
      const remainingAmount = debt.totalAmount - repaidAmount;
      const interestRate = debt.interestRate || 0;
      const monthlyInterest = (interestRate / 100) / 12;
      
      // Calculate remaining months based on remaining amount and monthly payment
      const remainingMonths = remainingAmount > 0 ? Math.ceil(remainingAmount / debt.monthlyRepayment) : 0;
      const estimatedInterestCost = remainingAmount * monthlyInterest * remainingMonths;
      
      return {
        debtName: debt.name,
        interestCost: estimatedInterestCost,
        interestRate: interestRate,
        remainingAmount: remainingAmount,
        remainingMonths: remainingMonths
      };
    }).sort((a, b) => b.interestCost - a.interestCost);

    // Calculate repayment efficiency score
    const calculateRepaymentEfficiencyScore = () => {
      if (debts.length === 0) return 0;
      
      let score = 100;
      
      // Deduct points for high debt-to-income ratio
      if (debtToIncomeRatio > 40) score -= 30;
      else if (debtToIncomeRatio > 20) score -= 15;
      
      // Deduct points for high interest rates
      const averageInterestRate = debts.reduce((sum, d) => sum + (d.interestRate || 0), 0) / debts.length;
      if (averageInterestRate > 15) score -= 25;
      else if (averageInterestRate > 10) score -= 15;
      else if (averageInterestRate > 5) score -= 5;
      
      // Add points for consistent payments (if we have budget data)
      if (budgets.length >= 3) {
        const recentBudgets = budgets.slice(-3);
        const hasConsistentPayments = recentBudgets.every(budget => {
          const debtAllocations = budget.allocations?.filter(alloc => 
            alloc.category.toLowerCase().includes('debt') || 
            alloc.category.toLowerCase().includes('loan')
          ) || [];
          return debtAllocations.length > 0;
        });
        if (hasConsistentPayments) score += 10;
      }
      
      // Deduct points for too many debts
      if (debts.length > 5) score -= 20;
      else if (debts.length > 3) score -= 10;
      
      return Math.max(0, Math.min(100, score));
    };

    return {
      totalDebt,
      totalMonthlyPayments,
      totalRepaid,
      totalRemaining,
      totalInterest,
      debtToIncomeRatio,
      debtByType,
      priorityBreakdown,
      debtProgress,
      averageInterestRate: debts.length > 0 ? debts.reduce((sum, d) => sum + (d.interestRate || 0), 0) / debts.length : 0,
      debtReductionData,
      debtTypeChartData,
      priorityChartData,
      debtToIncomeTrendData,
      interestImpactData,
      repaymentEfficiencyScore: calculateRepaymentEfficiencyScore()
    };
  }, [debts, income, budgets, getRepaidAmountForDebt]);

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};
    
    if (!debtForm.name.trim()) {
      errors.name = "Debt name is required";
    }
    
    const amount = parseFloat(debtForm.totalAmount);
    if (!debtForm.totalAmount || isNaN(amount) || amount <= 0) {
      errors.totalAmount = "Valid amount is required";
    }
    
    const months = parseInt(debtForm.months);
    if (!debtForm.months || isNaN(months) || months <= 0) {
      errors.months = "Valid repayment period is required";
    }
    
    const interestRate = parseFloat(debtForm.interestRate);
    if (!debtForm.interestRate || isNaN(interestRate) || interestRate < 0) {
      errors.interestRate = "Valid interest rate is required";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    const debtData = {
      name: debtForm.name.trim(),
      totalAmount: parseFloat(debtForm.totalAmount),
      months: parseInt(debtForm.months),
      interestRate: parseFloat(debtForm.interestRate),
      startDate: debtForm.startDate,
      debtType: debtForm.debtType,
      priority: debtForm.priority,
      notes: debtForm.notes.trim(),
      endDate: debtForm.endDate,
      monthlyRepayment: parseFloat(debtForm.totalAmount) / parseInt(debtForm.months),
      isActive: true,
    };

    try {
      if (editingDebt) {
        await updateDebt(editingDebt.id, debtData);
        toast({
          title: "Success",
          description: "Debt updated successfully!",
        });
        setEditingDebt(null);
      } else {
        await addDebt(debtData);
        toast({
          title: "Success",
          description: "Debt added successfully!",
        });
      }

      // Reset form
      setDebtForm({
        name: "",
        totalAmount: "",
        months: "",
        interestRate: "",
        startDate: new Date().toISOString().split('T')[0],
        debtType: "other",
        priority: "medium",
        notes: "",
        endDate: new Date().toISOString().split('T')[0],
      });
      setFormErrors({});
      setIsAddDebtModalOpen(false);
    } catch (error) {
      console.error('Error saving debt:', error);
      toast({
        title: "Error",
        description: "Failed to save debt. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditDebt = (debt: Debt) => {
    setEditingDebt(debt);
    setDebtForm({
      name: debt.name || "",
      totalAmount: (debt.totalAmount || 0).toString(),
      months: (debt.months || 0).toString(),
      interestRate: (debt.interestRate || 0).toString(),
      startDate: debt.startDate || new Date().toISOString().split('T')[0],
      debtType: debt.debtType || "other",
      priority: debt.priority || "medium",
      notes: debt.notes || "",
      endDate: debt.endDate || new Date().toISOString().split('T')[0],
    });
    setIsAddDebtModalOpen(true);
  };

  const handleDeleteDebt = async (debtId: string) => {
    try {
      await deleteDebt(debtId);
      toast({
        title: "Success",
        description: "Debt deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting debt:', error);
      toast({
        title: "Error",
        description: "Failed to delete debt. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getDebtToIncomeStatus = (ratio: number) => {
    if (ratio <= 20) return { status: "Good", color: "text-primary", bg: "bg-primary/10" };
    if (ratio <= 40) return { status: "Caution", color: "text-orange-600", bg: "bg-orange-100" };
    return { status: "High Risk", color: "text-red-600", bg: "bg-red-100" };
  };

  const handlePaidOffDebtClick = (debt: any) => {
    const interestSaved = (debt.interestRate / 100) * debt.totalAmount * (debt.months / 12);
    setPaidOffDebtModal({
      isOpen: true,
      debtName: debt.name,
      monthlyPayment: debt.monthlyRepayment,
      totalAmount: debt.totalAmount,
      interestSaved: interestSaved
    });
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20"
    >
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
        <div className="relative container mx-auto px-3 sm:px-6 py-16 sm:py-24">
          <motion.div variants={itemVariants} className="text-center mb-8 sm:mb-12">
            <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
              <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold text-primary">
                Debt Management
              </h1>
            </div>
            <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Track your debts, analyze repayment strategies, and work towards financial freedom
            </p>
          </motion.div>

          {/* Key Metrics */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            {debts.length === 0 ? (
              <Card className="col-span-2 md:col-span-4 bg-background/80 backdrop-blur-sm border-primary/20">
                <CardContent className="p-4 sm:p-8 text-center">
                  <CreditCard className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">No Debts Added</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">
                    You're currently debt-free! Add your first debt to start tracking your repayment journey.
                  </p>
                  <Button onClick={() => setIsAddDebtModalOpen(true)} className="bg-primary hover:bg-primary/90 text-xs sm:text-sm">
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Add Your First Debt
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                        <DollarSign className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Total Debt</p>
                        <p className="text-lg sm:text-2xl font-bold">£{debtData.totalDebt.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                        <TrendingDown className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Remaining</p>
                        <p className="text-lg sm:text-2xl font-bold">£{debtData.totalRemaining.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                        <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Monthly Payments</p>
                        <p className="text-lg sm:text-2xl font-bold">£{debtData.totalMonthlyPayments.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                        <Percent className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Avg Interest</p>
                        <p className="text-lg sm:text-2xl font-bold">{debtData.averageInterestRate.toFixed(1)}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-3 sm:px-6 pb-8 sm:pb-12">
         {/* Instructions */}
         <motion.section variants={itemVariants} className="mb-6 sm:mb-8 mt-12 sm:mt-16">
           <Card className="bg-orange-50 border-orange-200">
             <CardContent className="p-4 sm:p-6">
               <div className="flex items-start gap-3">
                 <div className="p-2 bg-orange-100 rounded-lg">
                   <CreditCard className="h-5 w-5 text-orange-600" />
                 </div>
                 <div>
                   <h3 className="font-semibold text-orange-900 mb-2 text-sm sm:text-base">Debt Management Guide</h3>
                   <div className="space-y-2 text-xs sm:text-sm text-orange-800">
                     <p><strong>Key Metrics:</strong> Track your total debt, remaining balance, monthly payments, and average interest rate.</p>
                     <p><strong>Debt Overview:</strong> See all your debts organized by type and priority with progress tracking.</p>
                     <p><strong>Debt Analysis:</strong> Get insights into your debt-to-income ratio, repayment timeline, and optimization strategies.</p>
                     <p><strong>Add/Edit Debts:</strong> Manage your debt portfolio by adding new debts or updating existing ones with interest rates and payment schedules.</p>
                     <p className="text-orange-700 font-medium">💡 Tip: Prioritize high-interest debts first and consider consolidating multiple debts to reduce overall interest costs.</p>
                   </div>
                 </div>
               </div>
             </CardContent>
           </Card>
         </motion.section>



         {/* Debt Analysis & Management */}
         <motion.section variants={itemVariants} className="mb-8">
          <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 text-xs sm:text-sm">
              <TabsTrigger value="overview" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="debts" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">My Debts</span>
                <span className="sm:hidden">Debts</span>
              </TabsTrigger>
              <TabsTrigger value="analysis" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Calculator className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Analysis</span>
                <span className="sm:hidden">Analysis</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Insights</span>
                <span className="sm:hidden">Insights</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {debts.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <CreditCard className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">No Debts to Analyze</h3>
                    <p className="text-muted-foreground mb-4">
                      Add your first debt to see detailed charts and analysis of your debt management.
                    </p>
                    <Button onClick={() => setIsAddDebtModalOpen(true)} className="bg-primary hover:bg-primary/90">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Debt
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                /* Financial Charts Section */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                {/* Debt Reduction Over Time */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5" />
                      Debt Reduction Over Time
                    </CardTitle>
                    <CardDescription>
                      Track your debt balance decreasing over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {budgets.length >= 3 ? (
                      <ChartContainer
                        config={{
                          remainingDebt: {
                            label: "Remaining Debt",
                            theme: {
                              light: "hsl(var(--destructive))",
                              dark: "hsl(var(--destructive))",
                            },
                          },
                          repaidAmount: {
                            label: "Repaid Amount",
                            theme: {
                              light: "hsl(var(--primary))",
                              dark: "hsl(var(--primary))",
                            },
                          },
                        }}
                        className="h-48 sm:h-64"
                      >
                        <LineChart data={debtData.debtReductionData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="month"
                            tickFormatter={(value) => {
                              const date = new Date(value);
                              return date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
                            }}
                          />
                          <YAxis
                            tickFormatter={(value) => `£${value}`}
                          />
                          <ChartTooltip
                            content={({ active, payload, label }) => {
                              if (!active || !payload?.length) return null;
                              const date = new Date(label);
                              return (
                                <ChartTooltipContent
                                  active={active}
                                  payload={payload}
                                  label={date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                                  formatter={(value: any, name: any) => [`£${value.toFixed(2)}`, String(name)]}
                                />
                              );
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="remainingDebt"
                            strokeWidth={3}
                            dot={{ strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, strokeWidth: 2 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="repaidAmount"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ strokeWidth: 2, r: 3 }}
                            activeDot={{ r: 5, strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ChartContainer>
                    ) : (
                      <div className="h-48 sm:h-64 flex items-center justify-center text-muted-foreground">
                                              <div className="text-center">
                        <TrendingDown className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                        <p className="text-sm sm:text-base">Need 3+ months of data</p>
                        <p className="text-xs sm:text-sm">Create at least 3 budgets with debts to see your debt reduction progress</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3 sm:mt-4 text-xs sm:text-sm"
                          onClick={() => setIsAddDebtModalOpen(true)}
                        >
                          <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Add Your First Debt
                        </Button>
                      </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Debt-to-Income Trend Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Percent className="h-5 w-5" />
                      Debt-to-Income Trend
                    </CardTitle>
                    <CardDescription>
                      Monitor your debt-to-income ratio over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {budgets.length >= 3 ? (
                      <ChartContainer
                        config={{
                          debtToIncomeRatio: {
                            label: "Debt-to-Income Ratio",
                            theme: {
                              light: "hsl(var(--warning))",
                              dark: "hsl(var(--warning))",
                            },
                          },
                        }}
                        className="h-48 sm:h-64"
                      >
                        <LineChart data={debtData.debtToIncomeTrendData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="month"
                            tickFormatter={(value) => {
                              const date = new Date(value);
                              return date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
                            }}
                          />
                          <YAxis
                            tickFormatter={(value) => `${value}%`}
                          />
                          <ChartTooltip
                            content={({ active, payload, label }) => {
                              if (!active || !payload?.length) return null;
                              const date = new Date(label);
                              const data = payload[0];
                              return (
                                <ChartTooltipContent
                                  active={active}
                                  payload={payload}
                                  label={`${date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`}
                                  formatter={(value: any, name: any) => {
                                    if (name === 'debtToIncomeRatio') {
                                      return [`${value.toFixed(1)}%`, 'Your Debt-to-Income Ratio'];
                                    } else if (name === 'targetRatio') {
                                      return [`${value.toFixed(1)}%`, 'Recommended Target (20%)'];
                                    }
                                    return [`${value.toFixed(1)}%`, String(name)];
                                  }}
                                />
                              );
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="debtToIncomeRatio"
                            strokeWidth={3}
                            dot={{ strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, strokeWidth: 2 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="targetRatio"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            stroke="hsl(var(--muted-foreground))"
                            dot={{ strokeWidth: 2, r: 3 }}
                            activeDot={{ r: 5, strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ChartContainer>
                    ) : (
                      <div className="h-48 sm:h-64 flex items-center justify-center text-muted-foreground">
                                              <div className="text-center">
                        <Percent className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                        <p className="text-sm sm:text-base">Need 3+ months of data</p>
                        <p className="text-xs sm:text-sm">Create at least 3 budgets to see your debt-to-income trend</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3 sm:mt-4 text-xs sm:text-sm"
                          onClick={() => setIsAddDebtModalOpen(true)}
                        >
                          <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Add Your First Debt
                        </Button>
                      </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Interest Cost Impact Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Interest Cost Impact
                    </CardTitle>
                    <CardDescription>
                      See how much interest costs you over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {debts.length === 0 ? (
                      <div className="h-64 flex items-center justify-center text-muted-foreground">
                                              <div className="text-center">
                        <DollarSign className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                        <p className="text-sm sm:text-base">No debts added yet</p>
                        <p className="text-xs sm:text-sm">Add your first debt to see interest cost analysis</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3 sm:mt-4 text-xs sm:text-sm"
                          onClick={() => setIsAddDebtModalOpen(true)}
                        >
                          <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Add Your First Debt
                        </Button>
                      </div>
                      </div>
                    ) : debts.filter(debt => (debt.interestRate || 0) > 0).length === 0 ? (
                      <div className="h-64 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <Shield className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                          <p className="font-semibold text-green-700">No Interest-Bearing Debts</p>
                          <p className="text-sm text-muted-foreground">Great news! You have no debts with interest charges.</p>
                          <p className="text-xs text-muted-foreground mt-2">This means you're not losing money to interest payments.</p>
                        </div>
                      </div>
                    ) : (
                      <ChartContainer
                        config={{
                          interestCost: {
                            label: "Interest Cost",
                            theme: {
                              light: "hsl(var(--destructive))",
                              dark: "hsl(var(--destructive))",
                            },
                          },
                        }}
                        className="h-48 sm:h-64"
                      >
                        <BarChart data={debtData.interestImpactData.filter(item => item.interestRate > 0)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="debtName"
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis
                            tickFormatter={(value) => `£${value}`}
                          />
                          <ChartTooltip
                            content={({ active, payload, label }) => {
                              if (!active || !payload?.length) return null;
                              return (
                                <ChartTooltipContent
                                  active={active}
                                  payload={payload}
                                  label={label}
                                  formatter={(value: any, name: any) => [`£${value.toFixed(2)}`, 'Interest Cost']}
                                />
                              );
                            }}
                          />
                          <Bar
                            dataKey="interestCost"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ChartContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Debt Repayment Efficiency Score */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Repayment Efficiency Score
                    </CardTitle>
                    <CardDescription>
                      How efficiently you're paying off your debts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 sm:h-64 flex items-center justify-center">
                                              <div className="text-center">
                          <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4">
                            <svg className="w-24 h-24 sm:w-32 sm:h-32 transform -rotate-90" viewBox="0 0 120 120">
                              <circle
                                cx="60"
                                cy="60"
                                r="50"
                                fill="none"
                                stroke="hsl(var(--muted))"
                                strokeWidth="8"
                              />
                              <circle
                                cx="60"
                                cy="60"
                                r="50"
                                fill="none"
                                stroke={debtData.repaymentEfficiencyScore >= 80 ? "hsl(var(--primary))" : 
                                       debtData.repaymentEfficiencyScore >= 60 ? "hsl(var(--warning))" : "hsl(var(--destructive))"}
                                strokeWidth="8"
                                strokeDasharray={`${(debtData.repaymentEfficiencyScore / 100) * 314} 314`}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <div className={`text-lg sm:text-2xl font-bold ${
                                  debtData.repaymentEfficiencyScore >= 80 ? "text-primary" : 
                                  debtData.repaymentEfficiencyScore >= 60 ? "text-warning" : "text-destructive"
                                }`}>
                                  {debtData.repaymentEfficiencyScore.toFixed(0)}
                                </div>
                                <div className="text-xs text-muted-foreground">Score</div>
                              </div>
                            </div>
                          </div>
                        <div className="space-y-2">
                          <div className="text-xs sm:text-sm">
                            <span className="font-medium">Status: </span>
                            <span className={cn(
                              debtData.repaymentEfficiencyScore >= 80 ? "text-primary" : 
                              debtData.repaymentEfficiencyScore >= 60 ? "text-warning" : "text-destructive"
                            )}>
                              {debtData.repaymentEfficiencyScore >= 80 ? "Excellent" : 
                               debtData.repaymentEfficiencyScore >= 60 ? "Good" : "Needs Improvement"}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Based on payment consistency, debt-to-income ratio, and interest rates
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              )}
            </TabsContent>

            {/* My Debts Tab */}
            <TabsContent value="debts" className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                <h2 className="text-xl sm:text-2xl font-bold">My Debts</h2>
                <Dialog open={isAddDebtModalOpen} onOpenChange={setIsAddDebtModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 text-xs sm:text-sm">
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Add Debt
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>
                        {editingDebt ? "Edit Debt" : "Add New Debt"}
                      </DialogTitle>
                      <DialogDescription>
                        Enter the details of your debt to track it properly.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="debt-name">Debt Name</Label>
                          <Input
                            id="debt-name"
                            placeholder="e.g., Credit Card"
                            value={debtForm.name}
                            onChange={(e) => setDebtForm(prev => ({ ...prev, name: e.target.value }))}
                            className={cn(formErrors.name && "border-destructive")}
                          />
                          {formErrors.name && (
                            <p className="text-xs text-destructive">{formErrors.name}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="debt-type">Debt Type</Label>
                          <Select
                            value={debtForm.debtType}
                            onValueChange={(value) => setDebtForm(prev => ({ ...prev, debtType: value as keyof typeof DEBT_TYPES }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(DEBT_TYPES).map(([key, { label, icon }]) => (
                                <SelectItem key={key} value={key}>
                                  <div className="flex items-center gap-2">
                                    {icon}
                                    {label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="debt-amount">Total Amount</Label>
                          <Input
                            id="debt-amount"
                            type="number"
                            placeholder="0.00"
                            value={debtForm.totalAmount}
                            onChange={(e) => setDebtForm(prev => ({ ...prev, totalAmount: e.target.value }))}
                            className={cn(formErrors.totalAmount && "border-destructive")}
                            min="0"
                            step="0.01"
                          />
                          {formErrors.totalAmount && (
                            <p className="text-xs text-destructive">{formErrors.totalAmount}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="debt-months">Repayment Period (Months)</Label>
                          <Input
                            id="debt-months"
                            type="number"
                            placeholder="12"
                            value={debtForm.months}
                            onChange={(e) => setDebtForm(prev => ({ ...prev, months: e.target.value }))}
                            className={cn(formErrors.months && "border-destructive")}
                            min="1"
                          />
                          {formErrors.months && (
                            <p className="text-xs text-destructive">{formErrors.months}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="debt-interest">Interest Rate (%)</Label>
                          <Input
                            id="debt-interest"
                            type="number"
                            placeholder="0.00"
                            value={debtForm.interestRate}
                            onChange={(e) => setDebtForm(prev => ({ ...prev, interestRate: e.target.value }))}
                            className={cn(formErrors.interestRate && "border-destructive")}
                            min="0"
                            step="0.01"
                          />
                          {formErrors.interestRate && (
                            <p className="text-xs text-destructive">{formErrors.interestRate}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="debt-start">Start Date</Label>
                          <Input
                            id="debt-start"
                            type="date"
                            value={debtForm.startDate}
                            onChange={(e) => setDebtForm(prev => ({ ...prev, startDate: e.target.value }))}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="debt-priority">Priority</Label>
                          <Select
                            value={debtForm.priority}
                            onValueChange={(value) => setDebtForm(prev => ({ ...prev, priority: value as keyof typeof PRIORITY_COLORS }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">High Priority</SelectItem>
                              <SelectItem value="medium">Medium Priority</SelectItem>
                              <SelectItem value="low">Low Priority</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="debt-end">End Date (Optional)</Label>
                          <Input
                            id="debt-end"
                            type="date"
                            value={debtForm.endDate}
                            onChange={(e) => setDebtForm(prev => ({ ...prev, endDate: e.target.value }))}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="debt-notes">Notes (Optional)</Label>
                        <Textarea
                          id="debt-notes"
                          placeholder="Additional notes about this debt..."
                          value={debtForm.notes}
                          onChange={(e) => setDebtForm(prev => ({ ...prev, notes: e.target.value }))}
                          rows={3}
                        />
                      </div>
                      
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsAddDebtModalOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" className="bg-primary hover:bg-primary/90">
                          {editingDebt ? "Update Debt" : "Add Debt"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {debtData.debtProgress.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No Debts Added</h3>
                      <p className="text-muted-foreground mb-4">
                        Start by adding your first debt to begin tracking your repayment progress.
                      </p>
                      <Button onClick={() => setIsAddDebtModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Debt
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  debtData.debtProgress.map((debt) => (
                    <Card key={debt.id} className="relative">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-0 mb-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className={cn("p-1.5 sm:p-2 rounded-lg", DEBT_TYPES[debt.debtType as keyof typeof DEBT_TYPES]?.color?.replace('text-', 'bg-').replace('-500', '-100') || 'bg-gray-100')}>
                              {DEBT_TYPES[debt.debtType as keyof typeof DEBT_TYPES]?.icon || <FileText className="h-3 w-3 sm:h-4 sm:w-4" />}
                            </div>
                            <div>
                              <h3 className="font-semibold text-base sm:text-lg">{debt.name}</h3>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {DEBT_TYPES[debt.debtType as keyof typeof DEBT_TYPES]?.label || 'Other'} • {(debt.interestRate || 0).toFixed(1)}% APR
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={cn(PRIORITY_COLORS[debt.priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.medium, "text-xs")}>
                              {(debt.priority || 'medium').charAt(0).toUpperCase() + (debt.priority || 'medium').slice(1)} Priority
                            </Badge>
                            {debt.isComplete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePaidOffDebtClick(debt as any)}
                                className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 text-xs"
                              >
                                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                Paid Off
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
                          <div>
                            <p className="text-xs sm:text-sm text-muted-foreground">Total Amount</p>
                            <p className="font-semibold text-sm sm:text-base">£{debt.totalAmount.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-muted-foreground">Monthly Payment</p>
                            <p className="font-semibold text-sm sm:text-base">£{debt.monthlyRepayment.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-muted-foreground">Amount Repaid</p>
                            <p className="font-semibold text-sm sm:text-base">£{debt.repaidAmount.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-muted-foreground">Remaining</p>
                            <p className="font-semibold text-sm sm:text-base text-muted-foreground">£{debt.remainingAmount.toFixed(2)}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span>Progress</span>
                            <span>{debt.progress.toFixed(1)}%</span>
                          </div>
                          <Progress value={Math.min(debt.progress, 100)} className="h-2" />
                        </div>
                        
                        {!debt.isComplete && (
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <Timer className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>
                              {debt.monthsRemaining} months remaining at current rate
                            </span>
                          </div>
                        )}
                        
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-4 pt-4 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditDebt(debt)}
                            className="text-xs sm:text-sm"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Edit
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive text-xs sm:text-sm">
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Debt</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{debt.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteDebt(debt.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Analysis Tab */}
            <TabsContent value="analysis" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                {/* Debt by Type */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Debt by Type
                    </CardTitle>
                    <CardDescription>
                      Breakdown of your debts by category
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(debtData.debtByType).map(([type, amount]) => {
                      const debtType = DEBT_TYPES[type as keyof typeof DEBT_TYPES];
                      if (!debtType) return null;
                      
                      return (
                        <div key={type} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className={debtType.color}>
                                {debtType.icon}
                              </span>
                              <span className="font-medium">
                                {debtType.label}
                              </span>
                            </div>
                            <span className="font-semibold">£{amount.toFixed(2)}</span>
                          </div>
                          <Progress 
                            value={(amount / debtData.totalDebt) * 100} 
                            className="h-2" 
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{((amount / debtData.totalDebt) * 100).toFixed(1)}% of total</span>
                            <span>£{amount.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Priority Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Priority Breakdown
                    </CardTitle>
                    <CardDescription>
                      Your debts organized by priority level
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(debtData.priorityBreakdown).map(([priority, amount]) => {
                      if (!priority) return null;
                      const priorityColor = PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS];
                      if (!priorityColor) return null;
                      
                      return (
                        <div key={priority} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Badge className={priorityColor}>
                                {(priority || 'medium').charAt(0).toUpperCase() + (priority || 'medium').slice(1)} Priority
                              </Badge>
                            </div>
                            <span className="font-semibold">£{amount.toFixed(2)}</span>
                          </div>
                          <Progress 
                            value={(amount / debtData.totalDebt) * 100} 
                            className="h-2" 
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{((amount / debtData.totalDebt) * 100).toFixed(1)}% of total</span>
                            <span>£{amount.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>

              {/* Additional Analysis Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Repayment Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Repayment Timeline
                    </CardTitle>
                    <CardDescription>
                      When you'll be debt-free
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {debtData.debtProgress.length > 0 ? (
                      <>
                        <div className="space-y-3">
                          {debtData.debtProgress
                            .filter(debt => !debt.isComplete)
                            .sort((a, b) => b.monthsRemaining - a.monthsRemaining)
                            .slice(0, 3)
                            .map((debt) => (
                              <div key={debt.id} className="flex justify-between items-center p-2 rounded-lg bg-muted/30">
                                <div className="flex items-center gap-2">
                                  <div className={cn("w-2 h-2 rounded-full", 
                                    debt.monthsRemaining <= 12 ? "bg-green-500" : 
                                    debt.monthsRemaining <= 24 ? "bg-yellow-500" : "bg-red-500"
                                  )} />
                                  <span className="text-sm font-medium">{debt.name}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {debt.monthsRemaining} months
                                </span>
                              </div>
                            ))}
                        </div>
                        {debtData.debtProgress.filter(d => !d.isComplete).length > 3 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{debtData.debtProgress.filter(d => !d.isComplete).length - 3} more debts
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No active debts</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Interest Impact */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Interest Impact
                    </CardTitle>
                    <CardDescription>
                      How interest affects your debt
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {debtData.totalInterest > 0 ? (
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Total Interest Paid</span>
                          <span className="font-semibold text-orange-600">£{debtData.totalInterest.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Interest as % of Debt</span>
                          <span className="font-semibold">
                            {((debtData.totalInterest / debtData.totalDebt) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Monthly Interest Cost</span>
                          <span className="font-semibold">
                            £{(debtData.totalInterest / 12).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No interest-bearing debts</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Debt Health Score */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Debt Health Score
                    </CardTitle>
                    <CardDescription>
                      Your overall debt situation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(() => {
                      const score = Math.max(0, 100 - debtData.debtToIncomeRatio * 2);
                      const getScoreColor = (score: number) => {
                        if (score >= 80) return "text-green-600";
                        if (score >= 60) return "text-yellow-600";
                        return "text-red-600";
                      };
                      const getScoreLabel = (score: number) => {
                        if (score >= 80) return "Excellent";
                        if (score >= 60) return "Good";
                        if (score >= 40) return "Fair";
                        return "Poor";
                      };
                      
                      return (
                        <div className="text-center">
                          <div className={cn("text-3xl font-bold mb-2", getScoreColor(score))}>
                            {score.toFixed(0)}/100
                          </div>
                          <Badge className={cn(
                            "text-sm",
                            score >= 80 ? "bg-green-100 text-green-800" :
                            score >= 60 ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          )}>
                            {getScoreLabel(score)}
                          </Badge>
                          <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                            <div className="flex justify-between">
                              <span>Debt-to-Income</span>
                              <span>{debtData.debtToIncomeRatio.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Total Debts</span>
                              <span>{debts.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Completed</span>
                              <span>{debtData.debtProgress.filter(d => d.isComplete).length}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Interest Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Percent className="h-5 w-5" />
                      Interest Analysis
                    </CardTitle>
                    <CardDescription>
                      Understanding your interest costs
                    </CardDescription>
                  </CardHeader>
                                     <CardContent className="space-y-4">
                     {debtData.totalInterest > 0 ? (
                       <>
                         <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                           <div className="text-2xl font-bold mb-2">
                             £{debtData.totalInterest.toFixed(2)}
                           </div>
                           <div className="text-sm text-muted-foreground">Estimated Total Interest Paid</div>
                         </div>
                         
                         <div className="space-y-3">
                           <div className="flex justify-between text-sm">
                             <span>Average Interest Rate</span>
                             <span className="font-semibold">{debtData.averageInterestRate.toFixed(1)}%</span>
                           </div>
                           <div className="flex justify-between text-sm">
                             <span>Highest Rate Debt</span>
                             <span className="font-semibold">
                               {debts.length > 0 ? Math.max(...debts.map(d => d.interestRate || 0)).toFixed(1) : 0}%
                             </span>
                           </div>
                         </div>
                       </>
                     ) : (
                                             <div className="text-center py-6 sm:py-8">
                        <Percent className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-base sm:text-lg font-semibold mb-2">No Interest-Bearing Debts</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                          You don't have any debts with interest rates. This is great for your financial health!
                        </p>
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            💡 Tip: Keep it this way by avoiding high-interest loans and credit cards
                          </p>
                        </div>
                      </div>
                     )}
                   </CardContent>
                </Card>

                {/* Repayment Strategy */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Repayment Strategy
                    </CardTitle>
                    <CardDescription>
                      Recommended approach to debt repayment
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                                             <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                         <div className="flex items-center gap-2 mb-2">
                           <AlertTriangle className="h-4 w-4 text-primary" />
                           <span className="font-medium text-primary">High-Interest First</span>
                         </div>
                         <p className="text-sm text-muted-foreground">
                           Focus on debts with the highest interest rates to minimize total cost.
                         </p>
                       </div>
                       
                       <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                         <div className="flex items-center gap-2 mb-2">
                           <Shield className="h-4 w-4 text-primary" />
                           <span className="font-medium text-primary">Debt-to-Income</span>
                         </div>
                         <p className="text-sm text-muted-foreground">
                           Keep your debt-to-income ratio below 20% for optimal financial health.
                         </p>
                       </div>
                       
                       <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                         <div className="flex items-center gap-2 mb-2">
                           <CalendarDays className="h-4 w-4 text-primary" />
                           <span className="font-medium text-primary">Consistent Payments</span>
                         </div>
                         <p className="text-sm text-muted-foreground">
                           Make consistent monthly payments to build positive payment history.
                         </p>
                       </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.section>
      </div>

      {/* Paid Off Debt Modal */}
      <PaidOffDebtModal
        isOpen={paidOffDebtModal.isOpen}
        onClose={() => setPaidOffDebtModal(prev => ({ ...prev, isOpen: false }))}
        debtName={paidOffDebtModal.debtName}
        monthlyPayment={paidOffDebtModal.monthlyPayment}
        totalAmount={paidOffDebtModal.totalAmount}
        interestSaved={paidOffDebtModal.interestSaved}
      />
    </motion.div>
  );
}
