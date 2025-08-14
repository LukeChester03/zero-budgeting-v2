'use client';
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, ArrowRight, ArrowLeft, CheckCircle, Sparkles, DollarSign, AlertTriangle } from 'lucide-react';
import { useAIBudgeting } from '@/hooks/use-ai-budgeting';
import { AI_QUESTIONS } from '@/lib/data/ai-questions';
import { QuestionRenderer } from './ai/QuestionRenderer';
import { AnalysisSummary } from './ai/AnalysisSummary';

interface AIBudgetingAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIBudgetingAssistantModal({ isOpen, onClose }: AIBudgetingAssistantModalProps) {
  const {
    preferences, 
    aiAnalysis, 
    parsedAnalysis, 
    hasExistingAnalysis, 
    isLoading, 
    error, 
    currentStep, 
    progress,
    monthlyIncome,
    updatePreference, 
    resetPreferences, 
    handleSavePreferences, 
    handleNext, 
    handlePrevious, 
    canProceed, 
    clearError,
    isLastStep, 
    isSummaryStep
  } = useAIBudgeting();

  const currentQuestion = AI_QUESTIONS[currentStep];

  const handleApplyToBudget = () => {
    // TODO: Implement budget application logic
    console.log('Applying AI analysis to budget...');
    // This would integrate with the budget system
  };

  const handleClose = () => {
    resetPreferences();
    clearError();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            AI Budgeting Assistant
          </DialogTitle>
          <DialogDescription>
            Get personalized budget recommendations based on your financial situation
          </DialogDescription>
        </DialogHeader>

        {/* Income Display */}
        {monthlyIncome > 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <DollarSign className="h-5 w-5" />
              <span className="font-medium">Monthly Income: £{monthlyIncome.toLocaleString()}</span>
              <Badge variant="outline" className="text-green-600 border-green-400">
                Auto-populated from your profile
              </Badge>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Step {currentStep + 1} of {AI_QUESTIONS.length + 1}
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="mt-2 text-red-600 hover:text-red-700"
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="min-h-[400px]">
          {isSummaryStep ? (
            // Show AI Analysis Summary
            parsedAnalysis ? (
              <AnalysisSummary 
                analysis={parsedAnalysis} 
                onApplyToBudget={handleApplyToBudget}
              />
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300">Generating your personalized analysis...</p>
              </div>
            )
          ) : (
            // Show Question
            currentQuestion && (
              <QuestionRenderer
                question={currentQuestion}
                preferences={preferences}
                updatePreference={updatePreference}
              />
            )
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center gap-2">
            {currentStep > 0 && !isSummaryStep && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isLoading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isLastStep ? (
              <Button
                onClick={handleSavePreferences}
                disabled={isLoading || !monthlyIncome || monthlyIncome <= 0}
                className="bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Analysis...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Get AI Analysis
                  </>
                )}
              </Button>
            ) : !isSummaryStep ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed(currentQuestion?.id || '')}
                className="bg-primary hover:bg-primary/90"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleClose}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete
              </Button>
            )}
          </div>
        </div>

        {/* Income Warning */}
        {(!monthlyIncome || monthlyIncome <= 0) && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>Please set your monthly income in your profile to generate accurate budget recommendations.</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
