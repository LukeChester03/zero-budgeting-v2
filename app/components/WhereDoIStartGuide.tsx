"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  PiggyBank, 
  CreditCard, 
  Target, 
  TrendingUp, 
  BarChart3, 
  DollarSign,
  FolderOpen,
  Users,
  Shield,
  Zap,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  BookOpen,
  Lightbulb,
  Star,
  Clock,
  Award
} from "lucide-react";

interface GuideStep {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  action?: {
    text: string;
    href: string;
  };
}

const guideSteps: GuideStep[] = [
  {
    title: "Set Your Monthly Income",
    subtitle: "Start with the foundation",
    icon: <DollarSign className="h-8 w-8 text-green-500" />,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Your monthly income is the foundation of your budget. This helps us calculate important metrics like your savings rate and debt-to-income ratio.
        </p>
        <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-800 dark:text-green-200">Why this matters:</span>
          </div>
          <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
            <li>• Accurate savings rate calculations</li>
            <li>• Proper debt-to-income ratio tracking</li>
            <li>• Better financial goal planning</li>
          </ul>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Takes 30 seconds to set up</span>
        </div>
      </div>
    )
  },
  {
    title: "Create Your First Budget",
    subtitle: "Plan your monthly spending",
    icon: <Plus className="h-8 w-8 text-blue-500" />,
    content: (
      <div className="space-y-4">
        <p className="text-sm sm:text-base text-muted-foreground">
          Create a zero-based budget where every pound has a purpose. Allocate your income to different categories like housing, food, savings, and debt payments.
        </p>
        <div className="grid grid-cols-1 gap-3">
          <Card className="border-blue-200 dark:border-blue-800">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm">Essential Categories</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Housing & Utilities</li>
                <li>• Food & Groceries</li>
                <li>• Transportation</li>
                <li>• Emergency Fund</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank className="h-4 w-4 text-green-600" />
                <span className="font-medium text-sm">Savings Categories</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Emergency Fund</li>
                <li>• Safety Net</li>
                <li>• Foundation</li>
                <li>• Investments</li>
              </ul>
            </CardContent>
          </Card>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Pro Tip:</span>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            Start with the 50/30/20 rule: 50% needs, 30% wants, 20% savings and debt repayment.
          </p>
        </div>
      </div>
    ),
    action: {
      text: "Create Budget",
      href: "/budget"
    }
  },
  {
    title: "Set Up Savings Goals",
    subtitle: "Define your financial targets",
    icon: <Target className="h-8 w-8 text-purple-500" />,
    content: (
      <div className="space-y-4">
        <p className="text-sm sm:text-base text-muted-foreground">
          Create specific savings goals with target amounts and timelines. Track your progress and celebrate milestones along the way.
        </p>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Shield className="h-4 w-4 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">Emergency Fund</span>
                <Badge variant="secondary" className="text-xs">Priority</Badge>
              </div>
              <p className="text-xs text-muted-foreground">3-6 months of expenses</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <PiggyBank className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">Vacation Fund</span>
                <Badge variant="outline" className="text-xs">Fun</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Save for memorable experiences</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">Investment Fund</span>
                <Badge variant="outline" className="text-xs">Growth</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Build long-term wealth</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800 dark:text-purple-200">Smart Goal Setting:</span>
          </div>
          <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
            Make goals specific, measurable, and time-bound. Start with smaller targets and build up.
          </p>
        </div>
      </div>
    ),
    
  },
  {
    title: "Track Your Debts",
    subtitle: "Manage debt repayment strategically",
    icon: <CreditCard className="h-8 w-8 text-orange-500" />,
    content: (
      <div className="space-y-4">
        <p className="text-sm sm:text-base text-muted-foreground">
          Add all your debts to track repayment progress, interest costs, and create a strategic payoff plan.
        </p>
        <div className="grid grid-cols-1 gap-3">
          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-600" />
                Debt Snowball
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground mb-2">Pay smallest debts first</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Credit Card 1</span>
                  <span className="font-medium">£500</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Personal Loan</span>
                  <span className="font-medium">£2,000</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Car Loan</span>
                  <span className="font-medium">£8,000</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-red-600" />
                Debt Avalanche
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground mb-2">Pay highest interest first</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Credit Card 2</span>
                  <span className="font-medium">18% APR</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Credit Card 1</span>
                  <span className="font-medium">15% APR</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Personal Loan</span>
                  <span className="font-medium">8% APR</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Strategy Tip:</span>
          </div>
          <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
            Choose snowball for motivation or avalanche for cost savings. Both work - pick what keeps you motivated!
          </p>
        </div>
      </div>
    ),
    action: {
      text: "Manage Debts",
      href: "/loans"
    }
  },
  {
    title: "Analyze Your Spending",
    subtitle: "Upload bank statements for insights",
    icon: <BarChart3 className="h-8 w-8 text-indigo-500" />,
    content: (
      <div className="space-y-4">
        <p className="text-sm sm:text-base text-muted-foreground">
          Upload your bank statements to get detailed analysis of your spending patterns, identify areas for improvement, and track your financial habits over time.
        </p>
        <div className="space-y-3">
                     <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg">
             <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
               <BarChart3 className="h-4 w-4 text-indigo-600" />
             </div>
             <div className="flex-1">
               <span className="font-medium text-sm">Upload Statements</span>
               <p className="text-xs text-muted-foreground">CSV or PDF format supported</p>
             </div>
           </div>
          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1">
              <span className="font-medium text-sm">Spending Analysis</span>
              <p className="text-xs text-muted-foreground">Categorized spending breakdown</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Target className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <span className="font-medium text-sm">Budget Comparison</span>
              <p className="text-xs text-muted-foreground">Compare actual vs planned spending</p>
            </div>
          </div>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-950/20 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-800 dark:text-indigo-200">Pro Tip:</span>
          </div>
          <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">
            Regular statement uploads help you identify spending patterns and make informed budget adjustments.
          </p>
        </div>
      </div>
    ),
    action: {
      text: "Upload Statements",
      href: "/bank-statements"
    }
  },
  {
    title: "Review & Track Progress",
    subtitle: "Monitor your financial journey",
    icon: <BookOpen className="h-8 w-8 text-teal-500" />,
    content: (
      <div className="space-y-4">
        <p className="text-sm sm:text-base text-muted-foreground">
          Use the specialized analytics in each section to track your progress and make informed financial decisions.
        </p>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <FolderOpen className="h-4 w-4 text-purple-600" />
            </div>
            <div className="flex-1">
              <span className="font-medium text-sm">Budget History</span>
              <p className="text-xs text-muted-foreground">Review past budgets and spending patterns</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <PiggyBank className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1">
              <span className="font-medium text-sm">Savings Analytics</span>
              <p className="text-xs text-muted-foreground">Track savings rate and wealth building progress</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <CreditCard className="h-4 w-4 text-orange-600" />
            </div>
            <div className="flex-1">
              <span className="font-medium text-sm">Debt Analytics</span>
              <p className="text-xs text-muted-foreground">Monitor debt reduction and repayment efficiency</p>
            </div>
          </div>
        </div>
        <div className="bg-teal-50 dark:bg-teal-950/20 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-teal-600" />
            <span className="text-sm font-medium text-teal-800 dark:text-teal-200">Success Habits:</span>
          </div>
          <p className="text-sm text-teal-700 dark:text-teal-300 mt-1">
            Review monthly, adjust quarterly, and celebrate every milestone. Each section has its own analytics to help you stay on track!
          </p>
        </div>
      </div>
    ),
    action: {
      text: "View Budget History",
      href: "/previous-budgets"
    }
  }
];

interface WhereDoIStartGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WhereDoIStartGuide({ isOpen, onClose }: WhereDoIStartGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);

  const handleNext = () => {
    setDirection(1);
    setCurrentStep((prev) => Math.min(prev + 1, guideSteps.length - 1));
  };

  const handlePrevious = () => {
    setDirection(-1);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleClose = () => {
    setCurrentStep(0);
    setDirection(0);
    onClose();
  };

  const currentStepData = guideSteps[currentStep];
  const progress = ((currentStep + 1) / guideSteps.length) * 100;

  return (
         <Dialog open={isOpen} onOpenChange={handleClose}>
       <DialogContent className="max-w-2xl w-[95vw] max-h-[95vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
                     <DialogTitle className="flex items-center gap-2 sm:gap-3">
             <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
               <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
             </div>
             <div>
               <div className="text-base sm:text-lg font-semibold">Where Do I Start?</div>
               <div className="text-xs sm:text-sm text-muted-foreground">
                 Step {currentStep + 1} of {guideSteps.length}
               </div>
             </div>
           </DialogTitle>
        </DialogHeader>

                 <div className="space-y-4 sm:space-y-6">
           {/* Progress Bar */}
           <div className="space-y-2">
             <div className="flex justify-between text-xs sm:text-sm">
               <span className="text-muted-foreground">Progress</span>
               <span className="font-medium">{Math.round(progress)}%</span>
             </div>
             <Progress value={progress} className="h-2" />
           </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: direction * 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -direction * 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
                             {/* Step Header */}
               <div className="flex items-start gap-3 sm:gap-4">
                 <div className="p-2 sm:p-3 bg-primary/10 rounded-xl">
                   {currentStepData.icon}
                 </div>
                 <div className="flex-1">
                   <h3 className="text-lg sm:text-xl font-semibold mb-1">{currentStepData.title}</h3>
                   <p className="text-sm sm:text-base text-muted-foreground">{currentStepData.subtitle}</p>
                 </div>
               </div>

              <Separator />

                             {/* Step Content */}
               <div className="min-h-[250px] sm:min-h-[300px]">
                 {currentStepData.content}
               </div>

                             {/* Action Button */}
               {currentStepData.action && (
                 <div className="pt-4">
                   <Button 
                     className="w-full" 
                     onClick={() => {
                       window.location.href = currentStepData.action!.href;
                     }}
                   >
                     {currentStepData.action.text}
                     <ArrowRight className="h-4 w-4 ml-2" />
                   </Button>
                 </div>
               )}
            </motion.div>
          </AnimatePresence>

                     {/* Navigation */}
           <div className="flex items-center justify-between pt-4 border-t">
             <Button
               variant="outline"
               onClick={handlePrevious}
               disabled={currentStep === 0}
               className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
               size="sm"
             >
               <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
               Previous
             </Button>

                         <div className="flex items-center gap-2">
               {currentStep < guideSteps.length - 1 ? (
                 <Button onClick={handleNext} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm" size="sm">
                   Next
                   <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                 </Button>
               ) : (
                 <Button onClick={handleClose} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm" size="sm">
                   <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                   Get Started
                 </Button>
               )}
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 