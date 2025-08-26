'use client';
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, ArrowRight, ArrowLeft, CheckCircle, Sparkles, DollarSign, AlertTriangle, Target } from 'lucide-react';
import { useAIBudgeting } from '@/hooks/use-ai-budgeting';
import { AI_QUESTIONS } from '@/lib/data/ai-questions';
import { QuestionRenderer } from './ai/QuestionRenderer';
import { useAIStore } from '@/lib/store/ai-store';
import { AIService } from '@/lib/services/ai-service';

import { useAuth } from '@/lib/auth-context';

interface AIBudgetingAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIBudgetingAssistantModal({ isOpen, onClose }: AIBudgetingAssistantModalProps) {

  const {
    preferences, 
    parsedAnalysis, 
    isLoading, 
    error, 
    currentStep, 
    progress,
    monthlyIncome,
    updatePreference, 
    resetPreferences, 
    resetPreferencesOnly,
    handleSavePreferences, 
    handleNext, 
    handlePrevious, 
    canProceed, 
    clearError,
    isLastStep, 
    isSummaryStep,
    createAutomatedBudget
  } = useAIBudgeting();

  const { user } = useAuth();

  const currentQuestion = AI_QUESTIONS[currentStep];



  const handleCreateAutomatedBudget = async () => {
    if (!monthlyIncome || monthlyIncome <= 0) {
      console.log('❌ No monthly income available for budget creation');
      return;
    }
    
    console.log('🤖 Creating automated budget from AI analysis...');
    
    try {
      const result = await createAutomatedBudget(user?.uid || '', monthlyIncome);
      
      if (result.success) {
        console.log('✅ Automated budget created successfully with ID:', result.budgetId);
        // Show success message and potentially redirect to budget view
        // You could also trigger a refresh of the budget list here
      } else {
        console.error('❌ Failed to create automated budget');
        // Show error message to user
      }
    } catch (error) {
      console.error('❌ Error creating automated budget:', error);
    }
  };

  const handleClose = () => {
    // Only reset preferences if there's no existing analysis
    if (!parsedAnalysis) {
      resetPreferences();
    } else {
      // If analysis exists, just reset preferences but keep the analysis
      resetPreferencesOnly();
    }
    clearError();
    onClose();
  };

  const handleAnalysisGenerated = async () => {
    try {
      console.log('🚀 User clicked View Full Analysis, ensuring analysis is saved...');
      
      // Check if we have the analysis in the store
      const { parsedAnalysis, aiAnalysis, setError } = useAIStore.getState();
      
      if (!parsedAnalysis || !aiAnalysis) {
        console.error('❌ No analysis available in store');
        setError('Analysis not available. Please try again.');
        return;
      }
      
      // Ensure the analysis is saved to Firebase before redirecting
      console.log('💾 Ensuring analysis is saved to Firebase...');
      let existing = await AIService.getExistingAnalysis(user?.uid || '');
      
      if (!existing) {
        // Create initial document if it doesn't exist
        console.log('🆕 No existing document found, creating initial preferences document...');
        const { preferences } = useAIStore.getState();
        const docId = await AIService.createInitialPreferences(user?.uid || '', preferences);
        existing = { id: docId, userId: user?.uid || '', preferences, aiAnalysis: '', createdAt: '', updatedAt: '' };
      }
      
      if (existing) {
        await AIService.saveGeneratedAnalysis(existing.id, aiAnalysis);
        console.log('✅ Analysis saved to Firebase, redirecting...');
        
        // Close the modal and redirect
        onClose();
        window.location.href = '/ai-analysis';
      } else {
        throw new Error('Failed to create or find document for saving analysis');
      }
      
    } catch (error) {
      console.error('❌ Error ensuring analysis is saved:', error);
      const { setError } = useAIStore.getState();
      setError('Failed to save analysis. Please try again.');
    }
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
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Analysis Complete!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
                    Your personalized financial analysis has been generated. Click below to view the comprehensive results.
                  </p>
                  <Button 
                    onClick={handleAnalysisGenerated}
                    className="bg-blue-600 hover:bg-blue-700 px-8 py-4 text-lg"
                  >
                    <Target className="w-6 h-6 mr-3" />
                    View Full Analysis
                  </Button>
                </div>
              ) : (
                <div className="text-center py-16 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border-2 border-dashed border-blue-200 dark:border-blue-700">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-6"></div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    Generating Your Personalized Analysis
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
                    Our AI is analyzing your financial situation, goals, and preferences to create a comprehensive budget strategy tailored just for you.
                  </p>
                  <div className="mt-6 flex justify-center">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )
            ) : (
            // Show Question
            currentQuestion && (
              <QuestionRenderer
                question={currentQuestion}
                preferences={preferences}
                updatePreference={updatePreference}
                onGenerateAnalysis={handleSavePreferences}
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
