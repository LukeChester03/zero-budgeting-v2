"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useAIStore } from '@/lib/store/ai-store';
import { AIAnalysisData } from '@/lib/types/ai';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Target, 
  Calendar,
  DollarSign,
  Shield,
  Lightbulb,
  BarChart3,
  Clock,
  Zap,
  ArrowRight,
  Star,
  AlertCircle,
  Heart,
  TrendingUpIcon,
  TrendingDownIcon,
  Minus,
  List
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AIAnalysisPage() {
  const { user } = useAuth();
  const { parsedAnalysis, aiAnalysis, isLoading, error, checkExistingAnalysis, hasExistingAnalysis } = useAIStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [isInitializing, setIsInitializing] = useState(true);

  // Load existing analysis when component mounts
  useEffect(() => {
    const loadAnalysis = async () => {
      console.log('🔄 useEffect triggered:', { user: !!user, parsedAnalysis: !!parsedAnalysis, hasExistingAnalysis });
      
      if (user && !parsedAnalysis) {
        try {
          // Small delay to ensure user is fully loaded
          await new Promise(resolve => setTimeout(resolve, 100));
          
          console.log('🔄 Loading existing analysis for user:', user.uid);
          await checkExistingAnalysis(user.uid);
        } catch (error) {
          console.error('Failed to load analysis:', error);
        } finally {
          setIsInitializing(false);
        }
      } else {
        console.log('✅ Analysis already loaded or no user:', { user: !!user, parsedAnalysis: !!parsedAnalysis });
        setIsInitializing(false);
      }
    };

    loadAnalysis();
  }, [user, parsedAnalysis, checkExistingAnalysis, hasExistingAnalysis]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Please log in to view your AI analysis.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isInitializing || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-lg font-medium">
                {isInitializing ? 'Loading your analysis...' : 'Generating your personalized financial analysis...'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !parsedAnalysis) {
    // Debug information
    console.log('🔍 AI Analysis Page Debug:', {
      error,
      parsedAnalysis,
      aiAnalysis: aiAnalysis?.substring(0, 100) + '...',
      user: user?.uid
    });

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
              <h2 className="text-xl font-semibold">Analysis Not Available</h2>
              <p className="text-muted-foreground">
                {error || "Please complete the AI questionnaire to generate your personalized analysis."}
              </p>
              <div className="flex flex-col space-y-2">
                <Button onClick={() => window.history.back()}>Go Back</Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/?openAI=true'}
                >
                  Complete AI Questionnaire
                </Button>
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    console.log('🔄 Manually triggering analysis load...');
                    try {
                      await checkExistingAnalysis(user.uid);
                    } catch (error) {
                      console.error('Manual load failed:', error);
                    }
                  }}
                >
                  Debug: Reload Analysis
                </Button>
              </div>
              
              {/* Debug Information */}
              <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-left">
                <h4 className="font-semibold mb-2">Debug Info:</h4>
                <p>User ID: {user?.uid}</p>
                <p>Has Existing Analysis: {hasExistingAnalysis ? 'Yes' : 'No'}</p>
                <p>Parsed Analysis: {parsedAnalysis ? 'Yes' : 'No'}</p>
                <p>AI Analysis Length: {aiAnalysis?.length || 0}</p>
                <p>Error: {error || 'None'}</p>
                <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
                <p>Initializing: {isInitializing ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const analysis = parsedAnalysis as AIAnalysisData;

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your AI Financial Analysis</h1>
              <p className="text-gray-600 mt-2">Personalized insights and strategies for your financial future</p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Star className="h-3 w-3 mr-1" />
                AI Powered
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Personalized
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white border border-gray-200">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              Overview
            </TabsTrigger>
            <TabsTrigger value="budget" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              Budget
            </TabsTrigger>
            <TabsTrigger value="priorities" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              Priorities
            </TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              Insights
            </TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              Timeline
            </TabsTrigger>
            <TabsTrigger value="advisor" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              Advisor
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Financial Snapshot */}
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-xl font-semibold text-gray-900">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                  Financial Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-700">Monthly Income</p>
                        <p className="text-2xl font-bold text-blue-900">£{analysis.financialSnapshot?.monthlyIncome?.toLocaleString() || 0}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-700">Savings Rate</p>
                        <p className="text-2xl font-bold text-green-900">{analysis.financialSnapshot?.savingsRate || 0}%</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-700">Financial Health</p>
                        <p className="text-2xl font-bold text-purple-900">{analysis.financialSnapshot?.financialHealthScore || 0}/100</p>
                      </div>
                      <Shield className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-700">Debt Ratio</p>
                        <p className="text-2xl font-bold text-orange-900">{analysis.financialSnapshot?.debtToIncomeRatio || 0}%</p>
                      </div>
                      <TrendingDown className="h-8 w-8 text-orange-600" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-semibold text-gray-900">
                  <Lightbulb className="h-5 w-5 mr-2 text-yellow-600" />
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed text-lg">{analysis.summary}</p>
              </CardContent>
            </Card>

            {/* Risk Assessment */}
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-semibold text-gray-900">
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                  Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge className={cn("px-3 py-1", getRiskColor(analysis.riskAssessment?.level || 'Low'))}>
                      {analysis.riskAssessment?.level || 'Low'} Risk
                    </Badge>
                    <span className="text-sm text-gray-600">Score: {analysis.riskAssessment?.score || 0}/100</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Risk Factors</h4>
                    <ul className="space-y-2">
                      {analysis.riskAssessment?.factors?.map((factor, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Mitigation Strategies</h4>
                    <p className="text-sm text-gray-700">{analysis.riskAssessment?.mitigation}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

                     {/* Budget Tab */}
           <TabsContent value="budget" className="space-y-6">
             {/* Budget Overview */}
             <Card className="bg-white border-0 shadow-lg">
               <CardHeader>
                 <CardTitle className="flex items-center text-xl font-semibold text-gray-900">
                   <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                   Budget Overview
                 </CardTitle>
                 <p className="text-sm text-gray-600 mt-2">
                   Your personalized budget allocation based on actual expenses and financial goals
                 </p>
               </CardHeader>
               <CardContent>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                   <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                     <div className="flex items-center justify-between">
                       <div>
                         <p className="text-sm font-medium text-blue-700">Total Income</p>
                         <p className="text-2xl font-bold text-blue-900">£{analysis.financialSnapshot?.monthlyIncome?.toLocaleString() || 0}</p>
                       </div>
                       <DollarSign className="h-8 w-8 text-blue-600" />
                     </div>
                   </div>
                   
                   <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                     <div className="flex items-center justify-between">
                       <div>
                         <p className="text-sm font-medium text-green-700">Total Expenses</p>
                         <p className="text-2xl font-bold text-green-900">£{analysis.financialSnapshot?.totalExpenses?.toLocaleString() || 0}</p>
                       </div>
                       <TrendingDown className="h-8 w-8 text-green-600" />
                     </div>
                   </div>
                   
                   <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                     <div className="flex items-center justify-between">
                       <div>
                         <p className="text-sm font-medium text-purple-700">Available for Savings</p>
                         <p className="text-2xl font-bold text-purple-900">£{analysis.financialSnapshot?.disposableIncome?.toLocaleString() || 0}</p>
                       </div>
                       <TrendingUp className="h-8 w-8 text-purple-600" />
                     </div>
                   </div>
                 </div>
               </CardContent>
             </Card>

                           {/* Zero Budget Distribution - Compact View */}
              <Card className="bg-white border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl font-semibold text-gray-900">
                    <Target className="h-5 w-5 mr-2 text-green-600" />
                    Zero Budget Distribution
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-2">
                    Every penny allocated - 100% of your income is accounted for
                  </p>
                </CardHeader>
                <CardContent>
                  {/* Zero Budget Summary */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-blue-900">Total Income Allocated</h3>
                        <p className="text-sm text-blue-700">Zero-budget principle: every penny has a purpose</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-900">
                          £{analysis.financialSnapshot?.monthlyIncome?.toLocaleString() || 0}
                        </p>
                        <p className="text-sm text-blue-700">100% allocated</p>
                      </div>
                    </div>
                  </div>

                  {/* Compact Distribution Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(analysis.budgetDistribution || {}).map(([key, value]) => {
                      const categoryName = key.replace(/([A-Z])/g, ' $1').trim();
                      const getCategoryStyle = (category: string) => {
                        switch (category.toLowerCase()) {
                          case 'emergency fund': return 'border-l-4 border-emerald-500 bg-emerald-50';
                          case 'debt payoff': return 'border-l-4 border-red-500 bg-red-50';
                          case 'essential expenses': return 'border-l-4 border-blue-500 bg-blue-50';
                          case 'primary goal': return 'border-l-4 border-purple-500 bg-purple-50';
                          case 'discretionary spending': return 'border-l-4 border-orange-500 bg-orange-50';
                          default: return 'border-l-4 border-gray-400 bg-gray-50';
                        }
                      };
                      
                      return (
                        <div key={key} className={`p-4 rounded-lg transition-all hover:shadow-md ${getCategoryStyle(categoryName)}`}>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-900 text-sm capitalize">{categoryName}</h3>
                            <Badge variant="outline" className="text-xs">
                              {value.percentage || 0}%
                            </Badge>
                          </div>
                          
                          <div className="mb-2">
                            <p className="text-xl font-bold text-gray-900">£{value.amount?.toLocaleString() || 0}</p>
                            <p className="text-xs text-gray-600">monthly</p>
                          </div>
                          
                          <Progress 
                            value={value.percentage || 0} 
                            className="h-2 mb-2" 
                          />
                          
                          <p className="text-xs text-gray-600 line-clamp-2" title={value.description}>
                            {value.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

                           {/* Detailed Budget Allocations */}
              <Card className="bg-white border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl font-semibold text-gray-900">
                    <List className="h-5 w-5 mr-2 text-indigo-600" />
                    Category Breakdown
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-2">
                    Detailed view of all budget categories with key information
                  </p>
                </CardHeader>
                <CardContent>
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {analysis.budgetAllocations?.filter(a => a.priority <= 3).length || 0}
                      </p>
                      <p className="text-xs text-blue-700">High Priority</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {analysis.budgetAllocations?.reduce((sum, a) => sum + (a.amount || 0), 0).toLocaleString() || 0}
                      </p>
                      <p className="text-xs text-green-700">Total Allocated</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">
                        {analysis.budgetAllocations?.length || 0}
                      </p>
                      <p className="text-xs text-purple-700">Total Categories</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">
                        {Math.round(analysis.budgetAllocations?.reduce((sum, a) => sum + (a.percentage || 0), 0) || 0)}%
                      </p>
                      <p className="text-xs text-orange-700">Income Allocated</p>
                    </div>
                  </div>

                  {/* Compact Table View */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide pb-2 border-b">
                      <div className="col-span-1">Priority</div>
                      <div className="col-span-4">Category</div>
                      <div className="col-span-2 text-right">Amount</div>
                      <div className="col-span-1 text-right">%</div>
                      <div className="col-span-4">Description</div>
                    </div>
                    
                    {analysis.budgetAllocations?.sort((a, b) => a.priority - b.priority).map((allocation, index) => (
                      <div 
                        key={index} 
                        className={`grid grid-cols-12 gap-2 py-3 rounded-lg transition-colors hover:bg-gray-50 ${
                          allocation.priority <= 3 ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50 border-l-4 border-transparent'
                        }`}
                      >
                        <div className="col-span-1 flex items-center">
                          <Badge 
                            variant={allocation.priority <= 3 ? "default" : "outline"} 
                            className="text-xs"
                          >
                            #{allocation.priority}
                          </Badge>
                        </div>
                        <div className="col-span-4 font-medium text-gray-900">
                          {allocation.category}
                        </div>
                        <div className="col-span-2 text-right font-bold text-gray-900">
                          £{allocation.amount?.toLocaleString() || 0}
                        </div>
                        <div className="col-span-1 text-right text-gray-600">
                          {allocation.percentage || 0}%
                        </div>
                        <div className="col-span-4 text-sm text-gray-600 truncate" title={allocation.description}>
                          {allocation.description}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Priority Legend */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Priority Levels</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        <span className="text-gray-700">High Priority (1-3): Essential expenses and critical financial goals</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-gray-400 rounded"></div>
                        <span className="text-gray-700">Standard Priority (4-6): Important but flexible allocations</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-gray-300 rounded"></div>
                        <span className="text-gray-700">Lower Priority (7+): Discretionary and optional spending</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
           </TabsContent>

          {/* Priorities Tab */}
          <TabsContent value="priorities" className="space-y-6">
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-semibold text-gray-900">
                  <Target className="h-5 w-5 mr-2 text-green-600" />
                  Financial Priorities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {analysis.priorities?.map((priority, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-6 py-4 bg-blue-50 rounded-r-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Badge className="bg-blue-600 text-white px-3 py-1">
                            #{priority.rank}
                          </Badge>
                          <h3 className="text-lg font-semibold text-gray-900">{priority.category}</h3>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getUrgencyIcon(priority.urgency)}
                          <Badge variant="outline" className="text-xs">
                            {priority.urgency} Priority
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Why This Matters</h4>
                          <p className="text-gray-700 text-sm">{priority.reason}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Action Plan</h4>
                          <p className="text-gray-700 text-sm">{priority.action}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-1">Expected Impact</h4>
                        <p className="text-blue-800 text-sm">{priority.impact}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Strategic Insights */}
              <Card className="bg-white border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl font-semibold text-gray-900">
                    <Lightbulb className="h-5 w-5 mr-2 text-yellow-600" />
                    Strategic Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-green-700 mb-2 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Strengths
                    </h4>
                    <ul className="space-y-1">
                      {analysis.strategicInsights?.strengths?.map((strength, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-semibold text-red-700 mb-2 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Areas for Improvement
                    </h4>
                    <ul className="space-y-1">
                      {analysis.strategicInsights?.weaknesses?.map((weakness, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start">
                          <span className="text-red-500 mr-2">•</span>
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-semibold text-blue-700 mb-2 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Opportunities
                    </h4>
                    <ul className="space-y-1">
                      {analysis.strategicInsights?.opportunities?.map((opportunity, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          {opportunity}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Progress Metrics */}
              <Card className="bg-white border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl font-semibold text-gray-900">
                    <Target className="h-5 w-5 mr-2 text-purple-600" />
                    Progress Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysis.progressMetrics?.map((metric, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{metric.metric}</span>
                          <span className="text-sm text-gray-600">{metric.progress}%</span>
                        </div>
                        <Progress value={metric.progress} className="h-2" />
                        <div className="text-sm text-gray-600">
                          <p>Target: £{metric.targetValue?.toLocaleString() || 0}</p>
                          <p>Timeline: {metric.timeline}</p>
                        </div>
                        <div className="mt-2">
                          <h5 className="font-medium text-gray-900 text-sm mb-1">Actions:</h5>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {metric.actions?.map((action, actionIndex) => (
                              <li key={actionIndex} className="flex items-start">
                                <span className="text-blue-500 mr-2">→</span>
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-6">
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-semibold text-gray-900">
                  <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
                  Financial Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(analysis.timeline || {}).map(([key, value]) => (
                    <div key={key} className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-3 h-3 bg-indigo-500 rounded-full mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 capitalize mb-2">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </h4>
                        <p className="text-gray-700">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advisor Tab */}
          <TabsContent value="advisor" className="space-y-6">
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-semibold text-gray-900">
                  <Heart className="h-5 w-5 mr-2 text-red-600" />
                  Financial Advisor Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Overall Assessment */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-3">Professional Assessment</h4>
                  <p className="text-blue-800 leading-relaxed">{analysis.financialAdvisorFeedback?.overallAssessment}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Key Strengths */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Key Strengths
                    </h4>
                    <ul className="space-y-2">
                      {analysis.financialAdvisorFeedback?.keyStrengths?.map((strength, index) => (
                        <li key={index} className="text-sm text-green-800 flex items-start">
                          <span className="text-green-600 mr-2">✓</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Critical Areas */}
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h4 className="font-semibold text-red-900 mb-3 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Critical Areas
                    </h4>
                    <ul className="space-y-2">
                      {analysis.financialAdvisorFeedback?.criticalAreas?.map((area, index) => (
                        <li key={index} className="text-sm text-red-800 flex items-start">
                          <span className="text-red-600 mr-2">⚠</span>
                          {area}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Success Factors & Warnings */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-3">Success Factors</h4>
                    <ul className="space-y-2">
                      {analysis.financialAdvisorFeedback?.successFactors?.map((factor, index) => (
                        <li key={index} className="text-sm text-blue-800 flex items-start">
                          <span className="text-blue-600 mr-2">→</span>
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <h4 className="font-semibold text-orange-900 mb-3">Warning Signs</h4>
                    <ul className="space-y-2">
                      {analysis.financialAdvisorFeedback?.warningSigns?.map((warning, index) => (
                        <li key={index} className="text-sm text-orange-800 flex items-start">
                          <span className="text-orange-600 mr-2">!</span>
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Encouragement */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                    <Heart className="h-4 w-4 mr-2" />
                    Encouragement
                  </h4>
                  <p className="text-green-800 leading-relaxed">{analysis.financialAdvisorFeedback?.encouragement}</p>
                </div>
              </CardContent>
            </Card>

            {/* Market Context */}
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-semibold text-gray-900">
                  <TrendingUpIcon className="h-5 w-5 mr-2 text-purple-600" />
                  Market Context
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Economic Climate</h4>
                    <p className="text-gray-700 text-sm">{analysis.marketContext?.currentEconomicClimate}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Interest Rate Impact</h4>
                    <p className="text-gray-700 text-sm">{analysis.marketContext?.interestRateImpact}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Inflation Considerations</h4>
                    <p className="text-gray-700 text-sm">{analysis.marketContext?.inflationConsiderations}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Market Opportunities</h4>
                    <p className="text-gray-700 text-sm">{analysis.marketContext?.marketOpportunities}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
            <Zap className="h-5 w-5 mr-2" />
            Create Budget from Analysis
          </Button>
          <Button variant="outline" size="lg" className="px-8 py-3">
            <ArrowRight className="h-5 w-5 mr-2" />
            Export Analysis
          </Button>
        </div>
      </div>
    </div>
  );
}

