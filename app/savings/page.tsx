"use client";

import React, { useMemo, useState } from "react";
import { motion, Variants } from "framer-motion";
import { useFirebaseStore } from "@/lib/store-firebase";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  PiggyBank, 
  TrendingUp, 
  Target, 
  Calendar,
  Clock,
  Sparkles,
  BarChart3,
  Goal,
  AlertCircle,
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
import { PieChart } from "recharts";
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

// Icon map for goal types
const GOAL_ICONS = {
  emergency: { icon: <LifeBuoy className="h-4 w-4" />, label: "Emergency" },
  vacation: { icon: <Umbrella className="h-4 w-4" />, label: "Vacation" },
  car: { icon: <Car className="h-4 w-4" />, label: "Car" },
  home: { icon: <Home className="h-4 w-4" />, label: "Home" },
  piggy: { icon: <PiggyBank className="h-4 w-4" />, label: "Savings" },
} as const;

type GoalIconKey = keyof typeof GOAL_ICONS;

interface GoalFormData {
  title: string;
  target: string;
  iconKey: GoalIconKey;
  targetMonth: string;
}

export default function SavingsDashboard() {
  const { user, isLoading } = useAuth();
  const budgets = useFirebaseStore((s) => s.budgets);
  const goals = useFirebaseStore((s) => s.goals);
  const income = useFirebaseStore((s) => s.income);
  const getTotalSaved = useFirebaseStore((s) => s.getTotalSaved);
  const getSavedAmountForGoal = useFirebaseStore((s) => s.getSavedAmountForGoal);
  const addGoal = useFirebaseStore((s) => s.addGoal);

  const deleteGoal = useFirebaseStore((s) => s.deleteGoal);

  // Goal form state
  const [goalForm, setGoalForm] = useState<GoalFormData>({
    title: "",
    target: "",
    iconKey: "piggy",
    targetMonth: "",
  });
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<{ title?: string; target?: string; targetMonth?: string }>({});

  // Calculate comprehensive savings data
  const savingsData = useMemo(() => {
    // Get all savings-related categories from budgets
    const allSavingsCategories = new Set<string>();
    budgets.forEach(budget => {
      budget.allocations.forEach(allocation => {
        if (allocation.category.toLowerCase().includes('savings') || 
            allocation.category.toLowerCase().includes('emergency') ||
            allocation.category.toLowerCase().includes('investment') ||
            allocation.category.toLowerCase().includes('pension') ||
            allocation.category.toLowerCase().includes('goal')) {
          allSavingsCategories.add(allocation.category);
        }
      });
    });
    
    const savingsCategories = Array.from(allSavingsCategories);
    const totalSaved = getTotalSaved();
    
    // Calculate monthly average savings from actual budget data
    const monthlySavings = budgets.length > 0 
      ? totalSaved / budgets.length 
      : 0;
    
    // Calculate savings rate based on total income across all budgets
    const totalIncome = budgets.reduce((sum, budget) => sum + budget.income, 0);
    const savingsRate = totalIncome > 0 ? (totalSaved / totalIncome) * 100 : 0;
    
    // Calculate projections based on current monthly savings
    const monthlyProjection = monthlySavings * 12; // Annual projection
    const sixMonthProjection = monthlySavings * 6;
    const oneYearProjection = monthlySavings * 12;
    
    // Calculate category breakdown from actual budget data
    const categoryBreakdown = savingsCategories.map(category => {
      const amount = budgets.reduce((sum, budget) => {
        const allocation = budget.allocations.find(a => a.category === category);
        return sum + (allocation?.amount || 0);
      }, 0);
      return { 
        category, 
        amount, 
        percentage: totalSaved > 0 ? (amount / totalSaved) * 100 : 0 
      };
    }).filter(item => item.amount > 0); // Only show categories with actual savings
    
    // Calculate trend (last 3 months vs previous 3 months)
    const recentBudgets = budgets.slice(-3);
    const previousBudgets = budgets.slice(-6, -3);
    
    const recentSavings = recentBudgets.reduce((sum, budget) => {
      const savings = budget.allocations
        .filter(alloc => savingsCategories.includes(alloc.category))
        .reduce((total, alloc) => total + alloc.amount, 0);
      return sum + savings;
    }, 0);
    
    const previousSavings = previousBudgets.reduce((sum, budget) => {
      const savings = budget.allocations
        .filter(alloc => savingsCategories.includes(alloc.category))
        .reduce((total, alloc) => total + alloc.amount, 0);
      return sum + savings;
    }, 0);
    
    const trendPercentage = previousSavings > 0 
      ? ((recentSavings - previousSavings) / previousSavings) * 100 
      : 0;
    
    // Calculate goal progress with actual saved amounts
    const goalProgress = goals.map(goal => {
      const saved = getSavedAmountForGoal(goal.title);
      const progress = goal.target > 0 ? (saved / goal.target) * 100 : 0;
      const remaining = goal.target - saved;
      const monthsToComplete = goal.monthlyContribution > 0 ? remaining / goal.monthlyContribution : 0;
      
      // Check if goal is completed
      const isCompleted = progress >= 100;
      
      return {
        ...goal,
        saved,
        progress,
        remaining,
        monthsToComplete,
        isOnTrack: goal.monthlyContribution > 0 && monthsToComplete <= 12,
        isCompleted
      };
    });

    // Prepare chart data from actual budget data
    const savingsOverTime = budgets.slice(-6).map(budget => {
      const savings = budget.allocations
        .filter(alloc => savingsCategories.includes(alloc.category))
        .reduce((total, alloc) => total + alloc.amount, 0);
      return {
        month: budget.month,
        savings: savings,
        cumulative: 0 // Will be calculated below
      };
    });

    // Calculate cumulative savings
    let cumulative = 0;
    savingsOverTime.forEach(item => {
      cumulative += item.savings;
      item.cumulative = cumulative;
    });

    // Prepare category chart data
    const categoryChartData = categoryBreakdown.map(item => ({
      name: item.category,
      value: item.amount,
      percentage: item.percentage
    }));
    
    return {
      totalSaved,
      monthlySavings,
      savingsRate,
      monthlyProjection,
      sixMonthProjection,
      oneYearProjection,
      categoryBreakdown,
      trendPercentage,
      goalProgress,
      recentSavings,
      previousSavings,
      savingsOverTime,
      categoryChartData
    };
  }, [budgets, goals, getTotalSaved, getSavedAmountForGoal]);

  // Goal form handlers
  const validateGoalForm = (): boolean => {
    const errors: { title?: string; target?: string; targetMonth?: string } = {};
    
    if (!goalForm.title.trim()) {
      errors.title = "Goal title is required";
    } else if (goals.some(g => g.title.toLowerCase() === goalForm.title.trim().toLowerCase())) {
      errors.title = "Goal title already exists";
    }
    
    const targetNum = parseFloat(goalForm.target);
    if (!goalForm.target || isNaN(targetNum) || targetNum <= 0) {
      errors.target = "Valid target amount is required";
    }
    
    if (!goalForm.targetMonth) {
      errors.targetMonth = "Target month is required";
    } else {
      const targetDate = new Date(goalForm.targetMonth + "-01");
      const currentDate = new Date();
      if (targetDate <= currentDate) {
        errors.targetMonth = "Target month must be in the future";
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateGoalForm()) return;
    
    try {
      await addGoal({
        title: goalForm.title.trim(),
        target: parseFloat(goalForm.target),
        iconKey: goalForm.iconKey,
        targetMonth: goalForm.targetMonth,
      });
      
      // Reset form
      setGoalForm({ title: "", target: "", iconKey: "piggy", targetMonth: "" });
      setFormErrors({});
      setIsGoalModalOpen(false);
    } catch (error) {
      console.error('Error adding goal:', error);
      // You could add a toast notification here for error feedback
    }
  };

  const handleInputChange = (field: keyof GoalFormData, value: string | GoalIconKey) => {
    setGoalForm(prev => ({ ...prev, [field]: value }));
    setFormErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteGoal(goalId);
    } catch (error) {
      console.error('Error deleting goal:', error);
      // You could add a toast notification here for error feedback
    }
  };

  // Check if user is authenticated
  if (isLoading) {
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
                    <div className="text-6xl mb-4">⏳</div>
                    <h2 className="text-2xl font-bold">Loading...</h2>
                    <p className="text-muted-foreground">
                      Please wait while we load your savings dashboard.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

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
                      Please sign in to view your savings dashboard.
                    </p>
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
              <PiggyBank className="h-8 w-8 text-primary" />
              <h1 className="text-4xl md:text-6xl font-bold text-primary">
                Savings Dashboard
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Track your progress, set goals, and see your financial future
            </p>
        </motion.div>

          {/* Key Metrics */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <PiggyBank className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Saved</p>
                    <p className="text-2xl font-bold">
                      £{savingsData.totalSaved > 0 ? savingsData.totalSaved.toFixed(2) : '0.00'}
                    </p>
                    {budgets.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        From {budgets.length} budget{budgets.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-background/80 backdrop-blur-sm border-green-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Average</p>
                    <p className="text-2xl font-bold text-green-600">
                      £{savingsData.monthlySavings > 0 ? savingsData.monthlySavings.toFixed(2) : '0.00'}
                    </p>
                    {budgets.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {savingsData.monthlySavings > 0 ? 'Based on your budget history' : 'No savings data yet'}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-background/80 backdrop-blur-sm border-blue-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Savings Rate</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {savingsData.savingsRate > 0 ? savingsData.savingsRate.toFixed(1) : '0.0'}%
                    </p>
                    {budgets.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {savingsData.savingsRate > 0 ? 'Of total income' : 'No savings yet'}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-background/80 backdrop-blur-sm border-purple-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Target className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Goals</p>
                    <p className="text-2xl font-bold text-purple-600">{goals.length}</p>
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
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <PiggyBank className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900 mb-2">Savings Dashboard Guide</h3>
                  <div className="space-y-2 text-sm text-green-800">
                    <p><strong>Key Metrics:</strong> Track your total savings, monthly average, savings rate, and active goals.</p>
                    <p><strong>Savings Goals:</strong> Set and track progress towards specific financial targets like emergency funds or big purchases.</p>
                    <p><strong>Progress Charts:</strong> Visualize your savings growth over time and see how your money is distributed across categories.</p>
                    <p><strong>Insights:</strong> Get personalized tips and recommendations to improve your saving habits.</p>
                    <p className="text-green-700 font-medium">💡 Tip: Create savings goals to stay motivated and track your progress towards financial milestones.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>



                 {/* Financial Analysis Charts */}
         <motion.section variants={itemVariants} className="mb-8">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                           {/* Savings Rate vs Recommended */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Savings Rate Analysis
                  </CardTitle>
                  <CardDescription>
                    Compare your savings rate to financial recommendations based on your average income
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Your Rate</span>
                      <span className="text-lg font-bold text-primary">{savingsData.savingsRate.toFixed(1)}%</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Emergency Fund (3-6 months)</span>
                        <span className="text-green-600">10-20%</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Retirement (15% rule)</span>
                        <span className="text-blue-600">15%</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">50/30/20 Rule</span>
                        <span className="text-purple-600">20%</span>
                      </div>
                    </div>
                    <div className="h-32 flex items-end justify-center gap-1">
                      <div className="w-8 bg-muted rounded-t-sm" style={{ height: '20%' }}>
                        <div className="w-full bg-green-500 rounded-t-sm" style={{ height: '10%' }}></div>
                      </div>
                      <div className="w-8 bg-muted rounded-t-sm" style={{ height: '30%' }}>
                        <div className="w-full bg-blue-500 rounded-t-sm" style={{ height: '15%' }}></div>
                      </div>
                      <div className="w-8 bg-muted rounded-t-sm" style={{ height: '40%' }}>
                        <div className="w-full bg-purple-500 rounded-t-sm" style={{ height: '20%' }}></div>
                      </div>
                      <div className="w-8 bg-primary rounded-t-sm" style={{ height: `${Math.min(savingsData.savingsRate * 2, 100)}%` }}></div>
                    </div>
                    <div className="text-center text-xs text-muted-foreground">
                      Your rate vs recommended benchmarks
                    </div>
                    {(() => {
                      // Calculate average monthly income from all budgets
                      const averageMonthlyIncome = budgets.length > 0 
                        ? budgets.reduce((sum, budget) => sum + budget.income, 0) / budgets.length 
                        : income;
                      
                      return (
                        <div className="text-center text-xs text-muted-foreground pt-2 border-t">
                          Based on £{averageMonthlyIncome.toFixed(0)} average monthly income
                        </div>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>

                           {/* Savings Velocity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Savings Velocity
                  </CardTitle>
                  <CardDescription>
                    How quickly you&apos;re building wealth
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 rounded-lg bg-green-500/10">
                        <p className="text-2xl font-bold text-green-600">£{savingsData.monthlySavings.toFixed(0)}</p>
                        <p className="text-xs text-muted-foreground">Monthly Velocity</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-blue-500/10">
                        <p className="text-2xl font-bold text-blue-600">£{(savingsData.monthlySavings * 12).toFixed(0)}</p>
                        <p className="text-xs text-muted-foreground">Annual Velocity</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {(() => {
                        // Calculate average monthly income from all budgets
                        const averageMonthlyIncome = budgets.length > 0 
                          ? budgets.reduce((sum, budget) => sum + budget.income, 0) / budgets.length 
                          : income;
                        
                        return (
                          <>
                            <div className="flex items-center justify-between text-sm">
                              <span>Emergency Fund (3 months)</span>
                              <span className="font-medium">{savingsData.monthlySavings > 0 ? (averageMonthlyIncome * 3 / savingsData.monthlySavings).toFixed(1) : '∞'} months</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>Emergency Fund (6 months)</span>
                              <span className="font-medium">{savingsData.monthlySavings > 0 ? (averageMonthlyIncome * 6 / savingsData.monthlySavings).toFixed(1) : '∞'} months</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>£10k Savings Goal</span>
                              <span className="font-medium">{savingsData.monthlySavings > 0 ? (10000 / savingsData.monthlySavings).toFixed(1) : '∞'} months</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>

                                                                                                               {/* Wealth Building Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Wealth Building Timeline
                    </CardTitle>
                    <CardDescription>
                      Your path to financial milestones based on your average monthly income
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-3">
                        {(() => {
                          // Calculate average monthly income from all budgets
                          const averageMonthlyIncome = budgets.length > 0 
                            ? budgets.reduce((sum, budget) => sum + budget.income, 0) / budgets.length 
                            : income;
                          
                          // Calculate saved amounts for each milestone category
                          const getSavedForCategory = (categoryKeywords: string[]) => {
                            return budgets.reduce((total, budget) => {
                              const categorySavings = budget.allocations
                                .filter(alloc => 
                                  categoryKeywords.some(keyword => 
                                    alloc.category.toLowerCase().includes(keyword.toLowerCase())
                                  )
                                )
                                .reduce((sum, alloc) => sum + alloc.amount, 0);
                              return total + categorySavings;
                            }, 0);
                          };
                          
                          return [
                            { 
                              milestone: `£${(averageMonthlyIncome * 3).toFixed(0)} Emergency Fund`, 
                              target: averageMonthlyIncome * 3, 
                              color: "bg-green-500",
                              description: "3 months of expenses",
                              categoryKeywords: ["emergency", "emergency fund", "emergency savings"]
                            },
                            { 
                              milestone: `£${(averageMonthlyIncome * 6).toFixed(0)} Safety Net`, 
                              target: averageMonthlyIncome * 6, 
                              color: "bg-blue-500",
                              description: "6 months of expenses",
                              categoryKeywords: ["safety", "safety net", "buffer", "reserve"]
                            },
                            { 
                              milestone: `£${(averageMonthlyIncome * 12).toFixed(0)} Foundation`, 
                              target: averageMonthlyIncome * 12, 
                              color: "bg-purple-500",
                              description: "1 year of expenses",
                              categoryKeywords: ["foundation", "long term", "long-term", "stability"]
                            },
                            { 
                              milestone: `£${(averageMonthlyIncome * 24).toFixed(0)} Wealth Building`, 
                              target: averageMonthlyIncome * 24, 
                              color: "bg-orange-500",
                              description: "2 years of expenses",
                              categoryKeywords: ["wealth", "investment", "pension", "retirement", "wealth building"]
                            }
                                                    ].map((item, index) => {
                             const savedAmount = getSavedForCategory(item.categoryKeywords);
                             const monthsToTarget = savingsData.monthlySavings > 0 ? item.target / savingsData.monthlySavings : 0;
                             const progress = Math.min((savedAmount / item.target) * 100, 100);
                             const isCompleted = progress >= 100;
                             return (
                               <div key={index} className="space-y-2">
                                 <div className="flex items-center justify-between text-sm">
                                   <div className="flex items-center gap-2">
                                     <span className="font-medium">{item.milestone}</span>
                                     {isCompleted && (
                                       <CheckCircle className="h-4 w-4 text-green-500" />
                                     )}
                                   </div>
                                   <span className={isCompleted ? "text-green-600 font-medium" : "text-muted-foreground"}>
                                     {isCompleted 
                                       ? "100% reached" 
                                       : monthsToTarget > 0 
                                         ? `${monthsToTarget.toFixed(1)} months` 
                                         : '∞'
                                     }
                                   </span>
                                 </div>
                                 <div className="w-full bg-muted rounded-full h-2">
                                   <div 
                                     className={`h-2 rounded-full ${item.color}`}
                                     style={{ width: `${progress}%` }}
                                   ></div>
                                 </div>
                                 <div className="flex justify-between text-xs text-muted-foreground">
                                   <span>{item.description}</span>
                                   <span>£{savedAmount.toFixed(0)} saved</span>
                                 </div>
                               </div>
                             );
                           });
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                           {/* Savings Efficiency Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Savings Efficiency Score
                  </CardTitle>
                  <CardDescription>
                                          How well you&apos;re optimizing your savings based on your average income
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="relative w-24 h-24 mx-auto">
                        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="hsl(var(--muted))"
                            strokeWidth="2"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="hsl(var(--primary))"
                            strokeWidth="2"
                            strokeDasharray={`${Math.min(savingsData.savingsRate * 5, 100)} 100`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xl font-bold">{Math.min(savingsData.savingsRate * 5, 100).toFixed(0)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">Efficiency Score</p>
                    </div>
                    <div className="space-y-2 text-xs">
                      {(() => {
                        // Calculate average monthly income from all budgets
                        const averageMonthlyIncome = budgets.length > 0 
                          ? budgets.reduce((sum, budget) => sum + budget.income, 0) / budgets.length 
                          : income;
                        
                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <span>Rate vs 20% Target</span>
                              <span className={savingsData.savingsRate >= 20 ? "text-green-600" : "text-orange-600"}>
                                {savingsData.savingsRate >= 20 ? "✓" : "✗"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Consistent Savings</span>
                              <span className={budgets.length >= 3 ? "text-green-600" : "text-orange-600"}>
                                {budgets.length >= 3 ? "✓" : "✗"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Goal Progress</span>
                              <span className={savingsData.goalProgress.length > 0 ? "text-green-600" : "text-orange-600"}>
                                {savingsData.goalProgress.length > 0 ? "✓" : "✗"}
                              </span>
                            </div>
                            <div className="pt-2 border-t text-center text-muted-foreground">
                              Based on £{averageMonthlyIncome.toFixed(0)} avg monthly income
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
           </div>
         </motion.section>

        {/* Category Breakdown & Goals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Category Breakdown */}
          <motion.section variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Savings Breakdown
                </CardTitle>
                <CardDescription>
                  Where your savings are allocated
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {savingsData.categoryBreakdown.length > 0 ? (
                  savingsData.categoryBreakdown.map((category) => (
                    <div key={category.category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{category.category}</span>
                        <span className="font-semibold">£{category.amount.toFixed(2)}</span>
                      </div>
                      <Progress value={category.percentage} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{category.percentage.toFixed(1)}% of total</span>
                        <span>{category.amount > 0 ? "£" + category.amount.toFixed(2) : "£0.00"}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No savings categories found</p>
                    <p className="text-xs">Add savings allocations to your budgets to see breakdown</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.section>

          {/* Goals Progress */}
          <motion.section variants={itemVariants}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Goal className="h-5 w-5" />
                    <CardTitle>Goals Progress</CardTitle>
                  </div>
                  <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-primary hover:bg-primary/90">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Goal
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Create New Savings Goal</DialogTitle>
                        <DialogDescription>
                          Set a new financial goal and track your progress towards it.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddGoal} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="goal-title">Goal Title</Label>
                          <Input
                            id="goal-title"
                            placeholder="e.g., Vacation Fund"
                            value={goalForm.title}
                            onChange={(e) => handleInputChange("title", e.target.value)}
                            className={cn(formErrors.title && "border-destructive")}
                          />
                          {formErrors.title && (
                            <p className="text-xs text-destructive">{formErrors.title}</p>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="goal-target">Target Amount</Label>
                            <Input
                              id="goal-target"
                              type="number"
                              placeholder="0.00"
                              value={goalForm.target}
                              onChange={(e) => handleInputChange("target", e.target.value)}
                              className={cn(formErrors.target && "border-destructive")}
                              min="0"
                              step="0.01"
                            />
                            {formErrors.target && (
                              <p className="text-xs text-destructive">{formErrors.target}</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="goal-icon">Icon</Label>
                            <Select
                              value={goalForm.iconKey}
                              onValueChange={(value) => handleInputChange("iconKey", value as GoalIconKey)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(GOAL_ICONS).map(([key, { label, icon }]) => (
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
                        
                        <div className="space-y-2">
                          <Label htmlFor="goal-target-month">Target Month</Label>
                          <Input
                            id="goal-target-month"
                            type="month"
                            value={goalForm.targetMonth}
                            onChange={(e) => handleInputChange("targetMonth", e.target.value)}
                            className={cn(formErrors.targetMonth && "border-destructive")}
                            min={new Date().toISOString().slice(0, 7)}
                          />
                          {formErrors.targetMonth && (
                            <p className="text-xs text-destructive">{formErrors.targetMonth}</p>
                          )}
                        </div>
                        
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsGoalModalOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" className="bg-primary hover:bg-primary/90">
                            Create Goal
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                <CardDescription>
                  Track your savings goals and progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                {savingsData.goalProgress.length > 0 ? (
                  <div className="space-y-4">
                    {savingsData.goalProgress.map((goal) => (
                      <div key={goal.id} className="relative p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                        {/* Delete Button */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2 h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Goal</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete &quot;{goal.title}&quot;? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteGoal(goal.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-primary">{GOAL_ICONS[goal.iconKey as GoalIconKey].icon}</span>
                              <span className="font-medium">{goal.title}</span>
                              {goal.isCompleted ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : goal.isOnTrack ? (
                                <Clock className="h-4 w-4 text-blue-500" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-orange-500" />
                              )}
                            </div>
                            <Badge variant={goal.isCompleted ? "default" : "secondary"}>
                              {goal.isCompleted ? "Complete" : `${goal.progress.toFixed(1)}%`}
                            </Badge>
                          </div>
                          
                          <Progress value={Math.min(goal.progress, 100)} className="h-2" />
                          
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>£{goal.saved.toFixed(2)} / £{goal.target.toFixed(2)}</span>
                            {goal.progress < 100 && (
                              <span>
                                {goal.monthsToComplete > 0 
                                  ? `${goal.monthsToComplete.toFixed(1)} months left`
                                  : "Set savings rate"
                                }
                              </span>
                            )}
                          </div>
                          
                          {/* Goal Details */}
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div>
                              <span className="font-medium">Target Month:</span>
                              <br />
                              <span>{new Date(goal.targetMonth + "-01").toLocaleDateString('en-GB', { 
                                year: 'numeric', 
                                month: 'long' 
                              })}</span>
                            </div>
                            <div>
                              <span className="font-medium">Monthly Contribution:</span>
                              <br />
                              <span>£{goal.monthlyContribution?.toFixed(2) || '0.00'}</span>
                            </div>
                          </div>
                          
                          {goal.progress < 100 && goal.remaining > 0 && (
                            <div className="text-xs text-muted-foreground">
                              <span>Remaining: £{goal.remaining.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No savings goals set</p>
                    <p className="text-sm">Create your first goal to start tracking progress</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.section>
        </div>

        {/* Insights & Recommendations */}
        <motion.section variants={itemVariants}>
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Smart Insights
              </CardTitle>
              <CardDescription>
                Personalized recommendations based on your data
              </CardDescription>
            </CardHeader>
                         <CardContent className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* Savings Rate Insight */}
                 <div className="p-4 rounded-lg bg-background/80 border">
                   <div className="flex items-center gap-2 mb-2">
                     <TrendingUp className="h-4 w-4 text-primary" />
                     <span className="font-medium">Savings Rate</span>
                   </div>
                   {income > 0 ? (
                     <>
                       <p className="text-sm text-muted-foreground mb-2">
                         You&apos;re saving {savingsData.savingsRate.toFixed(1)}% of your income
                       </p>
                       {savingsData.savingsRate < 20 ? (
                         <p className="text-xs text-orange-600">
                           💡 Consider increasing to 20% for better financial security
                         </p>
                       ) : (
                         <p className="text-xs text-green-600">
                           ✅ Excellent savings rate! Keep it up
                         </p>
                       )}
                     </>
                   ) : (
                     <>
                       <p className="text-sm text-muted-foreground mb-2">
                         Set your income to start tracking savings rate
                       </p>
                       <p className="text-xs text-blue-600">
                         💡 Aim for 20% of your income in savings
                       </p>
                     </>
                   )}
                 </div>

                 {/* Goal Progress Insight */}
                 <div className="p-4 rounded-lg bg-background/80 border">
                   <div className="flex items-center gap-2 mb-2">
                     <Target className="h-4 w-4 text-primary" />
                     <span className="font-medium">Goal Progress</span>
                   </div>
                   {goals.length > 0 ? (
                     <>
                       <p className="text-sm text-muted-foreground mb-2">
                         {savingsData.goalProgress.filter(g => g.progress >= 100).length} of {goals.length} goals completed
                       </p>
                       {savingsData.goalProgress.some(g => !g.isOnTrack && g.progress < 100) ? (
                         <p className="text-xs text-orange-600">
                           ⚠️ Some goals may need adjustment to stay on track
                         </p>
                       ) : (
                         <p className="text-xs text-green-600">
                           ✅ All goals are on track to completion
                         </p>
                       )}
                     </>
                   ) : (
                     <>
                       <p className="text-sm text-muted-foreground mb-2">
                         No savings goals set yet
                       </p>
                       <p className="text-xs text-blue-600">
                         💡 Create goals to track your progress
                       </p>
                     </>
                   )}
                 </div>

                 {/* Trend Insight */}
                 <div className="p-4 rounded-lg bg-background/80 border">
                   <div className="flex items-center gap-2 mb-2">
                     <BarChart3 className="h-4 w-4 text-primary" />
                     <span className="font-medium">Savings Trend</span>
                   </div>
                   {budgets.length >= 6 ? (
                     <>
                       <p className="text-sm text-muted-foreground mb-2">
                         {savingsData.trendPercentage > 0 ? "Increasing" : savingsData.trendPercentage < 0 ? "Decreasing" : "Stable"} savings rate
                       </p>
                       {savingsData.trendPercentage < 0 ? (
                         <p className="text-xs text-orange-600">
                           📉 Consider reviewing your budget to increase savings
                         </p>
                       ) : (
                         <p className="text-xs text-green-600">
                           📈 Great momentum! Your savings are growing
                         </p>
                       )}
                     </>
                   ) : (
                     <>
                       <p className="text-sm text-muted-foreground mb-2">
                         Need 6+ months of data for trend analysis
                       </p>
                       <p className="text-xs text-blue-600">
                         💡 Create more budgets to see your savings trend
                       </p>
                     </>
                   )}
                 </div>

                 {/* Projection Insight */}
                 <div className="p-4 rounded-lg bg-background/80 border">
                   <div className="flex items-center gap-2 mb-2">
                     <Calculator className="h-4 w-4 text-primary" />
                     <span className="font-medium">Annual Projection</span>
                   </div>
                   {budgets.length > 0 && savingsData.monthlySavings > 0 ? (
                     <>
                       <p className="text-sm text-muted-foreground mb-2">
                         On track to save £{savingsData.oneYearProjection.toFixed(2)} this year
                       </p>
                       <p className="text-xs text-blue-600">
                         💡 This could fund {Math.floor(savingsData.oneYearProjection / 1000)} major goals
                       </p>
                     </>
                   ) : (
                     <>
                       <p className="text-sm text-muted-foreground mb-2">
                         No projection data available
                       </p>
                       <p className="text-xs text-blue-600">
                         💡 Create budgets to see future projections
                       </p>
                     </>
                   )}
                 </div>
               </div>
             </CardContent>
          </Card>
        </motion.section>
      </div>
    </motion.div>
  );
}
