import { useState, useEffect, useCallback } from 'react';
import { useAIStore } from '@/lib/store/ai-store';
import { useAuth } from '@/lib/auth-context';
import { useFirebaseStore } from '@/lib/store-firebase';
import { AIService } from '@/lib/services/ai-service';

export const useAIBudgeting = () => {
  const { user } = useAuth();
  const { income: monthlyIncome } = useFirebaseStore();
  
  const {
    preferences,
    aiAnalysis,
    parsedAnalysis,
    hasExistingAnalysis,
    isLoading,
    error,
    currentStep,
    updatePreference,
    setCurrentStep,
    resetPreferences,
    checkExistingAnalysis,
    generateAnalysis,
    updatePreferences,
    setError,
    clearError,
    validateCurrentStep
  } = useAIStore();

  // Check for existing analysis when user changes
  useEffect(() => {
    if (user) {
      console.log('👤 User authenticated, checking existing analysis...');
      checkExistingAnalysis(user.uid);
    }
  }, [user, checkExistingAnalysis]);

  // Handle saving preferences and generating analysis
  const handleSavePreferences = useCallback(async () => {
    if (!user) {
      console.log('❌ No user authenticated');
      return;
    }
    
    if (!monthlyIncome || monthlyIncome <= 0) {
      console.log('❌ No monthly income available');
      setError('Please set your monthly income before generating analysis');
      return;
    }
    
    console.log('💾 Starting save preferences process...');
    console.log('📊 Current preferences:', preferences);
    console.log('💰 Monthly income:', monthlyIncome);
    
    try {
      // Check if user has existing analysis
      console.log('🔍 Checking if user has existing analysis...');
      const hasAnalysis = await AIService.hasExistingAnalysis(user.uid);
      console.log('📊 Has existing analysis:', hasAnalysis);
      
      if (hasAnalysis) {
        // User has existing analysis - check if it's actually complete
        console.log('🔄 Checking existing analysis completeness...');
        const existing = await AIService.getExistingAnalysis(user.uid);
        if (existing) {
          const hasCompleteAnalysis = existing.aiAnalysis && existing.aiAnalysis.trim().length > 0;
          
          if (hasCompleteAnalysis) {
            // Analysis exists and is complete - just update preferences
            console.log('✅ Existing analysis is complete, updating preferences...');
            await updatePreferences(user.uid, existing.id);
            console.log('✅ Successfully updated existing preferences');
          } else {
            // Analysis exists but is empty - regenerate it
            console.log('⚠️ Existing analysis is empty, regenerating...');
            
            // Update preferences first
            await AIService.updatePreferences(existing.id, {
              preferences,
              updatedAt: new Date().toISOString()
            });
            
            // Generate new analysis
            console.log('🤖 Generating new AI analysis...');
            await generateAnalysis(user.uid, monthlyIncome);
            
            // Update with the generated analysis
            if (aiAnalysis) {
              console.log('🔄 Updating document with new analysis...');
              await AIService.updatePreferences(existing.id, {
                aiAnalysis,
                updatedAt: new Date().toISOString()
              });
              console.log('✅ New analysis successfully saved to Firestore');
            }
          }
        }
      } else {
        // User has NO analysis - save preferences first, then generate analysis
        console.log('🆕 No existing analysis found, creating new one...');
        
        // Save preferences to Firestore first
        console.log('💾 Saving preferences to Firestore...');
        const newDocId = await AIService.savePreferencesAndAnalysis(
          user.uid, 
          preferences, 
          ''
        );
        console.log('✅ Preferences saved with document ID:', newDocId);
        
        // Generate analysis with single Gemini API call
        console.log('🤖 Generating AI analysis...');
        await generateAnalysis(user.uid, monthlyIncome);
        
        // Update with the generated analysis
        if (aiAnalysis) {
          console.log('🔄 Updating document with generated analysis...');
          await AIService.updatePreferences(newDocId, {
            aiAnalysis,
            updatedAt: new Date().toISOString()
          });
          console.log('✅ Analysis successfully saved to Firestore');
        }
      }
      
      // Move to final step
      console.log('🎯 Moving to final step...');
      setCurrentStep(23); // Total questions + 1 for summary (23 questions + 1 summary = 24 total steps)
    } catch (error) {
      console.error('❌ Error in handleSavePreferences:', error);
      setError(error instanceof Error ? error.message : 'Failed to save preferences');
    }
  }, [user, preferences, monthlyIncome, aiAnalysis, updatePreferences, generateAnalysis, setCurrentStep, setError]);

  // Handle next step
  const handleNext = useCallback(() => {
    if (currentStep < 23) { // 23 questions (0-22), 24 is summary
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, setCurrentStep]);

  // Handle previous step
  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep, setCurrentStep]);

  // Validation
  const canProceed = useCallback((questionId: string) => {
    const canProceedResult = validateCurrentStep();
    console.log(`✅ Validation for step ${currentStep} (${questionId}):`, canProceedResult);
    return canProceedResult;
  }, [validateCurrentStep, currentStep]);

  // Progress calculation
  const progress = ((currentStep + 1) / 24) * 100; // 24 total steps (23 questions + 1 summary)

  return {
    // State
    preferences,
    aiAnalysis,
    parsedAnalysis,
    hasExistingAnalysis,
    isLoading,
    error,
    currentStep,
    progress,
    monthlyIncome, // Return monthly income

    // Actions
    updatePreference,
    resetPreferences,
    handleSavePreferences,
    handleNext,
    handlePrevious,
    canProceed,
    clearError,

    // Computed
    isLastStep: currentStep === 22, // 22 questions (0-21), 23 is summary
    isSummaryStep: currentStep === 23
  };
};
