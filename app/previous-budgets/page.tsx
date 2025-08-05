"use client";

import { motion } from "framer-motion";
import { useFirebaseStore, Budget, Allocation, Goal, Debt } from "@/lib/store-firebase";
import { useAuth } from "@/lib/auth-context";
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  PiggyBank, 
  BarChart3, 
  PieChart, 
  Trash2,
  Eye,
  EyeOff,
  Plus,
  Award,
  AlertCircle,
  CheckCircle,
  Table,
  List,
  CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { budgetTemplate } from "@/app/utils/template";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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
    transition: { type: "spring" as const, stiffness: 200, damping: 25 },
  },
};

function PreviousBudgetsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const budgets = useFirebaseStore((s) => s.budgets);
  const goals = useFirebaseStore((s) => s.goals);
  const debts = useFirebaseStore((s) => s.debts);
  const deleteBudget = useFirebaseStore((s) => s.deleteBudget);
  const getBudgetTotal = useFirebaseStore((s) => s.getBudgetTotal);
  const getBudgetRemaining = useFirebaseStore((s) => s.getBudgetRemaining);
  
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "income" | "savings" | "efficiency">("date");
  const [viewMode, setViewMode] = useState<"breakdown" | "table">("breakdown");

  // Helper function to handle floating-point precision when comparing to zero
  const isZero = (value: number) => Math.abs(value) < 0.01;

  // Handle URL parameters for auto-selecting budget and view mode
  useEffect(() => {
    const budgetId = searchParams.get('budget');
    const viewParam = searchParams.get('view');
    
    if (budgetId && budgets.length > 0) {
      // Check if the budget exists
      const budgetExists = budgets.some(b => b.id === budgetId);
      if (budgetExists) {
        setSelectedBudget(budgetId);
        
        // Set view mode if specified
        if (viewParam === 'breakdown') {
          setViewMode('breakdown');
        }
        
        // Clear URL parameters after setting state
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('budget');
        newUrl.searchParams.delete('view');
        router.replace(newUrl.pathname, { scroll: false });
      }
    }
  }, [searchParams, budgets, router]);

  // Get savings categories
  const savingsCategories = useMemo(() => {
    return budgetTemplate.find(group => group.title === "Savings & Investments")?.categories || [];
  }, []);

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
  }, [budgets, sortBy, getBudgetTotal, savingsCategories]);

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

  const getBudgetInsights = (budget: Budget) => {
    const totalAllocated = getBudgetTotal(budget.allocations);
    const remaining = getBudgetRemaining(budget.allocations, budget.income);
    const savings = budget.allocations
      .filter((a: Allocation) => savingsCategories.includes(a.category))
      .reduce((sum: number, a: Allocation) => sum + a.amount, 0);
    const savingsRate = (savings / budget.income) * 100;
    const allocationRate = (totalAllocated / budget.income) * 100;

    // Use the same logic as BudgetForm.tsx for consistent status calculation
    let status: string;
    if (isZero(remaining)) {
      status = "balanced";
    } else if (remaining > 0) {
      status = "under";
    } else {
      status = "over";
    }

    return {
      totalAllocated,
      savings,
      savingsRate,
      allocationRate,
      remaining,
      status
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

  // Enhanced analytics functions
  const getSavingsTrend = (budgets: Budget[]) => {
    return budgets.slice(0, 6).map(budget => {
      const insights = getBudgetInsights(budget);
      return {
        month: budget.month,
        savings: insights.savings,
        savingsRate: insights.savingsRate,
        totalAllocated: insights.totalAllocated,
        allocationRate: insights.allocationRate
      };
    }).reverse();
  };

  const getCategoryBreakdown = (budgets: Budget[]) => {
    const latestBudget = budgets[0];
    if (!latestBudget) return [];
    
    const categoryTotals: { [key: string]: number } = {};
    latestBudget.allocations.forEach((allocation: Allocation) => {
      // Skip savings, investments, goals, and debts - they're not regular expenses
      if (allocation.category === "Emergency Fund" || 
          allocation.category === "Investments" || 
          allocation.category === "Pension" ||
          // Check if it's a goal (goals are stored by their title)
          goals.some(g => g.title === allocation.category) ||
          // Check if it's a debt (debts are stored by their name)
          debts.some(d => d.name === allocation.category)) {
        return;
      }
      
      const group = budgetTemplate.find(g => g.categories.includes(allocation.category));
      const groupName = group?.title || "Other";
      categoryTotals[groupName] = (categoryTotals[groupName] || 0) + allocation.amount;
    });
    
    return Object.entries(categoryTotals)
      .filter(([, amount]) => amount > 0)
      .map(([category, amount]) => ({
        name: category,
        value: amount,
        percentage: (amount / latestBudget.income) * 100
      }))
      .sort((a, b) => b.value - a.value);
  };

  const getBudgetEfficiency = (budgets: Budget[]) => {
    return budgets.slice(0, 6).map(budget => {
      const insights = getBudgetInsights(budget);
      return {
        month: budget.month,
        efficiency: insights.allocationRate,
        savingsRate: insights.savingsRate,
        overBudget: insights.status === "over"
      };
    }).reverse();
  };

  const getAverageSavingsRate = (budgets: Budget[]) => {
    if (budgets.length === 0) return 0;
    const totalRate = budgets.reduce((sum, budget) => {
      const insights = getBudgetInsights(budget);
      return sum + insights.savingsRate;
    }, 0);
    return totalRate / budgets.length;
  };

  const getTotalSavings = (budgets: Budget[]) => {
    return budgets.reduce((sum, budget) => {
      const insights = getBudgetInsights(budget);
      return sum + insights.savings;
    }, 0);
  };

  const getMostExpensiveCategory = (budgets: Budget[]) => {
    const latestBudget = budgets[0];
    if (!latestBudget) return null;
    
    const categoryTotals: { [key: string]: number } = {};
    latestBudget.allocations.forEach((allocation: Allocation) => {
      // Skip savings, investments, goals, and debts - they're not regular expenses
      if (allocation.category === "Emergency Fund" || 
          allocation.category === "Investments" || 
          allocation.category === "Pension" ||
          // Check if it's a goal (goals are stored by their title)
          goals.some(g => g.title === allocation.category) ||
          // Check if it's a debt (debts are stored by their name)
          debts.some(d => d.name === allocation.category)) {
        return;
      }
      
      const group = budgetTemplate.find(g => g.categories.includes(allocation.category));
      const groupName = group?.title || "Other";
      categoryTotals[groupName] = (categoryTotals[groupName] || 0) + allocation.amount;
    });
    
    const maxCategory = Object.entries(categoryTotals)
      .reduce((max, [category, amount]) => amount > max.amount ? { category, amount } : max, { category: "", amount: 0 });
    
    return maxCategory;
  };

  const getExpenseTrend = (budgets: Budget[]) => {
    return budgets.slice(0, 6).map(budget => {
      // Calculate total expenses (excluding savings/investments, goals, and debts)
      const totalExpenses = budget.allocations.reduce((sum: number, allocation: Allocation) => {
        if (allocation.category === "Emergency Fund" || 
            allocation.category === "Investments" || 
            allocation.category === "Pension" ||
            // Check if it's a goal (goals are stored by their title)
            goals.some(g => g.title === allocation.category) ||
            // Check if it's a debt (debts are stored by their name)
            debts.some(d => d.name === allocation.category)) {
          return sum;
        }
        return sum + allocation.amount;
      }, 0);
      
      const insights = getBudgetInsights(budget);
      return {
        month: budget.month,
        expenses: totalExpenses,
        savings: insights.savings,
        expenseRate: (totalExpenses / budget.income) * 100,
        savingsRate: insights.savingsRate
      };
    }).reverse();
  };



  const getTotalGoalAllocations = (budgets: Budget[]) => {
    return budgets.reduce((sum: number, budget: Budget) => {
      return sum + budget.allocations.reduce((budgetSum: number, allocation: Allocation) => {
        if (goals.some((g: Goal) => g.title === allocation.category)) {
          return budgetSum + allocation.amount;
        }
        return budgetSum;
      }, 0);
    }, 0);
  };

  const getTotalDebtAllocations = (budgets: Budget[]) => {
    return budgets.reduce((sum: number, budget: Budget) => {
      return sum + budget.allocations.reduce((budgetSum: number, allocation: Allocation) => {
        if (debts.some((d: Debt) => d.name === allocation.category)) {
          return budgetSum + allocation.amount;
        }
        return budgetSum;
      }, 0);
    }, 0);
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
            className="max-w-2xl mx-auto"
          >
            {/* Empty State Card */}
            <motion.div variants={itemVariants}>
              <Card className="bg-background/80 backdrop-blur-sm border-primary/20 shadow-xl">
                <CardContent className="p-12">
                  <div className="text-center space-y-8">
                    {/* Icon and Title */}
                    <div className="space-y-4">
                      <div className="mx-auto w-24 h-24 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center">
                        <BarChart3 className="h-12 w-12 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-foreground mb-2">
                          Start Your Financial Journey
                        </h2>
                        <p className="text-muted-foreground text-lg max-w-md mx-auto">
                          Create your first budget to begin building your financial history and gain valuable insights into your spending patterns.
                        </p>
                      </div>
                    </div>

                    {/* Benefits Grid */}
                    <div className="grid md:grid-cols-3 gap-6 mt-8">
                      <Card className="bg-muted/30 border-muted">
                        <CardContent className="p-6 text-center">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <TrendingUp className="h-6 w-6 text-primary" />
                          </div>
                          <h3 className="font-semibold mb-2">Track Progress</h3>
                          <p className="text-sm text-muted-foreground">
                            Monitor your savings growth and debt reduction over time
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-muted/30 border-muted">
                        <CardContent className="p-6 text-center">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <PieChart className="h-6 w-6 text-primary" />
                          </div>
                          <h3 className="font-semibold mb-2">Gain Insights</h3>
                          <p className="text-sm text-muted-foreground">
                            Analyze spending patterns and identify areas for improvement
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-muted/30 border-muted">
                        <CardContent className="p-6 text-center">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Target className="h-6 w-6 text-primary" />
                          </div>
                          <h3 className="font-semibold mb-2">Set Goals</h3>
                          <p className="text-sm text-muted-foreground">
                            Create and track financial goals with detailed progress metrics
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Call to Action */}
                    <div className="space-y-4 pt-6">
                      <Button
                        onClick={() => router.push("/budget")}
                        size="lg"
                        className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 h-auto"
                      >
                        <Plus className="h-5 w-5 mr-3" />
                        Create Your First Budget
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        It only takes a few minutes to set up your first budget
                      </p>
                    </div>
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
      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-24">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8 sm:space-y-12"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
              <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-primary">
                Budget History
              </h1>
            </div>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
              Analyze your financial journey, track progress, and learn from your past budgeting decisions
            </p>
          </motion.div>

          {/* Insights Overview */}
          {insights && (
            <motion.div variants={itemVariants} className="mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      <span className="text-xs sm:text-sm font-medium text-muted-foreground">Total Income</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold">£{insights.totalIncome.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Across {insights.totalMonths} months
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      <span className="text-xs sm:text-sm font-medium text-muted-foreground">Avg. Savings Rate</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold">{insights.avgSavingsRate.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Average monthly savings rate
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <PiggyBank className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      <span className="text-xs sm:text-sm font-medium text-muted-foreground">Total Saved</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold">£{insights.totalSavings.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Total savings across all budgets
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Award className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      <span className="text-xs sm:text-sm font-medium text-muted-foreground">Best Month</span>
                    </div>
                    <div className="text-lg sm:text-xl font-bold">{insights.bestMonth.month}</div>
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
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">How to Use This Page</h3>
                    <div className="space-y-2 text-xs sm:text-sm text-blue-800">
                      <p><strong>Overview Tab:</strong> See your overall financial performance and key metrics across all budgets.</p>
                      <p><strong>Analytics Tab:</strong> Get detailed insights into your spending patterns, savings trends, and financial recommendations.</p>
                      <p><strong>Budget Details Tab:</strong> Browse and select individual budgets to view detailed breakdowns and analytics.</p>
                      <p className="text-blue-700 font-medium">💡 Tip: Select a specific budget from the &quot;Budget Details&quot; tab to see detailed analytics for that month.</p>
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
                        <Select value={sortBy} onValueChange={(value: string) => setSortBy(value as "date" | "income" | "savings" | "efficiency")}>
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
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <PiggyBank className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-green-700 font-medium">Total Savings</p>
                          <p className="text-2xl font-bold text-green-800">
                            £{getTotalSavings(sortedBudgets).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Target className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-blue-700 font-medium">Avg Savings Rate</p>
                          <p className="text-2xl font-bold text-blue-800">
                            {getAverageSavingsRate(sortedBudgets).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <BarChart3 className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-purple-700 font-medium">Budgets Created</p>
                          <p className="text-2xl font-bold text-purple-800">
                            {sortedBudgets.length}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <DollarSign className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-orange-700 font-medium">Top Category</p>
                          <p className="text-lg font-bold text-orange-800">
                            {getMostExpensiveCategory(sortedBudgets)?.category || "N/A"}
                          </p>
                          <p className="text-xs text-orange-600">
                            £{getMostExpensiveCategory(sortedBudgets)?.amount.toFixed(2) || "0.00"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Target className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-green-700 font-medium">Goal Allocations</p>
                          <p className="text-2xl font-bold text-green-800">
                            £{getTotalGoalAllocations(sortedBudgets).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <CreditCard className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm text-red-700 font-medium">Debt Allocations</p>
                          <p className="text-2xl font-bold text-red-800">
                            £{getTotalDebtAllocations(sortedBudgets).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Savings Trend Chart */}
                  <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Savings Trend
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={getSavingsTrend(sortedBudgets)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="month" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => value.split(' ')[0]}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip 
                            formatter={(value: number) => [`£${value.toFixed(2)}`, 'Savings']}
                            labelFormatter={(label) => `Month: ${label}`}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="savings" 
                            stroke="#10b981" 
                            fill="#10b981" 
                            fillOpacity={0.3}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Budget Efficiency Chart */}
                  <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Budget Efficiency
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={getBudgetEfficiency(sortedBudgets)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="month" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => value.split(' ')[0]}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip 
                            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Rate']}
                            labelFormatter={(label) => `Month: ${label}`}
                          />
                          <Bar dataKey="efficiency" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="savingsRate" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="flex items-center justify-center gap-4 mt-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded"></div>
                          <span className="text-sm text-muted-foreground">Allocation Rate</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded"></div>
                          <span className="text-sm text-muted-foreground">Savings Rate</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Category Breakdown Pie Chart */}
                  <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <RechartsPieChart className="h-5 w-5" />
                        Category Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                          <Pie
                            data={getCategoryBreakdown(sortedBudgets)}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                            labelLine={false}
                          >
                            {getCategoryBreakdown(sortedBudgets).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={[
                                '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
                                '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
                              ][index % 8]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [`£${value.toFixed(2)}`, 'Amount']} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Goal & Debt Allocations Chart */}
                  <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Goal & Debt Allocations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={getSavingsTrend(sortedBudgets)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="month" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => value.split(' ')[0]}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip 
                            formatter={(value: number) => [`£${value.toFixed(2)}`, 'Amount']}
                            labelFormatter={(label) => `Month: ${label}`}
                          />
                          <Bar dataKey="totalAllocated" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="savings" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="flex items-center justify-center gap-4 mt-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded"></div>
                          <span className="text-sm text-muted-foreground">Total Allocated</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded"></div>
                          <span className="text-sm text-muted-foreground">Savings</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Monthly Comparison */}
                  <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Expense vs Savings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={getExpenseTrend(sortedBudgets)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="month" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => value.split(' ')[0]}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip 
                            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Rate']}
                            labelFormatter={(label) => `Month: ${label}`}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="expenseRate" 
                            stroke="#ef4444" 
                            strokeWidth={3}
                            dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                            name="Expense Rate"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="savingsRate" 
                            stroke="#10b981" 
                            strokeWidth={3}
                            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                            name="Savings Rate"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                      <div className="flex items-center justify-center gap-4 mt-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded"></div>
                          <span className="text-sm text-muted-foreground">Expense Rate</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded"></div>
                          <span className="text-sm text-muted-foreground">Savings Rate</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Insights Section */}
                <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Financial Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-green-700">Savings Performance</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Best Month</span>
                            <span className="font-medium">
                              {getSavingsTrend(sortedBudgets).reduce((max, item) => 
                                item.savingsRate > max.savingsRate ? item : max
                              ).month}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Average Monthly Savings</span>
                            <span className="font-medium">
                              £{(getTotalSavings(sortedBudgets) / Math.max(sortedBudgets.length, 1)).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total Saved</span>
                            <span className="font-medium text-green-600">
                              £{getTotalSavings(sortedBudgets).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Goal Allocations</span>
                            <span className="font-medium text-green-600">
                              £{getTotalGoalAllocations(sortedBudgets).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold text-red-700">Expense Analysis</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Average Monthly Expenses</span>
                            <span className="font-medium">
                              £{(getExpenseTrend(sortedBudgets).reduce((sum, item) => sum + item.expenses, 0) / Math.max(sortedBudgets.length, 1)).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Largest Expense Category</span>
                            <span className="font-medium">
                              {getMostExpensiveCategory(sortedBudgets)?.category || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Expense Categories</span>
                            <span className="font-medium">
                              {getCategoryBreakdown(sortedBudgets).length}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Debt Allocations</span>
                            <span className="font-medium text-red-600">
                              £{getTotalDebtAllocations(sortedBudgets).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold text-blue-700">Budget Management</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Consistency Score</span>
                            <span className="font-medium">
                              {((sortedBudgets.filter(budget => {
                                const insights = getBudgetInsights(budget);
                                return insights.allocationRate >= 90 && insights.allocationRate <= 110;
                              }).length / Math.max(sortedBudgets.length, 1)) * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Over-Budget Months</span>
                            <span className="font-medium text-red-600">
                              {sortedBudgets.filter(budget => {
                                const insights = getBudgetInsights(budget);
                                return insights.status === "over";
                              }).length}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total Budgets</span>
                            <span className="font-medium">
                              {sortedBudgets.length}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Active Goals</span>
                            <span className="font-medium">
                              {goals.filter(g => g.isActive).length}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Active Debts</span>
                            <span className="font-medium">
                              {debts.filter(d => d.isActive).length}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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

                        // Add goals and debts as separate groups
                        const goalAllocations = budget.allocations.filter(a => 
                          goals.some(g => g.title === a.category)
                        );
                        const debtAllocations = budget.allocations.filter(a => 
                          debts.some(d => d.name === a.category)
                        );

                        const allGroups = [
                          ...categoryGroups,
                          ...(goalAllocations.length > 0 ? [{
                            title: "Goals",
                            categories: goalAllocations.map(a => a.category),
                            allocations: goalAllocations
                          }] : []),
                          ...(debtAllocations.length > 0 ? [{
                            title: "Debts", 
                            categories: debtAllocations.map(a => a.category),
                            allocations: debtAllocations
                          }] : [])
                        ];

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
                              <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Category Breakdown</h3>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant={viewMode === "breakdown" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setViewMode("breakdown")}
                                    className="flex items-center gap-2"
                                  >
                                    <List className="h-4 w-4" />
                                    Breakdown
                                  </Button>
                                  <Button
                                    variant={viewMode === "table" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setViewMode("table")}
                                    className="flex items-center gap-2"
                                  >
                                    <Table className="h-4 w-4" />
                                    Table
                                  </Button>
                                </div>
                              </div>

                              {viewMode === "breakdown" ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {allGroups.map(group => {
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
                              ) : (
                                <div className="space-y-4">
                                  <div className="rounded-lg border">
                                    <div className="bg-muted/50 px-4 py-3 border-b">
                                      <h4 className="font-medium">All Expenses</h4>
                                    </div>
                                    <div className="overflow-hidden">
                                      <table className="w-full">
                                        <thead className="bg-muted/30">
                                          <tr>
                                            <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                                              Category
                                            </th>
                                            <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                                              Group
                                            </th>
                                            <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">
                                              Amount
                                            </th>
                                            <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">
                                              % of Income
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                          {budget.allocations
                                            .filter(allocation => allocation.amount > 0)
                                            .sort((a, b) => b.amount - a.amount)
                                            .map((allocation, index) => {
                                              const percentage = (allocation.amount / budget.income) * 100;
                                              const categoryGroup = categoryGroups.find(group => 
                                                group.categories.includes(allocation.category)
                                              );
                                              
                                              // Check if it's a goal or debt
                                              const isGoal = goals.some(g => g.title === allocation.category);
                                              const isDebt = debts.some(d => d.name === allocation.category);
                                              
                                              let groupTitle = categoryGroup?.title || "Other";
                                              if (isGoal) groupTitle = "Goals";
                                              if (isDebt) groupTitle = "Debts";
                                              
                                              return (
                                                <tr key={index} className="hover:bg-muted/30 transition-colors">
                                                  <td className="px-4 py-3">
                                                    <div className="font-medium">{allocation.category}</div>
                                                  </td>
                                                  <td className="px-4 py-3">
                                                    <div className="text-sm text-muted-foreground">
                                                      {groupTitle}
                                                    </div>
                                                  </td>
                                                  <td className="px-4 py-3 text-right">
                                                    <div className="font-medium">£{allocation.amount.toFixed(2)}</div>
                                                  </td>
                                                  <td className="px-4 py-3 text-right">
                                                    <div className="text-sm text-muted-foreground">
                                                      {percentage.toFixed(1)}%
                                                    </div>
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                  
                                  <div className="text-sm text-muted-foreground text-center">
                                    {budget.allocations.filter(a => a.amount > 0).length} categories • 
                                    Total: £{budget.allocations.reduce((sum, a) => sum + a.amount, 0).toFixed(2)}
                                  </div>
                                </div>
                              )}
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

export default function PreviousBudgetsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading previous budgets...</p>
        </div>
      </div>
    }>
      <PreviousBudgetsContent />
    </Suspense>
  );
}
