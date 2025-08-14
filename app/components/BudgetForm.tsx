"use client";

import { useState, useEffect, useMemo } from "react";
import { useFirebaseStore } from "@/lib/store-firebase";
import { useAuth } from "@/lib/auth-context";
import CustomCategoryManager from "./CustomCategoryManager";
import SaveTemplateModal from "./SaveTemplateModal";
import TemplateSelector from "./TemplateSelector";
import InfoModal from "./InfoModal";
import { motion, Variants } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToastContext } from "./ToastContext";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  Calculator,
  Home,
  Car,
  UtensilsCrossed,
  Zap,
  Shield,
  CreditCard,
  Target,
  Plus,
  Save,
  RotateCcw,
  CheckCircle,
  Edit,
  TrendingUp,
  TrendingDown,
  HelpCircle,
  Eye,
  EyeOff,
  Bookmark,
  X,
  AlertTriangle,
  Brain,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DollarSign } from "lucide-react";

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
  const { toast } = useToastContext();
  const router = useRouter();
  
  // Store selectors
  const income = useFirebaseStore((s) => s.income);
  const addBudget = useFirebaseStore((s) => s.addBudget);
  const updateBudget = useFirebaseStore((s) => s.updateBudget);
  const getBudgetTotal = useFirebaseStore((s) => s.getBudgetTotal);
  const getBudgetRemaining = useFirebaseStore((s) => s.getBudgetRemaining);
  const getCustomCategories = useFirebaseStore((s) => s.getCustomCategories);
  const removeCustomCategoryFromStore = useFirebaseStore((s) => s.removeCustomCategory);
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
  const [availableMonthsList, setAvailableMonthsList] = useState<string[]>([]);
  const [showRemaining, setShowRemaining] = useState(false);
  const [budgetSaved, setBudgetSaved] = useState(false);
  const [overBudgetModalOpen, setOverBudgetModalOpen] = useState(false);
  const [overBudgetReason, setOverBudgetReason] = useState("");
  const [pendingBudgetData, setPendingBudgetData] = useState<{ month: string; income: number; allocations: { category: string; amount: number }[]; overBudgetReason?: string } | null>(null);
  const [saveTemplateModalOpen, setSaveTemplateModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [infoModalCategory, setInfoModalCategory] = useState("");
  const [aiExplanations, setAiExplanations] = useState<{ [key: string]: string }>({});
  const [showAiExplanations, setShowAiExplanations] = useState(false);

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
    const templateSections = (defaultTemplate as { sections?: { title: string; categories: string[] }[] }).sections;
    
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
        categories: ["Emergency Fund", "Safety Net", "Foundation", "Investments", "Pension"],
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

    const initialAmounts: { [cat: string]: number } = {};

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
  }, [selectedMonth, selectedBudget, currentBudget, previousBudget, debts, budgets]);

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

  // Helper function to handle floating-point precision when comparing to zero
  const isZero = (value: number) => Math.abs(value) < 0.01;

  const getStatusColor = (remaining: number) => {
    if (remaining > 0) return "text-amber-600";
    if (remaining < 0 && !isZero(remaining)) return "text-red-600";
    return "text-green-600";
  };

  const getStatusIcon = (remaining: number) => {
    if (remaining > 0) return <TrendingUp className="h-4 w-4" />;
    if (remaining < 0 && !isZero(remaining)) return <TrendingDown className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  // Handlers
  const handleAmountChange = (category: string, value: string) => {
    if (debts.some(d => d.name === category)) return;
    if (!isEditing && currentBudget) return;

    setAmounts(prev => ({ ...prev, [category]: parseFloat(value) || 0 }));
    setBudgetSaved(false); // Reset saved state when amounts change
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    setSelectedBudget(null);
    setIsEditing(false);
    setBudgetSaved(false);
  };

  const handleBudgetSelect = (budgetId: string) => {
    setSelectedBudget(budgetId);
    setIsEditing(false);
    setBudgetSaved(false);
  };

  const handleCreateNew = () => {
    setSelectedBudget(null);
    setIsEditing(false);
    setBudgetSaved(false);
  };

  const handleEditBudget = () => {
    setIsEditing(true);
    setBudgetSaved(false);
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

    // Check if budget already exists for this month
    const existingBudget = budgets.find(b => b.month === selectedMonth);
    if (existingBudget && !isEditing) {
      toast({
        title: "Error",
        description: "A budget already exists for this month. Please edit the existing budget.",
        variant: "destructive",
      });
      return;
    }

    const allocations = allocationsArray.filter(a => a.amount > 0);
    const budgetData = {
      month: selectedMonth,
      income,
      allocations,
    };

    // Check if over budget
    if (remaining < 0 && !isZero(remaining)) {
      setPendingBudgetData(budgetData);
      setOverBudgetModalOpen(true);
      return;
    }

    await saveBudgetData(budgetData);
  };

  const saveBudgetData = async (budgetData: { month: string; income: number; allocations: { category: string; amount: number }[]; overBudgetReason?: string }) => {
    try {
      // Create budget data without overBudgetReason first
      const budgetWithoutReason = { ...budgetData };
      
      // Only add overBudgetReason if the budget is actually over budget
      if (remaining < 0 && !isZero(remaining)) {
        budgetWithoutReason.overBudgetReason = overBudgetReason;
      }

      console.log('Saving budget with data:', budgetWithoutReason);
      console.log('Remaining amount:', remaining);
      console.log('Over budget reason:', overBudgetReason);

      let savedBudgetId: string;

      if (currentBudget && isEditing) {
        // Update existing budget
        await updateBudget(currentBudget.id, budgetWithoutReason);
        savedBudgetId = currentBudget.id;
        console.log('Budget updated successfully');
      } else {
        // Create new budget with automatic goal and debt allocation
        const { goals, debts } = useFirebaseStore.getState();
        const activeGoals = goals.filter(goal => goal.isActive);
        const activeDebts = debts.filter(debt => debt.isActive);
        
        // Add goal contributions to allocations
        const updatedAllocations = [...budgetWithoutReason.allocations];
        activeGoals.forEach(goal => {
          const existingAllocation = updatedAllocations.find(alloc => alloc.category === goal.title);
          if (existingAllocation) {
            existingAllocation.amount += goal.monthlyContribution;
          } else {
            updatedAllocations.push({
              category: goal.title,
              amount: goal.monthlyContribution
            });
          }
        });
        
        // Add debt payments to allocations
        activeDebts.forEach(debt => {
          const existingAllocation = updatedAllocations.find(alloc => alloc.category === debt.name);
          if (existingAllocation) {
            existingAllocation.amount += debt.monthlyRepayment;
          } else {
            updatedAllocations.push({
              category: debt.name,
              amount: debt.monthlyRepayment
            });
          }
        });
        
        // Create budget with updated allocations
        const budgetWithAllocations = {
          ...budgetWithoutReason,
          allocations: updatedAllocations
        };
        
        const newBudget = await addBudget({
          ...budgetWithAllocations,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        savedBudgetId = newBudget.id;
        console.log('Budget created successfully with goal and debt allocations');
      }

      setIsEditing(false);
      setOverBudgetModalOpen(false);
      setOverBudgetReason("");
      setPendingBudgetData(null);
      setBudgetSaved(true);
      setTimeout(() => setBudgetSaved(false), 3000); // Hide saved message after 3 seconds

      // Show the view budget toast
      showViewBudgetToast(savedBudgetId);
    } catch (error: unknown) {
      console.error("Error:", error instanceof Error ? error.message : String(error));
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

  const handleTemplateSelect = (categories: string[]) => {
    // Clear current amounts and set up new categories
    const newAmounts: { [cat: string]: number } = {};
    categories.forEach(category => {
      newAmounts[category] = 0;
    });
    setAmounts(newAmounts);
  };

  const handleRemoveCustomCategory = async (sectionTitle: string, categoryName: string) => {
    try {
      await removeCustomCategoryFromStore(sectionTitle, categoryName);
      toast({
        title: "Success",
        description: `Custom category "${categoryName}" removed from "${sectionTitle}"!`,
      });
    } catch (error) {
      console.error('Error removing custom category:', error);
      toast({
        title: "Error",
        description: "Failed to remove custom category. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleOpenInfoModal = (category: string) => {
    setInfoModalCategory(category);
    setInfoModalOpen(true);
  };

  const showViewBudgetToast = (budgetId: string) => {
    toast({
      title: "Budget Saved!",
      description: "View budget?",
      action: (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              router.push(`/previous-budgets?budget=${budgetId}&view=breakdown`);
            }}
          >
            Yes
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              // Dismiss toast - no action needed
            }}
          >
            No
          </Button>
        </div>
      ),
    });
  };

  const handleAutoAllocate = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to use AI allocation!",
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

    if (!income || income <= 0) {
      toast({
        title: "Error",
        description: "Income must be greater than 0 to use AI allocation!",
        variant: "destructive",
      });
      return;
    }

    try {
      // Show loading state
      toast({
        title: "AI Allocation in Progress",
        description: "Generating personalized budget allocations...",
      });

      // Import the AI budget integration service
      const { aiBudgetIntegration } = await import('@/lib/services/ai-budget-integration');
      
      // Get user's AI analysis from Firebase
      const { AIService } = await import('@/lib/services/ai-service');
      const existingAnalysis = await AIService.getExistingAnalysis(user.uid);
      
      console.log('🔍 Existing analysis result:', existingAnalysis);
      console.log('📊 Has aiAnalysis field:', !!existingAnalysis?.aiAnalysis);
      console.log('📄 aiAnalysis content:', existingAnalysis?.aiAnalysis);
      
      if (!existingAnalysis) {
        // No analysis document exists - user needs to complete questionnaire
        toast({
          title: "AI Analysis Required",
          description: "Complete the AI questionnaire to get personalized budget allocations!",
          action: (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  toast({
                    title: "How to Access AI Assistant",
                    description: "Go to the main menu and click 'AI Budgeting Assistant' to complete the questionnaire.",
                  });
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Open AI Assistant
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  showFallbackAllocation();
                }}
              >
                Use Default Allocations
              </Button>
            </div>
          ),
        });
        return;
      }

      // Check if aiAnalysis is empty or incomplete
      if (!existingAnalysis.aiAnalysis || existingAnalysis.aiAnalysis.trim().length === 0) {
        // Analysis exists but is empty - regenerate it
        console.log('⚠️ Existing analysis is empty, regenerating...');
        
        try {
          // Update preferences first
          await AIService.updatePreferences(existingAnalysis.id, {
            preferences: existingAnalysis.preferences,
            updatedAt: new Date().toISOString()
          });
          
          // Generate new analysis using the stored preferences
          const response = await AIService.generateBudgetAnalysis(
            existingAnalysis.preferences, 
            income
          );
          
          if (response.success && response.data) {
            // Update the document with the new analysis
            await AIService.updatePreferences(existingAnalysis.id, {
              aiAnalysis: JSON.stringify(response.data),
              updatedAt: new Date().toISOString()
            });
            
            console.log('✅ New analysis generated and saved');
            
            // Use the new analysis for allocations
            const aiAnalysis = response.data;
            
            // Get budget allocations from AI analysis
            const allocations = aiBudgetIntegration.getBudgetAllocations(aiAnalysis);

            // Map allocations to user-specific debt names and goal titles
            const mappedAllocations = aiBudgetIntegration.mapAllocationsToUserCategories(
              allocations, 
              debts.filter(d => d.isActive), 
              goals.filter(g => g.isActive)
            );

            // Convert allocations to amounts format and store explanations
            const newAmounts: { [key: string]: number } = {};
            const newExplanations: { [key: string]: string } = {};
            
            mappedAllocations.forEach(alloc => {
              // If amount is 0, calculate it from percentage and income
              const amount = alloc.amount > 0 ? alloc.amount : (income * alloc.percentage / 100);
              newAmounts[alloc.category] = amount;
              newExplanations[alloc.category] = alloc.description;
            });

            // Update the amounts state and AI explanations
            setAmounts(newAmounts);
            setAiExplanations(newExplanations);
            setShowAiExplanations(true);

            toast({
              title: "Budget Auto-Allocated!",
              description: `AI has allocated £${mappedAllocations.reduce((sum, alloc) => {
                const amount = alloc.amount > 0 ? alloc.amount : (income * alloc.percentage / 100);
                return sum + amount;
              }, 0).toFixed(2)} across ${mappedAllocations.length} categories. Review and save when ready.`,
            });
            
            return;
          } else {
            throw new Error(response.error || 'Failed to generate analysis');
          }
        } catch (error) {
          console.error('Error regenerating analysis:', error);
          toast({
            title: "Analysis Generation Failed",
            description: "Failed to regenerate AI analysis. Please try completing the questionnaire again.",
            variant: "destructive",
          });
          return;
        }
      }

      // Parse the existing AI analysis
      const aiAnalysis = JSON.parse(existingAnalysis.aiAnalysis);
      
      // Get budget allocations from AI analysis
      const allocations = aiBudgetIntegration.getBudgetAllocations(aiAnalysis);

      // Map allocations to user-specific debt names and goal titles
      const mappedAllocations = aiBudgetIntegration.mapAllocationsToUserCategories(
        allocations, 
        debts.filter(d => d.isActive), 
        goals.filter(g => g.isActive)
      );

      // Convert allocations to amounts format and store explanations
      const newAmounts: { [key: string]: number } = {};
      const newExplanations: { [key: string]: string } = {};
      
      console.log('🔄 Processing mapped allocations (existing analysis):', mappedAllocations);
      
      mappedAllocations.forEach(alloc => {
        // If amount is 0, calculate it from percentage and income
        const amount = alloc.amount > 0 ? alloc.amount : (income * alloc.percentage / 100);
        newAmounts[alloc.category] = amount;
        newExplanations[alloc.category] = alloc.description;
        console.log(`💰 Setting ${alloc.category}: £${amount} (${alloc.percentage}%)`);
      });

      console.log('📊 Final newAmounts object (existing analysis):', newAmounts);
      console.log('📊 Final newExplanations object (existing analysis):', newExplanations);

      // Update the amounts state and AI explanations
      setAmounts(newAmounts);
      setAiExplanations(newExplanations);
      setShowAiExplanations(true);

      // Debug: Log the current amounts state after update
      console.log('🔍 Current amounts state after update (existing analysis):', newAmounts);
      console.log('🔍 Current AI explanations state after update (existing analysis):', newExplanations);

      toast({
        title: "Budget Auto-Allocated!",
        description: `AI has allocated £${mappedAllocations.reduce((sum, alloc) => {
          const amount = alloc.amount > 0 ? alloc.amount : (income * alloc.percentage / 100);
          return sum + amount;
        }, 0).toFixed(2)} across ${mappedAllocations.length} categories. Review and save when ready.`,
      });

    } catch (error: unknown) {
      console.error("Error auto-allocating budget:", error);
      toast({
        title: "Error",
        description: "Failed to auto-allocate budget. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Helper function to show fallback allocations when no AI analysis exists
  const showFallbackAllocation = () => {
    try {
      // Import the AI budget integration service for fallback
      import('@/lib/services/ai-budget-integration').then(({ aiBudgetIntegration }) => {
        // Create a minimal AI analysis object for fallback that matches AIAnalysisData interface
        const fallbackAnalysis = {
          summary: "Using standard budget allocation guidelines",
          priorities: [
            { 
              rank: 1, 
              category: "Emergency Fund", 
              reason: "Building financial safety net", 
              action: "Standard allocation" 
            }
          ],
          budgetDistribution: {
            emergencyFund: { percentage: 20, amount: income * 0.2, description: "Standard emergency fund allocation" },
            debtPayoff: { percentage: 0, amount: 0, description: "No debt to pay off" },
            essentialExpenses: { percentage: 50, amount: income * 0.5, description: "Standard essential expenses allocation" },
            savingsInvestments: { percentage: 20, amount: income * 0.2, description: "Standard savings allocation" },
            discretionarySpending: { percentage: 10, amount: income * 0.1, description: "Standard discretionary spending allocation" }
          },
          riskAssessment: {
            level: "Moderate",
            factors: ["Standard allocation", "Conservative approach"],
            mitigation: "Follow standard 50/30/20 rule"
          },
          timeline: {
            emergencyFund: "6 months",
            debtElimination: "N/A",
            investmentGrowth: "Long-term",
            retirementReadiness: "Long-term"
          },
          progressMetrics: ["Emergency fund building", "Regular savings"],
          recommendations: ["Complete AI questionnaire for personalized recommendations"],
          budgetAllocations: [],
          autoAllocationRules: [
            {
              category: "Emergency Fund",
              rule: "Allocate 20% of income until 6-month emergency fund is built",
              priority: 1
            },
            {
              category: "Essential Expenses",
              rule: "Allocate 50% of income to housing, transport, food, and utilities",
              priority: 2
            },
            {
              category: "Savings & Investments",
              rule: "Allocate 20% of income to savings and long-term goals",
              priority: 3
            },
            {
              category: "Discretionary Spending",
              rule: "Allocate 10% of income to entertainment and personal expenses",
              priority: 4
            }
          ]
        };

        // Generate fallback allocations
        const allocations = aiBudgetIntegration.getBudgetAllocations(fallbackAnalysis);
        
        // Map allocations to user-specific debt names and goal titles
        const mappedAllocations = aiBudgetIntegration.mapAllocationsToUserCategories(
          allocations, 
          debts.filter(d => d.isActive), 
          goals.filter(g => g.isActive)
        );
        
        // Convert allocations to amounts format and store explanations
        const newAmounts: { [key: string]: number } = {};
        const newExplanations: { [key: string]: string } = {};
        
        console.log('🔄 Processing fallback allocations:', mappedAllocations);
        
        mappedAllocations.forEach(alloc => {
          // If amount is 0, calculate it from percentage and income
          const amount = alloc.amount > 0 ? alloc.amount : (income * alloc.percentage / 100);
          newAmounts[alloc.category] = amount;
          newExplanations[alloc.category] = alloc.description;
          console.log(`💰 Setting fallback ${alloc.category}: £${amount} (${alloc.percentage}%)`);
        });

        console.log('📊 Final fallback newAmounts object:', newAmounts);
        console.log('📊 Final fallback newExplanations object:', newExplanations);

        // Update the amounts state and AI explanations
        setAmounts(newAmounts);
        setAiExplanations(newExplanations);
        setShowAiExplanations(true);

        // Debug: Log the current amounts state
        console.log('🔍 Current amounts state after fallback update:', newAmounts);
        console.log('🔍 Current AI explanations state after fallback update:', newExplanations);

        toast({
          title: "Default Allocations Applied",
          description: `Standard budget allocations applied. Review and save when ready. Complete the AI questionnaire for personalized recommendations!`,
        });
      });
    } catch (error) {
      console.error("Error applying fallback allocations:", error);
      toast({
        title: "Error",
        description: "Failed to apply default allocations. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto space-y-4 sm:space-y-8"
      >
        {/* Budget Setup */}
        <motion.div variants={itemVariants}>
          <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
            <CardContent className="p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-6">
                {/* Step 1: Month Selection */}
                <div className="space-y-3">
                  <Label className="text-sm sm:text-base font-semibold">Step 1: Select Month</Label>
                  <Select value={selectedMonth || ""} onValueChange={handleMonthChange}>
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

                {/* Step 1.5: AI Auto Allocate */}
                {selectedMonth && (
                  <div className="space-y-3">
                    <Label className="text-sm sm:text-base font-semibold">Step 1.5: AI Auto Allocate (Optional)</Label>
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Brain className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-blue-800 text-sm sm:text-base">AI Budgeting Assistant</span>
                            <Badge variant="secondary" className="text-xs">Recommended</Badge>
                          </div>
                                           <p className="text-xs sm:text-sm text-blue-700 mb-3">
                   Get personalized budget allocations based on your financial situation, goals, and preferences. 
                   Review the allocations and save when ready.
                 </p>
                 <Button
                   onClick={handleAutoAllocate}
                   disabled={!income || income <= 0}
                   className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 hover:from-blue-600 hover:to-purple-700 text-xs sm:text-sm"
                 >
                   <Brain className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                   AI Auto Allocate
                 </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 1.6: Template Selection */}
                {selectedMonth && (
                  <div className="space-y-3">
                    <Label className="text-sm sm:text-base font-semibold">Step 1.6: Load Template (Optional)</Label>
                    <TemplateSelector onTemplateSelect={handleTemplateSelect} />
                  </div>
                )}

                {/* Step 2: Budget Status & Actions */}
                {selectedMonth && (
                  <div className="space-y-4">
                    <Label className="text-sm sm:text-base font-semibold">Step 2: Budget Status</Label>
                    
                    {currentBudget ? (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                          <span className="font-medium text-blue-800 text-sm sm:text-base">Budget Exists for {selectedMonth}</span>
                        </div>
                        
                        {/* Budget Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-4">
                          <div className="bg-white/50 p-3 rounded">
                            <div className="text-xs text-blue-600 font-medium">Total Allocated</div>
                            <div className="text-base sm:text-lg font-bold text-blue-800">
                              £{getBudgetTotal(currentBudget.allocations).toFixed(2)}
                            </div>
                          </div>
                          <div className="bg-white/50 p-3 rounded">
                            <div className="text-xs text-blue-600 font-medium">Remaining</div>
                            <div className={`text-base sm:text-lg font-bold ${
                              getBudgetRemaining(currentBudget.allocations, currentBudget.income) >= 0 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              £{getBudgetRemaining(currentBudget.allocations, currentBudget.income).toFixed(2)}
                            </div>
                          </div>
                          <div className="bg-white/50 p-3 rounded">
                            <div className="text-xs text-blue-600 font-medium">Categories</div>
                            <div className="text-base sm:text-lg font-bold text-blue-800">
                              {currentBudget.allocations.length}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            onClick={handleEditBudget}
                            variant="outline"
                            size="sm"
                            className="bg-blue-600 text-black hover:bg-blue-700 text-xs sm:text-sm"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Edit Existing Budget
                          </Button>
                          <Button
                            onClick={handleCreateNew}
                            variant="outline"
                            size="sm"
                            className="text-xs sm:text-sm"
                          >
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Create New Budget
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                          <span className="font-medium text-green-800 text-sm sm:text-base">No Budget for {selectedMonth}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-green-700 mb-3">
                          You can create a new budget or load from a previous month
                        </p>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleCreateNew}
                            size="sm"
                            className="bg-green-600 text-white hover:bg-green-700 text-xs sm:text-sm"
                          >
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
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
                    <Label className="text-sm sm:text-base font-semibold">Step 3: Load Previous Budget (Optional)</Label>
                    
                    {previousBudget && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                          <span className="font-medium text-amber-800 text-sm sm:text-base">Previous Budget Available</span>
                        </div>
                        <p className="text-xs sm:text-sm text-amber-700 mb-3">
                          Load allocations from {previousBudget.month} to pre-fill this budget
                        </p>
                        <Button
                          onClick={handleResetToPrevious}
                          variant="outline"
                          size="sm"
                          className="border-amber-300 text-amber-700 hover:bg-amber-100 text-xs sm:text-sm"
                        >
                          <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
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
              </div>
            </CardContent>
          </Card>
        </motion.div>

       {/* Budget Summary */}
       <motion.div variants={itemVariants} className="mb-8">
         <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
           <CardContent className="p-3 sm:p-6">
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
               <div className="space-y-2">
                 <div className="flex items-center gap-2 text-muted-foreground">
                   <DollarSign className="h-4 w-4" />
                   <span className="text-xs sm:text-sm">Monthly Income</span>
                 </div>
                 <div className="text-lg sm:text-xl lg:text-2xl font-bold">£{income.toFixed(2)}</div>
               </div>

               <div className="space-y-2">
                 <div className="flex items-center gap-2 text-muted-foreground">
                   <Target className="h-4 w-4" />
                   <span className="text-xs sm:text-sm">Allocated</span>
                 </div>
                 <div className="text-lg sm:text-xl lg:text-2xl font-bold">£{totalAllocated.toFixed(2)}</div>
                 <Progress value={allocationPercentage} className="h-2" />
                 <div className="text-xs text-muted-foreground">
                   {allocationPercentage.toFixed(1)}% of income
                 </div>
               </div>

               <div className="space-y-2">
                 <div className="flex items-center gap-2 text-muted-foreground">
                   {getStatusIcon(remaining)}
                   <span className="text-xs sm:text-sm">Remaining</span>
                   <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => setShowRemaining(!showRemaining)}
                     className="h-4 w-4 p-0"
                   >
                     {showRemaining ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                   </Button>
                 </div>
                 <div className={cn("text-lg sm:text-xl lg:text-2xl font-bold", getStatusColor(remaining))}>
                   {showRemaining ? `£${isZero(remaining) ? "0.00" : remaining.toFixed(2)}` : "••••"}
                 </div>
               </div>

               <div className="space-y-2">
                 <div className="flex items-center gap-2 text-muted-foreground">
                   <Calculator className="h-4 w-4" />
                   <span className="text-xs sm:text-sm">Status</span>
                 </div>
                 <Badge 
                   variant={isZero(remaining) ? "default" : remaining > 0 ? "secondary" : "destructive"}
                   className="text-xs"
                 >
                   {isZero(remaining) ? "Balanced" : remaining > 0 ? "Under Budget" : "Over Budget"}
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
                                <CardTitle className="flex items-center gap-2 text-green-700 text-sm sm:text-base lg:text-lg">
                   <Target className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                   Goal Allocations
                 </CardTitle>
             </CardHeader>
             <CardContent className="space-y-3">
               {goals.filter(g => g.isActive).map(goal => (
                 <div key={goal.id} className="flex justify-between items-center p-2 bg-white/50 rounded">
                   <div className="flex items-center gap-2">
                     <Target className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                     <span className="font-medium text-xs sm:text-sm lg:text-base">{goal.title}</span>
                   </div>
                   <div className="text-right">
                     <div className="font-semibold text-green-700 text-xs sm:text-sm lg:text-base">
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
               <div className="flex items-center justify-between">
                 <CardTitle className="flex items-center gap-2 text-red-700 text-sm sm:text-base lg:text-lg">
                   <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                   Debt Allocations
                 </CardTitle>
                 <Button
                   type="button"
                   variant="ghost"
                   size="sm"
                   onClick={() => handleOpenInfoModal("Debts")}
                   className="h-4 w-4 p-0 text-muted-foreground hover:text-primary"
                 >
                   <HelpCircle className="h-3 w-3" />
                 </Button>
               </div>
             </CardHeader>
             <CardContent className="space-y-3">
               {debts.filter(d => d.isActive).map(debt => (
                 <div key={debt.id} className="flex justify-between items-center p-2 bg-white/50 rounded">
                   <div className="flex items-center gap-2">
                     <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                     <span className="font-medium text-xs sm:text-sm lg:text-base">{debt.name}</span>
                   </div>
                   <div className="text-right">
                     <div className="font-semibold text-red-700 text-xs sm:text-sm lg:text-base">
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
             <TabsTrigger value="categories" className="text-xs sm:text-sm">Budget Categories</TabsTrigger>
             <TabsTrigger value="summary" className="text-xs sm:text-sm">Budget Summary</TabsTrigger>
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
                              "text-sm sm:text-base lg:text-lg",
                              section.title === "Goals" && "text-green-700",
                              section.title === "Debts" && "text-red-700"
                            )}>{section.title}</CardTitle>
                            {section.title === "Savings" && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenInfoModal("Savings")}
                                className="h-4 w-4 p-0 text-muted-foreground hover:text-primary"
                              >
                                <HelpCircle className="h-3 w-3" />
                              </Button>
                            )}
                            {section.title === "Debts" && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenInfoModal("Debts")}
                                className="h-4 w-4 p-0 text-muted-foreground hover:text-primary"
                              >
                                <HelpCircle className="h-3 w-3" />
                              </Button>
                            )}
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
                        {/* Custom Category Manager - moved to top of section */}
                        <CustomCategoryManager 
                          section={section.title} 
                          title="Custom Categories" 
                        />
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
               {userCategories.map((cat) => {
                 // Check if this is a goal category
                 const isGoalCategory = section.title === "Goals";
                 const isDebtCategory = section.title === "Debts";
                 const goal = goals.find(g => g.title === cat);
                 const debt = debts.find(d => d.name === cat);
                 const isEditable = false; // Removed editableGoals state
                 
                 return (
                   <div key={cat} className="space-y-2">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                                                <Label className="text-xs sm:text-sm font-medium truncate">
                         {cat}
                       </Label>
                         {(cat === "Safety Net" || cat === "Foundation" || cat === "Emergency Fund" || cat === "Investments") && (
                           <Button
                             type="button"
                             variant="ghost"
                             size="sm"
                             onClick={() => handleOpenInfoModal(cat)}
                             className="h-4 w-4 p-0 text-muted-foreground hover:text-primary"
                           >
                             <HelpCircle className="h-3 w-3" />
                           </Button>
                         )}
                       </div>
                       <div className="flex items-center gap-1">
                         {isGoalCategory && goal && (
                           <Badge variant="outline" className="text-xs">
                             Goal
                           </Badge>
                         )}
                         {isDebtCategory && debt && (
                           <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                             Debt
                           </Badge>
                         )}
                         {/* Remove button for custom categories */}
                         {custom.includes(cat) && (
                           <Button
                             type="button"
                             variant="ghost"
                             size="sm"
                             onClick={() => handleRemoveCustomCategory(section.title, cat)}
                             className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                           >
                             <X className="h-3 w-3" />
                           </Button>
                         )}
                       </div>
                     </div>
                     <div className="relative">
                       <Input
                         type="number"
                         value={amounts[cat] ?? ""}
                         onChange={(e) => handleAmountChange(cat, e.target.value)}
                         className={cn(
                           "pr-8 text-sm sm:text-base",
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
                                                                   <Label className="text-xs sm:text-sm font-medium text-destructive truncate">
                                   {debt.name}
                                 </Label>
                                  <Badge variant="destructive" className="text-xs">Debt</Badge>
                                </div>
                                <div className="relative">
                                  <Input
                      type="number"
                      value={amounts[debt.name]?.toFixed(2) ?? "0.00"}
                      readOnly
                                 className="bg-destructive/10 border-destructive/30 text-destructive cursor-not-allowed pr-8 text-sm sm:text-base"
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
                 <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg">
                   <Calculator className="h-4 w-4 sm:h-5 sm:w-5" />
                   Budget Overview
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-6">
                 {/* Summary Stats */}
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                   <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                     <p className="text-xs text-muted-foreground">Total Allocated</p>
                     <p className="text-sm sm:text-lg font-bold text-blue-700">£{totalAllocated.toFixed(2)}</p>
                   </div>
                   <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg">
                     <p className="text-xs text-muted-foreground">Goal Allocations</p>
                     <p className="text-sm sm:text-lg font-bold text-green-700">
                       £{goals.filter(g => g.isActive).reduce((sum, goal) => sum + (amounts[goal.title] || 0), 0).toFixed(2)}
                     </p>
                   </div>
                   {debts.filter(d => d.isActive).length > 0 && (
                     <div className="text-center p-2 sm:p-3 bg-red-50 rounded-lg">
                       <p className="text-xs text-muted-foreground">Debt Allocations</p>
                       <p className="text-sm sm:text-lg font-bold text-red-700">
                         £{debts.filter(d => d.isActive).reduce((sum, debt) => sum + (amounts[debt.name] || 0), 0).toFixed(2)}
                       </p>
                     </div>
                   )}
                   <div className={cn(
                     "text-center p-2 sm:p-3 rounded-lg",
                     debts.filter(d => d.isActive).length > 0 ? "bg-amber-50" : "bg-amber-50 col-span-2"
                   )}>
                     <p className="text-xs text-muted-foreground">Remaining</p>
                     <p className="text-sm sm:text-lg font-bold text-amber-700">£{remaining.toFixed(2)}</p>
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
                   isZero(remaining) ? 'bg-green-50 border border-green-200' :
                   remaining > 0 ? 'bg-amber-50 border border-amber-200' :
                   'bg-red-50 border border-red-200'
                 }`}>
                   {getStatusIcon(remaining)}
                   <span className={`font-medium ${
                     isZero(remaining) ? 'text-green-700' :
                     remaining > 0 ? 'text-amber-700' :
                     'text-red-700'
                   }`}>
                     {isZero(remaining) ? 'Perfect allocation!' :
                      remaining > 0 ? `${remaining.toFixed(2)} remaining to allocate` :
                      `${Math.abs(remaining).toFixed(2)} over budget`}
                   </span>
                 </div>
               </CardContent>
             </Card>

             {/* Budget Breakdown Card */}
             <Card>
               <CardHeader>
                 <div className="flex items-center justify-between">
                   <CardTitle className="flex items-center gap-2">
                     <Target className="h-5 w-5" />
                     Budget Breakdown
                   </CardTitle>
                   {Object.keys(aiExplanations).length > 0 && (
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => setShowAiExplanations(!showAiExplanations)}
                       className="text-xs"
                     >
                       <Brain className="h-3 w-3 mr-1" />
                       {showAiExplanations ? 'Hide AI Explanations' : 'Show AI Explanations'}
                     </Button>
                   )}
                 </div>
               </CardHeader>
               <CardContent className="space-y-4">
                 {Object.entries(amounts)
                   .filter(([, amount]) => amount > 0)
                   .sort(([, a], [, b]) => b - a)
                   .map(([category, amount]) => {
                     const percentage = income > 0 ? (amount / income) * 100 : 0;
                     const isDebt = debts.some(d => d.name === category);
                     const isGoal = goals.some(g => g.title === category && g.isActive);
                     const aiExplanation = aiExplanations[category];
                     
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
                         {showAiExplanations && aiExplanation && (
                           <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg">
                             <div className="flex items-start gap-2">
                               <Brain className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                               <div className="text-sm">
                                 <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">AI Reasoning:</p>
                                 <p className="text-blue-700 dark:text-blue-300 text-xs leading-relaxed">{aiExplanation}</p>
                               </div>
                             </div>
                           </div>
                         )}
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
      <motion.div variants={itemVariants} className="mt-6 sm:mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
          <Button
            onClick={() => setSaveTemplateModalOpen(true)}
            variant="outline"
            disabled={Object.keys(amounts).length === 0}
            className="text-xs sm:text-sm"
          >
            <Bookmark className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Save as Template
          </Button>
          <Button
            onClick={handleResetToPrevious}
            variant="outline"
            disabled={!previousBudget}
            className="text-xs sm:text-sm"
          >
            <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Reset to Previous
          </Button>
        </div>
        
        {/* Save Budget Button */}
        <div className="flex justify-end">
          <div className="flex flex-col items-end gap-1">
            <Button
              onClick={handleSaveBudget}
              disabled={!selectedMonth || (!!currentBudget && !isEditing) || budgetSaved || remaining > 0}
              className={cn(
                "bg-primary hover:bg-primary/90 text-xs sm:text-sm",
                remaining < 0 && !isZero(remaining) && "bg-amber-600 hover:bg-amber-700",
                budgetSaved && "bg-green-600 hover:bg-green-700 cursor-not-allowed"
              )}
            >
              <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {budgetSaved ? "Budget Saved" : 
               remaining > 0 ? "Allocate Remaining £" + remaining.toFixed(2) :
               (currentBudget && isEditing ? "Update Budget" : "Save Budget")}
            </Button>
            <p className="text-xs text-muted-foreground">
              {totalAllocated > 0 ? `£${totalAllocated.toFixed(2)} allocated` : "No allocations"}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Save Template Modal */}
      <SaveTemplateModal
        open={saveTemplateModalOpen}
        onClose={() => setSaveTemplateModalOpen(false)}
        currentAllocations={allocationsArray}
      />

      {/* Over Budget Modal */}
      <Dialog open={overBudgetModalOpen} onOpenChange={setOverBudgetModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Over Budget Warning
            </DialogTitle>
            <DialogDescription>
              You are over budget by £{Math.abs(remaining).toFixed(2)}. Please provide a reason (optional) and confirm you want to proceed.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="over-budget-reason">Reason for going over budget (optional)</Label>
              <Textarea
                id="over-budget-reason"
                value={overBudgetReason}
                onChange={(e) => setOverBudgetReason(e.target.value)}
                placeholder="e.g., Unexpected car repair, medical expenses..."
                className="min-h-[80px]"
              />
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                <strong>Warning:</strong> Going over budget may impact your financial goals. 
                Are you sure you want to proceed with this budget?
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverBudgetModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => pendingBudgetData && saveBudgetData(pendingBudgetData)}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Yes, Save Budget
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Info Modal */}
      <InfoModal
        open={infoModalOpen}
        category={infoModalCategory}
        onClose={() => setInfoModalOpen(false)}
      />
    </motion.div>
    </div>
  );
}
