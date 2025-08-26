"use client";

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle,
  Calendar,
  Target,
  AlertTriangle,
  X,
  Download,
  Share2,
  Bookmark
} from 'lucide-react';
import { AIAnalysisData } from '@/lib/types/ai';

interface AIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: AIAnalysisData;
  monthlyIncome?: number;
  onApplyToBudget?: () => void;
  onCreateAutomatedBudget?: () => Promise<void>;
}

export default function AIAnalysisModal({ 
  isOpen, 
  onClose, 
  analysis, 
  monthlyIncome,
  onApplyToBudget,
  onCreateAutomatedBudget
}: AIAnalysisModalProps) {
  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[98vw] max-h-[98vh] w-[98vw] h-[98vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Target className="w-7 h-7 text-white" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-bold text-gray-900 dark:text-white">
                  AI Financial Analysis
                </DialogTitle>
                <DialogDescription className="text-lg text-gray-600 dark:text-gray-400">
                  Your personalized financial strategy and budget recommendations
                </DialogDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Bookmark className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 max-w-none">
          {/* Summary */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200">
            <CardContent className="p-8">
              <h3 className="font-bold text-3xl mb-6 text-gray-900 dark:text-white flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                AI Analysis Summary
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-xl">
                {analysis.summary}
              </p>
            </CardContent>
          </Card>

          {/* Budget Allocations */}
          {analysis.budgetAllocations && analysis.budgetAllocations.length > 0 && (
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200">
              <CardContent className="p-8">
                <h4 className="font-bold text-3xl mb-8 text-gray-900 dark:text-white flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                    <Target className="w-7 h-7 text-white" />
                  </div>
                  Budget Allocations
                </h4>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {analysis.budgetAllocations.map((allocation, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-2 border-green-100 dark:border-green-800 shadow-lg hover:shadow-xl transition-shadow">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-6">
                          <div className="flex-shrink-0 w-16 h-16 bg-green-500 text-white rounded-2xl flex items-center justify-center text-2xl font-bold">
                            {allocation.priority}
                          </div>
                          <div>
                            <h5 className="font-bold text-2xl text-gray-900 dark:text-white">{allocation.category}</h5>
                            <p className="text-gray-600 dark:text-gray-400 max-w-md text-lg">{allocation.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-3xl text-gray-900 dark:text-white">
                            £{allocation.amount.toLocaleString()}
                          </div>
                          <Badge variant="outline" className="text-lg px-4 py-2">
                            {allocation.percentage}%
                          </Badge>
                        </div>
                      </div>
                      <Progress value={allocation.percentage} className="h-4" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Priorities */}
          {analysis.priorities && analysis.priorities.length > 0 && (
            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200">
              <CardContent className="p-8">
                <h4 className="font-bold text-3xl mb-8 text-gray-900 dark:text-white flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                    <Target className="w-7 h-7 text-white" />
                  </div>
                  Financial Priorities
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {analysis.priorities.map((priority, index) => (
                    <div key={index} className="flex items-start gap-6 p-8 bg-white dark:bg-gray-800 rounded-2xl border-2 border-purple-100 dark:border-purple-800 shadow-lg">
                      <div className="flex-shrink-0 w-16 h-16 bg-purple-500 text-white rounded-2xl flex items-center justify-center text-2xl font-bold">
                        {priority.rank}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-bold text-2xl text-gray-900 dark:text-white mb-4">{priority.category}</h5>
                        <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed text-lg">{priority.reason}</p>
                        <p className="text-lg text-purple-700 dark:text-purple-300 font-semibold bg-purple-50 dark:bg-purple-900/20 px-6 py-3 rounded-xl">{priority.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risk Assessment */}
          {analysis.riskAssessment && (
            <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200">
              <CardContent className="p-8">
                <h4 className="font-bold text-3xl mb-8 text-gray-900 dark:text-white flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-7 h-7 text-white" />
                  </div>
                  Risk Assessment
                </h4>
                <div className="space-y-8">
                  <div className="flex items-center gap-4 mb-8">
                    <Badge variant={analysis.riskAssessment.level === 'High' ? 'destructive' : 'secondary'} className="text-xl px-6 py-3">
                      {analysis.riskAssessment.level} Risk
                    </Badge>
                  </div>
                  
                  {analysis.riskAssessment.factors && analysis.riskAssessment.factors.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-2 border-orange-100 dark:border-orange-800 shadow-lg">
                        <h6 className="font-bold text-2xl text-gray-900 dark:text-white mb-6">Risk Factors:</h6>
                        <ul className="space-y-4">
                          {analysis.riskAssessment.factors.map((factor, index) => (
                            <li key={index} className="flex items-start gap-4">
                              <div className="w-3 h-3 bg-orange-500 rounded-full mt-3 flex-shrink-0"></div>
                              <span className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">{factor}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {analysis.riskAssessment.mitigation && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-2 border-orange-100 dark:border-orange-800 shadow-lg">
                          <h6 className="font-bold text-2xl text-gray-900 dark:text-white mb-6">Mitigation Strategies:</h6>
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">{analysis.riskAssessment.mitigation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200">
              <CardContent className="p-8">
                <h4 className="font-bold text-3xl mb-8 text-gray-900 dark:text-white flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center">
                    <Target className="w-7 h-7 text-white" />
                  </div>
                  Recommendations
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {analysis.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-6 p-8 bg-white dark:bg-gray-800 rounded-2xl border-2 border-amber-100 dark:border-amber-800 shadow-lg">
                      <div className="flex-shrink-0 w-16 h-16 bg-amber-500 text-white rounded-2xl flex items-center justify-center text-2xl font-bold">
                        {index + 1}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-xl">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progress Metrics */}
          {analysis.progressMetrics && analysis.progressMetrics.length > 0 && (
            <Card className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 border-sky-200">
              <CardContent className="p-8">
                <h4 className="font-bold text-3xl mb-8 text-gray-900 dark:text-white flex items-center gap-3">
                  <div className="w-12 h-12 bg-sky-600 rounded-xl flex items-center justify-center">
                    <Target className="w-7 h-7 text-white" />
                  </div>
                  Progress Metrics
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {analysis.progressMetrics.map((metric, index) => (
                    <div key={index} className="flex items-center gap-6 p-8 bg-white dark:bg-gray-800 rounded-2xl border-2 border-sky-100 dark:border-sky-800 shadow-lg">
                      <Target className="h-8 w-8 text-sky-600 flex-shrink-0" />
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-xl">{metric}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Analysis generated on {new Date().toLocaleDateString()}
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              {onCreateAutomatedBudget && monthlyIncome && monthlyIncome > 0 && (
                <Button onClick={onCreateAutomatedBudget} className="bg-blue-600 hover:bg-blue-700">
                  <Target className="w-5 h-5 mr-2" />
                  Create Automated Budget
                </Button>
              )}
              {onApplyToBudget && (
                <Button onClick={onApplyToBudget} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Apply to Budget
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
