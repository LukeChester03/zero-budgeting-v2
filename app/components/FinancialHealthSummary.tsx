"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  PiggyBank, 
  CreditCard, 
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Shield,
  Award
} from 'lucide-react';
import { useFirebaseStore } from '@/lib/store-firebase';
import { useAuth } from '@/lib/auth-context';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';

// Chart components
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface FinancialSummary {
  id: string;
  userId: string;
  generatedAt: Date;
  nextUpdate: Date;
  
  // Key Metrics
  totalIncome: number;
  totalSaved: number;
  totalDebt: number;
  totalMonthlyDebtPayments: number;
  activeGoals: number;
  completedGoals: number;
  
  // Ratios
  savingsRate: number;
  debtToIncomeRatio: number;
  emergencyFundRatio: number;
  
  // Trends
  monthlyIncomeTrend: { month: string; income: number }[];
  savingsTrend: { month: string; saved: number }[];
  debtReductionTrend: { month: string; debt: number }[];
  
  // Category Breakdown
  spendingByCategory: { category: string; amount: number; percentage: number }[];
  
  // Goals Progress
  goalsProgress: { title: string; current: number; target: number; percentage: number }[];
  
  // Debt Status
  debtStatus: { name: string; remaining: number; monthlyPayment: number; monthsRemaining: number }[];
  
  // Financial Health Score
  healthScore: number;
  healthLevel: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';
  
  // Recommendations
  recommendations: string[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

export default function FinancialHealthSummary() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Store selectors
  const budgets = useFirebaseStore((s) => s.budgets);
  const income = useFirebaseStore((s) => s.income);
  const goals = useFirebaseStore((s) => s.goals);
  const debts = useFirebaseStore((s) => s.debts);
  const getTotalSaved = useFirebaseStore((s) => s.getTotalSaved);
  const getTotalMonthlyDebtRepayments = useFirebaseStore((s) => s.getTotalMonthlyDebtRepayments);
  const getSavedAmountForGoal = useFirebaseStore((s) => s.getSavedAmountForGoal);

  // Calculate financial metrics
  const financialMetrics = useMemo(() => {
    if (!budgets.length) return null;

    const totalIncome = budgets.reduce((sum, budget) => sum + budget.income, 0);
    const totalSaved = getTotalSaved();
    const totalDebt = debts.reduce((sum, debt) => sum + debt.totalAmount, 0);
    const totalMonthlyDebtPayments = getTotalMonthlyDebtRepayments();
    
    // Calculate trends
    const monthlyIncomeTrend = budgets.map(budget => ({
      month: budget.month,
      income: budget.income
    })).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    const savingsTrend = budgets.map(budget => {
      const totalSpent = budget.allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
      const saved = budget.income - totalSpent;
      return {
        month: budget.month,
        saved: Math.max(0, saved)
      };
    }).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    // Calculate debt reduction trend (simplified - using total debt amount)
    const debtReductionTrend = debts.map(debt => ({
      month: new Date().toLocaleString("default", { month: "long", year: "numeric" }),
      debt: debt.totalAmount
    }));

    // Calculate spending by category
    const categorySpending: { [key: string]: number } = {};
    budgets.forEach(budget => {
      budget.allocations.forEach(allocation => {
        categorySpending[allocation.category] = (categorySpending[allocation.category] || 0) + allocation.amount;
      });
    });

    const totalSpent = Object.values(categorySpending).reduce((sum, amount) => sum + amount, 0);
    const spendingByCategory = Object.entries(categorySpending)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);

    // Calculate goals progress
    const goalsProgress = goals.map(goal => {
      const savedAmount = getSavedAmountForGoal(goal.title);
      return {
        title: goal.title,
        current: savedAmount,
        target: goal.target,
        percentage: goal.target > 0 ? (savedAmount / goal.target) * 100 : 0
      };
    });

    // Calculate debt status
    const debtStatus = debts.map(debt => {
      const repaidAmount = debt.totalAmount - (debt.monthlyRepayment * debt.months);
      const remaining = Math.max(0, debt.totalAmount - repaidAmount);
      const monthsRemaining = debt.monthlyRepayment > 0 ? Math.ceil(remaining / debt.monthlyRepayment) : 0;
      
      return {
        name: debt.name,
        remaining,
        monthlyPayment: debt.monthlyRepayment,
        monthsRemaining
      };
    });

    // Calculate ratios
    const savingsRate = totalIncome > 0 ? (totalSaved / totalIncome) * 100 : 0;
    const debtToIncomeRatio = totalIncome > 0 ? (totalMonthlyDebtPayments / totalIncome) * 100 : 0;
    const emergencyFundRatio = totalIncome > 0 ? (totalSaved / (totalIncome * 3)) * 100 : 0; // 3 months emergency fund

    // Calculate health score (0-100)
    let healthScore = 100;
    
    // Deduct points for high debt-to-income ratio
    if (debtToIncomeRatio > 40) healthScore -= 30;
    else if (debtToIncomeRatio > 30) healthScore -= 20;
    else if (debtToIncomeRatio > 20) healthScore -= 10;
    
    // Deduct points for low savings rate
    if (savingsRate < 10) healthScore -= 25;
    else if (savingsRate < 20) healthScore -= 15;
    else if (savingsRate < 30) healthScore -= 5;
    
    // Deduct points for low emergency fund
    if (emergencyFundRatio < 50) healthScore -= 20;
    else if (emergencyFundRatio < 100) healthScore -= 10;
    
    // Add points for good practices
    if (savingsRate > 30) healthScore += 10;
    if (emergencyFundRatio > 150) healthScore += 10;
    if (goals.length > 0) healthScore += 5;
    
    healthScore = Math.max(0, Math.min(100, healthScore));

    // Determine health level
    let healthLevel: FinancialSummary['healthLevel'] = 'Excellent';
    if (healthScore < 60) healthLevel = 'Critical';
    else if (healthScore < 70) healthLevel = 'Poor';
    else if (healthScore < 80) healthLevel = 'Fair';
    else if (healthScore < 90) healthLevel = 'Good';

    // Generate recommendations
    const recommendations: string[] = [];
    if (savingsRate < 20) recommendations.push('Increase your savings rate to at least 20% of income');
    if (debtToIncomeRatio > 30) recommendations.push('Focus on reducing debt to improve your debt-to-income ratio');
    if (emergencyFundRatio < 100) recommendations.push('Build an emergency fund covering 3-6 months of expenses');
    if (goals.length === 0) recommendations.push('Set specific financial goals to stay motivated');
    if (recommendations.length === 0) recommendations.push('Great job! Keep maintaining your healthy financial habits');

    return {
      totalIncome,
      totalSaved,
      totalDebt,
      totalMonthlyDebtPayments,
      activeGoals: goals.filter(g => g.isActive).length,
      completedGoals: goals.filter(g => !g.isActive).length,
      monthlyIncomeTrend,
      savingsTrend,
      debtReductionTrend,
      spendingByCategory,
      goalsProgress,
      debtStatus,
      savingsRate,
      debtToIncomeRatio,
      emergencyFundRatio,
      healthScore,
      healthLevel,
      recommendations
    };
  }, [budgets, income, goals, debts, getTotalSaved, getTotalMonthlyDebtRepayments, getSavedAmountForGoal]);

  // Load or generate summary
  useEffect(() => {
    if (!user || !financialMetrics) return;
    
    const loadOrGenerateSummary = async () => {
      try {
        // Check if we have a recent summary
        const summaryRef = doc(db, 'financialSummaries', user.uid);
        const summaryDoc = await getDoc(summaryRef);
        
        if (summaryDoc.exists()) {
          const existingSummary = summaryDoc.data() as any;
          const lastUpdate = existingSummary.generatedAt?.toDate?.() || new Date(existingSummary.generatedAt);
          const now = new Date();
          const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
          
          // If summary is less than 24 hours old, use it
          if (hoursSinceUpdate < 24) {
            setSummary(existingSummary);
            setLastUpdated(lastUpdate);
            return;
          }
        }
        
        // Generate new summary
        await generateSummary();
      } catch (error) {
        console.error('Error loading summary:', error);
        // Generate summary anyway
        await generateSummary();
      }
    };

    loadOrGenerateSummary();
  }, [user, financialMetrics]);

  const generateSummary = async () => {
    if (!user || !financialMetrics) return;
    
    setIsLoading(true);
    try {
      const now = new Date();
      const nextUpdate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
      
      const newSummary: FinancialSummary = {
        id: user.uid,
        userId: user.uid,
        generatedAt: now,
        nextUpdate,
        ...financialMetrics
      };

      // Save to Firebase
      const summaryRef = doc(db, 'financialSummaries', user.uid);
      await setDoc(summaryRef, {
        ...newSummary,
        generatedAt: serverTimestamp(),
        nextUpdate: serverTimestamp()
      });

      setSummary(newSummary);
      setLastUpdated(now);
    } catch (error) {
      console.error('Error generating summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthColor = (level: FinancialSummary['healthLevel']) => {
    switch (level) {
      case 'Excellent': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'Good': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'Fair': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'Poor': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'Critical': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  if (!summary) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
            </div>
            
            {/* Metrics Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded animate-pulse" />
              ))}
            </div>
            
            {/* Health Score Skeleton */}
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded w-1/3 animate-pulse" />
              <div className="h-3 bg-muted rounded w-full animate-pulse" />
            </div>
            
            {/* Tabs Skeleton */}
            <div className="space-y-4">
              <div className="h-10 bg-muted rounded animate-pulse" />
              <div className="h-64 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full space-y-6"
    >
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Activity className="h-6 w-6 text-primary" />
                Financial Health at a Glance
              </CardTitle>
              <CardDescription>
                Comprehensive overview of your financial profile and progress
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={cn("px-3 py-1", getHealthColor(summary.healthLevel))}>
                {summary.healthLevel}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={generateSummary}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
          {lastUpdated && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Last updated: {lastUpdated.toLocaleString()}
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-xl font-bold">£{summary.totalIncome.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <PiggyBank className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Saved</p>
                <p className="text-xl font-bold text-green-600">£{summary.totalSaved.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <CreditCard className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Debt</p>
                <p className="text-xl font-bold text-orange-600">£{summary.totalDebt.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Goals</p>
                <p className="text-xl font-bold text-purple-600">{summary.activeGoals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Financial Health Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Score</span>
              <span className="text-2xl font-bold text-primary">{summary.healthScore}/100</span>
            </div>
            <Progress value={summary.healthScore} className="h-3" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Award className="h-4 w-4" />
              Your financial health is rated as <strong>{summary.healthLevel}</strong>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="recommendations">Tips</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Key Ratios */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Key Financial Ratios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Savings Rate</span>
                    <span className="text-sm text-muted-foreground">{summary.savingsRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={summary.savingsRate} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Debt to Income</span>
                    <span className="text-sm text-muted-foreground">{summary.debtToIncomeRatio.toFixed(1)}%</span>
                  </div>
                  <Progress value={summary.debtToIncomeRatio} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Emergency Fund</span>
                    <span className="text-sm text-muted-foreground">{summary.emergencyFundRatio.toFixed(1)}%</span>
                  </div>
                  <Progress value={summary.emergencyFundRatio} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Spending Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Spending by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summary.spendingByCategory.map((category, index) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium">{category.category}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">£{category.amount.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{category.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {/* Income Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monthly Income Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[300px]">
                <LineChart data={summary.monthlyIncomeTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="income" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Savings Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monthly Savings Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[300px]">
                <BarChart data={summary.savingsTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="saved" fill="#10b981" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          {/* Goals Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Goals Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary.goalsProgress.map((goal, index) => (
                  <div key={goal.title} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{goal.title}</span>
                      <span className="text-sm text-muted-foreground">
                        £{goal.current.toLocaleString()} / £{goal.target.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={goal.percentage} className="h-2" />
                    <div className="text-right">
                      <span className="text-sm text-muted-foreground">{goal.percentage.toFixed(1)}% complete</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Debt Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Debt Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary.debtStatus.map((debt) => (
                  <div key={debt.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{debt.name}</div>
                      <div className="text-sm text-muted-foreground">
                        £{debt.remaining.toLocaleString()} remaining
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">£{debt.monthlyPayment.toLocaleString()}/month</div>
                      <div className="text-sm text-muted-foreground">
                        {debt.monthsRemaining} months left
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personalized Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <Zap className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
} 