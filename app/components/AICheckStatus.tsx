"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface AICheckStatusProps {
  userId: string;
}

interface AIStatus {
  hasQuestionnaireData: boolean;
  isComplete: boolean;
  lastUpdated?: string;
  error?: string;
}

export default function AICheckStatus({ userId }: AICheckStatusProps) {
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAIStatus();
  }, [userId]);

  const checkAIStatus = async () => {
    try {
      setIsLoading(true);
      
      // Import the AI service
      const { AIService } = await import('@/lib/services/ai-service');
      
      // Check if user has any AI analysis data
      const existingAnalysis = await AIService.getExistingAnalysis(userId);
      
      if (!existingAnalysis) {
        setStatus({
          hasQuestionnaireData: false,
          isComplete: false
        });
        return;
      }

      if (!existingAnalysis.aiAnalysis || existingAnalysis.aiAnalysis.trim().length === 0) {
        setStatus({
          hasQuestionnaireData: false,
          isComplete: false
        });
        return;
      }

      // Try to parse the analysis to check if it's complete
      try {
        const aiAnalysis = JSON.parse(existingAnalysis.aiAnalysis);
        const hasBudgetAllocations = aiAnalysis.budgetAllocations && aiAnalysis.budgetAllocations.length > 0;
        
        setStatus({
          hasQuestionnaireData: true,
          isComplete: hasBudgetAllocations,
          lastUpdated: existingAnalysis.updatedAt || existingAnalysis.createdAt
        });
      } catch (parseError) {
        setStatus({
          hasQuestionnaireData: false,
          isComplete: false,
          error: 'Analysis data corrupted'
        });
      }
      
    } catch (error) {
      console.error('Error checking AI status:', error);
      setStatus({
        hasQuestionnaireData: false,
        isComplete: false,
        error: 'Failed to check status'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-blue-200 bg-blue-50/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-blue-600 animate-pulse" />
            <div className="text-sm text-blue-700">Checking AI questionnaire status...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return null;
  }

  if (!status.hasQuestionnaireData) {
    return (
      <Card className="border-orange-200 bg-orange-50/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-orange-800 text-sm">AI Questionnaire Not Completed</span>
                <Badge variant="secondary" className="text-xs">Required for AI Auto Allocate</Badge>
              </div>
              <p className="text-xs text-orange-700 mb-3">
                Complete the AI questionnaire to get personalized budget allocations based on your financial situation, goals, and preferences.
              </p>
              <Button
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white text-xs"
                onClick={() => {
                  // Navigate to home page and automatically open AI modal
                  router.push('/?openAI=true');
                }}
              >
                <Brain className="h-3 w-3 mr-2" />
                Complete AI Questionnaire
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status.isComplete) {
    return (
      <Card className="border-yellow-200 bg-yellow-50/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-yellow-800 text-sm">AI Questionnaire Incomplete</span>
                <Badge variant="secondary" className="text-xs">In Progress</Badge>
              </div>
              <p className="text-xs text-yellow-700 mb-3">
                Your AI questionnaire appears to be incomplete. Please complete it to get personalized budget allocations.
              </p>
              <Button
                size="sm"
                className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs"
                onClick={() => {
                  // Navigate to home page and automatically open AI modal
                  router.push('/?openAI=true');
                }}
              >
                <Brain className="h-3 w-3 mr-2" />
                Complete AI Questionnaire
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // AI questionnaire is complete
  return (
    <Card className="border-green-200 bg-green-50/30">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-green-800 text-sm">AI Questionnaire Complete</span>
              <Badge variant="secondary" className="text-xs">Ready for AI Auto Allocate</Badge>
            </div>
            <p className="text-xs text-green-700 mb-2">
              Your AI questionnaire is complete! Click "AI Auto Allocate" to get personalized budget allocations.
            </p>
            {status.lastUpdated && (
              <p className="text-xs text-green-600">
                Last updated: {new Date(status.lastUpdated).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
