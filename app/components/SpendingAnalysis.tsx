"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, BarChart3, PieChart, AlertTriangle, PoundSterling } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from "recharts";
import { useInvoiceStore } from "@/app/lib/invoiceStore";
import { budgetTemplate } from "@/app/utils/template";
import { useBudgetStore } from "@/app/lib/store";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

export default function SpendingAnalysis() {
  const invoices = useInvoiceStore((state) => state.invoices);
  const getTotalSpendingByCategory = useInvoiceStore((state) => state.getTotalSpendingByCategory);
  const getMonthlySpending = useInvoiceStore((state) => state.getMonthlySpending);
  const budgets = useBudgetStore((state) => state.budgets);
  
  const [timeRange, setTimeRange] = useState("3-months");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const spendingCategories = budgetTemplate.flatMap(group => group.categories);

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
    // Get current month's budget
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentBudget = budgets.find(b => b.month === currentMonth);
    
    const totalBudget = currentBudget ? currentBudget.allocations.reduce((sum, allocation) => 
      sum + allocation.amount, 0) : 0;
    
    const totalSpending = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    
    return {
      budget: totalBudget,
      spending: totalSpending,
      difference: totalBudget - totalSpending,
      percentage: totalBudget > 0 ? (totalSpending / totalBudget) * 100 : 0,
    };
  }, [budgets, invoices]);

  // Calculate top vendors
  const topVendors = useMemo(() => {
    const vendorSpending = invoices.reduce((acc, invoice) => {
      acc[invoice.vendor] = (acc[invoice.vendor] || 0) + invoice.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(vendorSpending)
      .map(([vendor, amount]) => ({ vendor, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [invoices]);

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

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Data to Analyze</h3>
        <p className="text-muted-foreground">
          Add some invoices to see spending analysis and insights.
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
            <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
            <PoundSterling className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {invoices.length} invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget vs Spending</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {budgetComparison.percentage.toFixed(1)}%
            </div>
            <div className="flex items-center gap-1 text-xs">
              {budgetComparison.difference >= 0 ? (
                <TrendingDown className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingUp className="h-3 w-3 text-red-600" />
              )}
              <span className={budgetComparison.difference >= 0 ? "text-green-600" : "text-red-600"}>
                £{Math.abs(budgetComparison.difference).toFixed(2)} {budgetComparison.difference >= 0 ? "under" : "over"}
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categoryBreakdown[0]?.name || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              £{categoryBreakdown[0]?.value.toFixed(2) || "0.00"}
            </p>
          </CardContent>
        </Card>
      </div>

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
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
    </div>
  );
} 