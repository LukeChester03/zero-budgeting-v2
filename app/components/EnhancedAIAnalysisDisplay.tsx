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
    X,
  FileText,
  CreditCard,
  PiggyBank,
  Shield,
  Zap,
  Star,
  Clock,
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon
} from "lucide-react";
import { BankStatementAnalysis } from "@/lib/types/ai";
import { cn } from "@/lib/utils";

interface EnhancedAIAnalysisDisplayProps {
  analysis: BankStatementAnalysis;
  onClose: () => void;
}

export default function EnhancedAIAnalysisDisplay({ analysis, onClose }: EnhancedAIAnalysisDisplayProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const getTrendIcon = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing': return <TrendingUpIcon className="h-4 w-4 text-red-500" />;
      case 'decreasing': return <TrendingDownIcon className="h-4 w-4 text-green-500" />;
      case 'stable': return <MinusIcon className="h-4 w-4 text-blue-500" />;
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  AI Financial Analysis
                </h2>
                <p className="text-gray-600">
                  {analysis.bankName} • {analysis.accountType}
                </p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-6">
              <TabsTrigger value="overview" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4" />
                <span>Transactions</span>
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex items-center space-x-2">
                <PieChart className="h-4 w-4" />
                <span>Categories</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center space-x-2">
                <Lightbulb className="h-4 w-4" />
                <span>Insights</span>
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>Actions</span>
              </TabsTrigger>
              <TabsTrigger value="health" className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Health</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <DollarSign className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-600">Total Spending</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {formatCurrency(analysis.summary.totalSpending)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-500 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-600">Total Income</p>
                        <p className="text-2xl font-bold text-green-900">
                          {formatCurrency(analysis.summary.totalIncome)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-500 rounded-lg">
                        <PiggyBank className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-600">Net Position</p>
                        <p className={cn(
                          "text-2xl font-bold",
                          analysis.summary.netPosition >= 0 ? "text-purple-900" : "text-red-900"
                        )}>
                          {formatCurrency(analysis.summary.netPosition)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-500 rounded-lg">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-orange-600">Period</p>
                        <p className="text-2xl font-bold text-orange-900">
                          {analysis.summary.periodDays} days
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Statement Period */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Statement Period</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Start Date</p>
                      <p className="text-lg font-semibold">{analysis.statementPeriod.startDate}</p>
                    </div>
                    <div className="text-gray-400">
                      <ArrowUpRight className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">End Date</p>
                      <p className="text-lg font-semibold">{analysis.statementPeriod.endDate}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Health Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Financial Health Score</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overall Score</span>
                      <Badge className={cn("text-sm font-bold", getHealthColor(analysis.financialHealth.status))}>
                        {analysis.financialHealth.score}/100
                      </Badge>
                    </div>
                    <Progress value={analysis.financialHealth.score} className="h-3" />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Key Factors</p>
                        <ul className="space-y-1">
                          {analysis.financialHealth.factors.map((factor, index) => (
                            <li key={index} className="text-sm text-gray-700 flex items-center space-x-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span>{factor}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Recommendations</p>
                        <ul className="space-y-1">
                          {analysis.financialHealth.recommendations.map((rec, index) => (
                            <li key={index} className="text-sm text-gray-700 flex items-center space-x-2">
                              <Lightbulb className="h-3 w-3 text-yellow-500" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>All Transactions ({analysis.transactions.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {analysis.transactions.map((transaction, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={cn(
                            "p-2 rounded-full",
                            transaction.type === 'credit' ? "bg-green-100" : "bg-red-100"
                          )}>
                            {transaction.type === 'credit' ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{transaction.description}</p>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <span>{transaction.date}</span>
                              <span>•</span>
                              <Badge variant="outline" className="text-xs">
                                {transaction.category}
                              </Badge>
                              <span>•</span>
                              <span>{transaction.vendor}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "font-bold",
                            transaction.type === 'credit' ? "text-green-600" : "text-red-600"
                          )}>
                            {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Categories Tab */}
            <TabsContent value="categories" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="h-5 w-5" />
                    <span>Spending by Category</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysis.categoryBreakdown.map((category, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Badge variant="outline">{category.category}</Badge>
                            <span className="text-sm text-gray-600">
                              {category.transactionCount} transactions
                            </span>
                            {getTrendIcon(category.trend)}
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(category.amount)}</p>
                            <p className="text-sm text-gray-600">{category.percentage.toFixed(1)}%</p>
                          </div>
                        </div>
                        <Progress value={category.percentage} className="h-2" />
                        <div className="text-sm text-gray-600">
                          Average: {formatCurrency(category.averageTransaction)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Vendors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5" />
                    <span>Top Vendors</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.topVendors.map((vendor, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{vendor.vendor}</p>
                            <p className="text-sm text-gray-600">{vendor.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(vendor.totalSpent)}</p>
                          <p className="text-sm text-gray-600">
                            {vendor.transactionCount} transactions
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Lightbulb className="h-5 w-5" />
                    <span>AI Insights</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Summary */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">Summary</h4>
                      <p className="text-blue-800">{analysis.insights.summary}</p>
                    </div>

                    {/* Key Findings */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>Key Findings</span>
                      </h4>
                      <div className="space-y-2">
                        {analysis.insights.keyFindings.map((finding, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{finding}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Warnings */}
                    {analysis.insights.warnings.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span>Warnings</span>
                        </h4>
                        <div className="space-y-2">
                          {analysis.insights.warnings.map((warning, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{warning}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Advice */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                        <Zap className="h-4 w-4 text-blue-500" />
                        <span>Advice</span>
                      </h4>
                      <div className="space-y-2">
                        {analysis.insights.advice.map((advice, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{advice}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Trends */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span>Trends</span>
                      </h4>
                      <div className="space-y-2">
                        {analysis.insights.trends.map((trend, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{trend}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Recommendations Tab */}
            <TabsContent value="recommendations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Actionable Recommendations</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Immediate Actions */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-red-500" />
                        <span>Immediate Actions (This Week)</span>
                      </h4>
                      <div className="space-y-2">
                        {analysis.recommendations.immediate.map((rec, index) => (
                          <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-800">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Short Term */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-yellow-500" />
                        <span>Short Term (Next Month)</span>
                      </h4>
                      <div className="space-y-2">
                        {analysis.recommendations.shortTerm.map((rec, index) => (
                          <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-yellow-800">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Long Term */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                        <Target className="h-4 w-4 text-blue-500" />
                        <span>Long Term (Next 3-6 Months)</span>
                      </h4>
                      <div className="space-y-2">
                        {analysis.recommendations.longTerm.map((rec, index) => (
                          <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-blue-800">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Priority Level */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">Priority Level</span>
                        <Badge className={cn("text-sm font-bold", getPriorityColor(analysis.recommendations.priority))}>
                          {analysis.recommendations.priority.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Savings Opportunities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PiggyBank className="h-5 w-5" />
                    <span>Savings Opportunities</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysis.savingsOpportunities.map((opportunity, index) => (
                      <div key={index} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-semibold text-green-900">{opportunity.category}</h5>
                          <Badge className="bg-green-100 text-green-800">
                            Save {opportunity.savingsPercentage.toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-gray-600">Current Spending</p>
                            <p className="font-bold text-gray-900">{formatCurrency(opportunity.currentSpending)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Potential Savings</p>
                            <p className="font-bold text-green-600">{formatCurrency(opportunity.potentialSavings)}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-800 mb-2">Recommendations:</p>
                          <ul className="space-y-1">
                            {opportunity.recommendations.map((rec, recIndex) => (
                              <li key={recIndex} className="text-sm text-green-700 flex items-center space-x-2">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Health Tab */}
            <TabsContent value="health" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Financial Health Assessment</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Health Score */}
                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                      <div className="text-6xl font-bold text-blue-600 mb-2">
                        {analysis.financialHealth.score}
                      </div>
                      <div className="text-2xl font-semibold text-gray-700 mb-2">out of 100</div>
                      <Badge className={cn("text-lg px-4 py-2", getHealthColor(analysis.financialHealth.status))}>
                        {analysis.financialHealth.status.toUpperCase()}
                      </Badge>
                    </div>

                    {/* Spending Patterns */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Spending Patterns</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(analysis.spendingPatterns.dailyAverage)}
                          </p>
                          <p className="text-sm text-gray-600">Daily Average</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(analysis.spendingPatterns.weeklyAverage)}
                          </p>
                          <p className="text-sm text-gray-600">Weekly Average</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <p className="text-2xl font-bold text-gray-900">
                            {analysis.spendingPatterns.highestSpendingDay}
                          </p>
                          <p className="text-sm text-gray-600">Highest Spending Day</p>
                        </div>
                      </div>
                    </div>

                    {/* Weekend vs Weekday */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Weekend vs Weekday Spending</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-900">
                            {formatCurrency(analysis.spendingPatterns.weekendVsWeekday.weekend)}
                          </p>
                          <p className="text-sm text-blue-600">Weekend</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <p className="text-2xl font-bold text-green-900">
                            {formatCurrency(analysis.spendingPatterns.weekendVsWeekday.weekday)}
                          </p>
                          <p className="text-sm text-green-600">Weekday</p>
                        </div>
                      </div>
                      <div className="mt-3 text-center">
                        <p className="text-sm text-gray-600">
                          Difference: {formatCurrency(analysis.spendingPatterns.weekendVsWeekday.difference)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </div>
  );
}
