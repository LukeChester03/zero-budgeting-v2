"use client";

import { motion } from "framer-motion";
import { useFirebaseStore } from "@/lib/store-firebase";
import { useAuth } from "@/lib/auth-context";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  PiggyBank, 
  BarChart3, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight,
  Trash2,
  Eye,
  EyeOff,
  Filter,
  Search,
  Plus,
  History,
  Award,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { budgetTemplate } from "@/app/utils/template";
import { useRouter } from "next/navigation";

// Motion variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 200, damping: 25 },
  },
};

export default function PreviousBudgetsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const budgets = useFirebaseStore((s) => s.budgets);
  const deleteBudget = useFirebaseStore((s) => s.deleteBudget);
  const getBudgetTotal = useFirebaseStore((s) => s.getBudgetTotal);
  const getBudgetRemaining = useFirebaseStore((s) => s.getBudgetRemaining);
  
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);
  const [showRemaining, setShowRemaining] = useState(true);
  const [sortBy, setSortBy] = useState<"date" | "income" | "savings" | "efficiency">("date");

  // Get savings categories
  const savingsCategories = budgetTemplate.find(group => group.title === "Savings & Investments")?.categories || [];

  // Sort budgets based on selected criteria
  const sortedBudgets = useMemo(() => {
    const sorted = [...budgets];
    switch (sortBy) {
      case "date":
        return sorted.sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime());
      case "income":
        return sorted.sort((a, b) => b.income - a.income);
      case "savings":
        return sorted.sort((a, b) => {
          const aSavings = a.allocations
            .filter(allocation => savingsCategories.includes(allocation.category))
            .reduce((sum, allocation) => sum + allocation.amount, 0);
          const bSavings = b.allocations
            .filter(allocation => savingsCategories.includes(allocation.category))
            .reduce((sum, allocation) => sum + allocation.amount, 0);
          return bSavings - aSavings;
        });
      case "efficiency":
        return sorted.sort((a, b) => {
          const aEfficiency = (getBudgetTotal(a.allocations) / a.income) * 100;
          const bEfficiency = (getBudgetTotal(b.allocations) / b.income) * 100;
          return bEfficiency - aEfficiency;
        });
      default:
        return sorted;
    }
  }, [budgets, sortBy, getBudgetRemaining, getBudgetTotal, savingsCategories]);

  // Calculate insights
  const insights = useMemo(() => {
    if (budgets.length === 0) return null;

    const totalIncome = budgets.reduce((sum, b) => sum + b.income, 0);
    const totalAllocated = budgets.reduce((sum, b) => sum + getBudgetTotal(b.allocations), 0);
    const avgIncome = totalIncome / budgets.length;
    
    // Calculate actual savings (from Savings category)
    const totalSavings = budgets.reduce((sum, b) => {
      const savingsAmount = b.allocations
        .filter(a => savingsCategories.includes(a.category))
        .reduce((catSum, a) => catSum + a.amount, 0);
      return sum + savingsAmount;
    }, 0);
    
    // Calculate budget adherence (how well they stuck to their planned budget)
    const budgetAdherence = budgets.reduce((sum, b) => {
      const plannedTotal = getBudgetTotal(b.allocations);
      const actualTotal = b.income; // Since system forces full allocation
      const adherence = (plannedTotal / actualTotal) * 100;
      return sum + adherence;
    }, 0) / budgets.length;
    
    // Find best and worst months based on savings
    const budgetSavings = budgets.map(b => ({
      budget: b,
      savings: b.allocations
        .filter(a => savingsCategories.includes(a.category))
        .reduce((sum, a) => sum + a.amount, 0),
      savingsRate: (b.allocations
        .filter(a => savingsCategories.includes(a.category))
        .reduce((sum, a) => sum + a.amount, 0) / b.income) * 100
    }));
    
    const bestMonth = budgetSavings.reduce((best, current) => 
      current.savingsRate > best.savingsRate ? current : best
    );
    
    const worstMonth = budgetSavings.reduce((worst, current) => 
      current.savingsRate < worst.savingsRate ? current : worst
    );

    return {
      totalIncome,
      totalAllocated,
      totalSavings,
      avgIncome,
      avgBudgetAdherence: budgetAdherence,
      bestMonth: bestMonth.budget,
      worstMonth: worstMonth.budget,
      totalMonths: budgets.length,
      avgSavingsRate: (totalSavings / totalIncome) * 100
    };
  }, [budgets, getBudgetTotal, savingsCategories]);

  const handleDeleteBudget = async (budgetId: string) => {
    try {
      await deleteBudget(budgetId);
      if (selectedBudget === budgetId) {
        setSelectedBudget(null);
      }
    } catch (error) {
      console.error('Error deleting budget:', error);
      // You could add a toast notification here for error feedback
    }
  };

  const getBudgetInsights = (budget: any) => {
    const totalAllocated = getBudgetTotal(budget.allocations);
    const savings = budget.allocations
      .filter((a: any) => savingsCategories.includes(a.category))
      .reduce((sum: number, a: any) => sum + a.amount, 0);
    const savingsRate = (savings / budget.income) * 100;
    const allocationRate = (totalAllocated / budget.income) * 100;

    return {
      totalAllocated,
      savings,
      savingsRate,
      allocationRate,
      status: allocationRate <= 100 ? "under" : allocationRate > 100 ? "over" : "balanced"
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "under": return "text-green-600";
      case "over": return "text-red-600";
      default: return "text-blue-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "under": return <TrendingUp className="h-4 w-4" />;
      case "over": return <TrendingDown className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  // Check if user is authenticated
  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20"
      >
        <div className="container mx-auto px-6 py-24">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-2xl mx-auto text-center"
          >
            <motion.div variants={itemVariants}>
              <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                <CardContent className="p-12">
                  <div className="text-center space-y-6">
                    <div className="text-6xl mb-4">🔐</div>
                    <h2 className="text-2xl font-bold">Authentication Required</h2>
                    <p className="text-muted-foreground">
                      Please sign in to view your budget history.
                    </p>
                    <Button
                      onClick={() => router.push("/")}
                      size="lg"
                      className="bg-primary hover:bg-primary/90"
                    >
                      Go to Home
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  if (budgets.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20"
      >
        <div className="container mx-auto px-6 py-24">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-2xl mx-auto text-center"
          >
            <motion.div variants={itemVariants} className="mb-8">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-full">
                  <History className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-primary">
                  Budget History
                </h1>
              </div>
              <p className="text-xl text-muted-foreground">
                Track your financial journey and learn from your past budgets
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                <CardContent className="p-12">
                  <div className="text-center space-y-6">
                    <div className="text-6xl mb-4">📊</div>
                    <h2 className="text-2xl font-bold">No Budget History Yet</h2>
                    <p className="text-muted-foreground">
                      Create your first budget to start building your financial history and insights.
                    </p>
                    <Button
                      onClick={() => router.push("/budget")}
                      size="lg"
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Budget
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20"
    >
      <div className="container mx-auto px-6 py-24">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto"
        >
          {/* Hero Section */}
          <motion.div variants={itemVariants} className="mb-12">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-full">
                  <History className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-primary">
                  Budget History
                </h1>
              </div>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Analyze your financial journey, track progress, and learn from your past budgeting decisions
              </p>
            </div>
          </motion.div>

          {/* Insights Overview */}
          {insights && (
            <motion.div variants={itemVariants} className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">Total Income</span>
                    </div>
                    <div className="text-2xl font-bold">£{insights.totalIncome.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Across {insights.totalMonths} months
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Target className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">Avg. Savings Rate</span>
                    </div>
                    <div className="text-2xl font-bold">{insights.avgSavingsRate.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Average monthly savings rate
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <PiggyBank className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">Total Saved</span>
                    </div>
                    <div className="text-2xl font-bold">£{insights.totalSavings.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Total savings across all budgets
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Award className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">Best Month</span>
                    </div>
                    <div className="text-lg font-bold">{insights.bestMonth.month}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      £{insights.bestMonth.allocations
                        .filter(a => savingsCategories.includes(a.category))
                        .reduce((sum, a) => sum + a.amount, 0).toFixed(2)} saved
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Instructions */}
          <motion.div variants={itemVariants} className="mb-8">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">How to Use This Page</h3>
                    <div className="space-y-2 text-sm text-blue-800">
                      <p><strong>Overview Tab:</strong> See your overall financial performance and key metrics across all budgets.</p>
                      <p><strong>Analytics Tab:</strong> Get detailed insights into your spending patterns, savings trends, and financial recommendations.</p>
                      <p><strong>Budget Details Tab:</strong> Browse and select individual budgets to view detailed breakdowns and analytics.</p>
                      <p className="text-blue-700 font-medium">💡 Tip: Select a specific budget from the "Budget Details" tab to see detailed analytics for that month.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content */}
          <motion.div variants={itemVariants}>
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="details">Budget Details</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Budget Overview
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Sort by..." />
                          </SelectTrigger>
                          <SelectContent>
                                                      <SelectItem value="date">Date (Newest)</SelectItem>
                          <SelectItem value="income">Income (High to Low)</SelectItem>
                          <SelectItem value="savings">Savings Rate (High to Low)</SelectItem>
                          <SelectItem value="efficiency">Allocation Rate (High to Low)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {sortedBudgets.map((budget, index) => {
                        const insights = getBudgetInsights(budget);
                        return (
                          <motion.div
                            key={budget.id}
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            transition={{ delay: index * 0.1 }}
                          >
                            <Card 
                              className={cn(
                                "hover:shadow-lg transition-all duration-300 cursor-pointer",
                                selectedBudget === budget.id && "ring-2 ring-primary"
                              )}
                              onClick={() => setSelectedBudget(selectedBudget === budget.id ? null : budget.id)}
                            >
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <CardTitle className="text-lg">{budget.month}</CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                      £{budget.income.toFixed(2)} income
                                    </p>
                                  </div>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Trash2 className="h-4 w-4" />
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
                                        <AlertDialogAction 
                                          onClick={() => handleDeleteBudget(budget.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Allocated</span>
                                    <span className="font-medium">£{insights.totalAllocated.toFixed(2)}</span>
                                  </div>
                                  <Progress value={insights.allocationRate} className="h-2" />
                                  <div className="text-xs text-muted-foreground">
                                    {insights.allocationRate.toFixed(1)}% of income
                                  </div>
                                </div>

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {getStatusIcon(insights.status)}
                                    <span className={cn("text-sm font-medium", getStatusColor(insights.status))}>
                                      {insights.status === "under" ? "Under Budget" : 
                                       insights.status === "over" ? "Over Budget" : "Balanced"}
                                    </span>
                                  </div>
                                  <span className={cn("text-sm font-bold", getStatusColor(insights.status))}>
                                    {insights.allocationRate.toFixed(1)}%
                                  </span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Savings Rate</span>
                                  <span className="font-medium text-green-600">
                                    {insights.savingsRate.toFixed(1)}%
                                  </span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Savings Amount</span>
                                  <span className="font-medium text-green-600">
                                    £{insights.savings.toFixed(2)}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Income Trends
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {sortedBudgets.slice(0, 6).map((budget, index) => {
                          const prevBudget = sortedBudgets[index + 1];
                          const change = prevBudget ? ((budget.income - prevBudget.income) / prevBudget.income) * 100 : 0;
                          
                          return (
                            <div key={budget.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div>
                                <div className="font-medium">{budget.month}</div>
                                <div className="text-sm text-muted-foreground">£{budget.income.toFixed(2)}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                {change !== 0 && (
                                  <>
                                    {change > 0 ? (
                                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                                    )}
                                    <span className={cn("text-sm font-medium", change > 0 ? "text-green-600" : "text-red-600")}>
                                      {Math.abs(change).toFixed(1)}%
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChart className="h-5 w-5" />
                        Savings Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {sortedBudgets.slice(0, 6).map((budget) => {
                          const insights = getBudgetInsights(budget);
                          const savingsRate = (insights.savings / budget.income) * 100;
                          
                          return (
                            <div key={budget.id} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{budget.month}</span>
                                <span className="text-sm text-green-600 font-medium">
                                  £{insights.savings.toFixed(2)}
                                </span>
                              </div>
                              <div className="space-y-1">
                                <Progress value={savingsRate} className="h-2" />
                                <div className="text-xs text-muted-foreground">
                                  {savingsRate.toFixed(1)}% savings rate
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-6">
                {selectedBudget && (
                  <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Budget Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const budget = budgets.find(b => b.id === selectedBudget);
                        if (!budget) return null;
                        
                        const insights = getBudgetInsights(budget);
                        const categoryGroups = budgetTemplate.map(group => ({
                          ...group,
                          allocations: budget.allocations.filter(a => 
                            group.categories.includes(a.category)
                          )
                        }));

                        return (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="space-y-2">
                                <div className="text-sm text-muted-foreground">Total Income</div>
                                <div className="text-2xl font-bold">£{budget.income.toFixed(2)}</div>
                              </div>
                              <div className="space-y-2">
                                <div className="text-sm text-muted-foreground">Allocated</div>
                                <div className="text-2xl font-bold">£{insights.totalAllocated.toFixed(2)}</div>
                                <div className="text-sm text-muted-foreground">
                                  {insights.allocationRate.toFixed(1)}% of income
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="text-sm text-muted-foreground">Savings Rate</div>
                                <div className="text-2xl font-bold text-green-600">
                                  {insights.savingsRate.toFixed(1)}%
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  £{insights.savings.toFixed(2)} saved
                                </div>
                              </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold">Category Breakdown</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {categoryGroups.map(group => {
                                  const total = group.allocations.reduce((sum, a) => sum + a.amount, 0);
                                  const percentage = (total / budget.income) * 100;
                                  
                                  if (total === 0) return null;
                                  
                                  return (
                                    <div key={group.title} className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium">{group.title}</span>
                                        <span className="text-sm font-medium">£{total.toFixed(2)}</span>
                                      </div>
                                      <Progress value={percentage} className="h-2" />
                                      <div className="text-xs text-muted-foreground">
                                        {percentage.toFixed(1)}% of income
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                )}

                {!selectedBudget && (
                  <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                    <CardContent className="p-12 text-center">
                      <EyeOff className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">Select a Budget</h3>
                      <p className="text-muted-foreground">
                        Choose a budget from the overview to see detailed breakdown and analysis
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
