"use client";

import React, { useEffect, useState } from 'react';
import { useFirebaseStore } from '@/lib/store-firebase';
import { AIQuestion, AIPreferences } from '@/lib/types/ai';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, AlertCircle, CheckCircle } from 'lucide-react';

interface DebtConfirmationQuestionProps {
  question: AIQuestion;
  preferences: AIPreferences;
  updatePreference: (key: keyof AIPreferences, value: string | number | string[]) => void;
}

interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  monthlyRepayment: number;
  interestRate: number;
  debtType: string;
  priority: string;
  isActive: boolean;
}

export const DebtConfirmationQuestion: React.FC<DebtConfirmationQuestionProps> = ({
  question,
  preferences,
  updatePreference
}) => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const { user } = useFirebaseStore();

  useEffect(() => {
    const loadDebts = async () => {
      try {
        setIsLoading(true);
        // Get debts from Firebase store
        const { useFirebaseStore } = await import('@/lib/store-firebase');
        const store = useFirebaseStore.getState();
        const userDebts = store.debts.filter((d: any) => d.isActive);
        setDebts(userDebts);
      } catch (error) {
        console.error('Error loading debts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadDebts();
    }
  }, [user]);

  // Check if debts are already confirmed
  useEffect(() => {
    if (preferences.debtConfirmation === 'yes') {
      setIsConfirmed(true);
    }
  }, [preferences.debtConfirmation]);

  const handleConfirm = (includeDebts: boolean) => {
    updatePreference('debtConfirmation', includeDebts ? 'yes' : 'no');
    setIsConfirmed(includeDebts);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <CreditCard className="w-12 h-12 text-primary mx-auto animate-pulse" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {question.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Loading your debt information...
          </p>
        </div>
      </div>
    );
  }

  if (debts.length === 0) {
    // No debts found - show redirect to debts screen
    return (
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <CreditCard className="w-12 h-12 text-primary mx-auto" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            No Debts Found
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            We couldn't find any active debts in your system. To provide accurate budget recommendations, please add your debt information first.
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
              Add Your Debts
            </h4>
            <p className="text-blue-700 dark:text-blue-300">
              Visit the Debts screen to input your debt details including amounts, interest rates, and repayment terms.
            </p>
          </div>
          
          <div className="flex justify-center">
            <a
              href="/loans"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200"
            >
              Go to Debts Screen
            </a>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Return here after adding your debts to continue with the AI questionnaire.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If debts are confirmed, show confirmation status
  if (isConfirmed) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <CreditCard className="w-12 h-12 text-green-600 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Debts Included ✓
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Your debts have been included in your budget allocation. The AI will consider these when creating your personalized budget plan.
          </p>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-6 space-y-4">
          <div className="text-center space-y-3">
            <h4 className="text-lg font-semibold text-green-900 dark:text-green-100">
              Debts Confirmed for Budget
            </h4>
            <p className="text-green-700 dark:text-green-300">
              The following debts will be included in your budget allocation:
            </p>
          </div>
          
          {/* Debt Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">£{debts.reduce((sum, debt) => sum + debt.totalAmount, 0).toLocaleString()}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Debt</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">£{debts.reduce((sum, debt) => sum + debt.monthlyRepayment, 0).toLocaleString()}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Monthly Payment</div>
              </div>
            </div>
            
            {/* Debt List */}
            <div className="space-y-2">
              <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Included Debts:</h5>
              {debts.map((debt) => (
                <div key={debt.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-900 dark:text-white">{debt.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {debt.debtType}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      £{debt.totalAmount.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      £{debt.monthlyRepayment.toFixed(2)}/month
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

  // Debts found - show confirmation with debt list
  const totalDebtAmount = debts.reduce((sum, debt) => sum + debt.totalAmount, 0);
  const totalMonthlyPayment = debts.reduce((sum, debt) => sum + debt.monthlyRepayment, 0);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <CreditCard className="w-12 h-12 text-primary mx-auto" />
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
            {question.debtConfirmationInfo?.title}
          </h4>
          <p className="text-green-700 dark:text-green-300">
            {question.debtConfirmationInfo?.description}
          </p>
        </div>
        
        {/* Debt Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">£{totalDebtAmount.toLocaleString()}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Debt</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">£{totalMonthlyPayment.toLocaleString()}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Monthly Payment</div>
            </div>
          </div>
          
          {/* Debt List */}
          <div className="space-y-2">
            <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Your Debts:</h5>
            {debts.map((debt) => (
              <div key={debt.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-900 dark:text-white">{debt.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {debt.debtType}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    £{debt.totalAmount.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    £{debt.monthlyRepayment.toFixed(2)}/month
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-center gap-4">
          <Button
            onClick={() => handleConfirm(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {question.debtConfirmationInfo?.confirmButtonText}
          </Button>
          <Button
            onClick={() => handleConfirm(false)}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3"
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            {question.debtConfirmationInfo?.skipButtonText}
          </Button>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-green-600 dark:text-green-400">
            {question.debtConfirmationInfo?.returnMessage}
          </p>
        </div>
      </div>
    </div>
  );
};
