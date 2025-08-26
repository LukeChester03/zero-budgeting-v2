"use client";

import React, { useEffect, useState } from 'react';
import { useFirebaseStore } from '@/lib/store-firebase';
import { AIQuestion, AIPreferences } from '@/lib/types/ai';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, AlertCircle, CheckCircle, PiggyBank } from 'lucide-react';

interface GoalsConfirmationQuestionProps {
  question: AIQuestion;
  preferences: AIPreferences;
  updatePreference: (key: keyof AIPreferences, value: string | number | string[]) => void;
}

interface Goal {
  id: string;
  title: string;
  target: number;
  monthlyContribution: number;
  priority: string;
  isActive: boolean;
}

export const GoalsConfirmationQuestion: React.FC<GoalsConfirmationQuestionProps> = ({
  question,
  preferences,
  updatePreference
}) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const { user } = useFirebaseStore();

  useEffect(() => {
    const loadGoals = async () => {
      try {
        setIsLoading(true);
        // Get goals from Firebase store
        const { useFirebaseStore } = await import('@/lib/store-firebase');
        const store = useFirebaseStore.getState();
        const userGoals = store.goals.filter((g: any) => g.isActive);
        setGoals(userGoals);
      } catch (error) {
        console.error('Error loading goals:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadGoals();
    }
  }, [user]);

  // Check if goals are already confirmed
  useEffect(() => {
    if (preferences.goalsConfirmation === 'yes') {
      setIsConfirmed(true);
    }
  }, [preferences.goalsConfirmation]);

  const handleConfirm = (includeGoals: boolean | null) => {
    if (includeGoals === null) {
      // User doesn't have goals yet
      updatePreference('goalsConfirmation', 'none');
      setIsConfirmed(false);
    } else {
      updatePreference('goalsConfirmation', includeGoals ? 'yes' : 'no');
      setIsConfirmed(includeGoals);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <Target className="w-12 h-12 text-primary mx-auto animate-pulse" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {question.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Loading your goals information...
          </p>
        </div>
      </div>
    );
  }

  if (goals.length === 0) {
    // No goals found - allow user to continue without goals
    return (
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <Target className="w-12 h-12 text-primary mx-auto" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            No Goals Found
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            We couldn't find any active savings goals in your system. You can continue without goals, and add them later.
          </p>
          {question.required && (
            <Badge variant="outline" className="text-orange-600 border-orange-300">
              Required
            </Badge>
          )}
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6 space-y-4">
          <div className="text-center space-y-3">
            <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
              Continue Without Goals
            </h4>
            <p className="text-blue-700 dark:text-blue-300">
              We'll focus on your essentials first. You can add goals any time from the Savings screen.
            </p>
          </div>

          <div className="flex justify-center gap-3">
            <Button
              onClick={() => handleConfirm(null)}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50 px-6 py-3"
            >
              {question.goalsConfirmationInfo?.noGoalsButtonText || "I don't have any goals yet"}
            </Button>
            <a
              href="/savings"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200"
            >
              Go to Savings (optional)
            </a>
          </div>

          <div className="text-center">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              After choosing to continue, click Next to proceed with the questionnaire.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If goals are confirmed, show confirmation status
  if (isConfirmed) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <Target className="w-12 h-12 text-green-600 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Goals Included ✓
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Your savings goals have been included in your budget allocation. The AI will consider these when creating your personalized budget plan.
          </p>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-6 space-y-4">
          <div className="text-center space-y-3">
            <h4 className="text-lg font-semibold text-green-900 dark:text-green-100">
              Goals Confirmed for Budget
            </h4>
            <p className="text-green-700 dark:text-green-300">
              The following savings goals will be included in your budget allocation:
            </p>
          </div>
          
          {/* Goals Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">£{goals.reduce((sum, goal) => sum + goal.target, 0).toLocaleString()}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Target</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">£{goals.reduce((sum, goal) => sum + goal.monthlyContribution, 0).toLocaleString()}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Monthly Contribution</div>
              </div>
            </div>
            
            {/* Goals List */}
            <div className="space-y-2">
              <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Included Goals:</h5>
              {goals.map((goal) => (
                <div key={goal.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="flex items-center gap-2">
                    <PiggyBank className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-900 dark:text-white">{goal.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {goal.priority}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      £{goal.target.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      £{goal.monthlyContribution.toFixed(2)}/month
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-center">
            <Button
              onClick={() => setIsConfirmed(false)}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3"
            >
              Change Selection
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Goals found - show confirmation with goals list
  const totalTarget = goals.reduce((sum, goal) => sum + goal.target, 0);
  const totalMonthlyContribution = goals.reduce((sum, goal) => sum + goal.monthlyContribution, 0);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <Target className="w-12 h-12 text-primary mx-auto" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {question.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          {question.description}
        </p>
        {question.required && (
          <Badge variant="outline" className="text-orange-600 border-orange-300">
            Required
          </Badge>
        )}
      </div>
      
      <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-6 space-y-4">
        <div className="text-center space-y-3">
          <h4 className="text-lg font-semibold text-green-900 dark:text-green-100">
            {question.goalsConfirmationInfo?.title}
          </h4>
          <p className="text-green-700 dark:text-green-300">
            {question.goalsConfirmationInfo?.description}
          </p>
        </div>
        
        {/* Goals Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">£{totalTarget.toLocaleString()}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Target</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">£{totalMonthlyContribution.toLocaleString()}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Monthly Contribution</div>
            </div>
          </div>
          
          {/* Goals List */}
          <div className="space-y-2">
            <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Your Goals:</h5>
            {goals.map((goal) => (
              <div key={goal.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="flex items-center gap-2">
                  <PiggyBank className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-900 dark:text-white">{goal.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {goal.priority}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    £{goal.target.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    £{goal.monthlyContribution.toFixed(2)}/month
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button
            onClick={() => handleConfirm(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {question.goalsConfirmationInfo?.confirmButtonText}
          </Button>
          <Button
            onClick={() => handleConfirm(false)}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3"
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            {question.goalsConfirmationInfo?.skipButtonText}
          </Button>
          <Button
            onClick={() => handleConfirm(null)}
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-50 px-6 py-3"
          >
            <Target className="w-4 h-4 mr-2" />
            {question.goalsConfirmationInfo?.noGoalsButtonText}
          </Button>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-green-600 dark:text-green-400">
            {question.goalsConfirmationInfo?.returnMessage}
          </p>
        </div>
        
        {/* Show no goals message when user selects that option */}
        {preferences.goalsConfirmation === 'none' && (
          <div className="text-center bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              {question.goalsConfirmationInfo?.noGoalsMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

