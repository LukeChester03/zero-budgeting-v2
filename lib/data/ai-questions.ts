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
  Building2,
  FileText,
  Briefcase,
  Zap,
  CheckCircle,
  Plane,
  Gift,
  Gamepad2,
  BookOpen,
  UtensilsCrossed,
  Wifi,
  Phone,
  Droplets,
  Lightbulb,
  Bus,
  Train,
  Bike,
  ShoppingBag,
  Coffee,
  Video,
  Music,
  Dumbbell,
  BookOpenCheck,
  GraduationCap as GraduationCapIcon,
  Baby,
  PawPrint,
  Palette,
  Camera,
  Gamepad2 as GamepadIcon,
  Plane as PlaneIcon,
  Car as CarIcon,
  Wrench,
  Heart as HeartIcon,
  Gift as GiftIcon
} from 'lucide-react';

export const AI_QUESTIONS: AIQuestion[] = [
  {
    id: 'welcome',
    title: 'Welcome to AI Budgeting Assistant',
    description: 'I\'ll analyze your actual financial situation and create a personalized budget allocation strategy based on your real expenses and goals.',
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
    id: 'housingType',
    title: 'What type of housing do you have?',
    description: 'This helps determine what housing-related expenses you actually have.',
    type: 'radio',
    icon: Home,
    required: true,
    options: [
      { value: 'rent', label: 'Renting', description: 'Pay rent, may include some utilities', icon: Home },
      { value: 'mortgage', label: 'Mortgage', description: 'Pay mortgage, property tax, insurance', icon: Building2 },
      { value: 'owned', label: 'Own Outright', description: 'No mortgage, just maintenance and taxes', icon: CheckCircle },
      { value: 'living-with-family', label: 'Living with Family', description: 'Minimal housing costs', icon: Users },
      { value: 'other', label: 'Other', description: 'Specify your housing situation', icon: Home }
    ]
  },
  {
    id: 'housingCosts',
    title: 'What are your monthly housing costs?',
    description: 'Enter your actual monthly housing expenses including rent/mortgage, property tax, and insurance.',
    type: 'number',
    icon: Home,
    min: 0,
    max: 10000,
    step: 50,
    placeholder: 'e.g., 1200',
    required: true,
    unit: '£',
    helpText: 'This helps the AI allocate your budget more accurately based on your actual housing expenses.'
  },
  {
    id: 'utilitiesIncluded',
    title: 'Which utilities are included in your housing costs?',
    description: 'Select all utilities that are already covered in your rent/mortgage payment.',
    type: 'checkbox',
    icon: Lightbulb,
    required: true,
    options: [
      { value: 'electricity', label: 'Electricity', description: 'Power and lighting', icon: Zap },
      { value: 'gas', label: 'Gas', description: 'Heating and cooking', icon: Zap },
      { value: 'water', label: 'Water', description: 'Water and sewage', icon: Droplets },
      { value: 'internet', label: 'Internet', description: 'WiFi and broadband', icon: Wifi },
      { value: 'phone', label: 'Phone', description: 'Landline service', icon: Phone },
      { value: 'none', label: 'None included', description: 'I pay all utilities separately', icon: AlertTriangle }
    ]
  },
  {
    id: 'separateUtilities',
    title: 'Which utilities do you pay separately?',
    description: 'Select all utilities you pay for separately from your housing costs.',
    type: 'checkbox',
    icon: Lightbulb,
    required: false,
    options: [
      { value: 'electricity', label: 'Electricity', description: 'Power and lighting', icon: Zap },
      { value: 'gas', label: 'Gas', description: 'Heating and cooking', icon: Zap },
      { value: 'water', label: 'Water', description: 'Water and sewage', icon: Droplets },
      { value: 'internet', label: 'Internet', description: 'WiFi and broadband', icon: Wifi },
      { value: 'phone', label: 'Phone', description: 'Landline service', icon: Phone },
      { value: 'none', label: 'None', description: 'All utilities are included', icon: CheckCircle }
    ]
  },
  {
    id: 'transportationType',
    title: 'What is your primary mode of transportation?',
    description: 'This determines your actual transportation costs.',
    type: 'radio',
    icon: Car,
    required: true,
    options: [
      { value: 'car', label: 'Personal Car', description: 'Car payment, gas, insurance, maintenance', icon: Car },
      { value: 'public-transit', label: 'Public Transportation', description: 'Bus, train, subway passes', icon: Bus },
      { value: 'walking-biking', label: 'Walking/Biking', description: 'Minimal transport costs', icon: Bike },
      { value: 'multiple', label: 'Multiple Options', description: 'Mix of car and public transit', icon: Train },
      { value: 'other', label: 'Other', description: 'Specify your transportation method', icon: Car }
    ]
  },
  {
    id: 'transportationCosts',
    title: 'What are your monthly transportation costs?',
    description: 'Enter your actual monthly transportation expenses.',
    type: 'number',
    icon: Car,
    min: 0,
    max: 2000,
    step: 25,
    placeholder: 'e.g., 300',
    required: true,
    unit: '£',
    helpText: 'Include car payment, gas, insurance, maintenance, or public transit passes.'
  },
  {
    id: 'healthcareType',
    title: 'What type of healthcare coverage do you have?',
    description: 'This affects your healthcare costs and insurance needs.',
    type: 'radio',
    icon: Stethoscope,
    required: true,
    options: [
      { value: 'employer', label: 'Employer Health Insurance', description: 'Covered through work', icon: Briefcase },
      { value: 'private', label: 'Private Health Insurance', description: 'Individual policy', icon: Shield },
      { value: 'nhs', label: 'NHS Only', description: 'No private insurance', icon: Stethoscope },
      { value: 'none', label: 'No Health Insurance', description: 'Need to budget for medical costs', icon: AlertTriangle },
      { value: 'other', label: 'Other', description: 'Specify your healthcare coverage', icon: Stethoscope }
    ]
  },
  {
    id: 'healthcareCosts',
    title: 'What are your monthly healthcare costs?',
    description: 'Enter your actual monthly healthcare expenses including insurance premiums, medications, and medical costs.',
    type: 'number',
    icon: Stethoscope,
    min: 0,
    max: 1000,
    step: 25,
    placeholder: 'e.g., 150',
    required: true,
    unit: '£',
    helpText: 'Include insurance premiums, prescriptions, doctor visits, and other medical expenses.'
  },
  {
    id: 'foodAndGroceries',
    title: 'What are your monthly food and grocery costs?',
    description: 'Enter your actual monthly food expenses.',
    type: 'number',
    icon: UtensilsCrossed,
    min: 0,
    max: 2000,
    step: 25,
    placeholder: 'e.g., 400',
    required: true,
    unit: '£',
    helpText: 'Include groceries, dining out, food delivery, and any other food-related expenses.'
  },
  {
    id: 'subscriptions',
    title: 'Which subscription services do you pay for monthly?',
    description: 'Select all subscription services you currently use.',
    type: 'checkbox',
    icon: Wifi,
    required: false,
    options: [
      { value: 'streaming', label: 'Streaming Services', description: 'Netflix, Disney+, etc.', icon: Video },
      { value: 'music', label: 'Music Services', description: 'Spotify, Apple Music, etc.', icon: Music },
      { value: 'gaming', label: 'Gaming Services', description: 'Xbox Game Pass, PlayStation Plus', icon: GamepadIcon },
      { value: 'software', label: 'Software Subscriptions', description: 'Adobe, Microsoft 365, etc.', icon: Zap },
      { value: 'fitness', label: 'Fitness Memberships', description: 'Gym, fitness apps, etc.', icon: Dumbbell },
      { value: 'education', label: 'Education Platforms', description: 'Coursera, Udemy, etc.', icon: BookOpenCheck },
      { value: 'other', label: 'Other Subscriptions', description: 'Specify other services', icon: Wifi },
      { value: 'none', label: 'No Subscriptions', description: 'I don\'t pay for any subscription services', icon: CheckCircle }
    ]
  },
  {
    id: 'entertainmentAndHobbies',
    title: 'What are your monthly entertainment and hobby costs?',
    description: 'Enter your actual monthly entertainment expenses.',
    type: 'number',
    icon: Gamepad2,
    min: 0,
    max: 1000,
    step: 25,
    placeholder: 'e.g., 150',
    required: true,
    unit: '£',
    helpText: 'Include hobbies, entertainment, gym memberships, and leisure activities.'
  },
  {
    id: 'shoppingAndPersonal',
    title: 'What are your monthly shopping and personal care costs?',
    description: 'Enter your actual monthly personal expenses.',
    type: 'number',
    icon: ShoppingBag,
    min: 0,
    max: 1000,
    step: 25,
    placeholder: 'e.g., 200',
    required: true,
    unit: '£',
    helpText: 'Include clothing, personal care, household items, and other shopping expenses.'
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
    id: 'debtConfirmation',
    title: 'Debt Confirmation',
    description: 'We found the following debts in your system. Do you want to include these in your budget for debt payoff?',
    type: 'debtConfirmation',
    icon: CreditCard,
    required: true,
    debtConfirmationInfo: {
      title: 'Your Current Debts',
      description: 'Review your existing debts and confirm if you want to include them in your budget allocation.',
      confirmButtonText: 'Yes, include these debts',
      skipButtonText: 'No, skip debt payoff',
      returnMessage: 'Your debt information will be used to create accurate budget allocations.'
    }
  },
  {
    id: 'goalsConfirmation',
    title: 'Goals Confirmation',
    description: 'We found the following savings goals in your system. Do you want to include these in your budget for monthly contributions?',
    type: 'goalsConfirmation',
    icon: Target,
    required: true,
    goalsConfirmationInfo: {
      title: 'Your Current Goals',
      description: 'Review your existing savings goals and confirm if you want to include them in your budget allocation.',
      confirmButtonText: 'Yes, include these goals',
      skipButtonText: 'No, skip goal contributions',
      noGoalsButtonText: 'I don\'t have any goals yet',
      returnMessage: 'Your goal information will be used to create accurate budget allocations.',
      noGoalsMessage: 'No problem! We\'ll focus on building your emergency fund and essential expenses first. You can always add goals later.'
    }
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
      { value: 'vacation', label: 'Vacation Fund', description: 'Save for travel and experiences', icon: PlaneIcon },
      { value: 'education', label: 'Education Fund', description: 'Save for courses or certifications', icon: BookOpenCheck },
      { value: 'wedding', label: 'Wedding Fund', description: 'Save for wedding expenses', icon: GiftIcon },
      { value: 'business', label: 'Business Fund', description: 'Start or expand a business', icon: Building2 },
      { value: 'car', label: 'Car Fund', description: 'Save for vehicle purchase or upgrade', icon: CarIcon },
      { value: 'home-improvement', label: 'Home Improvement', description: 'Renovations and repairs', icon: Wrench },
      { value: 'children', label: 'Children\'s Fund', description: 'Save for children\'s future needs', icon: Baby },
      { value: 'charity', label: 'Charitable Giving', description: 'Support causes you care about', icon: HeartIcon },
      { value: 'hobbies', label: 'Hobby Fund', description: 'Invest in your interests and passions', icon: Palette },
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
      { value: 'long-term', label: 'Long-term Goals', description: 'Retirement, children\'s education', icon: GraduationCapIcon },
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
  },
  {
    id: 'summary',
    title: 'Questionnaire Complete!',
    description: 'Great job! You\'ve completed the AI budgeting questionnaire. Review your answers below and click "Generate AI Analysis" to get your personalized budget recommendations.',
    type: 'summary',
    icon: CheckCircle,
    required: false
  }
];
