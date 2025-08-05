"use client";

import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  TrendingUp, 
  PiggyBank, 
  Target, 
  Shield, 
  Zap,
  Lightbulb,
  DollarSign,
  Calendar,
  Calculator
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PaidOffDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debtName: string;
  monthlyPayment: number;
  totalAmount: number;
  interestSaved: number;
}

export default function PaidOffDebtModal({
  isOpen,
  onClose,
  debtName,
  monthlyPayment,
  totalAmount,
  interestSaved
}: PaidOffDebtModalProps) {
  const suggestions = [
    {
      title: "Emergency Fund",
      description: "Build a 3-6 month emergency fund",
      monthlyAmount: monthlyPayment * 0.4,
      icon: <Shield className="h-5 w-5 text-green-600" />,
      color: "bg-green-50 border-green-200"
    },
    {
      title: "Investments",
      description: "Start building long-term wealth",
      monthlyAmount: monthlyPayment * 0.3,
      icon: <TrendingUp className="h-5 w-5 text-blue-600" />,
      color: "bg-blue-50 border-blue-200"
    },
    {
      title: "Savings Goals",
      description: "Save for your next big purchase",
      monthlyAmount: monthlyPayment * 0.2,
      icon: <Target className="h-5 w-5 text-purple-600" />,
      color: "bg-purple-50 border-purple-200"
    },
    {
      title: "Fun Money",
      description: "Treat yourself occasionally",
      monthlyAmount: monthlyPayment * 0.1,
      icon: <Zap className="h-5 w-5 text-orange-600" />,
      color: "bg-orange-50 border-orange-200"
    }
  ];

  const annualSavings = monthlyPayment * 12;
  const fiveYearSavings = annualSavings * 5;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-green-700">
                Congratulations! 🎉
              </DialogTitle>
              <DialogDescription className="text-lg">
                You've successfully paid off <strong>{debtName}</strong>!
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Card */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-700">
                    £{monthlyPayment.toFixed(2)}
                  </div>
                  <div className="text-sm text-green-600">Monthly Payment Freed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-700">
                    £{totalAmount.toFixed(2)}
                  </div>
                  <div className="text-sm text-green-600">Total Amount Paid</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What to do with the money */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              What to do with your freed-up money
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestions.map((suggestion, index) => (
                <Card key={index} className={cn("border-2", suggestion.color)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      {suggestion.icon}
                      <div>
                        <h4 className="font-semibold">{suggestion.title}</h4>
                        <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-green-700">
                      £{suggestion.monthlyAmount.toFixed(2)}/month
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Long-term impact */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                Long-term impact of staying debt-free
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Annual savings:</span>
                  <span className="font-bold text-blue-700">£{annualSavings.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>5-year savings:</span>
                  <span className="font-bold text-blue-700">£{fiveYearSavings.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Interest saved:</span>
                  <span className="font-bold text-green-700">£{interestSaved.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warning about new debt */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-yellow-800">
                <Shield className="h-5 w-5" />
                Stay Debt-Free!
              </h3>
              <div className="space-y-2 text-sm text-yellow-700">
                <p>• Avoid taking on new debt - you've worked hard to get here!</p>
                <p>• Use this freed-up money to build wealth, not create new obligations</p>
                <p>• Remember: every new debt delays your financial freedom</p>
                <p>• Focus on saving and investing instead of borrowing</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
              Got it! I'll stay debt-free
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 