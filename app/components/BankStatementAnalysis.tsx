"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, BarChart3, PieChart, AlertTriangle, PoundSterling, Target, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from "recharts";
import { useBankStatementStore } from "@/app/lib/bankStatementStore";
import { useBankStatementAnalysisStore } from "@/app/lib/bankStatementAnalysisStore";
import { useFirebaseStore } from "@/lib/store-firebase";
import { budgetTemplate } from "@/app/utils/template";
import { useBudgetStore } from "@/app/lib/store";
import { cn } from "@/lib/utils";

import EnhancedAIAnalysisDisplay from "./EnhancedAIAnalysisDisplay";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

export default function BankStatementAnalysis() {
  const statements = useBankStatementStore((state) => state.statements);
  const loadStatements = useBankStatementStore((state) => state.loadStatements);
  const getTotalSpendingByCategory = useBankStatementStore((state) => state.getTotalSpendingByCategory);
  const getMonthlySpending = useBankStatementStore((state) => state.getMonthlySpending);
  const getUncategorizedTransactions = useBankStatementStore((state) => state.getUncategorizedTransactions);
  const budgets = useBudgetStore((state) => state.budgets);
  
  // AI Analysis state
  const statementAnalyses = useBankStatementAnalysisStore((state) => state.statementAnalyses);
  const user = useFirebaseStore((state) => state.user);
  
  const [timeRange, setTimeRange] = useState("3-months");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showEnhancedAnalysis, setShowEnhancedAnalysis] = useState(false);


  const spendingCategories = budgetTemplate.flatMap(group => group.categories);
  const allTransactions = statements.flatMap(statement => statement.transactions);

  // Load analyses when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 Loading analyses from Firebase...');
        await useBankStatementAnalysisStore.getState().loadAnalyses();
        console.log('✅ Analyses loaded successfully');
        
        console.log('🔄 Loading statements from Firebase...');
        await loadStatements();
        console.log('✅ Statements loaded successfully');
      } catch (error) {
        console.error('❌ Failed to load data:', error);
      }
    };
    
    if (user) {
      loadData();
    }
  }, [user, loadStatements]);
  
  // Also load analyses when user changes or when component mounts
  useEffect(() => {
    if (user) {
      console.log('🔄 User authenticated, checking if analyses need loading...');
      const store = useBankStatementAnalysisStore.getState();
      if (store.statementAnalyses.length === 0) {
        console.log('🔄 No analyses in store, loading from Firebase...');
        store.loadAnalyses();
      } else {
        console.log('📊 Analyses already in store:', store.statementAnalyses.length);
      }
    }
  }, [user]);
  
  // Reload analyses when statements change (new uploads or deletions)
  useEffect(() => {
    if (user && statements.length > 0) {
      console.log('🔄 Statements changed, reloading analyses...');
      useBankStatementAnalysisStore.getState().loadAnalyses();
    }
  }, [user, statements.length]);
  
  // Debug logging
  useEffect(() => {
    console.log('📊 BankStatementAnalysis - Current state:', {
      statements: statements.length,
      statementAnalyses: statementAnalyses.length,
      user: !!user
    });
  }, [statements, statementAnalyses, user]);

  // Calculate spending data for the selected time range
  const spendingData = useMemo(() => {
    const now = new Date();
    const months = timeRange === "3-months" ? 3 : timeRange === "6-months" ? 6 : 12;
    const data = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const spending = getMonthlySpending(year, month);
      
      data.push({
        monthLabel: date.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
        spending,
        year,
        month,
      });
    }

    return data;
  }, [timeRange, getMonthlySpending]);

  // Calculate category breakdown
  const categoryBreakdown = useMemo(() => {
    const breakdown = spendingCategories.map(category => {
      const spending = getTotalSpendingByCategory(category);
      return {
        name: category,
        value: spending,
      };
    }).filter(item => item.value > 0);

    return breakdown.sort((a, b) => b.value - a.value);
  }, [spendingCategories, getTotalSpendingByCategory]);

  // Calculate budget vs actual spending
  const budgetComparison = useMemo(() => {
    const currentBudget = budgets[budgets.length - 1];
    const totalBudget = currentBudget ? currentBudget.allocations.reduce((sum, allocation) => 
      sum + allocation.amount, 0) : 0;
    
    const totalSpending = allTransactions
      .filter(t => t.type === "debit")
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      budget: totalBudget,
      spending: totalSpending,
      difference: totalBudget - totalSpending,
      percentage: totalBudget > 0 ? (totalSpending / totalBudget) * 100 : 0,
    };
  }, [budgets, allTransactions]);

  // Calculate top vendors - fully dynamic based on all transactions
  const topVendors = useMemo(() => {
    const vendorSpending = allTransactions
      .filter(t => t.type === "debit")
      .reduce((acc, transaction) => {
        // Better vendor extraction - try to get meaningful vendor names
        let vendor = transaction.description;
        
        // Remove common prefixes and suffixes
        vendor = vendor
          .replace(/^(PAYMENT|TRANSFER|DEBIT|CREDIT|ATM|CASH|WITHDRAWAL|DEPOSIT)\s*/i, '')
          .replace(/\s+(PAYMENT|TRANSFER|DEBIT|CREDIT|ATM|CASH|WITHDRAWAL|DEPOSIT)$/i, '')
          .replace(/^(\d{2}\/\d{2}\/\d{2,4})\s*/, '') // Remove dates
          .replace(/\s+(\d{2}\/\d{2}\/\d{2,4})$/, '') // Remove dates at end
          .trim();
        
        // If vendor is too short or generic, use first meaningful word
        if (vendor.length < 3 || /^(THE|A|AN|TO|FROM|FOR|WITH|BY)$/i.test(vendor)) {
          const words = transaction.description.split(' ').filter(word => 
            word.length > 2 && !/^(THE|A|AN|TO|FROM|FOR|WITH|BY|PAYMENT|TRANSFER|DEBIT|CREDIT|ATM|CASH|WITHDRAWAL|DEPOSIT)$/i.test(word)
          );
          vendor = words[0] || transaction.description.split(' ')[0];
        }
        
        // Limit vendor name length
        if (vendor.length > 20) {
          vendor = vendor.substring(0, 20) + '...';
        }
        
        acc[vendor] = (acc[vendor] || 0) + transaction.amount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(vendorSpending)
      .map(([vendor, amount]) => ({ vendor, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10); // Show top 10 instead of 5
  }, [allTransactions, statements.length]); // Add statements.length to ensure updates

  // Calculate spending trends
  const spendingTrend = useMemo(() => {
    if (spendingData.length < 2) return { trend: "stable", percentage: 0 };
    
    const recent = spendingData[spendingData.length - 1].spending;
    const previous = spendingData[spendingData.length - 2].spending;
    
    if (previous === 0) return { trend: "stable", percentage: 0 };
    
    const percentage = ((recent - previous) / previous) * 100;
    return {
      trend: percentage > 5 ? "increasing" : percentage < -5 ? "decreasing" : "stable",
      percentage: Math.abs(percentage),
    };
  }, [spendingData]);



  const uncategorizedTransactions = getUncategorizedTransactions();

  if (statements.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Bank Statements</h3>
        <p className="text-muted-foreground">
          Upload your bank statements to see spending analysis and insights.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3-months">Last 3 Months</SelectItem>
            <SelectItem value="6-months">Last 6 Months</SelectItem>
            <SelectItem value="12-months">Last 12 Months</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {spendingCategories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              £{useFirebaseStore.getState().income.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Your monthly income
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
            <PoundSterling className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              budgetComparison.difference >= 0 ? "text-green-600" : "text-red-600"
            )}>
              £{allTransactions
                .filter(t => t.type === "debit")
                .reduce((sum, t) => sum + t.amount, 0)
                .toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {allTransactions.filter(t => t.type === "debit").length} transactions
            </p>
            <p className={cn(
              "text-xs font-medium mt-1",
              budgetComparison.difference >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {budgetComparison.difference >= 0 ? "✅ Within income" : "⚠️ Exceeds income"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Position</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              budgetComparison.difference >= 0 ? "text-green-600" : "text-red-600"
            )}>
              £{budgetComparison.difference.toFixed(2)}
            </div>
            <div className="flex items-center gap-1 text-xs">
              {budgetComparison.difference >= 0 ? (
                <TrendingDown className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingUp className="h-3 w-3 text-red-600" />
              )}
              <span className={budgetComparison.difference >= 0 ? "text-green-600" : "text-red-600"}>
                {budgetComparison.difference >= 0 ? "Net Savings" : "Net Loss"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Trend</CardTitle>
            {spendingTrend.trend === "increasing" ? (
              <TrendingUp className="h-4 w-4 text-red-600" />
            ) : spendingTrend.trend === "decreasing" ? (
              <TrendingDown className="h-4 w-4 text-green-600" />
            ) : (
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {spendingTrend.percentage.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground capitalize">
              {spendingTrend.trend} from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Income vs Spending Analysis */}
      {(() => {
        const latestAnalysis = statementAnalyses.sort((a, b) => 
          new Date(b.analysisDate).getTime() - new Date(a.analysisDate).getTime()
        )[0];
        
        // If no AI analysis available, use basic calculation from statements
        if (!latestAnalysis?.summary?.monthlyIncome) {
          const totalSpending = allTransactions
            .filter(t => t.type === "debit")
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
          
          const totalIncome = allTransactions
            .filter(t => t.type === "credit")
            .reduce((sum, t) => sum + t.amount, 0);
          
          // Calculate income for the period: monthly income × number of statements
          const monthlyIncome = useFirebaseStore.getState().income;
          const statementsCount = statements.length;
          const totalIncomeForPeriod = monthlyIncome * statementsCount;
          
          // Net position: total income for period - total spending
          const netPosition = totalIncomeForPeriod - totalSpending;
          
          return (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <TrendingUp className="h-5 w-5" />
                  Basic Spending Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      £{totalIncomeForPeriod.toFixed(2)}
                    </div>
                    <p className="text-sm font-medium text-blue-800">Total Income</p>
                    <p className="text-xs text-blue-600">{statementsCount} month{statementsCount > 1 ? 's' : ''} × £{monthlyIncome.toFixed(2)}</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600 mb-2">
                      £{totalSpending.toFixed(2)}
                    </div>
                    <p className="text-sm font-medium text-gray-800">Total Spending</p>
                    <p className="text-xs text-gray-600">This period</p>
                  </div>
                  
                  <div className="text-center">
                    <div className={cn(
                      "text-3xl font-bold mb-2",
                      netPosition >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      £{netPosition.toFixed(2)}
                    </div>
                    <p className="text-sm font-medium text-gray-800">Net Position</p>
                    <Badge variant={netPosition >= 0 ? 'default' : 'destructive'} className="mt-1">
                      {netPosition >= 0 ? 'Positive' : 'Negative'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        }
        
        const { monthlyIncome, totalSpending, incomeVsSpending } = latestAnalysis.summary;
        
        return (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <TrendingUp className="h-5 w-5" />
                Income vs Spending Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    £{monthlyIncome.toFixed(2)}
                  </div>
                  <p className="text-sm font-medium text-green-800">Monthly Income</p>
                  <p className="text-xs text-green-600">Your monthly income from Firebase</p>
                </div>
                
                <div className="text-center">
                  <div className={cn(
                    "text-3xl font-bold mb-2",
                    incomeVsSpending?.status === 'over_budget' ? 'text-red-600' :
                    incomeVsSpending?.status === 'excellent_savings' ? 'text-green-600' : 'text-blue-600'
                  )}>
                    £{totalSpending.toFixed(2)}
                  </div>
                  <p className="text-sm font-medium text-gray-800">Total Spending</p>
                  <p className="text-xs text-gray-600">This statement period</p>
                </div>
                
                <div className="text-center">
                  <div className={cn(
                    "text-3xl font-bold mb-2",
                    incomeVsSpending?.status === 'over_budget' ? 'text-red-600' :
                    incomeVsSpending?.status === 'excellent_savings' ? 'text-green-600' : 'text-blue-600'
                  )}>
                    {incomeVsSpending?.percentage?.toFixed(1) || '0'}%
                  </div>
                  <p className="text-sm font-medium text-gray-800">Of Income Spent</p>
                  <Badge variant={
                    incomeVsSpending?.status === 'over_budget' ? 'destructive' :
                    incomeVsSpending?.status === 'excellent_savings' ? 'default' : 'secondary'
                  } className="mt-1">
                    {incomeVsSpending?.status === 'over_budget' ? 'Over Budget' :
                     incomeVsSpending?.status === 'excellent_savings' ? 'Excellent Savings' : 'Within Budget'}
                  </Badge>
                </div>
              </div>
              
              {incomeVsSpending?.remaining !== undefined && (
                <div className="mt-6 p-4 bg-white rounded-lg border">
                  <div className="text-center">
                    <div className={cn(
                      "text-2xl font-bold mb-1",
                      incomeVsSpending.remaining >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      £{incomeVsSpending.remaining.toFixed(2)}
                    </div>
                    <p className="text-sm text-gray-600">
                      {incomeVsSpending.remaining >= 0 ? 'Remaining from income' : 'Over budget amount'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={spendingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthLabel" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`£${value.toFixed(2)}`, "Spending"]}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="spending" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`£${value.toFixed(2)}`, "Amount"]} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>



      {/* Top Vendors */}
      <Card>
        <CardHeader>
          <CardTitle>Top Vendors by Spending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topVendors.map((vendor, index) => (
              <div key={vendor.vendor} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{index + 1}</Badge>
                  <span className="font-medium">{vendor.vendor}</span>
                </div>
                <span className="font-semibold">£{vendor.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Uncategorized Transactions Alert */}
      {uncategorizedTransactions.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              Uncategorized Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-700 mb-4">
              You have {uncategorizedTransactions.length} transactions that haven&apos;t been categorized yet. 
              Review them to improve your spending analysis.
            </p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {uncategorizedTransactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center p-2 bg-white rounded">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">{transaction.date}</p>
                  </div>
                  <span className="font-medium text-red-600">£{transaction.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Alerts */}
      {budgetComparison.percentage > 100 && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Budget Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You have exceeded your budget by {budgetComparison.percentage.toFixed(1)}%. 
              Consider reviewing your spending patterns and adjusting your budget categories.
            </p>
          </CardContent>
        </Card>
      )}

      {/* AI Insights Section - Always Visible */}
      {user && statementAnalyses.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <BarChart3 className="h-5 w-5" />
              AI-Powered Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Analysis Summary */}
            {statementAnalyses.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Overall Statement Analysis</h4>
                {(() => {
                  const latestAnalysis = statementAnalyses.sort((a, b) => 
                    new Date(b.analysisDate).getTime() - new Date(a.analysisDate).getTime()
                  )[0];
                  
                  if (!latestAnalysis) return null;
                  
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Financial Health Score</span>
                          <span className={`font-bold ${
                            latestAnalysis.financialHealth.score >= 80 ? 'text-green-600' :
                            latestAnalysis.financialHealth.score >= 60 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {latestAnalysis.financialHealth.score}/100
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Status</span>
                          <Badge variant={
                            latestAnalysis.financialHealth.status === 'excellent' ? 'default' :
                            latestAnalysis.financialHealth.status === 'good' ? 'secondary' :
                            latestAnalysis.financialHealth.status === 'fair' ? 'outline' :
                            'destructive'
                          }>
                            {latestAnalysis.financialHealth.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Net Position</span>
                          <span className={`font-bold ${
                            (() => {
                              const totalSpending = allTransactions
                                .filter(t => t.type === "debit")
                                .reduce((sum, t) => sum + Math.abs(t.amount), 0);
                              const totalIncome = allTransactions
                                .filter(t => t.type === "credit")
                                .reduce((sum, t) => sum + t.amount, 0);
                              return totalIncome - totalSpending;
                            })() >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            £{(() => {
                              const totalSpending = allTransactions
                                .filter(t => t.type === "debit")
                                .reduce((sum, t) => sum + Math.abs(t.amount), 0);
                              const totalIncome = allTransactions
                                .filter(t => t.type === "credit")
                                .reduce((sum, t) => sum + t.amount, 0);
                              return (totalIncome - totalSpending).toFixed(2);
                            })()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Period</span>
                          <span className="text-sm">
                            {(() => {
                              if (statements.length === 0) return 0;
                              const dates = statements.flatMap(s => s.transactions).map(t => new Date(t.date));
                              const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
                              const endDate = new Date(Math.max(...dates.map(d => d.getTime())));
                              return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                            })()} days
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Key Insights - Overall from All Statements */}
            {(() => {
              if (statementAnalyses.length === 0) return null;
              
              // Collect insights from all statements
              const allKeyFindings = statementAnalyses.flatMap(analysis => analysis.insights.keyFindings);
              const allRecommendations = statementAnalyses.flatMap(analysis => analysis.recommendations.immediate);
              
              // Get unique insights and recommendations
              const uniqueFindings = [...new Set(allKeyFindings)];
              const uniqueRecommendations = [...new Set(allRecommendations)];
              
              return (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Key Insights from All Statements</h4>
                  <div className="space-y-3">
                    {uniqueFindings.slice(0, 3).map((finding, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-sm">{finding}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* AI Recommendations - Overall from All Statements */}
            {(() => {
              if (statementAnalyses.length === 0) return null;
              
              // Use the unique recommendations we collected earlier
              const allRecommendations = statementAnalyses.flatMap(analysis => analysis.recommendations.immediate);
              const uniqueRecommendations = [...new Set(allRecommendations)];
              
              return (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">AI Recommendations from All Statements</h4>
                  <div className="space-y-3">
                    {uniqueRecommendations.slice(0, 3).map((rec, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-blue-800">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Enhanced AI Analysis Section */}
            {statementAnalyses.length > 0 && (
              <div className="pt-4 border-t">
                <div className="space-y-3">
                  <Button
                    onClick={() => setShowEnhancedAnalysis(true)}
                    className="w-full"
                    variant="default"
                  >
                    View Overall Enhanced AI Analysis
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    View comprehensive AI insights across all your statements
                  </p>
                </div>
              </div>
            )}


          </CardContent>
        </Card>
      )}

      {/* Enhanced AI Analysis Modal */}
      {showEnhancedAnalysis && statementAnalyses.length > 0 && (
        <EnhancedAIAnalysisDisplay
          analysis={(() => {
            // Create an aggregated analysis from all statements
            if (statementAnalyses.length === 0) return null;
            
            // Aggregate data from all statements
            const allTransactions = statementAnalyses.flatMap(analysis => analysis.transactions || []);
            const allKeyFindings = statementAnalyses.flatMap(analysis => analysis.insights?.keyFindings || []);
            const allRecommendations = statementAnalyses.flatMap(analysis => analysis.recommendations?.immediate || []);
            const allCategoryBreakdown = statementAnalyses.flatMap(analysis => analysis.categoryBreakdown || []);
            
            // Get unique insights and recommendations
            const uniqueFindings = [...new Set(allKeyFindings)];
            const uniqueRecommendations = [...new Set(allRecommendations)];
            
            // Aggregate category breakdown
            const aggregatedCategories = allCategoryBreakdown.reduce((acc, cat) => {
              if (!cat || !cat.category) return acc; // Skip invalid entries
              const existing = acc.find(c => c.category === cat.category);
              if (existing) {
                existing.amount += cat.amount || 0;
                existing.transactionCount += cat.transactionCount || 1;
              } else {
                acc.push({ 
                  category: cat.category, 
                  amount: cat.amount || 0, 
                  transactionCount: cat.transactionCount || 1 
                });
              }
              return acc;
            }, [] as any[]);
            
            // Add missing properties that the component expects
            const totalSpendingForPercentage = aggregatedCategories.reduce((sum, cat) => sum + cat.amount, 0);
            aggregatedCategories.forEach(cat => {
              cat.percentage = totalSpendingForPercentage > 0 ? (cat.amount / totalSpendingForPercentage) * 100 : 0;
              cat.averageTransaction = cat.amount / Math.max(1, cat.transactionCount);
              cat.trend = 'stable'; // Default trend
            });
            
            // Calculate overall financial health
            const totalSpending = allTransactions
              .filter(t => t.type === "debit")
              .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            const totalIncome = allTransactions
              .filter(t => t.type === "credit")
              .reduce((sum, t) => sum + t.amount, 0);
            
            // Determine overall health score based on spending patterns
            let healthScore = 80; // Start with good score
            if (totalSpending > totalIncome * 1.2) healthScore = 40; // Poor
            else if (totalSpending > totalIncome) healthScore = 60; // Fair
            else if (totalSpending < totalIncome * 0.7) healthScore = 95; // Excellent
            
            const healthStatus = healthScore >= 80 ? 'excellent' : 
                               healthScore >= 60 ? 'good' : 
                               healthScore >= 40 ? 'fair' : 'poor';
            
            // Create aggregated analysis object
            const aggregatedAnalysis = {
              id: 'aggregated-analysis',
              statementId: 'all-statements',
              userId: user?.uid || 'unknown',
              analysisDate: new Date().toISOString(),
              bankName: 'Multiple Banks',
              accountType: 'Multiple Accounts',
              statementPeriod: {
                startDate: statements.length > 0 ? 
                  new Date(Math.min(...statements.flatMap(s => s.transactions).map(t => new Date(t.date).getTime()))).toISOString().split('T')[0] : 
                  new Date().toISOString().split('T')[0],
                endDate: statements.length > 0 ? 
                  new Date(Math.max(...statements.flatMap(s => s.transactions).map(t => new Date(t.date).getTime()))).toISOString().split('T')[0] : 
                  new Date().toISOString().split('T')[0]
              },
              transactions: allTransactions,
              summary: {
                totalSpending,
                totalIncome,
                netPosition: totalIncome - totalSpending,
                periodDays: statements.length > 0 ? 
                  Math.ceil((new Date(Math.max(...statements.flatMap(s => s.transactions).map(t => new Date(t.date).getTime()))) - 
                           new Date(Math.min(...statements.flatMap(s => s.transactions).map(t => new Date(t.date).getTime())))) / (1000 * 60 * 60 * 24)) : 30,
                transactionCount: allTransactions.length,
                monthlyIncome: useFirebaseStore.getState().income || 0,
                incomeVsSpending: {
                  percentage: totalIncome > 0 ? (totalSpending / totalIncome) * 100 : 0,
                  remaining: totalIncome - totalSpending,
                  status: totalSpending > totalIncome ? 'over_budget' : 
                          totalSpending < totalIncome * 0.8 ? 'excellent_savings' : 'within_budget'
                }
              },
              categoryBreakdown: aggregatedCategories,
              insights: {
                keyFindings: uniqueFindings || [],
                spendingPatterns: statementAnalyses.flatMap(analysis => analysis.insights?.spendingPatterns || []),
                riskFactors: statementAnalyses.flatMap(analysis => analysis.insights?.riskFactors || []),
                summary: `Analysis of ${allTransactions.length} transactions across ${statements.length} statements`,
                warnings: statementAnalyses.flatMap(analysis => analysis.insights?.warnings || []),
                advice: statementAnalyses.flatMap(analysis => analysis.insights?.advice || []),
                trends: statementAnalyses.flatMap(analysis => analysis.insights?.trends || [])
              },
              recommendations: {
                immediate: uniqueRecommendations || [],
                shortTerm: statementAnalyses.flatMap(analysis => analysis.recommendations?.shortTerm || []),
                longTerm: statementAnalyses.flatMap(analysis => analysis.recommendations?.longTerm || []),
                priority: totalSpending > totalIncome ? 'high' : 'medium'
              },
              financialHealth: {
                score: healthScore,
                status: healthStatus,
                factors: [
                  totalSpending > totalIncome ? 'Spending exceeds income' : 'Spending within income',
                  totalSpending < totalIncome * 0.7 ? 'Excellent savings rate' : 'Moderate savings rate',
                  allTransactions.length > 50 ? 'High transaction volume' : 'Moderate transaction volume'
                ],
                recommendations: uniqueRecommendations.slice(0, 3) || []
              },
              topVendors: (() => {
                // Create top vendors from transactions
                const vendorSpending = allTransactions
                  .filter(t => t.type === "debit")
                  .reduce((acc, transaction) => {
                    const vendor = transaction.description.split(' ')[0] || 'Unknown';
                    acc[vendor] = (acc[vendor] || 0) + Math.abs(transaction.amount);
                    return acc;
                  }, {} as Record<string, number>);
                
                return Object.entries(vendorSpending)
                  .map(([vendor, totalSpent]) => ({
                    vendor,
                    totalSpent,
                    category: 'Unknown',
                    transactionCount: 1,
                    averageAmount: totalSpent
                  }))
                  .sort((a, b) => b.totalSpent - a.totalSpent)
                  .slice(0, 5);
              })(),
              savingsOpportunities: (() => {
                // Create savings opportunities based on category spending
                return aggregatedCategories
                  .filter(cat => cat.amount > 100) // Only categories with significant spending
                  .map(cat => ({
                    category: cat.category,
                    currentSpending: cat.amount,
                    potentialSavings: cat.amount * 0.2, // Assume 20% savings potential
                    savingsPercentage: 20,
                    recommendations: [
                      'Review spending in this category',
                      'Look for cheaper alternatives',
                      'Consider if all expenses are necessary'
                    ]
                  }))
                  .slice(0, 3);
              })(),
              spendingPatterns: {
                dailyAverage: totalSpending / (Math.max(1, Math.ceil((new Date().getTime() - new Date(statements[0]?.uploadDate || Date.now()).getTime()) / (1000 * 60 * 60 * 24)))),
                weeklyAverage: totalSpending / Math.max(1, Math.ceil((new Date().getTime() - new Date(statements[0]?.uploadDate || Date.now()).getTime()) / (1000 * 60 * 60 * 24 * 7))),
                highestSpendingDay: 'Monday',
                weekendVsWeekday: {
                  weekend: totalSpending * 0.4,
                  weekday: totalSpending * 0.6,
                  difference: totalSpending * 0.2
                }
              }
            };
            
            // Validate the aggregated analysis object
            console.log('🔍 Created aggregated analysis:', aggregatedAnalysis);
            
            // Ensure all required arrays exist with proper fallbacks
            if (!aggregatedAnalysis.transactions) aggregatedAnalysis.transactions = [];
            if (!aggregatedAnalysis.categoryBreakdown) aggregatedAnalysis.categoryBreakdown = [];
            if (!aggregatedAnalysis.insights) aggregatedAnalysis.insights = { 
              keyFindings: [], 
              spendingPatterns: [], 
              riskFactors: [], 
              summary: '', 
              warnings: [], 
              advice: [], 
              trends: [] 
            };
            if (!aggregatedAnalysis.recommendations) aggregatedAnalysis.recommendations = { 
              immediate: [], 
              shortTerm: [], 
              longTerm: [], 
              priority: 'medium' 
            };
            if (!aggregatedAnalysis.financialHealth) aggregatedAnalysis.financialHealth = { 
              score: 0, 
              status: 'unknown', 
              factors: [], 
              recommendations: [] 
            };
            if (!aggregatedAnalysis.topVendors) aggregatedAnalysis.topVendors = [];
            if (!aggregatedAnalysis.savingsOpportunities) aggregatedAnalysis.savingsOpportunities = [];
            if (!aggregatedAnalysis.spendingPatterns) aggregatedAnalysis.spendingPatterns = {
              dailyAverage: 0,
              weeklyAverage: 0,
              highestSpendingDay: 'Unknown',
              weekendVsWeekday: { weekend: 0, weekday: 0, difference: 0 }
            };
            
            return aggregatedAnalysis;
          })()}
          onClose={() => setShowEnhancedAnalysis(false)}
        />
      )}



    </div>
  );
} 