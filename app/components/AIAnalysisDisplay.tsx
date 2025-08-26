"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  BarChart3, 
  PieChart, 
  Target, 
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Calendar,

  Building2,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { BankStatementAnalysis } from "@/lib/types/ai";
import { cn } from "@/lib/utils";

interface AIAnalysisDisplayProps {
  analysis: BankStatementAnalysis;
  onClose?: () => void;
}

export default function AIAnalysisDisplay({ analysis, onClose }: AIAnalysisDisplayProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const getTrendIcon = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-blue-500" />;
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getHealthBadgeVariant = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'default';
      case 'good':
        return 'secondary';
      case 'fair':
        return 'outline';
      case 'poor':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">AI Financial Analysis</h2>
            <p className="text-muted-foreground">
              Generated on {new Date(analysis.analysisDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              £{analysis.summary.totalSpending.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {analysis.summary.periodDays} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              £{analysis.summary.totalIncome.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {analysis.summary.periodDays} days
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
              analysis.summary.netPosition >= 0 ? "text-green-600" : "text-red-600"
            )}>
              £{analysis.summary.netPosition.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {analysis.summary.netPosition >= 0 ? "Positive" : "Negative"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Financial Health</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", getHealthColor(analysis.financialHealth.score))}>
              {analysis.financialHealth.score}/100
            </div>
            <Badge variant={getHealthBadgeVariant(analysis.financialHealth.status)} className="mt-1">
              {analysis.financialHealth.status}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="recommendations">Actions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Financial Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Daily Average Spending</span>
                    <span className="font-semibold">
                      £{analysis.spendingPatterns.dailyAverage.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Weekly Average</span>
                    <span className="font-semibold">
                      £{analysis.spendingPatterns.weeklyAverage.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Highest Spending Day</span>
                    <span className="font-semibold">{analysis.spendingPatterns.highestSpendingDay}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Lowest Spending Day</span>
                    <span className="font-semibold">{analysis.spendingPatterns.lowestSpendingDay}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Vendors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Top Vendors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.topVendors.slice(0, 5).map((vendor, index) => (
                    <div key={vendor.vendor} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{index + 1}</Badge>
                        <div>
                          <p className="font-medium text-sm">{vendor.vendor}</p>
                          <p className="text-xs text-muted-foreground">{vendor.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">£{vendor.totalSpent.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          {vendor.transactionCount} transactions
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Spending by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.categoryBreakdown.map((category) => (
                  <div key={category.category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{category.category}</span>
                        {getTrendIcon(category.trend)}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">£{category.amount.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">
                          {category.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{category.transactionCount} transactions</span>
                        <span>Avg: £{category.averageTransaction.toFixed(2)}</span>
                      </div>
                      <Progress value={category.percentage} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekend vs Weekday */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Weekend vs Weekday
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Weekend Spending</span>
                    <span className="font-semibold">£{analysis.spendingPatterns.weekendVsWeekday.weekend.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Weekday Spending</span>
                    <span className="font-semibold">£{analysis.spendingPatterns.weekendVsWeekday.weekday.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Difference</span>
                    <div className="flex items-center gap-1">
                      {analysis.spendingPatterns.weekendVsWeekday.difference > 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-red-500" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-green-500" />
                      )}
                      <span className={cn(
                        "font-semibold",
                        analysis.spendingPatterns.weekendVsWeekday.difference > 0 ? "text-red-600" : "text-green-600"
                      )}>
                        £{Math.abs(analysis.spendingPatterns.weekendVsWeekday.difference).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Savings Opportunities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Savings Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.savingsOpportunities.slice(0, 3).map((opportunity, index) => (
                    <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-sm text-green-800">{opportunity.category}</span>
                        <Badge variant="outline" className="text-green-700">
                          Save £{opportunity.potentialSavings.toFixed(2)}
                        </Badge>
                      </div>
                      <p className="text-xs text-green-700">
                        {opportunity.recommendations[0]}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Key Findings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Key Findings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.insights.keyFindings.map((finding, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-blue-800">{finding}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Warnings & Advice */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Warnings & Advice
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis.insights.warnings.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-red-700">Warnings</h4>
                    <div className="space-y-2">
                      {analysis.insights.warnings.map((warning, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-sm text-red-700">{warning}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.insights.advice.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-green-700">Advice</h4>
                    <div className="space-y-2">
                      {analysis.insights.advice.map((advice, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 bg-green-50 border border-green-200 rounded">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-sm text-green-700">{advice}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <div className="space-y-6">
            {/* Immediate Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpRight className="h-5 w-5 text-red-500" />
                  Immediate Actions (This Week)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.recommendations.immediate.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <p className="text-sm text-red-800">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Short Term Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-yellow-500" />
                  Short Term Actions (Next Month)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.recommendations.shortTerm.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <p className="text-sm text-yellow-800">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Long Term Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  Long Term Actions (3-6 Months)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.recommendations.longTerm.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <p className="text-sm text-blue-800">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
