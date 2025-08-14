import { AIQuestion } from '@/lib/types/ai';
import { 
  Brain, 
  Target, 
  Shield, 
  CreditCard, 
  PiggyBank, 
  Home, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  Calendar, 
  Heart, 
  GraduationCap,
  Users,
  Car,
  Stethoscope,
  ShoppingBag,
  Building2,
  Umbrella,
  FileText,
  Briefcase,
  Zap,
  Calculator,
  CheckCircle,
  Plane,
  Gift,
  Gamepad2,
  BookOpen,
  Dumbbell,
  Coffee,
  Wifi,
  Phone,
  UtensilsCrossed
} from 'lucide-react';

export const AI_QUESTIONS: AIQuestion[] = [
  {
    id: 'welcome',
    title: 'Welcome to AI Budgeting Assistant',
    description: 'I\'ll analyze your financial situation and create a personalized budget allocation strategy based on proven financial research.',
    type: 'welcome',
    icon: Brain,
    required: false
  },
  {
    id: 'age',
    title: 'What is your age?',
    description: 'This helps determine appropriate investment strategies and risk tolerance.',
    type: 'number',
    icon: Users,
    min: 18,
    max: 100,
    step: 1,
    placeholder: 'e.g., 30',
    required: true
  },
  {
    id: 'familySize',
    title: 'How many people are in your household?',
    description: 'This affects budget allocations for housing, food, and other family expenses.',
    type: 'number',
    icon: Users,
    min: 1,
    max: 10,
    step: 1,
    placeholder: 'e.g., 3',
    required: true
  },
  {
    id: 'employmentStatus',
    title: 'What is your employment status?',
    description: 'This affects income stability and insurance needs.',
    type: 'radio',
    icon: Briefcase,
    required: true,
    options: [
      { value: 'full-time', label: 'Full-time Employee', description: 'Stable income with benefits', icon: Briefcase },
      { value: 'part-time', label: 'Part-time Employee', description: 'Variable income', icon: Calendar },
      { value: 'self-employed', label: 'Self-employed', description: 'Variable income, need to save for taxes', icon: Target },
      { value: 'contractor', label: 'Contractor/Freelancer', description: 'Variable income, no benefits', icon: FileText },
      { value: 'unemployed', label: 'Currently Unemployed', description: 'Focus on emergency fund', icon: AlertTriangle }
    ]
  },
  {
    id: 'housingCosts',
    title: 'What are your monthly housing costs?',
    description: 'Include rent/mortgage, utilities, insurance, and maintenance.',
    type: 'radio',
    icon: Home,
    required: true,
    options: [
      { value: 'low', label: 'Low (<30% of income)', description: 'Affordable housing costs', icon: Home },
      { value: 'medium', label: 'Medium (30-40% of income)', description: 'Standard housing costs', icon: Home },
      { value: 'high', label: 'High (>40% of income)', description: 'Expensive housing costs', icon: Home }
    ]
  },
  {
    id: 'transportationCosts',
    title: 'What are your monthly transportation costs?',
    description: 'Include car payment, gas, insurance, maintenance, and public transit.',
    type: 'radio',
    icon: Car,
    required: true,
    options: [
      { value: 'low', label: 'Low (<10% of income)', description: 'Minimal transport costs', icon: Car },
      { value: 'medium', label: 'Medium (10-15% of income)', description: 'Standard transport costs', icon: Car },
      { value: 'high', label: 'High (>15% of income)', description: 'High transport costs', icon: Car }
    ]
  },
  {
    id: 'healthcareCosts',
    title: 'What are your monthly healthcare costs?',
    description: 'Include insurance premiums, copays, medications, and medical expenses.',
    type: 'radio',
    icon: Stethoscope,
    required: true,
    options: [
      { value: 'low', label: 'Low (<5% of income)', description: 'Minimal healthcare costs', icon: Stethoscope },
      { value: 'medium', label: 'Medium (5-10% of income)', description: 'Standard healthcare costs', icon: Stethoscope },
      { value: 'high', label: 'High (>10% of income)', description: 'High healthcare costs', icon: Stethoscope }
    ]
  },
  {
    id: 'foodAndGroceries',
    title: 'What are your monthly food and grocery costs?',
    description: 'Include groceries, dining out, and food delivery.',
    type: 'radio',
    icon: UtensilsCrossed,
    required: true,
    options: [
      { value: 'low', label: 'Low (<10% of income)', description: 'Budget-conscious food spending', icon: UtensilsCrossed },
      { value: 'medium', label: 'Medium (10-15% of income)', description: 'Balanced food spending', icon: UtensilsCrossed },
      { value: 'high', label: 'High (>15% of income)', description: 'Premium food and dining', icon: UtensilsCrossed }
    ]
  },
  {
    id: 'entertainmentAndHobbies',
    title: 'What are your monthly entertainment and hobby costs?',
    description: 'Include streaming services, hobbies, gym memberships, and leisure activities.',
    type: 'radio',
    icon: Gamepad2,
    required: true,
    options: [
      { value: 'low', label: 'Low (<5% of income)', description: 'Minimal entertainment spending', icon: Gamepad2 },
      { value: 'medium', label: 'Medium (5-10% of income)', description: 'Moderate entertainment', icon: Gamepad2 },
      { value: 'high', label: 'High (>10% of income)', description: 'Premium entertainment', icon: Gamepad2 }
    ]
  },
  {
    id: 'currentSavings',
    title: 'How much do you currently have in savings?',
    description: 'Include all liquid savings accounts and emergency funds.',
    type: 'radio',
    icon: PiggyBank,
    required: true,
    options: [
      { value: 'none', label: 'No savings', description: 'Starting from zero', icon: AlertTriangle },
      { value: 'low', label: 'Low (<1 month expenses)', description: 'Less than 1 month of expenses', icon: Shield },
      { value: 'medium', label: 'Medium (1-3 months)', description: '1-3 months of expenses', icon: Target },
      { value: 'high', label: 'High (>3 months)', description: 'More than 3 months of expenses', icon: PiggyBank }
    ]
  },
  {
    id: 'emergencyFund',
    title: 'How much do you currently have in emergency savings?',
    description: 'This determines if emergency fund building should be prioritized.',
    type: 'radio',
    icon: Shield,
    required: true,
    options: [
      { value: 'none', label: 'No emergency fund', description: 'Need to build from scratch', icon: AlertTriangle },
      { value: 'partial', label: 'Partial emergency fund', description: 'Some emergency savings', icon: Shield },
      { value: 'complete', label: 'Complete emergency fund', description: '6+ months of expenses', icon: CheckCircle }
    ]
  },
  {
    id: 'debtAmount',
    title: 'What is your total high-interest debt (credit cards, personal loans)?',
    description: 'This helps prioritize debt payoff vs. other financial goals.',
    type: 'radio',
    icon: CreditCard,
    required: true,
    options: [
      { value: 'none', label: 'No high-interest debt', description: 'Debt-free or only low-interest debt', icon: CheckCircle },
      { value: 'low', label: 'Low debt (<20% of income)', description: 'Manageable debt level', icon: CreditCard },
      { value: 'medium', label: 'Medium debt (20-50% of income)', description: 'Significant debt to address', icon: AlertTriangle },
      { value: 'high', label: 'High debt (>50% of income)', description: 'High debt requiring immediate attention', icon: AlertTriangle }
    ]
  },
  {
    id: 'debtTypes',
    title: 'What types of debt do you have?',
    description: 'Select all that apply to understand your debt situation.',
    type: 'checkbox',
    icon: CreditCard,
    required: true,
    options: [
      { value: 'credit-cards', label: 'Credit Cards', description: 'High-interest revolving debt', icon: CreditCard },
      { value: 'personal-loans', label: 'Personal Loans', description: 'Unsecured personal debt', icon: FileText },
      { value: 'student-loans', label: 'Student Loans', description: 'Education-related debt', icon: GraduationCap },
      { value: 'car-loans', label: 'Car Loans', description: 'Vehicle financing', icon: Car },
      { value: 'mortgage', label: 'Mortgage', description: 'Home financing', icon: Home },
      { value: 'none', label: 'No Debt', description: 'Debt-free', icon: CheckCircle }
    ]
  },
  {
    id: 'investmentExperience',
    title: 'What is your experience level with investments?',
    description: 'This affects how much to allocate to investment vs. safer options.',
    type: 'radio',
    icon: TrendingUp,
    required: true,
    options: [
      { value: 'beginner', label: 'Beginner', description: 'New to investing, prefer simple options', icon: Shield },
      { value: 'intermediate', label: 'Intermediate', description: 'Some experience, comfortable with risk', icon: Target },
      { value: 'advanced', label: 'Advanced', description: 'Experienced investor, comfortable with complex strategies', icon: Zap }
    ]
  },
  {
    id: 'timeHorizon',
    title: 'What is your primary investment time horizon?',
    description: 'This affects the balance between growth and stability.',
    type: 'radio',
    icon: Calendar,
    required: true,
    options: [
      { value: 'short', label: '1-3 years', description: 'Short-term goals, conservative approach', icon: Shield },
      { value: 'medium', label: '3-10 years', description: 'Medium-term goals, balanced approach', icon: Target },
      { value: 'long', label: '10+ years', description: 'Long-term goals, growth-focused approach', icon: TrendingUp }
    ]
  },
  {
    id: 'primaryGoal',
    title: 'What is your primary financial goal?',
    description: 'This determines your core budget allocation strategy and savings priorities.',
    type: 'radio',
    icon: Target,
    required: true,
    options: [
      { value: 'emergency-fund', label: 'Build Emergency Fund', description: 'Focus on 3-6 months of expenses', icon: Shield },
      { value: 'debt-payoff', label: 'Pay Off High-Interest Debt', description: 'Prioritize debt elimination', icon: CreditCard },
      { value: 'retirement', label: 'Save for Retirement', description: 'Long-term wealth building', icon: PiggyBank },
      { value: 'home-purchase', label: 'Save for Home Purchase', description: 'Down payment and closing costs', icon: Home },
      { value: 'investment', label: 'Build Investment Portfolio', description: 'Grow wealth through investments', icon: TrendingUp },
      { value: 'other', label: 'Other', description: 'Specify your primary financial goal', icon: Target }
    ]
  },
  {
    id: 'primaryGoalOther',
    title: 'Please specify your primary financial goal',
    description: 'Describe your specific primary financial goal in detail.',
    type: 'textarea',
    icon: Target,
    placeholder: 'e.g., Start a business, Travel the world, Pay for children\'s education...',
    rows: 3,
    required: false
  },
  {
    id: 'secondaryGoals',
    title: 'What are your secondary financial goals?',
    description: 'Select all that apply to understand your complete financial picture.',
    type: 'checkbox',
    icon: Target,
    required: true,
    options: [
      { value: 'vacation', label: 'Vacation Fund', description: 'Save for travel and experiences', icon: Plane },
      { value: 'education', label: 'Education Fund', description: 'Save for courses or certifications', icon: BookOpen },
      { value: 'wedding', label: 'Wedding Fund', description: 'Save for wedding expenses', icon: Gift },
      { value: 'business', label: 'Business Fund', description: 'Start or expand a business', icon: Building2 },
      { value: 'car', label: 'Car Fund', description: 'Save for vehicle purchase or upgrade', icon: Car },
      { value: 'home-improvement', label: 'Home Improvement', description: 'Renovations and repairs', icon: Home },
      { value: 'children', label: 'Children\'s Fund', description: 'Save for children\'s future needs', icon: Users },
      { value: 'charity', label: 'Charitable Giving', description: 'Support causes you care about', icon: Heart },
      { value: 'hobbies', label: 'Hobby Fund', description: 'Invest in your interests and passions', icon: Gamepad2 },
      { value: 'technology', label: 'Technology Fund', description: 'Save for gadgets and tech upgrades', icon: Zap },
      { value: 'other', label: 'Other', description: 'Specify additional secondary goals', icon: Target }
    ]
  },
  {
    id: 'secondaryGoalsOther',
    title: 'Please specify your other secondary financial goals',
    description: 'Describe any additional secondary financial goals not listed above.',
    type: 'textarea',
    icon: Target,
    placeholder: 'e.g., Pet care fund, Sports equipment, Collectibles...',
    rows: 3,
    required: false
  },
  {
    id: 'riskTolerance',
    title: 'What is your risk tolerance level?',
    description: 'This affects how much to allocate to savings vs. investments vs. debt payoff.',
    type: 'slider',
    icon: AlertTriangle,
    min: 1,
    max: 10,
    step: 1,
    labels: ['Conservative', 'Moderate', 'Aggressive'],
    required: true
  },
  {
    id: 'savingsPriority',
    title: 'Which savings category is most important to you right now?',
    description: 'This helps determine the order of budget allocations.',
    type: 'radio',
    icon: PiggyBank,
    required: true,
    options: [
      { value: 'emergency', label: 'Emergency Fund', description: 'Financial safety net', icon: Shield },
      { value: 'short-term', label: 'Short-term Goals', description: 'Vacations, car repairs, etc.', icon: Calendar },
      { value: 'long-term', label: 'Long-term Goals', description: 'Retirement, children\'s education', icon: GraduationCap },
      { value: 'investment', label: 'Investment Growth', description: 'Building wealth over time', icon: TrendingUp }
    ]
  },
  {
    id: 'lifestylePreferences',
    title: 'What lifestyle factors affect your budget?',
    description: 'Consider housing preferences, transportation choices, family activities, hobbies, etc.',
    type: 'radio',
    icon: Heart,
    required: true,
    options: [
      { value: 'minimalist', label: 'Minimalist', description: 'Simple lifestyle, focus on essentials', icon: Shield },
      { value: 'balanced', label: 'Balanced', description: 'Mix of essentials and some luxuries', icon: Target },
      { value: 'luxury', label: 'Luxury-oriented', description: 'Premium lifestyle, willing to spend more', icon: Heart }
    ]
  },
  {
    id: 'financialStressors',
    title: 'What financial concerns keep you up at night?',
    description: 'This helps identify areas that need immediate attention in your budget.',
    type: 'checkbox',
    icon: AlertTriangle,
    required: true,
    options: [
      { value: 'debt', label: 'High debt levels', description: 'Worried about debt and interest payments', icon: CreditCard },
      { value: 'emergency', label: 'No emergency fund', description: 'Concerned about unexpected expenses', icon: AlertTriangle },
      { value: 'retirement', label: 'Retirement savings', description: 'Worried about long-term financial security', icon: PiggyBank },
      { value: 'income', label: 'Income stability', description: 'Concerned about job security or income', icon: DollarSign },
      { value: 'none', label: 'No major concerns', description: 'Financially stable and confident', icon: CheckCircle }
    ]
  }
];
