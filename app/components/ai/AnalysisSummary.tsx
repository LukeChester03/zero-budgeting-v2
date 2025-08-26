import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle,
  Calendar,
  Target,
  AlertTriangle
} from 'lucide-react';
import { AIAnalysisData } from '@/lib/types/ai';
import { aiBudgetIntegration } from '@/lib/services/ai-budget-integration';

interface AnalysisSummaryProps {
  analysis: AIAnalysisData;
  onApplyToBudget?: () => void;
  onCreateAutomatedBudget?: () => Promise<void>;
  monthlyIncome?: number;
}

export const AnalysisSummary: React.FC<AnalysisSummaryProps> = ({ 
  analysis, 
  onApplyToBudget,
  onCreateAutomatedBudget,
  monthlyIncome
}) => {
  const budgetAllocations = aiBudgetIntegration.getBudgetAllocations(analysis);

  return (
    <div className="space-y-8">
      {/* Summary */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200">
        <CardContent className="p-8">
          <h3 className="font-bold text-2xl mb-6 text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            AI Analysis Summary
          </h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
            {analysis.summary}
          </p>
        </CardContent>
      </Card>

      {/* Budget Allocations */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h4 className="font-bold text-2xl text-gray-900 dark:text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              Budget Allocations
            </h4>
            <div className="flex gap-3">
              {onCreateAutomatedBudget && monthlyIncome && monthlyIncome > 0 && (
                <Button 
                  onClick={onCreateAutomatedBudget}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3"
                  variant="outline"
                >
                  <Target className="h-5 w-5 mr-2" />
                  Create Automated Budget
                </Button>
              )}
              {onApplyToBudget && (
                <Button 
                  onClick={onApplyToBudget}
                  className="bg-green-600 hover:bg-green-700 px-6 py-3"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Apply to Budget
                </Button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {budgetAllocations.map((allocation, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-green-100 dark:border-green-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-green-500 text-white rounded-xl flex items-center justify-center text-lg font-bold">
                      {allocation.priority}
                    </div>
                    <div>
                      <h5 className="font-bold text-lg text-gray-900 dark:text-white">{allocation.category}</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">{allocation.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-2xl text-gray-900 dark:text-white">
                      £{allocation.amount.toLocaleString()}
                    </div>
                    <Badge variant="outline" className="text-sm px-3 py-1">
                      {allocation.percentage}%
                    </Badge>
                  </div>
                </div>
                <Progress value={allocation.percentage} className="h-3" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Priorities */}
      <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200">
        <CardContent className="p-8">
          <h4 className="font-bold text-2xl mb-6 text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            Financial Priorities
          </h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analysis.priorities?.map((priority, index) => (
              <div key={index} className="flex items-start gap-4 p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-purple-100 dark:border-purple-800 shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-500 text-white rounded-xl flex items-center justify-center text-lg font-bold">
                  {priority.rank}
                </div>
                <div className="flex-1">
                  <h5 className="font-bold text-lg text-gray-900 dark:text-white mb-3">{priority.category}</h5>
                  <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">{priority.reason}</p>
                  <p className="text-sm text-purple-700 dark:text-purple-300 font-semibold bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-lg">{priority.action}</p>
                </div>
              </div>
            )) || (
              <div className="col-span-full text-center py-8">
                <p className="text-lg text-gray-500 dark:text-gray-500 italic">
                  No priorities available
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment */}
      <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200">
        <CardContent className="p-8">
          <h4 className="font-bold text-2xl mb-6 text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            Risk Assessment
          </h4>
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Badge variant={analysis.riskAssessment?.level === 'High' ? 'destructive' : 'secondary'} className="text-lg px-4 py-2">
                {analysis.riskAssessment?.level || 'Moderate'} Risk
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {analysis.riskAssessment?.factors && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-orange-100 dark:border-orange-800">
                  <h6 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Risk Factors:</h6>
                  <ul className="space-y-3">
                    {analysis.riskAssessment.factors.map((factor, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700 dark:text-gray-300 leading-relaxed">{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {analysis.riskAssessment?.mitigation && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-orange-100 dark:border-orange-800">
                  <h6 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Mitigation Strategies:</h6>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{analysis.riskAssessment.mitigation}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border-teal-200">
        <CardContent className="p-8">
          <h4 className="font-bold text-2xl mb-6 text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            Financial Timeline
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analysis.timeline && Object.entries(analysis.timeline).map(([key, value]) => (
              <div key={key} className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-teal-100 dark:border-teal-800 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="h-6 w-6 text-teal-600" />
                  <h6 className="font-bold text-lg text-gray-900 dark:text-white capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </h6>
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Auto-Allocation Rules */}
      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200">
        <CardContent className="p-8">
          <h4 className="font-bold text-2xl mb-6 text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            Auto-Allocation Rules
          </h4>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
            These rules can be used to automatically allocate your budget in the future:
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analysis.autoAllocationRules?.map((rule, index) => (
              <div key={index} className="flex items-start gap-4 p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-emerald-100 dark:border-emerald-800 shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center text-lg font-bold">
                  {rule.priority}
                </div>
                <div className="flex-1">
                  <h5 className="font-bold text-lg text-gray-900 dark:text-white mb-3">{rule.category}</h5>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{rule.rule}</p>
                </div>
              </div>
            )) || (
              <div className="col-span-full text-center py-8">
                <p className="text-lg text-gray-500 dark:text-gray-500 italic">
                  No auto-allocation rules available
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200">
        <CardContent className="p-8">
          <h4 className="font-bold text-2xl mb-6 text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            Recommendations
          </h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analysis.recommendations?.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-4 p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-amber-100 dark:border-amber-800 shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center text-lg font-bold">
                  {index + 1}
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">{recommendation}</p>
              </div>
            )) || (
              <div className="col-span-full text-center py-8">
                <p className="text-lg text-gray-500 dark:text-gray-500 italic">
                  No recommendations available
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress Metrics */}
      <Card className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 border-sky-200">
        <CardContent className="p-8">
          <h4 className="font-bold text-2xl mb-6 text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-600 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            Progress Metrics
          </h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analysis.progressMetrics?.map((metric, index) => (
              <div key={index} className="flex items-center gap-4 p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-sky-100 dark:border-sky-800 shadow-sm">
                <Target className="h-6 w-6 text-sky-600 flex-shrink-0" />
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">{metric}</p>
              </div>
            )) || (
              <div className="col-span-full text-center py-8">
                <p className="text-lg text-gray-500 dark:text-gray-500 italic">
                  No progress metrics available
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
