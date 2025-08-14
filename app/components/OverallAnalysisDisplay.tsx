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
  Users,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  X,
  FileText
} from "lucide-react";
import { OverallAnalysis } from "@/lib/types/ai";
import { cn } from "@/lib/utils";

interface OverallAnalysisDisplayProps {
  analysis: OverallAnalysis;
  onClose?: () => void;
}

export default function OverallAnalysisDisplay({ analysis, onClose }: OverallAnalysisDisplayProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Safety check for incomplete analysis data
  if (!analysis || !analysis.analysisDate) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">Analysis Incomplete</h3>
        <p className="text-muted-foreground">
          The overall analysis data is incomplete. Please try generating it again.
        </p>
      </div>
    );
  }

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
            <h2 className="text-2xl font-bold">Overall Financial Analysis</h2>
            <p className="text-muted-foreground">
              Generated on {analysis.analysisDate ? new Date(analysis.analysisDate).toLocaleDateString() : 'Unknown date'}
            </p>
          </div>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Statements</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {analysis.totalStatements || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Bank statements analyzed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {(analysis.totalTransactions || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Transactions processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              £{(analysis.totalIncome || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Your monthly income
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              £{(analysis.totalSpending || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Over {analysis.analysisPeriod?.days || 0} days
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
              (analysis.netPosition || 0) >= 0 ? "text-green-600" : "text-red-600"
            )}>
              £{(analysis.netPosition || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {(analysis.netPosition || 0) >= 0 ? "Positive" : "Negative"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Analysis Period */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Analysis Period
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Start Date</span>
                    <span className="font-semibold">
                      {analysis.analysisPeriod?.startDate ? new Date(analysis.analysisPeriod.startDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">End Date</span>
                    <span className="font-semibold">
                      {analysis.analysisPeriod?.endDate ? new Date(analysis.analysisPeriod.endDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Days</span>
                    <span className="font-semibold">{analysis.analysisPeriod?.days || 0} days</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Analysis Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {analysis.overallRecommendations?.summary || 'No summary available'}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Spending Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Spending Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(analysis.spendingTrends || []).slice(0, 5).map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        {getTrendIcon((trend.change || 0) > 0 ? 'increasing' : (trend.change || 0) < 0 ? 'decreasing' : 'stable')}
                        <span className="text-sm font-medium">{trend.month || 'Unknown'}</span>
                      </div>
                                              <div className="text-right">
                          <div className="font-semibold">£{(trend.spending || 0).toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">
                            {trend.monthlyIncome ? `${((trend.spending || 0) / trend.monthlyIncome * 100).toFixed(1)}% of income` : 'Net: £' + (trend.net || 0).toFixed(2)}
                          </div>
                        </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Category Evolution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Category Evolution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(analysis.categoryEvolution || []).slice(0, 5).map((evolution, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">{evolution.category || 'Unknown Category'}</span>
                        <Badge variant="outline">
                          {(evolution.changePercentage || 0) > 0 ? '+' : ''}{(evolution.changePercentage || 0)}%
                        </Badge>
                      </div>
                      <Progress value={Math.abs(evolution.changePercentage || 0)} className="h-2" />
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
            {/* Health Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Financial Health Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(analysis.healthTrends || []).slice(0, 5).map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        {getTrendIcon('stable')}
                        <span className="text-sm font-medium">Health Score</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{trend.score || 0}/100</div>
                        <div className="text-xs text-muted-foreground">
                          {trend.status || 'Unknown'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Key Priorities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Key Priorities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(analysis.overallRecommendations?.priorities || []).slice(0, 5).map((priority, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-blue-800">{priority}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <div className="space-y-6">
            {/* Recommended Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Recommended Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(analysis.overallRecommendations?.actions || []).slice(0, 5).map((action, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <p className="text-sm text-yellow-800">{action}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Implementation Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Expected Timeline:</p>
                  <p className="text-sm text-muted-foreground">
                    {analysis.overallRecommendations?.timeline || 'No timeline available'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
