import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Shield, 
  CreditCard, 
  Home, 
  PiggyBank, 
  ShoppingBag,
  CheckCircle,
  AlertTriangle,
  Target,
  Calendar,
  Zap
} from 'lucide-react';
import { AIAnalysisData } from '@/lib/types/ai';
import { aiBudgetIntegration } from '@/lib/services/ai-budget-integration';

interface AnalysisSummaryProps {
  analysis: AIAnalysisData;
  onApplyToBudget?: () => void;
}

export const AnalysisSummary: React.FC<AnalysisSummaryProps> = ({ 
  analysis, 
  onApplyToBudget 
}) => {
  const budgetAllocations = aiBudgetIntegration.getBudgetAllocations(analysis);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">AI Analysis Summary</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {analysis.summary}
          </p>
        </CardContent>
      </Card>

      {/* Budget Allocations */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-lg text-gray-900 dark:text-white">Budget Allocations</h4>
            {onApplyToBudget && (
              <Button 
                onClick={onApplyToBudget}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Apply to Budget
              </Button>
            )}
          </div>
          
          <div className="space-y-4">
            {budgetAllocations.map((allocation, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {allocation.priority}
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white">{allocation.category}</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{allocation.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-lg text-gray-900 dark:text-white">
                      £{allocation.amount.toLocaleString()}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {allocation.percentage}%
                    </Badge>
                  </div>
                </div>
                <Progress value={allocation.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Priorities */}
      <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200">
        <CardContent className="p-6">
          <h4 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">Financial Priorities</h4>
          <div className="space-y-3">
            {analysis.priorities?.map((priority, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                <div className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {priority.rank}
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900 dark:text-white">{priority.category}</h5>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{priority.reason}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{priority.action}</p>
                </div>
              </div>
            )) || (
              <p className="text-sm text-gray-500 dark:text-gray-500 italic">
                No priorities available
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment */}
      <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200">
        <CardContent className="p-6">
          <h4 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">Risk Assessment</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant={analysis.riskAssessment?.level === 'High' ? 'destructive' : 'secondary'}>
                {analysis.riskAssessment?.level || 'Moderate'} Risk
              </Badge>
            </div>
            
            {analysis.riskAssessment?.factors && (
              <div className="mb-3">
                <h6 className="font-medium text-gray-900 dark:text-white mb-2">Risk Factors:</h6>
                <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  {analysis.riskAssessment.factors.map((factor, index) => (
                    <li key={index}>{factor}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {analysis.riskAssessment?.mitigation && (
              <div>
                <h6 className="font-medium text-gray-900 dark:text-white mb-2">Mitigation Strategies:</h6>
                <p className="text-sm text-gray-700 dark:text-gray-300">{analysis.riskAssessment.mitigation}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border-teal-200">
        <CardContent className="p-6">
          <h4 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">Financial Timeline</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.timeline && Object.entries(analysis.timeline).map(([key, value]) => (
              <div key={key} className="bg-white dark:bg-gray-800 rounded-lg p-3 border">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-teal-600" />
                  <h6 className="font-medium text-gray-900 dark:text-white capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </h6>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Auto-Allocation Rules */}
      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200">
        <CardContent className="p-6">
          <h4 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">Auto-Allocation Rules</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            These rules can be used to automatically allocate your budget in the future:
          </p>
          <div className="space-y-3">
            {analysis.autoAllocationRules?.map((rule, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                <div className="flex-shrink-0 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {rule.priority}
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900 dark:text-white">{rule.category}</h5>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{rule.rule}</p>
                </div>
              </div>
            )) || (
              <p className="text-sm text-gray-500 dark:text-gray-500 italic">
                No auto-allocation rules available
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200">
        <CardContent className="p-6">
          <h4 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">Recommendations</h4>
          <div className="space-y-3">
            {analysis.recommendations?.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                <div className="flex-shrink-0 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{recommendation}</p>
              </div>
            )) || (
              <p className="text-sm text-gray-500 dark:text-gray-500 italic">
                No recommendations available
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress Metrics */}
      <Card className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 border-sky-200">
        <CardContent className="p-6">
          <h4 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">Progress Metrics</h4>
          <div className="space-y-3">
            {analysis.progressMetrics?.map((metric, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                <Target className="h-4 w-4 text-sky-600" />
                <p className="text-sm text-gray-700 dark:text-gray-300">{metric}</p>
              </div>
            )) || (
              <p className="text-sm text-gray-500 dark:text-gray-500 italic">
                No progress metrics available
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
