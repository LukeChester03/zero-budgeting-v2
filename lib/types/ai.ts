import { z } from 'zod';

// Zod validation schemas
export const AIPreferencesSchema = z.object({
  primaryGoal: z.string().min(1, "Primary goal is required"),
  primaryGoalOther: z.string().optional(),
  secondaryGoals: z.array(z.string()).min(1, "At least one secondary goal is required"),
  secondaryGoalsOther: z.string().optional(),
  riskTolerance: z.number().min(1).max(10),
  emergencyFund: z.string().min(1, "Emergency fund amount is required"),
  debtAmount: z.string().min(1, "Debt amount is required"),
  debtTypes: z.array(z.string()).min(1, "At least one debt type is required"),
  savingsPriority: z.string().min(1, "Savings priority is required"),
  investmentExperience: z.string().min(1, "Investment experience is required"),
  timeHorizon: z.string().min(1, "Time horizon is required"),
  lifestylePreferences: z.string().min(1, "Lifestyle preferences is required"),
  financialStressors: z.array(z.string()).min(1, "At least one financial stressor is required"),
  age: z.number().min(18).max(100),
  familySize: z.number().min(1).max(10),
  housingCosts: z.string().min(1, "Housing costs is required"),
  transportationCosts: z.string().min(1, "Transportation costs is required"),
  healthcareCosts: z.string().min(1, "Healthcare costs is required"),
  foodAndGroceries: z.string().min(1, "Food and grocery costs is required"),
  entertainmentAndHobbies: z.string().min(1, "Entertainment and hobby costs is required"),
  currentSavings: z.string().min(1, "Current savings is required"),
  employmentStatus: z.string().min(1, "Employment status is required")
});

export type AIPreferences = z.infer<typeof AIPreferencesSchema>;

export interface StoredAIPreferences {
  id: string;
  userId: string;
  preferences: AIPreferences;
  aiAnalysis: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIAnalysisData {
  summary: string;
  priorities: Array<{
    rank: number;
    category: string;
    reason: string;
    action: string;
  }>;
  budgetDistribution: {
    emergencyFund: { percentage: number; amount: number; description: string };
    debtPayoff: { percentage: number; amount: number; description: string };
    essentialExpenses: { percentage: number; amount: number; description: string };
    savingsInvestments: { percentage: number; amount: number; description: string };
    discretionarySpending: { percentage: number; amount: number; description: string };
  };
  riskAssessment: {
    level: string;
    factors: string[];
    mitigation: string;
  };
  timeline: {
    emergencyFund: string;
    debtElimination: string;
    investmentGrowth: string;
    retirementReadiness: string;
  };
  progressMetrics: string[];
  recommendations: string[];
  autoAllocationRules: Array<{
    category: string;
    rule: string;
    priority: number;
  }>;
  // Budget allocation integration
  budgetAllocations: Array<{
    category: string;
    amount: number;
    percentage: number;
    priority: number;
    description: string;
  }>;
}

export interface AIQuestion {
  id: string;
  title: string;
  description: string;
  type: 'welcome' | 'radio' | 'checkbox' | 'slider' | 'text' | 'textarea' | 'number';
  icon: any;
  options?: Array<{
    value: string;
    label: string;
    description: string;
    icon: any;
  }>;
  min?: number;
  max?: number;
  step?: number;
  labels?: string[];
  placeholder?: string;
  validation?: string;
  rows?: number;
  required?: boolean;
  autoPopulate?: boolean; // For fields that should auto-populate from existing data
}

export interface AIAnalysisRequest {
  preferences: AIPreferences;
  monthlyIncome: number; // This will come from Firebase
}

export interface AIAnalysisResponse {
  success: boolean;
  data?: AIAnalysisData;
  error?: string;
}
