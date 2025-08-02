"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useFirebaseStore } from "@/lib/store-firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import ClientOnly from "@/app/components/ClientOnly";
import MonthlyIncomeInput from "@/app/components/MonthlyIncomeInput";
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
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const router = useRouter();

  // Store data
  const income = useFirebaseStore((s) => s.income);
  const budgets = useFirebaseStore((s) => s.budgets);
  const debts = useFirebaseStore((s) => s.debts);
  const goals = useFirebaseStore((s) => s.goals);
  const getTotalSaved = useFirebaseStore((s) => s.getTotalSaved);
  const getTotalMonthlyDebtRepayments = useFirebaseStore((s) => s.getTotalMonthlyDebtRepayments);

  // Calculate key metrics
  const totalSaved = getTotalSaved();
  const totalDebtRepayments = getTotalMonthlyDebtRepayments();
  const recentBudgets = budgets.slice(-3).reverse();
  const currentMonth = new Date().toLocaleString("default", { month: "long", year: "numeric" });
  const hasCurrentBudget = budgets.some(b => b.month === currentMonth);

  const handleAddBudget = () => router.push("/budget");
  const handleViewSavings = () => router.push("/savings");
  const handleViewBudgets = () => router.push("/previous-budgets");
  const handleViewDebts = () => router.push("/loans");
  const handleViewAnalysis = () => router.push("/analysis");

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
      transition: { type: "spring", stiffness: 200, damping: 25 },
    },
  };

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
        <div className="relative container mx-auto px-6 py-24">
          <motion.div variants={itemVariants} className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Sparkles className="h-8 w-8 text-primary" />
              <h1 className="text-4xl md:text-6xl font-bold text-primary">
                Zero Budgeting
      </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Take control of your finances with intelligent budgeting and spending analysis
            </p>
          </motion.div>

          {/* Key Stats */}
          <ClientOnly
            fallback={
              <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <DollarSign className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Monthly Income</p>
                        <p className="text-2xl font-bold">£0.00</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-background/80 backdrop-blur-sm border-green-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <PiggyBank className="h-6 w-6 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Saved</p>
                        <p className="text-2xl font-bold text-green-600">£0.00</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-background/80 backdrop-blur-sm border-orange-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-500/10 rounded-lg">
                        <CreditCard className="h-6 w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Monthly Debt</p>
                        <p className="text-2xl font-bold text-orange-600">£0.00</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            }
          >
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Income</p>
                    <p className="text-2xl font-bold">£{income.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-background/80 backdrop-blur-sm border-green-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <PiggyBank className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Saved</p>
                    <p className="text-2xl font-bold text-green-600">£{totalSaved.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-background/80 backdrop-blur-sm border-orange-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <CreditCard className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Debt</p>
                    <p className="text-2xl font-bold text-orange-600">£{totalDebtRepayments.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          </ClientOnly>
        </div>
      </section>

      <div className="container mx-auto px-6 pb-12">
        {/* Quick Actions */}
        <motion.section variants={itemVariants} className="mb-12 mt-16">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-2xl font-bold">Quick Actions</h2>
            <Badge variant="secondary" className="ml-2">
              <ClientOnly fallback="0 budgets created">
                {budgets.length} budgets created
              </ClientOnly>
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-primary/20 hover:border-primary/40">
              <CardContent className="p-6" onClick={handleAddBudget}>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                    <Plus className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">Create Budget</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {hasCurrentBudget ? "Update this month's budget" : "Set up your monthly budget"}
                    </p>
                    <Badge variant={hasCurrentBudget ? "secondary" : "default"}>
                      {hasCurrentBudget ? "Update" : "New"}
                    </Badge>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>



            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
              <CardContent className="p-6" onClick={handleViewSavings}>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/10 rounded-xl group-hover:bg-green-500/20 transition-colors">
                    <PiggyBank className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">Savings Tracker</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Track your savings goals and progress
                    </p>
                    <Badge variant="outline">
                      <ClientOnly fallback="0 goals">
                        {goals.length} goals
                      </ClientOnly>
                    </Badge>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-green-500 transition-colors" />
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
              <CardContent className="p-6" onClick={handleViewDebts}>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-500/10 rounded-xl group-hover:bg-orange-500/20 transition-colors">
                    <CreditCard className="h-8 w-8 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">Debt Management</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Track and manage your debt repayment
                    </p>
                    <Badge variant="outline">{debts.length} debts</Badge>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-orange-500 transition-colors" />
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
              <CardContent className="p-6" onClick={handleViewBudgets}>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
                    <FolderOpen className="h-8 w-8 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">Budget History</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Review your past budgets and spending
                    </p>
                    <Badge variant="outline">{budgets.length} records</Badge>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-purple-500 transition-colors" />
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
              <CardContent className="p-6" onClick={handleViewAnalysis}>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-500/10 rounded-xl group-hover:bg-indigo-500/20 transition-colors">
                    <Target className="h-8 w-8 text-indigo-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">Financial Analysis</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Detailed insights and recommendations
                    </p>
                    <Badge variant="outline">Analytics</Badge>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-indigo-500 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Monthly Income Input - Higher Priority */}
        <motion.section variants={itemVariants} className="mb-12 mt-8">
          <MonthlyIncomeInput />
        </motion.section>

        {/* Instructions */}
        <motion.section variants={itemVariants} className="mb-8 mt-16">
           <Card className="bg-primary/5 border-primary/20">
             <CardContent className="p-6">
               <div className="flex items-start gap-3">
                 <div className="p-2 bg-primary/10 rounded-lg">
                   <Sparkles className="h-5 w-5 text-primary" />
                 </div>
                 <div>
                   <h3 className="font-semibold text-primary mb-2">Welcome to Zero Budgeting</h3>
                   <div className="space-y-2 text-sm text-muted-foreground">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Financial Overview */}
          <motion.section variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Financial Overview
                </CardTitle>
                <CardDescription>
                  Your financial health at a glance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Savings Progress */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Savings Rate</span>
                    <span className="text-sm text-muted-foreground">
                      {income > 0 ? ((totalSaved / income) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={income > 0 ? (totalSaved / income) * 100 : 0} 
                    className="h-2"
                  />
                </div>

                {/* Debt Progress */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Debt to Income</span>
                    <span className="text-sm text-muted-foreground">
                      {income > 0 ? ((totalDebtRepayments / income) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={income > 0 ? (totalDebtRepayments / income) * 100 : 0} 
                    className="h-2"
                  />
                </div>

                {/* Goals Progress */}
                {goals.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Active Goals</span>
                      <span className="text-sm text-muted-foreground">{goals.length}</span>
                    </div>
                    <div className="space-y-2">
                      {goals.slice(0, 3).map((goal) => {
                        const progress = goal.target > 0 ? (goal.saved / goal.target) * 100 : 0;
                        return (
                          <div key={goal.id} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="truncate">{goal.title}</span>
                              <span>£{goal.saved.toFixed(0)} / £{goal.target.toFixed(0)}</span>
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
                  <Calendar className="h-5 w-5" />
                  Recent Budgets
                </CardTitle>
                <CardDescription>
                  Your latest budget activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentBudgets.length > 0 ? (
                  <div className="space-y-4">
                    {recentBudgets.map((budget) => {
                      const totalSpent = budget.allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
                      const remaining = budget.income - totalSpent;
                      const isOverBudget = remaining < 0;
                      
                      return (
                        <div key={budget.id} className="flex items-center gap-4 p-3 rounded-lg border">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{budget.month}</span>
                              {isOverBudget ? (
                                <Badge variant="destructive" className="text-xs">Over Budget</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">On Track</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Income: £{budget.income.toFixed(2)} • Spent: £{totalSpent.toFixed(2)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={cn(
                              "font-semibold",
                              isOverBudget ? "text-destructive" : "text-green-600"
                            )}>
                              £{Math.abs(remaining).toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {isOverBudget ? "Over" : "Remaining"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <PiggyBank className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No budgets created yet</p>
                    <p className="text-sm">Create your first budget to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.section>
        </div>

        {/* Call to Action */}
        <motion.section variants={itemVariants} className="mt-12">
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-8 text-center">
              <div className="max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold mb-4">Ready to take control of your finances?</h3>
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
