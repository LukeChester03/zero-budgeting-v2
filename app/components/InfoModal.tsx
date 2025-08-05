"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Building2, AlertCircle, TrendingUp, Target, Calculator, PiggyBank, Coins, DollarSign, CreditCard } from "lucide-react";

type Props = {
  open: boolean;
  category: string;
  onClose: () => void;
};

export default function InfoModal({ open, category, onClose }: Props) {
  const getCategoryInfo = (categoryName: string) => {
    switch (categoryName) {
      case "Safety Net":
        return {
          title: "Safety Net",
          icon: <Shield className="h-6 w-6 text-blue-600" />,
          description: "Your financial safety cushion for unexpected expenses and income disruptions.",
          details: [
            {
              title: "What it covers",
              content: "Medical emergencies, car repairs, home maintenance, job loss, and other unexpected expenses that could derail your budget."
            },
            {
              title: "How much to save",
              content: "Aim for 6 months of your essential expenses. This provides a strong buffer against financial shocks."
            },
            {
              title: "Why it's important",
              content: "Prevents you from going into debt when unexpected expenses arise. Gives you peace of mind and financial security."
            }
          ],
          tips: [
            "Start with 1 month of expenses, then build up gradually",
            "Keep this money in an easily accessible savings account",
            "Only use for true emergencies, not planned expenses"
          ]
        };
      case "Foundation":
        return {
          title: "Foundation",
          icon: <Building2 className="h-6 w-6 text-purple-600" />,
          description: "Your long-term financial foundation for building wealth and achieving financial independence.",
          details: [
            {
              title: "What it covers",
              content: "Long-term investments, retirement planning, wealth building, and financial goals that extend beyond emergency savings."
            },
            {
              title: "How much to save",
              content: "Aim for 12 months of your total expenses. This represents your financial foundation and long-term security."
            },
            {
              title: "Why it's important",
              content: "Provides the foundation for building wealth, achieving financial independence, and securing your long-term financial future."
            }
          ],
          tips: [
            "Focus on this after your Safety Net is established",
            "Consider investing this money for long-term growth",
            "Align with your long-term financial goals"
          ]
        };
      case "Emergency Fund":
        return {
          title: "Emergency Fund",
          icon: <AlertCircle className="h-6 w-6 text-red-600" />,
          description: "Your first line of defense against financial emergencies and unexpected expenses.",
          details: [
            {
              title: "What it covers",
              content: "Immediate emergencies like medical bills, car breakdowns, home repairs, and other urgent expenses that require immediate cash."
            },
            {
              title: "How much to save",
              content: "Start with £1,000, then build to 3-6 months of essential expenses. This is your financial first aid kit."
            },
            {
              title: "Why it's important",
              content: "Prevents you from using credit cards or loans for emergencies, which can lead to high-interest debt and financial stress."
            }
          ],
          tips: [
            "Start with £1,000 as your first goal",
            "Keep in a high-yield savings account for easy access",
            "Only use for true emergencies, not wants or planned expenses",
            "Rebuild immediately after using it"
          ]
        };
      case "Investments":
        return {
          title: "Investments",
          icon: <TrendingUp className="h-6 w-6 text-green-600" />,
          description: "Building long-term wealth through strategic investment in your financial future.",
          details: [
            {
              title: "What it covers",
              content: "Stocks, bonds, mutual funds, ETFs, retirement accounts, and other investment vehicles that grow your money over time."
            },
            {
              title: "How much to save",
              content: "Aim for 15-20% of your income after emergency fund and safety net are established. Start small and increase gradually."
            },
            {
              title: "Why it's important",
              content: "Investments provide the best opportunity for long-term wealth building, beating inflation, and achieving financial independence."
            }
          ],
          tips: [
            "Start with index funds for diversification",
            "Consider tax-advantaged accounts like ISAs and pensions",
            "Invest regularly regardless of market conditions",
            "Focus on long-term growth, not short-term gains"
          ]
        };
      case "Savings":
        return {
          title: "Savings Strategy",
          icon: <PiggyBank className="h-6 w-6 text-blue-600" />,
          description: "The smart way to save money following proven financial principles for maximum security and growth.",
          details: [
            {
              title: "The 50/30/20 Rule",
              content: "Allocate 50% to needs, 30% to wants, and 20% to savings. This creates a balanced approach to budgeting."
            },
            {
              title: "The Savings Hierarchy",
              content: "1) Emergency Fund (£1,000), 2) Safety Net (3-6 months expenses), 3) Foundation (12 months), 4) Investments (15-20% of income)."
            },
            {
              title: "Why this approach works",
              content: "Builds financial security progressively, prevents debt, creates wealth, and provides peace of mind through systematic saving."
            }
          ],
          tips: [
            "Pay yourself first - automate savings transfers",
            "Start with emergency fund, then build systematically",
            "Increase savings rate with every pay raise",
            "Keep emergency funds in accessible accounts",
            "Invest long-term savings for growth"
          ]
        };
      case "Debts":
        return {
          title: "Debt Elimination Strategy",
          icon: <CreditCard className="h-6 w-6 text-red-600" />,
          description: "Why eliminating debt quickly is crucial for your financial health and future wealth building.",
          details: [
            {
              title: "The Debt Snowball Effect",
              content: "High-interest debt compounds quickly, making it harder to pay off over time. The longer you carry debt, the more money you lose to interest payments."
            },
            {
              title: "Opportunity Cost of Debt",
              content: "Every pound spent on debt interest is money that could be invested or saved. Debt payments prevent you from building wealth and achieving financial goals."
            },
            {
              title: "Financial Freedom Impact",
              content: "Debt limits your financial choices and creates stress. Eliminating debt frees up income for savings, investments, and achieving your financial goals."
            }
          ],
          tips: [
            "Prioritize high-interest debt first (credit cards, payday loans)",
            "Use the debt avalanche method: pay highest interest rate first",
            "Consider debt consolidation for lower interest rates",
            "Stop using credit cards while paying off debt",
            "Allocate any extra income to debt repayment",
            "Build emergency fund alongside debt repayment to avoid new debt"
          ]
        };
      default:
        return null;
    }
  };

  const info = getCategoryInfo(category);

  if (!info) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {info.icon}
            <div>
              <DialogTitle className="text-xl">{info.title}</DialogTitle>
              <DialogDescription className="text-base">
                {info.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Details Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Key Information
            </h3>
            <div className="space-y-4">
              {info.details.map((detail, index) => (
                <div key={index} className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">{detail.title}</h4>
                  <p className="text-sm text-muted-foreground">{detail.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tips Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Pro Tips
            </h3>
            <div className="space-y-2">
              {info.tips.map((tip, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-muted-foreground">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Badge */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Priority: {category === "Emergency Fund" ? "Critical" : category === "Safety Net" ? "High" : category === "Investments" ? "Medium" : category === "Savings" ? "Strategic" : category === "Debts" ? "Urgent" : "Important"}
            </span>
            <Badge variant="outline" className="ml-auto">
              {category === "Emergency Fund" ? "Critical" : category === "Safety Net" ? "Essential" : category === "Investments" ? "Growth" : category === "Savings" ? "Strategy" : category === "Debts" ? "Eliminate" : "Important"}
            </Badge>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose} className="bg-primary hover:bg-primary/90">
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 