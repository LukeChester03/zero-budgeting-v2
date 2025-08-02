"use client";

import { useFirebaseStore } from "@/lib/store-firebase";
import { budgetTemplate } from "@/app/utils/template";
import { useState, useEffect, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "@/lib/auth-context";
import AddCategoryModal from "./AddCategoryModal";
import { motion, Variants } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Edit3, 
  Eye, 
  EyeOff, 
  Save, 
  RotateCcw, 
  Plus,
  CheckCircle,
  AlertCircle,
  Calculator,
  Target,
  Zap,
  Shield,
  Home,
  Car,
  ShoppingBag,
  Utensils,
  Heart,
  GraduationCap,
  Briefcase,
  Gift,
  CreditCard
} from "lucide-react";

// Motion variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
    staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 200, damping: 25 },
  },
};

// Category icons mapping
const CATEGORY_ICONS: { [key: string]: React.ReactNode } = {
  "Housing": <Home className="h-4 w-4" />,
  "Transportation": <Car className="h-4 w-4" />,
  "Food & Dining": <Utensils className="h-4 w-4" />,
  "Shopping": <ShoppingBag className="h-4 w-4" />,
  "Healthcare": <Heart className="h-4 w-4" />,
  "Education": <GraduationCap className="h-4 w-4" />,
  "Entertainment": <Gift className="h-4 w-4" />,
  "Utilities": <Zap className="h-4 w-4" />,
  "Insurance": <Shield className="h-4 w-4" />,
  "Savings": <Target className="h-4 w-4" />,
  "Debts": <CreditCard className="h-4 w-4" />,
  "Other": <Calculator className="h-4 w-4" />,
};

export default function BudgetForm() {
  const { toast } = useToast();
  
  // Store selectors
  const income = useFirebaseStore((s) => s.income);
  const addBudget = useFirebaseStore((s) => s.addBudget);
  const getBudgetTotal = useFirebaseStore((s) => s.getBudgetTotal);
  const getBudgetRemaining = useFirebaseStore((s) => s.getBudgetRemaining);
  const getCustomCategories = useFirebaseStore((s) => s.getCustomCategories);
  const addCustomCategory = useFirebaseStore((s) => s.addCustomCategory);
  const debts = useFirebaseStore((s) => s.debts);
  const budgets = useFirebaseStore((s) => s.budgets);
  const { user } = useAuth();

  // State
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);
  const [amounts, setAmounts] = useState<{ [cat: string]: number }>({});
  const [isEditing, setIsEditing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showRemaining, setShowRemaining] = useState(true);
  const [availableMonthsList, setAvailableMonthsList] = useState<string[]>([]);

  // Get available months for budget selection
  const availableMonths = useMemo(() => {
    const months = budgets.map(b => b.month).sort().reverse();
    return months;
  }, [budgets]);

  // Generate available months list on client side only
  useEffect(() => {
    const months = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const month = date.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
      months.push(month);
    }
    setAvailableMonthsList(months);
  }, []);

  // Get current month's budget
  const currentBudget = useMemo(() => {
    if (!selectedMonth) return null;
    return budgets.find(b => b.month === selectedMonth);
  }, [budgets, selectedMonth]);

  // Get previous month's budget for pre-filling
  const previousBudget = useMemo(() => {
    if (!selectedMonth) return null;
    const [monthName, year] = selectedMonth.split(" ");
    const currentDate = new Date(`${monthName} 1, ${year}`);
    const previousDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
    const previousMonth = previousDate.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    return budgets.find((b) => b.month === previousMonth);
  }, [budgets, selectedMonth]);

     // Initialize amounts when month changes
  useEffect(() => {
     if (!selectedMonth) return;

     let initialAmounts: { [cat: string]: number } = {};

     // If a specific budget is selected from dropdown, load its allocations first
     if (selectedBudget) {
       const selectedBudgetData = budgets.find(b => b.id === selectedBudget);
       if (selectedBudgetData) {
         selectedBudgetData.allocations.forEach(({ category, amount }) => {
           initialAmounts[category] = amount;
         });
       }
     } else {
       // If there's an existing budget for the selected month, load it
       if (currentBudget) {
         currentBudget.allocations.forEach(({ category, amount }) => {
           initialAmounts[category] = amount;
         });
       } else {
         // Pre-fill with debt amounts
         debts.forEach(debt => {
           initialAmounts[debt.name] = debt.monthlyRepayment;
         });

         // Pre-fill with previous month's budget if available
         if (previousBudget) {
           previousBudget.allocations.forEach(({ category, amount }) => {
             if (!debts.some(d => d.name === category)) {
               initialAmounts[category] = amount;
             }
           });
         }
       }
    }

    setAmounts(initialAmounts);
   }, [selectedMonth, currentBudget, previousBudget, debts, selectedBudget, budgets, isEditing]);

  // Derived data
  const allocationsArray = Object.entries(amounts).map(([category, amount]) => ({
    category,
    amount,
  }));

  const totalAllocated = getBudgetTotal(allocationsArray);
  const remaining = getBudgetRemaining(allocationsArray, income);
  const allocationPercentage = income > 0 ? (totalAllocated / income) * 100 : 0;

  const getStatusColor = (remaining: number) => {
    if (remaining > 0) return "text-amber-600";
    if (remaining < 0) return "text-red-600";
    return "text-green-600";
  };

  const getStatusIcon = (remaining: number) => {
    if (remaining > 0) return <TrendingUp className="h-4 w-4" />;
    if (remaining < 0) return <TrendingDown className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  // Handlers
  const handleAmountChange = (category: string, value: string) => {
    if (debts.some(d => d.name === category)) return;
    if (!isEditing && currentBudget) return;

    setAmounts(prev => ({ ...prev, [category]: parseFloat(value) || 0 }));
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    setSelectedBudget(null);
    setIsEditing(false);
  };

  const handleBudgetSelect = (budgetId: string) => {
    setSelectedBudget(budgetId);
    setIsEditing(false);
  };

  const handleCreateNew = () => {
    setSelectedBudget(null);
    setIsEditing(false);
  };

  const handleEditBudget = () => {
    setIsEditing(true);
  };

  const handleSaveBudget = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save a budget!",
        variant: "destructive",
      });
      return;
    }

    if (!selectedMonth) {
      toast({
        title: "Error",
        description: "Please select a month first!",
        variant: "destructive",
      });
      return;
    }

    if (currentBudget && !isEditing) {
      toast({
        title: "Error",
        description: "A budget already exists for this month. Please edit the existing budget.",
        variant: "destructive",
      });
      return;
    }

    const allocations = allocationsArray.filter(a => a.amount > 0);
    
    try {
      if (currentBudget && isEditing) {
        // Update existing budget
        await addBudget({
          month: selectedMonth,
          income,
          allocations,
        });
        toast({
          title: "Success",
          description: "Budget updated successfully!",
        });
      } else {
        // Create new budget
        await addBudget({
          month: selectedMonth,
          income,
          allocations,
        });
        toast({
          title: "Success",
          description: "Budget created successfully!",
        });
      }

      setIsEditing(false);
    } catch (error) {
      console.error('Error saving budget:', error);
      toast({
        title: "Error",
        description: "Failed to save budget. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleResetToPrevious = () => {
    if (previousBudget) {
      const resetAmounts: { [cat: string]: number } = {};
      
      // Reset to debt amounts
      debts.forEach(debt => {
        resetAmounts[debt.name] = debt.monthlyRepayment;
      });

      // Add previous month's allocations
      previousBudget.allocations.forEach(({ category, amount }) => {
        if (!debts.some(d => d.name === category)) {
          resetAmounts[category] = amount;
        }
      });

      setAmounts(resetAmounts);
      toast({
        title: "Reset Complete",
        description: "Budget reset to previous month's allocations",
      });
    }
  };

  const openAddModal = (section: string) => {
    setActiveSection(section);
    setModalOpen(true);
  };

  const confirmAddCategory = async (name: string) => {
    if (activeSection) {
      try {
        await addCustomCategory(activeSection, name);
        setModalOpen(false);
        toast({
          title: "Success",
          description: `Category "${name}" added successfully!`,
        });
      } catch (error) {
        console.error('Error adding custom category:', error);
        toast({
          title: "Error",
          description: "Failed to add custom category. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto"
    >
             {/* Budget Management Header */}
       <motion.div variants={itemVariants} className="mb-8">
         <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Calendar className="h-5 w-5" />
               Create or Edit Budget
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-6">
             {/* Step 1: Select Month */}
             <div className="space-y-3">
               <Label className="text-base font-semibold">Step 1: Choose Month</Label>
               <Select value={selectedMonth} onValueChange={handleMonthChange}>
                 <SelectTrigger className="w-full">
                   <SelectValue placeholder="Select month for your budget..." />
                 </SelectTrigger>
                                   <SelectContent>
                    {availableMonthsList.map((month) => (
                      <SelectItem key={month} value={month}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
               </Select>
             </div>

             {/* Step 2: Budget Status & Actions */}
             {selectedMonth && (
               <div className="space-y-4">
                 <Label className="text-base font-semibold">Step 2: Budget Status</Label>
                 
                 {currentBudget ? (
                   <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                     <div className="flex items-center gap-2 mb-3">
                       <CheckCircle className="h-5 w-5 text-blue-600" />
                       <span className="font-medium text-blue-800">Budget Exists for {selectedMonth}</span>
                     </div>
                     
                     {/* Budget Details */}
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                       <div className="bg-white/50 p-3 rounded">
                         <div className="text-xs text-blue-600 font-medium">Total Allocated</div>
                         <div className="text-lg font-bold text-blue-800">
                           £{getBudgetTotal(currentBudget.allocations).toFixed(2)}
                         </div>
                       </div>
                       <div className="bg-white/50 p-3 rounded">
                         <div className="text-xs text-blue-600 font-medium">Remaining</div>
                         <div className={`text-lg font-bold ${
                           getBudgetRemaining(currentBudget.allocations, currentBudget.income) >= 0 
                             ? 'text-green-600' 
                             : 'text-red-600'
                         }`}>
                           £{getBudgetRemaining(currentBudget.allocations, currentBudget.income).toFixed(2)}
                         </div>
                       </div>
                       <div className="bg-white/50 p-3 rounded">
                         <div className="text-xs text-blue-600 font-medium">Categories</div>
                         <div className="text-lg font-bold text-blue-800">
                           {currentBudget.allocations.length}
                         </div>
                       </div>
                     </div>
                     
                     <div className="flex gap-2">
                       <Button
                         onClick={handleEditBudget}
                         variant="outline"
                         size="sm"
                         className="bg-blue-600 text-black hover:bg-blue-700"
                       >
                         <Edit3 className="h-4 w-4 mr-2" />
                         Edit Existing Budget
                       </Button>
                       <Button
                         onClick={handleCreateNew}
                         variant="outline"
                         size="sm"
                       >
                         <Plus className="h-4 w-4 mr-2" />
                         Create New Budget
                       </Button>
                     </div>
                   </div>
                 ) : (
                   <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                     <div className="flex items-center gap-2 mb-2">
                       <Plus className="h-5 w-5 text-green-600" />
                       <span className="font-medium text-green-800">No Budget for {selectedMonth}</span>
                     </div>
                     <p className="text-sm text-green-700 mb-3">
                       You can create a new budget or load from a previous month
                     </p>
                     <div className="flex gap-2">
                       <Button
                         onClick={handleCreateNew}
                         size="sm"
                         className="bg-green-600 text-white hover:bg-green-700"
                       >
                         <Plus className="h-4 w-4 mr-2" />
                         Create New Budget
                       </Button>
                     </div>
                   </div>
                 )}
               </div>
             )}

             {/* Step 3: Load Previous Budget */}
             {selectedMonth && !currentBudget && (
               <div className="space-y-3">
                 <Label className="text-base font-semibold">Step 3: Load Previous Budget (Optional)</Label>
                 
                 {previousBudget && (
                   <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                     <div className="flex items-center gap-2 mb-2">
                       <RotateCcw className="h-5 w-5 text-amber-600" />
                       <span className="font-medium text-amber-800">Previous Budget Available</span>
                     </div>
                     <p className="text-sm text-amber-700 mb-3">
                       Load allocations from {previousBudget.month} to pre-fill this budget
                     </p>
                     <Button
                       onClick={handleResetToPrevious}
                       variant="outline"
                       size="sm"
                       className="border-amber-300 text-amber-700 hover:bg-amber-100"
                     >
                       <RotateCcw className="h-4 w-4 mr-2" />
                       Load from {previousBudget.month}
                     </Button>
                   </div>
                 )}

                 {availableMonths.length > 0 && (
                   <div className="space-y-2">
                     <Label className="text-sm text-muted-foreground">Or load any previous budget:</Label>
                     <Select value={selectedBudget || ""} onValueChange={handleBudgetSelect}>
                       <SelectTrigger>
                         <SelectValue placeholder="Select a previous budget to load..." />
                       </SelectTrigger>
                       <SelectContent>
                         {availableMonths.map(month => {
                           const budget = budgets.find(b => b.month === month);
                           return (
                             <SelectItem key={budget?.id || month} value={budget?.id || ""}>
                               {month} - £{budget ? getBudgetTotal(budget.allocations).toFixed(2) : '0.00'}
                             </SelectItem>
                           );
                         })}
                       </SelectContent>
                     </Select>
                   </div>
                 )}
               </div>
             )}

             {/* Current Status */}
             {selectedMonth && (
               <div className="p-4 bg-muted/50 rounded-lg">
                 <div className="flex items-center gap-2 mb-2">
                   <Calculator className="h-4 w-4 text-muted-foreground" />
                   <span className="text-sm font-medium text-muted-foreground">Current Status</span>
                 </div>
                 <div className="grid grid-cols-2 gap-4 text-sm">
                   <div>
                     <span className="text-muted-foreground">Selected Month:</span>
                     <span className="ml-2 font-medium">{selectedMonth}</span>
                   </div>
                   <div>
                     <span className="text-muted-foreground">Mode:</span>
                     <span className="ml-2 font-medium">
                       {currentBudget ? (isEditing ? 'Editing' : 'Viewing') : 'Creating New'}
                     </span>
                   </div>
                 </div>
               </div>
             )}
           </CardContent>
         </Card>
       </motion.div>

      {/* Budget Summary */}
      <motion.div variants={itemVariants} className="mb-8">
        <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">Monthly Income</span>
                </div>
                <div className="text-2xl font-bold">£{income.toFixed(2)}</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span className="text-sm">Allocated</span>
                </div>
                <div className="text-2xl font-bold">£{totalAllocated.toFixed(2)}</div>
                <Progress value={allocationPercentage} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {allocationPercentage.toFixed(1)}% of income
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  {getStatusIcon(remaining)}
                  <span className="text-sm">Remaining</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRemaining(!showRemaining)}
                    className="h-4 w-4 p-0"
                  >
                    {showRemaining ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
                <div className={cn("text-2xl font-bold", getStatusColor(remaining))}>
                  {showRemaining ? `£${remaining.toFixed(2)}` : "••••"}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calculator className="h-4 w-4" />
                  <span className="text-sm">Status</span>
                </div>
                <Badge 
                  variant={remaining === 0 ? "default" : remaining > 0 ? "secondary" : "destructive"}
                  className="text-sm"
                >
                  {remaining === 0 ? "Balanced" : remaining > 0 ? "Under Budget" : "Over Budget"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Budget Categories */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="categories" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="categories">Budget Categories</TabsTrigger>
            <TabsTrigger value="summary">Budget Summary</TabsTrigger>
          </TabsList>

                     <TabsContent value="categories" className="space-y-6">
             <div className="space-y-6">
        {budgetTemplate.map((group) => {
          const custom = getCustomCategories(group.title);
          const allCategories = [...group.categories, ...custom];
          const debtsInGroup = debts.filter((d) => allCategories.includes(d.name));
          const userCategories = allCategories.filter((cat) => !debts.some((d) => d.name === cat));

          return (
                   <Card key={group.title}>
                     <CardHeader className="pb-4">
                       <div className="flex justify-between items-center">
                         <div className="flex items-center gap-2">
                           {CATEGORY_ICONS[group.title] || <Calculator className="h-4 w-4" />}
                           <CardTitle className="text-lg">{group.title}</CardTitle>
                         </div>
                         <Button
                           onClick={() => openAddModal(group.title)}
                           size="sm"
                           variant="outline"
                         >
                           <Plus className="h-4 w-4 mr-2" />
                           Add
                         </Button>
              </div>
                     </CardHeader>
                     <CardContent className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                {userCategories.map((cat) => (
                           <div key={cat} className="space-y-2">
                             <Label className="text-sm font-medium">
                      {cat}
                             </Label>
                             <div className="relative">
                               <Input
                        type="number"
                        value={amounts[cat] ?? ""}
                        onChange={(e) => handleAmountChange(cat, e.target.value)}
                                 className={cn(
                                   "pr-8",
                                   !isEditing && currentBudget && "opacity-70 cursor-not-allowed"
                        )}
                        placeholder="0.00"
                                 disabled={!isEditing && currentBudget}
                               />
                               <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                 £
                               </span>
                    </div>
                  </div>
                ))}

                {debtsInGroup.map((debt) => (
                           <div key={debt.id} className="space-y-2">
                             <div className="flex items-center gap-2">
                               <CreditCard className="h-4 w-4 text-destructive" />
                               <Label className="text-sm font-medium text-destructive">
                                 {debt.name}
                               </Label>
                               <Badge variant="destructive" className="text-xs">Debt</Badge>
                             </div>
                             <div className="relative">
                               <Input
                      type="number"
                      value={amounts[debt.name]?.toFixed(2) ?? "0.00"}
                      readOnly
                                 className="bg-destructive/10 border-destructive/30 text-destructive cursor-not-allowed pr-8"
                    />
                               <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-destructive">
                                 £
                               </span>
                             </div>
                  </div>
                ))}
              </div>
                     </CardContent>
                   </Card>
                 );
              })}
            </div>
          </TabsContent>

                     <TabsContent value="summary" className="space-y-6">
             {/* Budget Overview Card */}
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <Calculator className="h-5 w-5" />
                   Budget Overview
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-6">
                 {/* Summary Stats */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="bg-primary/5 p-4 rounded-lg">
                     <div className="text-sm text-muted-foreground">Monthly Income</div>
                     <div className="text-2xl font-bold text-primary">£{income.toFixed(2)}</div>
                   </div>
                   <div className="bg-blue-50 p-4 rounded-lg">
                     <div className="text-sm text-muted-foreground">Total Allocated</div>
                     <div className="text-2xl font-bold text-blue-600">£{totalAllocated.toFixed(2)}</div>
                   </div>
                   <div className={`p-4 rounded-lg ${remaining >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                     <div className="text-sm text-muted-foreground">Remaining</div>
                     <div className={`text-2xl font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                       £{remaining.toFixed(2)}
                     </div>
                   </div>
                 </div>

                 {/* Allocation Progress */}
                 <div className="space-y-2">
                   <div className="flex justify-between items-center">
                     <span className="text-sm font-medium">Allocation Progress</span>
                     <span className="text-sm text-muted-foreground">{allocationPercentage.toFixed(1)}%</span>
                   </div>
                   <Progress value={allocationPercentage} className="h-3" />
                   <div className="flex justify-between text-xs text-muted-foreground">
                     <span>£0</span>
                     <span>£{income.toFixed(2)}</span>
                   </div>
                 </div>

                 {/* Status Indicator */}
                 <div className={`flex items-center gap-2 p-3 rounded-lg ${
                   remaining === 0 ? 'bg-green-50 border border-green-200' :
                   remaining > 0 ? 'bg-amber-50 border border-amber-200' :
                   'bg-red-50 border border-red-200'
                 }`}>
                   {getStatusIcon(remaining)}
                   <span className={`font-medium ${
                     remaining === 0 ? 'text-green-700' :
                     remaining > 0 ? 'text-amber-700' :
                     'text-red-700'
                   }`}>
                     {remaining === 0 ? 'Perfect allocation!' :
                      remaining > 0 ? `${remaining.toFixed(2)} remaining to allocate` :
                      `${Math.abs(remaining).toFixed(2)} over budget`}
                   </span>
                 </div>
               </CardContent>
             </Card>

             {/* Budget Breakdown Card */}
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <Target className="h-5 w-5" />
                   Budget Breakdown
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 {Object.entries(amounts)
                   .filter(([, amount]) => amount > 0)
                   .sort(([, a], [, b]) => b - a)
                   .map(([category, amount]) => {
                     const percentage = income > 0 ? (amount / income) * 100 : 0;
                     const isDebt = debts.some(d => d.name === category);
                     
                     return (
                       <div key={category} className="space-y-2">
                         <div className="flex justify-between items-center">
                           <div className="flex items-center gap-2">
                             {isDebt && <CreditCard className="h-4 w-4 text-destructive" />}
                             <span className="font-medium">{category}</span>
                             {isDebt && <Badge variant="destructive" className="text-xs">Debt</Badge>}
                           </div>
                           <span className="font-semibold">£{amount.toFixed(2)}</span>
                         </div>
                         <Progress value={percentage} className="h-2" />
                         <div className="flex justify-between text-xs text-muted-foreground">
                           <span>{percentage.toFixed(1)}% of income</span>
                           <span>£{amount.toFixed(2)}</span>
                         </div>
                       </div>
          );
        })}

                 {Object.entries(amounts).filter(([, amount]) => amount > 0).length === 0 && (
                   <div className="text-center py-8 text-muted-foreground">
                     <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                     <p className="text-sm">No budget allocations yet</p>
                     <p className="text-xs">Add amounts to categories to see the breakdown</p>
            </div>
        )}
               </CardContent>
             </Card>
           </TabsContent>
        </Tabs>
      </motion.div>

      {/* Action Buttons */}
      <motion.div variants={itemVariants} className="mt-8 flex justify-end gap-4">
        <Button
          onClick={handleResetToPrevious}
          variant="outline"
          disabled={!previousBudget}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Previous
        </Button>
        <Button
          onClick={handleSaveBudget}
          disabled={!selectedMonth || (currentBudget && !isEditing)}
          className="bg-primary hover:bg-primary/90"
        >
          <Save className="h-4 w-4 mr-2" />
          {currentBudget && isEditing ? "Update Budget" : "Save Budget"}
        </Button>
      </motion.div>

      {/* Modal */}
      <AddCategoryModal
        open={modalOpen}
        section={activeSection ?? ""}
        onClose={() => setModalOpen(false)}
        onConfirm={confirmAddCategory}
      />
    </motion.div>
  );
}
