"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useFirebaseStore } from "@/lib/store-firebase";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import ClientOnly from "@/app/components/ClientOnly";
import MonthlyIncomeInput from "@/app/components/MonthlyIncomeInput";
import AuthModal from "@/app/components/AuthModal";
import { 
  Plus, 
  PiggyBank, 
  FolderOpen, 
  CreditCard, 
  TrendingUp, 
  Target, 
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  BarChart3,
  Users,
  Award,
  Clock,
  BookOpen,
  Lightbulb
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // Store selectors
  const budgets = useFirebaseStore((s) => s.budgets);
  const income = useFirebaseStore((s) => s.income);
  const goals = useFirebaseStore((s) => s.goals);
  const debts = useFirebaseStore((s) => s.debts);
  const getTotalSaved = useFirebaseStore((s) => s.getTotalSaved);
  const getTotalMonthlyDebtRepayments = useFirebaseStore((s) => s.getTotalMonthlyDebtRepayments);
  const getSavedAmountForGoal = useFirebaseStore((s) => s.getSavedAmountForGoal);
  const getRepaidAmountForDebt = useFirebaseStore((s) => s.getRepaidAmountForDebt);



  // Helper function to handle floating-point precision when comparing to zero
  const isZero = (value: number) => Math.abs(value) < 0.01;

  // Calculate key metrics
  const totalSaved = getTotalSaved();
  const totalDebtRepayments = getTotalMonthlyDebtRepayments();
  const recentBudgets = budgets.slice(-3).reverse();
  const currentMonth = new Date().toLocaleString("default", { month: "long", year: "numeric" });
  const hasCurrentBudget = budgets.some(b => b.month === currentMonth);
  
  // Calculate savings rate and debt-to-income ratio based on total income across all budgets (like in savings page)
  const totalIncome = budgets.reduce((sum, budget) => sum + budget.income, 0);
  const savingsRate = totalIncome > 0 ? (totalSaved / totalIncome) * 100 : 0;
  const debtToIncomeRatio = totalIncome > 0 ? (totalDebtRepayments / totalIncome) * 100 : 0;

  const handleAddBudget = () => router.push("/budget");
  const handleViewSavings = () => router.push("/savings");
  const handleViewBudgets = () => router.push("/previous-budgets");
  const handleViewDebts = () => router.push("/loans");
  const handleViewAnalysis = () => router.push("/analysis");
  const handleSignIn = () => setIsAuthModalOpen(true);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 200, damping: 25 },
    },
  };

  // If user is not authenticated, show educational hub
  if (!user) {
  return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20"
      >
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
          <div className="relative container mx-auto px-4 sm:px-6 py-12 sm:py-24">
            <motion.div variants={itemVariants} className="text-center mb-8 sm:mb-12">
              <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
                <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-primary">
                  Zero Budgeting
                </h1>
              </div>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-6 sm:mb-8 px-4">
                Take control of your finances with intelligent budgeting, goal tracking, and debt management. 
                Every penny has a purpose.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-primary hover:bg-primary/90" onClick={handleSignIn}>
                  <Shield className="h-4 w-4 mr-2" />
                  Get Started Free
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="container mx-auto px-4 sm:px-6 pb-8 sm:pb-12">
          {/* Features Section */}
          <motion.section variants={itemVariants} className="mb-12 sm:mb-16">
            <div className="text-center mb-8 sm:mb-12 mt-8 sm:mt-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">Why Choose Zero Budgeting?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto px-4">
                Our comprehensive financial management platform helps you build wealth, eliminate debt, and achieve your financial goals.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <Card className="group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4 mb-4">
                    <div className="p-2 sm:p-3 bg-primary/10 rounded-xl">
                      <PiggyBank className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-base sm:text-lg">Smart Budgeting</h3>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Create detailed monthly budgets with automatic goal and debt allocation. Every pound is assigned a purpose.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4 mb-4">
                    <div className="p-2 sm:p-3 bg-green-500/10 rounded-xl">
                      <Target className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                    </div>
                    <h3 className="font-semibold text-base sm:text-lg">Goal Tracking</h3>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Set financial goals and track your progress. Watch your savings grow with visual progress indicators.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4 mb-4">
                    <div className="p-2 sm:p-3 bg-orange-500/10 rounded-xl">
                      <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
                    </div>
                    <h3 className="font-semibold text-base sm:text-lg">Debt Management</h3>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Track and manage your debt repayment with automatic monthly allocation and progress monitoring.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4 mb-4">
                    <div className="p-2 sm:p-3 bg-indigo-500/10 rounded-xl">
                      <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-500" />
                    </div>
                    <h3 className="font-semibold text-base sm:text-lg">Automatic Allocation</h3>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Goals and debts are automatically allocated in your budgets, ensuring you stay on track.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4 mb-4">
                    <div className="p-2 sm:p-3 bg-teal-500/10 rounded-xl">
                      <Award className="h-6 w-6 sm:h-8 sm:w-8 text-teal-500" />
                    </div>
                    <h3 className="font-semibold text-base sm:text-lg">Progress Tracking</h3>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Visual progress indicators help you stay motivated and see your financial journey unfold.
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.section>

          {/* How It Works */}
          <motion.section variants={itemVariants} className="mb-12 sm:mb-16">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto px-4">
                Get started in minutes with our simple three-step process
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl sm:text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="font-semibold text-base sm:text-lg mb-2">Set Your Income</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Enter your monthly income after taxes to establish your financial foundation.
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl sm:text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="font-semibold text-base sm:text-lg mb-2">Create Your Budget</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Allocate every pound to specific categories, goals, and debt payments.
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl sm:text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="font-semibold text-base sm:text-lg mb-2">Track & Grow</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Monitor your progress, adjust as needed, and watch your financial goals become reality.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Benefits */}
          <motion.section variants={itemVariants} className="mb-12 sm:mb-16">
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-6 sm:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold mb-4">Benefits of Zero Budgeting</h3>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-sm sm:text-base">Complete Financial Control</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground">Every pound has a purpose, eliminating wasteful spending.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-sm sm:text-base">Goal Achievement</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground">Set and track financial goals with automatic allocation.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-sm sm:text-base">Debt Freedom</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground">Systematic debt repayment with progress tracking.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-sm sm:text-base">Financial Peace</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground">Reduce stress with clear financial visibility and control.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 sm:w-24 sm:h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lightbulb className="h-8 w-8 sm:h-12 sm:w-12 text-primary" />
                      </div>
                      <h4 className="font-semibold text-base sm:text-lg mb-2">Start Your Journey</h4>
                      <p className="text-sm sm:text-base text-muted-foreground mb-4">
                        Join thousands of users who have transformed their financial lives with zero budgeting.
                      </p>
                      <Button size="lg" className="bg-primary hover:bg-primary/90" onClick={handleSignIn}>
                        <Shield className="h-4 w-4 mr-2" />
                        Create Free Account
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Call to Action */}
          <motion.section variants={itemVariants}>
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-6 sm:p-8 text-center">
                <div className="max-w-2xl mx-auto">
                  <h3 className="text-xl sm:text-2xl font-bold mb-4">Ready to Transform Your Finances?</h3>
                  <p className="text-muted-foreground mb-6">
                    Join the zero budgeting revolution and take control of your financial future today.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="lg" className="bg-primary hover:bg-primary/90" onClick={handleSignIn}>
                      <Shield className="h-4 w-4 mr-2" />
                      Get Started Free
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        </div>

        {/* Auth Modal */}
        <AuthModal 
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </motion.div>
    );
  }

  // Authenticated user dashboard (existing code)
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20"
    >
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
        <div className="relative container mx-auto px-4 sm:px-6 py-12 sm:py-24">
          <motion.div variants={itemVariants} className="text-center mb-8 sm:mb-12">
            <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-primary">
                Zero Budgeting
              </h1>
            </div>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Take control of your finances with intelligent budgeting and spending analysis
            </p>
          </motion.div>

          {/* Key Stats */}
          <ClientOnly
            fallback={
              <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
                <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Monthly Income</p>
                        <p className="text-xl sm:text-2xl font-bold">£0.00</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-background/80 backdrop-blur-sm border-green-500/20">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <PiggyBank className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Total Saved</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-600">£0.00</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-background/80 backdrop-blur-sm border-orange-500/20 sm:col-span-2 lg:col-span-1">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-500/10 rounded-lg">
                        <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Monthly Debt</p>
                        <p className="text-xl sm:text-2xl font-bold text-orange-600">£0.00</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            }
          >
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
              <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Monthly Income</p>
                      <p className="text-xl sm:text-2xl font-bold">£{income.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background/80 backdrop-blur-sm border-green-500/20">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <PiggyBank className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Total Saved</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-600">£{totalSaved.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background/80 backdrop-blur-sm border-orange-500/20 sm:col-span-2 lg:col-span-1">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                      <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Monthly Debt</p>
                      <p className="text-xl sm:text-2xl font-bold text-orange-600">£{totalDebtRepayments.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </ClientOnly>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 pb-8 sm:pb-12">
        {/* Quick Actions */}
        <motion.section variants={itemVariants} className="mb-8 sm:mb-12 mt-12 sm:mt-16">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">Quick Actions</h2>
            <Badge variant="secondary" className="ml-2">
              <ClientOnly fallback="0 budgets created">
                {budgets.length} budgets created
              </ClientOnly>
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-primary/20 hover:border-primary/40">
              <CardContent className="p-4 sm:p-6" onClick={handleAddBudget}>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                    <Plus className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base sm:text-lg mb-1">Create Budget</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                      {hasCurrentBudget ? "Update this month's budget" : "Set up your monthly budget"}
                    </p>
                    <Badge variant={hasCurrentBudget ? "secondary" : "default"}>
                      {hasCurrentBudget ? "Update" : "New"}
                    </Badge>
                  </div>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
              <CardContent className="p-4 sm:p-6" onClick={handleViewSavings}>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-green-500/10 rounded-xl group-hover:bg-green-500/20 transition-colors">
                    <PiggyBank className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base sm:text-lg mb-1">Savings Tracker</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                      Track your savings goals and progress
                    </p>
                    <Badge variant="outline">
                      <ClientOnly fallback="0 goals">
                        {goals.length} goals
                      </ClientOnly>
                    </Badge>
                  </div>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-green-500 transition-colors" />
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
              <CardContent className="p-4 sm:p-6" onClick={handleViewDebts}>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-orange-500/10 rounded-xl group-hover:bg-orange-500/20 transition-colors">
                    <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base sm:text-lg mb-1">Debt Management</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                      Track and manage your debt repayment
                    </p>
                    <Badge variant="outline">{debts.length} debts</Badge>
                  </div>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-orange-500 transition-colors" />
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
              <CardContent className="p-4 sm:p-6" onClick={handleViewBudgets}>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
                    <FolderOpen className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base sm:text-lg mb-1">Budget History</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                      Review your past budgets and spending
                    </p>
                    <Badge variant="outline">{budgets.length} records</Badge>
                  </div>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-purple-500 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Monthly Income Input - Higher Priority */}
        <motion.section variants={itemVariants} className="mb-8 sm:mb-12 mt-8">
          <MonthlyIncomeInput />
        </motion.section>

        {/* Instructions */}
        <motion.section variants={itemVariants} className="mb-8 mt-12 sm:mt-16">
           <Card className="bg-primary/5 border-primary/20">
             <CardContent className="p-4 sm:p-6">
               <div className="flex items-start gap-3">
                 <div className="p-2 bg-primary/10 rounded-lg">
                   <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                 </div>
                 <div>
                   <h3 className="font-semibold text-primary mb-2">Welcome to Zero Budgeting</h3>
                   <div className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                     <p><strong>Quick Actions:</strong> Access all your financial tools from one place - create budgets, track savings, manage debts, and view analytics.</p>
                     <p><strong>Financial Overview:</strong> See your savings rate, debt-to-income ratio, and progress on your financial goals at a glance.</p>
                     <p><strong>Recent Activity:</strong> Track your latest budget performance and stay on top of your spending patterns.</p>
                     <p className="text-primary font-medium">💡 Tip: Start by creating your first budget to establish your financial foundation and track your progress over time.</p>
                   </div>
                 </div>
               </div>
             </CardContent>
           </Card>
         </motion.section>

         {/* Financial Overview & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Financial Overview */}
          <motion.section variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                  Financial Overview
                </CardTitle>
                <CardDescription>
                  Your financial health at a glance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                {/* Savings Progress */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs sm:text-sm font-medium">Savings Rate</span>
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {savingsRate.toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={savingsRate} 
                    className="h-2"
                  />
                </div>

                {/* Debt Progress */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs sm:text-sm font-medium">Debt to Income</span>
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {debtToIncomeRatio.toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={debtToIncomeRatio} 
                    className="h-2"
                  />
                </div>

                {/* Goals Progress */}
                {goals.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs sm:text-sm font-medium">Active Goals</span>
                      <span className="text-xs sm:text-sm text-muted-foreground">{goals.length}</span>
                    </div>
                    <div className="space-y-2">
                      {goals.slice(0, 3).map((goal) => {
                        const savedAmount = getSavedAmountForGoal(goal.title);
                        const progress = goal.target > 0 ? (savedAmount / goal.target) * 100 : 0;
                        return (
                          <div key={goal.id} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="truncate">{goal.title}</span>
                              <span>£{savedAmount.toFixed(0)} / £{goal.target.toFixed(0)}</span>
                            </div>
                            <Progress value={progress} className="h-1" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.section>

          {/* Recent Activity */}
          <motion.section variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                  Recent Budgets
                </CardTitle>
                <CardDescription>
                  Your latest budget activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentBudgets.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {recentBudgets.map((budget) => {
                      const totalSpent = budget.allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
                      const remaining = budget.income - totalSpent;
                      const isOverBudget = remaining < 0 && !isZero(remaining);
                      const isBalanced = isZero(remaining);
                      
                      return (
                        <div key={budget.id} className="flex items-center gap-3 sm:gap-4 p-3 rounded-lg border">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm sm:text-base truncate">{budget.month}</span>
                              {isOverBudget ? (
                                <Badge variant="destructive" className="text-xs">Over Budget</Badge>
                              ) : isBalanced ? (
                                <Badge variant="default" className="text-xs">Balanced</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">On Track</Badge>
                              )}
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground">
                              Income: £{budget.income.toFixed(2)} • Spent: £{totalSpent.toFixed(2)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={cn(
                              "font-semibold text-sm sm:text-base",
                              isOverBudget ? "text-destructive" : isBalanced ? "text-green-600" : "text-green-600"
                            )}>
                              £{isZero(remaining) ? "0.00" : Math.abs(remaining).toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {isOverBudget ? "Over" : isBalanced ? "Balanced" : "Remaining"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <PiggyBank className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm sm:text-base">No budgets created yet</p>
                    <p className="text-xs sm:text-sm">Create your first budget to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.section>
        </div>

        {/* Call to Action */}
        <motion.section variants={itemVariants} className="mt-8 sm:mt-12">
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6 sm:p-8 text-center">
              <div className="max-w-2xl mx-auto">
                <h3 className="text-xl sm:text-2xl font-bold mb-4">Ready to take control of your finances?</h3>
                <p className="text-muted-foreground mb-6">
                  Start your zero-budgeting journey today and watch your savings grow
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" onClick={handleAddBudget} className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Budget
                  </Button>
                  <Button size="lg" variant="outline" onClick={handleViewSavings}>
                    <PiggyBank className="h-4 w-4 mr-2" />
                    View Savings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </motion.div>
  );
}
