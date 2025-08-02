"use client";

import React, { useMemo, useState } from "react";
import { motion, Variants } from "framer-motion";
import { useBudgetStore } from "@/app/lib/store";
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
}

export default function LoansPage() {
  const debts = useBudgetStore((s) => s.debts);
  const budgets = useBudgetStore((s) => s.budgets);
  const income = useBudgetStore((s) => s.income);
  const addDebt = useBudgetStore((s) => s.addDebt);
  const updateDebt = useBudgetStore((s) => s.updateDebt);
  const removeDebt = useBudgetStore((s) => s.removeDebt);
  const getRepaidAmountForDebt = useBudgetStore((s) => s.getRepaidAmountForDebt);

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
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

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
          const monthsSinceStart = (budgetDate.getFullYear() - startDate.getFullYear()) * 12 + 
                                 (budgetDate.getMonth() - startDate.getMonth());
          const expectedRepaid = Math.min(monthsSinceStart * debt.monthlyRepayment, debt.totalAmount);
          return sum + (debt.totalAmount - expectedRepaid);
        }
        return sum + debt.totalAmount;
      }, 0);
      
      return {
        month: budget.month,
        totalDebt: totalDebtAtTime,
        remainingDebt: totalDebtAtTime,
        repaidAmount: totalDebt - totalDebtAtTime
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
      priorityChartData
    };
  }, [debts, income, getRepaidAmountForDebt]);

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

  const handleSubmit = (e: React.FormEvent) => {
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
    };

    if (editingDebt) {
      updateDebt(editingDebt.id, debtData);
      setEditingDebt(null);
    } else {
      addDebt(debtData);
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
    });
    setFormErrors({});
    setIsAddDebtModalOpen(false);
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
    });
    setIsAddDebtModalOpen(true);
  };

  const handleDeleteDebt = (debtId: string) => {
    removeDebt(debtId);
  };

  const getDebtToIncomeStatus = (ratio: number) => {
    if (ratio <= 20) return { status: "Good", color: "text-primary", bg: "bg-primary/10" };
    if (ratio <= 40) return { status: "Caution", color: "text-orange-600", bg: "bg-orange-100" };
    return { status: "High Risk", color: "text-red-600", bg: "bg-red-100" };
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
        <div className="relative container mx-auto px-6 py-24">
          <motion.div variants={itemVariants} className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-6">
              <CreditCard className="h-8 w-8 text-primary" />
              <h1 className="text-4xl md:text-6xl font-bold text-primary">
                Debt Management
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Track your debts, analyze repayment strategies, and work towards financial freedom
            </p>
          </motion.div>

          {/* Key Metrics */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Debt</p>
                    <p className="text-2xl font-bold">£{debtData.totalDebt.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

                         <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
               <CardContent className="p-6">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-primary/10 rounded-lg">
                     <TrendingDown className="h-6 w-6 text-primary" />
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground">Remaining</p>
                     <p className="text-2xl font-bold">£{debtData.totalRemaining.toFixed(2)}</p>
                   </div>
                 </div>
               </CardContent>
             </Card>

                         <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
               <CardContent className="p-6">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-primary/10 rounded-lg">
                     <Calendar className="h-6 w-6 text-primary" />
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground">Monthly Payments</p>
                     <p className="text-2xl font-bold">£{debtData.totalMonthlyPayments.toFixed(2)}</p>
                   </div>
                 </div>
               </CardContent>
             </Card>

                         <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
               <CardContent className="p-6">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-primary/10 rounded-lg">
                     <Percent className="h-6 w-6 text-primary" />
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground">Avg Interest</p>
                     <p className="text-2xl font-bold">{debtData.averageInterestRate.toFixed(1)}%</p>
                   </div>
                 </div>
               </CardContent>
             </Card>
          </motion.div>
        </div>
      </section>

             <div className="container mx-auto px-6 pb-12">
         {/* Instructions */}
         <motion.section variants={itemVariants} className="mb-8 mt-16">
           <Card className="bg-orange-50 border-orange-200">
             <CardContent className="p-6">
               <div className="flex items-start gap-3">
                 <div className="p-2 bg-orange-100 rounded-lg">
                   <CreditCard className="h-5 w-5 text-orange-600" />
                 </div>
                 <div>
                   <h3 className="font-semibold text-orange-900 mb-2">Debt Management Guide</h3>
                   <div className="space-y-2 text-sm text-orange-800">
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

         {/* Charts Section */}
         <motion.section variants={itemVariants} className="mb-8 mt-16">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {/* Debt Reduction Over Time */}
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <TrendingDown className="h-5 w-5" />
                   Debt Reduction Over Time
                 </CardTitle>
                 <CardDescription>
                   Your debt balance decreasing over time
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 {false ? (
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
                     className="h-64"
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
                     <div className="h-64 flex items-center justify-center text-muted-foreground">
                       <div className="text-center">
                         <TrendingDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                         <p>Need 3+ months of data</p>
                         <p className="text-sm">Create at least 3 budgets with debts to see your debt reduction progress</p>
                       </div>
                     </div>
                   )}
               </CardContent>
             </Card>

             {/* Debt by Type Chart */}
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <BarChart3 className="h-5 w-5" />
                   Debt by Type
                 </CardTitle>
                 <CardDescription>
                   Distribution of your debts by category
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 {false ? (
                   <ChartContainer
                     config={{
                       value: {
                         label: "Amount",
                         theme: {
                           light: "hsl(var(--primary))",
                           dark: "hsl(var(--primary))",
                         },
                       },
                     }}
                     className="h-64"
                   >
                     <BarChart data={debtData.debtTypeChartData}>
                       <CartesianGrid strokeDasharray="3 3" />
                       <XAxis 
                         dataKey="name" 
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
                               formatter={(value: any, name: any) => [`£${value.toFixed(2)}`, 'Amount']}
                             />
                           );
                         }}
                       />
                       <Bar 
                         dataKey="value" 
                         radius={[4, 4, 0, 0]}
                       />
                     </BarChart>
                   </ChartContainer>
                                    ) : (
                     <div className="h-64 flex items-center justify-center text-muted-foreground">
                       <div className="text-center">
                         <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                         <p>No debts added yet</p>
                         <p className="text-sm">Add your first debt to see the breakdown by type</p>
                       </div>
                     </div>
                   )}
               </CardContent>
             </Card>
           </div>
         </motion.section>

         {/* Debt Analysis & Management */}
         <motion.section variants={itemVariants} className="mb-8">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="debts" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                My Debts
              </TabsTrigger>
              <TabsTrigger value="analysis" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Analysis
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Insights
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Debt Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Debt Progress
                    </CardTitle>
                    <CardDescription>
                      Your overall debt reduction progress
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Repaid</span>
                        <span className="font-semibold">£{debtData.totalRepaid.toFixed(2)}</span>
                      </div>
                      <Progress 
                        value={(debtData.totalRepaid / debtData.totalDebt) * 100} 
                        className="h-3" 
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0%</span>
                        <span>{((debtData.totalRepaid / debtData.totalDebt) * 100).toFixed(1)}%</span>
                        <span>100%</span>
                      </div>
                    </div>
                    
                    <Separator />
                    
                                         <div className="grid grid-cols-2 gap-4">
                       <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
                         <div className="text-2xl font-bold">
                           £{debtData.totalRepaid.toFixed(2)}
                         </div>
                         <div className="text-sm text-muted-foreground">Total Repaid</div>
                       </div>
                       <div className="text-center p-4 rounded-lg bg-muted border border-border">
                         <div className="text-2xl font-bold text-muted-foreground">
                           £{debtData.totalRemaining.toFixed(2)}
                         </div>
                         <div className="text-sm text-muted-foreground">Remaining</div>
                       </div>
                     </div>
                  </CardContent>
                </Card>

                {/* Debt to Income Ratio */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Debt to Income Ratio
                    </CardTitle>
                    <CardDescription>
                      Monthly debt payments vs income
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center">
                      <div className={cn(
                        "text-4xl font-bold mb-2",
                        getDebtToIncomeStatus(debtData.debtToIncomeRatio).color
                      )}>
                        {debtData.debtToIncomeRatio.toFixed(1)}%
                      </div>
                      <Badge className={cn(
                        "text-sm",
                        getDebtToIncomeStatus(debtData.debtToIncomeRatio).bg
                      )}>
                        {getDebtToIncomeStatus(debtData.debtToIncomeRatio).status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Monthly Payments</span>
                        <span className="font-semibold">£{debtData.totalMonthlyPayments.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Monthly Income</span>
                        <span className="font-semibold">£{income.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="text-sm text-muted-foreground mb-2">
                        <strong>Recommendations:</strong>
                      </div>
                      <ul className="text-xs space-y-1 text-muted-foreground">
                        <li>• Keep ratio below 20% for optimal financial health</li>
                        <li>• Consider debt consolidation if ratio exceeds 40%</li>
                        <li>• Focus on high-interest debts first</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* My Debts Tab */}
            <TabsContent value="debts" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">My Debts</h2>
                <Dialog open={isAddDebtModalOpen} onOpenChange={setIsAddDebtModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90">
                      <Plus className="h-4 w-4 mr-2" />
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
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg", DEBT_TYPES[debt.debtType]?.color?.replace('text-', 'bg-').replace('-500', '-100') || 'bg-gray-100')}>
                              {DEBT_TYPES[debt.debtType]?.icon || <FileText className="h-4 w-4" />}
                            </div>
                                                         <div>
                               <h3 className="font-semibold text-lg">{debt.name}</h3>
                               <p className="text-sm text-muted-foreground">
                                 {DEBT_TYPES[debt.debtType]?.label || 'Other'} • {(debt.interestRate || 0).toFixed(1)}% APR
                               </p>
                             </div>
                          </div>
                          
                                                     <div className="flex items-center gap-2">
                             <Badge className={PRIORITY_COLORS[debt.priority] || PRIORITY_COLORS.medium}>
                               {(debt.priority || 'medium').charAt(0).toUpperCase() + (debt.priority || 'medium').slice(1)} Priority
                             </Badge>
                                                         {debt.isComplete && (
                               <Badge className="bg-primary/10 text-primary border-primary/20">
                                 <CheckCircle className="h-3 w-3 mr-1" />
                                 Complete
                               </Badge>
                             )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Amount</p>
                            <p className="font-semibold">£{debt.totalAmount.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Monthly Payment</p>
                            <p className="font-semibold">£{debt.monthlyRepayment.toFixed(2)}</p>
                          </div>
                                                     <div>
                             <p className="text-sm text-muted-foreground">Amount Repaid</p>
                             <p className="font-semibold">£{debt.repaidAmount.toFixed(2)}</p>
                           </div>
                           <div>
                             <p className="text-sm text-muted-foreground">Remaining</p>
                             <p className="font-semibold text-muted-foreground">£{debt.remainingAmount.toFixed(2)}</p>
                           </div>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{debt.progress.toFixed(1)}%</span>
                          </div>
                          <Progress value={Math.min(debt.progress, 100)} className="h-2" />
                        </div>
                        
                        {!debt.isComplete && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Timer className="h-4 w-4" />
                            <span>
                              {debt.monthsRemaining} months remaining at current rate
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditDebt(debt)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                       <div className="text-center py-8">
                         <Percent className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                         <h3 className="text-lg font-semibold mb-2">No Interest-Bearing Debts</h3>
                         <p className="text-muted-foreground mb-4">
                           You don't have any debts with interest rates. This is great for your financial health!
                         </p>
                         <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                           <p className="text-sm text-muted-foreground">
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
    </motion.div>
  );
}
