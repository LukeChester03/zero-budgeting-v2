"use client";

import { useState, useEffect, useMemo } from "react";
import { useFirebaseStore } from "@/lib/store-firebase";
import { useAuth } from "@/lib/auth-context";
import AddCategoryModal from "./AddCategoryModal";
import CustomCategoryManager from "./CustomCategoryManager";
import SaveTemplateModal from "./SaveTemplateModal";
import TemplateSelector from "./TemplateSelector";
import { motion, Variants } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Calculator,
  Calendar,
  CreditCard,
  DollarSign,
  Home,
  ShoppingBag,
  Target,
  Zap,
  Shield,
  Plus,
  Save,
  RotateCcw,
  CheckCircle,
  Edit,
  Trash2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Car,
  Heart,
  Plane,
  GraduationCap,
  Building2,
  UtensilsCrossed,
  Gamepad2,
  BookOpen,
  Music,
  Camera,
  Gift,
  Wifi,
  Phone,
  Bus,
  Train,
  Bike,
  Footprints,
  Baby,
  Dog,
  Cat,
  TreePine,
  Sun,
  CloudRain,
  Snowflake,
  Leaf,
  Flower2,
  Gem,
  Crown,
  Star,
  HeartHandshake,
  HandHeart,
  PiggyBank,
  Coins,
  Banknote,
  Wallet,
  CreditCard as CreditCardIcon,
  Building,
  Home as HomeIcon,
  Car as CarIcon,
  Plane as PlaneIcon,
  GraduationCap as GraduationCapIcon,
  Heart as HeartIcon,
  TreePine as TreePineIcon,
  Sun as SunIcon,
  CloudRain as CloudRainIcon,
  Snowflake as SnowflakeIcon,
  Leaf as LeafIcon,
  Flower2 as Flower2Icon,
  Gem as GemIcon,
  Crown as CrownIcon,
  Star as StarIcon,
  HeartHandshake as HeartHandshakeIcon,
  HandHeart as HandHeartIcon,
  PiggyBank as PiggyBankIcon,
  Coins as CoinsIcon,
  Banknote as BanknoteIcon,
  Wallet as WalletIcon,
  Building as BuildingIcon,
  Eye,
  EyeOff,
  Bookmark,
} from "lucide-react";

// Category icons mapping
const CATEGORY_ICONS: { [key: string]: React.ReactNode } = {
  "Housing": <Home className="h-4 w-4" />,
  "Transport": <Car className="h-4 w-4" />,
  "Food": <UtensilsCrossed className="h-4 w-4" />,
  "Utilities": <Zap className="h-4 w-4" />,
  "Insurance": <Shield className="h-4 w-4" />,
  "Savings": <Target className="h-4 w-4" />,
  "Debts": <CreditCard className="h-4 w-4" />,
  "Goals": <Target className="h-4 w-4" />,
  "Other": <Calculator className="h-4 w-4" />,
};

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

export default function BudgetForm() {
  const { toast } = useToast();
  
  // Store selectors
  const income = useFirebaseStore((s) => s.income);
  const addBudget = useFirebaseStore((s) => s.addBudget);
  const getBudgetTotal = useFirebaseStore((s) => s.getBudgetTotal);
  const getBudgetRemaining = useFirebaseStore((s) => s.getBudgetRemaining);
  const getCustomCategories = useFirebaseStore((s) => s.getCustomCategories);
  const addCustomCategory = useFirebaseStore((s) => s.addCustomCategory);
  const allocateGoalContributions = useFirebaseStore((s) => s.allocateGoalContributions);
  const allocateDebtPayments = useFirebaseStore((s) => s.allocateDebtPayments);
  const debts = useFirebaseStore((s) => s.debts);
  const budgets = useFirebaseStore((s) => s.budgets);
  const goals = useFirebaseStore((s) => s.goals);
  const budgetTemplates = useFirebaseStore((s) => s.budgetTemplates);
  const { user } = useAuth();

  // State
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);
  const [amounts, setAmounts] = useState<{ [cat: string]: number }>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editableGoals, setEditableGoals] = useState<Set<string>>(new Set());
  const [availableMonthsList, setAvailableMonthsList] = useState<string[]>([]);
  const [showRemaining, setShowRemaining] = useState(false);
  const [saveTemplateModalOpen, setSaveTemplateModalOpen] = useState(false);

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

  // Get the default template
  const defaultTemplate = useMemo(() => {
    return budgetTemplates.find(t => t.isDefault);
  }, [budgetTemplates]);

  // Organize categories into sections
  const budgetSections = useMemo(() => {
    if (!defaultTemplate) return [];
    
    // Use sections from template if available, otherwise fall back to hardcoded sections
    const templateSections = (defaultTemplate as any).sections;
    
    if (templateSections && templateSections.length > 0) {
      // Use template sections with icons
      return templateSections.map((section: { title: string; categories: string[] }, index: number) => {
        const icons = [
          <Home className="h-4 w-4" key="home" />,
          <Car className="h-4 w-4" key="car" />,
          <UtensilsCrossed className="h-4 w-4" key="food" />,
          <Zap className="h-4 w-4" key="utilities" />,
          <Shield className="h-4 w-4" key="insurance" />,
          <Target className="h-4 w-4" key="savings" />,
          <Calculator className="h-4 w-4" key="other" />
        ];
        
        return {
          ...section,
          icon: icons[index] || <Calculator className="h-4 w-4" />
        };
      });
    }
    
    // Fallback to hardcoded sections if template doesn't have sections
    const sections = [
      {
        title: "Housing",
        categories: ["Rent/Mortgage", "Council Tax", "Home Insurance", "Maintenance"],
        icon: <Home className="h-4 w-4" />
      },
      {
        title: "Transport",
        categories: ["Fuel", "Car Insurance", "Car Tax", "Public Transport", "Parking", "Car Maintenance"],
        icon: <Car className="h-4 w-4" />
      },
      {
        title: "Food",
        categories: ["Groceries", "Takeaways", "Restaurants"],
        icon: <UtensilsCrossed className="h-4 w-4" />
      },
      {
        title: "Utilities",
        categories: ["Electricity", "Gas", "Water", "Internet", "Phone"],
        icon: <Zap className="h-4 w-4" />
      },
      {
        title: "Insurance",
        categories: ["Life Insurance", "Health Insurance", "Pet Insurance"],
        icon: <Shield className="h-4 w-4" />
      },
      {
        title: "Savings",
        categories: ["Emergency Fund", "Investments", "Pension"],
        icon: <Target className="h-4 w-4" />
      },
      {
        title: "Debts",
        categories: [],
        icon: <CreditCard className="h-4 w-4" />
      },
      {
        title: "Goals",
        categories: [],
        icon: <Target className="h-4 w-4" />
      },
      {
        title: "Other",
        categories: ["Entertainment", "Clothing", "Healthcare", "Gifts", "Holidays"],
        icon: <Calculator className="h-4 w-4" />
      }
    ];

    // Filter sections to only include categories that exist in the default template
    const filteredSections = sections.map(section => ({
      ...section,
      categories: section.categories.filter(cat => defaultTemplate.categories.includes(cat))
    })).filter(section => section.categories.length > 0);
    
    return filteredSections;
  }, [defaultTemplate]);

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
        const activeDebtsForPrefill = debts.filter(d => d.isActive);
        activeDebtsForPrefill.forEach(debt => {
          initialAmounts[debt.name] = debt.monthlyRepayment;
        });

        // Pre-fill with previous month's budget if available
        if (previousBudget) {
          previousBudget.allocations.forEach(({ category, amount }) => {
            if (!activeDebtsForPrefill.some(d => d.name === category)) {
              initialAmounts[category] = amount;
            }
          });
        }
      }
    }

    setAmounts(initialAmounts);
  }, [selectedMonth, selectedBudget, currentBudget, previousBudget, debts]);

  // Auto-load default template when component mounts and no amounts are set
  useEffect(() => {
    if (defaultTemplate && Object.keys(amounts).length === 0) {
      const newAmounts: { [cat: string]: number } = {};
      defaultTemplate.categories.forEach(category => {
        newAmounts[category] = 0;
      });
      setAmounts(newAmounts);
    }
  }, [defaultTemplate, amounts]);

  // Ensure goal allocations are properly set when goals change
  useEffect(() => {
    if (selectedMonth && !currentBudget && !selectedBudget) {
      const activeGoals = goals.filter(g => g.isActive);
      if (activeGoals.length > 0) {
        setAmounts(prev => {
          const updated = { ...prev };
          activeGoals.forEach(goal => {
            updated[goal.title] = goal.monthlyContribution;
          });
          return updated;
        });
      }
    }
  }, [goals, selectedMonth, currentBudget, selectedBudget]);

  // Show loading state if budget templates are not loaded yet
  if (budgetTemplates.length === 0 || !defaultTemplate) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Setting up your budget templates...</p>
          <p className="text-xs text-muted-foreground mt-2">This may take a moment on first login</p>
        </div>
      </div>
    );
  }

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
        // Create new budget with goal allocations
        const budgetData = {
          month: selectedMonth,
          income,
          allocations,
        };
        
        // Allocate goal contributions and debt payments if there are active goals or debts
        const activeGoals = goals.filter(g => g.isActive);
        const activeDebts = debts.filter(d => d.isActive);
        
        if (activeGoals.length > 0 || activeDebts.length > 0) {
          // Allocate both goals and debts
          if (activeGoals.length > 0) {
            await allocateGoalContributions(budgetData);
          }
          if (activeDebts.length > 0) {
            await allocateDebtPayments(budgetData);
          }
          toast({
            title: "Success",
            description: "Budget created successfully with goal and debt allocations!",
          });
        } else {
          await addBudget(budgetData);
          toast({
            title: "Success",
            description: "Budget created successfully!",
          });
        }
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

  const handleResetToPrevious = async () => {
    if (!previousBudget) return;

    try {
      // Reset amounts to previous budget allocations
      const newAmounts: { [cat: string]: number } = {};
      previousBudget.allocations.forEach(({ category, amount }) => {
        newAmounts[category] = amount;
      });
      setAmounts(newAmounts);

      toast({
        title: "Success",
        description: "Budget reset to previous month's allocations!",
      });
    } catch (error) {
      console.error('Error resetting budget:', error);
      toast({
        title: "Error",
        description: "Failed to reset budget. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleGoalEdit = (goalTitle: string) => {
    setEditableGoals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(goalTitle)) {
        newSet.delete(goalTitle);
      } else {
        newSet.add(goalTitle);
      }
      return newSet;
    });
  };

  const handleTemplateSelect = (categories: string[]) => {
    // Clear current amounts and set up new categories
    const newAmounts: { [cat: string]: number } = {};
    categories.forEach(category => {
      newAmounts[category] = 0;
    });
    setAmounts(newAmounts);
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

             {/* Step 1.5: Template Selection */}
             {selectedMonth && (
               <div className="space-y-3">
                 <Label className="text-base font-semibold">Step 1.5: Load Template (Optional)</Label>
                 <TemplateSelector 
                   onTemplateSelect={handleTemplateSelect}
                   currentAllocations={allocationsArray}
                 />
               </div>
             )}

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
                         <Edit className="h-4 w-4 mr-2" />
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

      {/* Goal Allocations Breakdown */}
      {goals.filter(g => g.isActive).length > 0 && (
        <motion.div variants={itemVariants} className="mb-8">
          <Card className="border-green-200 bg-green-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Target className="h-5 w-5" />
                Goal Allocations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {goals.filter(g => g.isActive).map(goal => (
                <div key={goal.id} className="flex justify-between items-center p-2 bg-white/50 rounded">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-600" />
                    <span className="font-medium">{goal.title}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-700">
                      £{(amounts[goal.title] || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Target: £{goal.target.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Debt Allocations Breakdown */}
      {debts.filter(d => d.isActive).length > 0 && (
        <motion.div variants={itemVariants} className="mb-8">
          <Card className="border-red-200 bg-red-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <CreditCard className="h-5 w-5" />
                Debt Allocations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {debts.filter(d => d.isActive).map(debt => (
                <div key={debt.id} className="flex justify-between items-center p-2 bg-white/50 rounded">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-red-600" />
                    <span className="font-medium">{debt.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-red-700">
                      £{(amounts[debt.name] || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total: £{debt.totalAmount.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Budget Categories */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="categories" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="categories">Budget Categories</TabsTrigger>
            <TabsTrigger value="summary">Budget Summary</TabsTrigger>
          </TabsList>

                     <TabsContent value="categories" className="space-y-6">
             <div className="space-y-6">
        {budgetSections.map((section: { title: string; categories: string[]; icon: React.ReactNode }) => {
          const custom = getCustomCategories(section.title);
          let allCategories = [...section.categories, ...custom];
          
          // Dynamically populate Goals section with user's active goals
          if (section.title === "Goals") {
            const activeGoals = goals.filter(g => g.isActive).map(g => g.title);
            allCategories = [...activeGoals, ...custom];
          }
          
          // Dynamically populate Debts section with user's active debts
          if (section.title === "Debts") {
            const activeDebts = debts.filter(d => d.isActive).map(d => d.name);
            allCategories = [...activeDebts, ...custom];
          }
          
          // Skip rendering if no categories in this group
          if (allCategories.length === 0) {
            return null;
          }
          
          const debtsInGroup = debts.filter((d) => allCategories.includes(d.name));
          const userCategories = allCategories.filter((cat) => !debts.some((d) => d.name === cat));

          return (
                   <Card key={section.title} className={cn(
                     section.title === "Goals" && "border-green-200 bg-green-50/30",
                     section.title === "Debts" && "border-red-200 bg-red-50/30"
                   )}>
                     <CardHeader className="pb-4">
                       <div className="flex justify-between items-center">
                         <div className="flex items-center gap-2">
                           {CATEGORY_ICONS[section.title] || <Calculator className="h-4 w-4" />}
                           <CardTitle className={cn(
                             "text-lg",
                             section.title === "Goals" && "text-green-700",
                             section.title === "Debts" && "text-red-700"
                           )}>{section.title}</CardTitle>
                           {section.title === "Goals" && (
                             <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                               Auto-allocated
                             </Badge>
                           )}
                           {section.title === "Debts" && (
                             <Badge variant="outline" className="text-xs bg-red-100 text-red-700 border-red-300">
                               Auto-allocated
                             </Badge>
                           )}
                         </div>
                       </div>
                     </CardHeader>
                     <CardContent className="space-y-4">
                       {/* Custom Category Manager */}
                         <CustomCategoryManager 
                           section={section.title} 
                           title="Custom Categories" 
                         />
                         
                         <div className="grid grid-cols-2 gap-4">
                {userCategories.map((cat) => {
                  // Check if this is a goal category
                  const isGoalCategory = section.title === "Goals";
                  const isDebtCategory = section.title === "Debts";
                  const goal = goals.find(g => g.title === cat);
                  const debt = debts.find(d => d.name === cat);
                  const isEditable = editableGoals.has(cat);
                  
                  return (
                    <div key={cat} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          {cat}
                        </Label>
                        {isGoalCategory && goal && (
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">
                              Goal
                            </Badge>
                            {!isEditable ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleGoalEdit(cat)}
                                className="h-6 px-2 text-xs"
                              >
                                Edit
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleGoalEdit(cat)}
                                className="h-6 px-2 text-xs text-green-600"
                              >
                                Save
                              </Button>
                            )}
                          </div>
                        )}
                        {isDebtCategory && debt && (
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                              Debt
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="relative">
                        <Input
                          type="number"
                          value={amounts[cat] ?? ""}
                          onChange={(e) => handleAmountChange(cat, e.target.value)}
                          className={cn(
                            "pr-8",
                            !isEditing && currentBudget && "opacity-70 cursor-not-allowed",
                            isGoalCategory && !isEditable && "bg-green-50 border-green-200",
                            isDebtCategory && "bg-red-50 border-red-200"
                          )}
                          placeholder="0.00"
                          disabled={(!isEditing && !!currentBudget) || (isGoalCategory && !isEditable) || isDebtCategory}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          £
                        </span>
                      </div>
                      {isGoalCategory && goal && (
                        <div className="text-xs text-muted-foreground">
                          Target: £{goal.target.toFixed(2)} | Monthly: £{goal.monthlyContribution.toFixed(2)}
                        </div>
                      )}
                      {isDebtCategory && debt && (
                        <div className="text-xs text-muted-foreground">
                          Total: £{debt.totalAmount.toFixed(2)} | Monthly: £{debt.monthlyRepayment.toFixed(2)}
                        </div>
                      )}
                    </div>
                  );
                })}

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
                 <div className="grid grid-cols-4 gap-4">
                   <div className="text-center p-3 bg-blue-50 rounded-lg">
                     <p className="text-xs text-muted-foreground">Total Allocated</p>
                     <p className="text-lg font-bold text-blue-700">£{totalAllocated.toFixed(2)}</p>
                   </div>
                   <div className="text-center p-3 bg-green-50 rounded-lg">
                     <p className="text-xs text-muted-foreground">Goal Allocations</p>
                     <p className="text-lg font-bold text-green-700">
                       £{goals.filter(g => g.isActive).reduce((sum, goal) => sum + (amounts[goal.title] || 0), 0).toFixed(2)}
                     </p>
                   </div>
                   {debts.filter(d => d.isActive).length > 0 && (
                     <div className="text-center p-3 bg-red-50 rounded-lg">
                       <p className="text-xs text-muted-foreground">Debt Allocations</p>
                       <p className="text-lg font-bold text-red-700">
                         £{debts.filter(d => d.isActive).reduce((sum, debt) => sum + (amounts[debt.name] || 0), 0).toFixed(2)}
                       </p>
                     </div>
                   )}
                   <div className={cn(
                     "text-center p-3 rounded-lg",
                     debts.filter(d => d.isActive).length > 0 ? "bg-amber-50" : "bg-amber-50 col-span-2"
                   )}>
                     <p className="text-xs text-muted-foreground">Remaining</p>
                     <p className="text-lg font-bold text-amber-700">£{remaining.toFixed(2)}</p>
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
                     const isGoal = goals.some(g => g.title === category && g.isActive);
                     
                     return (
                       <div key={category} className="space-y-2">
                         <div className="flex justify-between items-center">
                           <div className="flex items-center gap-2">
                             {isDebt && <CreditCard className="h-4 w-4 text-destructive" />}
                             {isGoal && <Target className="h-4 w-4 text-green-600" />}
                             <span className="font-medium">{category}</span>
                             {isDebt && <Badge variant="destructive" className="text-xs">Debt</Badge>}
                             {isGoal && <Badge variant="outline" className="text-xs text-green-600">Goal</Badge>}
                           </div>
                           <span className="font-semibold">£{amount.toFixed(2)}</span>
                         </div>
                         <Progress 
                           value={percentage} 
                           className={cn("h-2", isGoal && "bg-green-100")}
                         />
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
          onClick={() => setSaveTemplateModalOpen(true)}
          variant="outline"
          disabled={Object.keys(amounts).length === 0}
        >
          <Bookmark className="h-4 w-4 mr-2" />
          Save as Template
        </Button>
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
          disabled={!selectedMonth || (!!currentBudget && !isEditing)}
          className="bg-primary hover:bg-primary/90"
        >
          <Save className="h-4 w-4 mr-2" />
          {currentBudget && isEditing ? "Update Budget" : "Save Budget"}
        </Button>
      </motion.div>

      {/* Save Template Modal */}
      <SaveTemplateModal
        open={saveTemplateModalOpen}
        onClose={() => setSaveTemplateModalOpen(false)}
        currentAllocations={allocationsArray}
        currentMonth={selectedMonth}
      />
    </motion.div>
  );
}
