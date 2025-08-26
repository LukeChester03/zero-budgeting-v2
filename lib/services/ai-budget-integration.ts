import { AIAnalysisData } from '@/lib/types/ai';
import { Budget, Allocation } from '@/lib/store-firebase';
import { generateText, analyzePDFDocument } from '@/lib/gemini';
import { BankStatementAnalysis, OverallAnalysis, BankStatementAnalysisRequest } from '@/lib/types/ai';

export interface BudgetAllocation {
  category: string;
  amount: number;
  percentage: number;
  priority: number;
  description: string;
}

export interface AIBudgetIntegration {
  /**
   * Apply AI analysis to create a new budget
   */
  applyAIToBudget: (analysis: AIAnalysisData, month: string) => Promise<void>;

  /**
   * Get budget allocations from AI analysis
   */
  getBudgetAllocations: (analysis: AIAnalysisData) => BudgetAllocation[];

  /**
   * Validate AI budget allocations
   */
  validateAllocations: (allocations: BudgetAllocation[], monthlyIncome: number, existingDebts?: Array<{name: string; amount: number}>, existingGoals?: Array<{title: string; targetAmount: number}>) => boolean;

  /**
   * Convert AI categories to budget template categories
   */
  mapAICategoriesToBudget: (allocations: BudgetAllocation[]) => Array<{
    category: string;
    amount: number;
    description: string;
  }>;

  /**
   * Generate budget allocations using AI analysis and past budgets
   */
  generateBudgetAllocations: (
    aiAnalysis: AIAnalysisData, 
    monthlyIncome: number, 
    pastBudgets: Budget[], 
    existingDebts: Array<{name: string; amount: number; monthlyRepayment?: number}>, 
    existingGoals: Array<{title: string; targetAmount: number; monthlyContribution?: number; name?: string}>
  ) => Promise<BudgetAllocation[]>;
}

export class AIBudgetIntegrationService implements AIBudgetIntegration {

  /**
   * Generate budget allocations using AI analysis and past budgets
   */
  async generateBudgetAllocations(
    aiAnalysis: AIAnalysisData, 
    monthlyIncome: number, 
    pastBudgets: Budget[], 
    existingDebts: Array<{name: string; amount: number; monthlyRepayment?: number}>, 
    existingGoals: Array<{title: string; targetAmount: number; monthlyContribution?: number; name?: string}>
  ): Promise<BudgetAllocation[]> {
    console.log('🤖 Generating budget allocations with AI...');
    console.log('💰 Monthly income:', monthlyIncome);
    console.log('📊 Past budgets:', pastBudgets.length);
    console.log('💳 Existing debts:', existingDebts.length);
    console.log('🎯 Existing goals:', existingGoals.length);

    try {
      const prompt = this.buildBudgetAllocationPrompt(
        aiAnalysis, 
        monthlyIncome, 
        pastBudgets, 
        existingDebts, 
        existingGoals
      );

      console.log('📝 Budget allocation prompt length:', prompt.length, 'characters');

      const response = await generateText(prompt);
      console.log('✅ AI response received for budget allocation');

      // Parse the response
      const parsedResponse = JSON.parse(response);
      console.log('📊 Parsed budget allocation response:', parsedResponse);

      if (parsedResponse.allocations && Array.isArray(parsedResponse.allocations)) {
        const allocations: BudgetAllocation[] = parsedResponse.allocations.map((alloc: {category: string; amount: number; percentage: number; priority?: number; description?: string; reasoning?: string}, index: number) => ({
          category: alloc.category,
          amount: alloc.amount,
          percentage: alloc.percentage,
          priority: alloc.priority || index + 1,
          description: alloc.description || alloc.reasoning || ''
        }));

        // Validate allocations
        if (this.validateAllocations(allocations, monthlyIncome, existingDebts, existingGoals)) {
          console.log('✅ Budget allocations generated successfully');
          return allocations;
        } else {
          console.warn('⚠️ Generated allocations failed validation, using fallback');
          return this.getFallbackAllocations(monthlyIncome, aiAnalysis);
        }
      } else {
        console.warn('⚠️ Invalid response format, using fallback');
        return this.getFallbackAllocations(monthlyIncome, aiAnalysis);
      }
    } catch (error) {
      console.error('❌ Error generating budget allocations:', error);
      console.log('🔄 Using fallback allocations');
      return this.getFallbackAllocations(monthlyIncome, aiAnalysis);
    }
  }

  /**
   * Build the prompt for budget allocation generation
   */
    private buildBudgetAllocationPrompt(
    aiAnalysis: AIAnalysisData, 
    monthlyIncome: number, 
    pastBudgets: Budget[], 
    existingDebts: Array<{name: string; amount: number; monthlyRepayment?: number}>,
    existingGoals: Array<{title: string; targetAmount: number; monthlyContribution?: number; name?: string}>
  ): string {
    const recentBudgets = pastBudgets.slice(-3); // Last 3 budgets
    const totalDebt = existingDebts.reduce((sum, debt) => sum + (debt.monthlyRepayment || 0), 0);
    const totalGoals = existingGoals.reduce((sum, goal) => sum + (goal.monthlyContribution || 0), 0);
    const availableIncome = monthlyIncome - totalDebt - totalGoals;

    return `Create a detailed budget allocation for monthly income £${monthlyIncome}. Return ONLY valid JSON.

IMPORTANT: Your response must be complete, valid JSON that can be parsed immediately.

{
  "allocations": [
    {
      "category": "Category Name",
      "amount": 0,
      "percentage": 0,
      "priority": 1,
      "description": "Reasoning for this allocation"
    }
  ]
}

COMPREHENSIVE USER PROFILE FROM AI ANALYSIS:
- Summary: ${aiAnalysis.summary}
- Risk Assessment: ${aiAnalysis.riskAssessment?.level || 'Moderate'}
- Financial Priorities: ${aiAnalysis.priorities?.map(p => `${p.rank}. ${p.category}: ${p.reason}`).join(' | ') || 'Not specified'}
- Timeline: Emergency Fund (${aiAnalysis.timeline?.emergencyFund || '6-12 months'}), Debt Elimination (${aiAnalysis.timeline?.debtElimination || '2-5 years'})
- Progress Metrics: ${aiAnalysis.progressMetrics?.join(', ') || 'Not specified'}
- Recommendations: ${aiAnalysis.recommendations?.join(', ') || 'Not specified'}

CURRENT FINANCIAL SITUATION:
- Monthly Income: £${monthlyIncome}
- Monthly Debt Payments: £${totalDebt}
- Monthly Goal Contributions: £${totalGoals}
- Available for Budget: £${availableIncome}

EXISTING DEBTS DETAILS:
${existingDebts.map(debt => `- ${debt.name || 'Debt'}: £${debt.amount || 0} (Monthly: £${debt.monthlyRepayment || 0})`).join('\n')}

EXISTING GOALS DETAILS:
${existingGoals.map(goal => `- ${goal.name || 'Goal'}: £${goal.targetAmount || 0} (Monthly: £${goal.monthlyContribution || 0})`).join('\n')}

PAST BUDGET PATTERNS (last 3 months):
${recentBudgets.length > 0 ? recentBudgets.map(budget => `- ${budget.month}: £${budget.allocations.reduce((sum, alloc) => sum + alloc.amount, 0)} total`).join('\n') : 'No past budgets available'}

BUDGET ALLOCATION REQUIREMENTS:
1. Total allocations must equal £${availableIncome} (income minus debt/goals)
2. Include these categories: Housing, Transport, Food & Groceries, Utilities, Healthcare, Insurance, Entertainment, Savings, Emergency Fund
3. Consider user's primary goal: ${aiAnalysis.priorities?.[0]?.category || 'Not specified'}
4. Provide realistic amounts based on income level and user's financial situation
5. Include detailed reasoning for each allocation based on the AI analysis
6. Prioritize based on user's financial priorities and risk tolerance
7. Account for existing debt payments and goal contributions
8. Use insights from past budget patterns if available

SMART ALLOCATION STRATEGY:
- If user has high debt: Prioritize debt repayment categories
- If user has no emergency fund: Increase emergency fund allocation
- If user has specific goals: Allocate accordingly to goal categories
- Consider user's risk tolerance: Conservative users get more savings, aggressive users get more investments
- Use past budget patterns to identify spending habits and adjust accordingly

Return ONLY valid JSON with no additional text. Ensure all amounts add up to £${availableIncome} exactly.`;
  }

  /**
   * Get fallback allocations if AI generation fails
   */
  private getFallbackAllocations(monthlyIncome: number, aiAnalysis: AIAnalysisData): BudgetAllocation[] {
    console.log('🔄 Generating fallback allocations...');
    
    // If monthlyIncome is 0, we'll create percentage-based allocations
    // that can be applied when the actual income is known
    const usePercentages = monthlyIncome === 0;
    
    // Calculate available income (assuming no existing debts/goals for fallback)
    const availableIncome = monthlyIncome || 1000; // Use 1000 as placeholder for percentage calculations

    // Create comprehensive fallback allocations based on standard financial principles
    return [
      {
        category: 'Housing',
        amount: usePercentages ? 0 : availableIncome * 0.25,
        percentage: 25,
        priority: 1,
        description: 'Standard housing allocation (25% of income) - includes rent/mortgage, utilities, insurance'
      },
      {
        category: 'Transport',
        amount: usePercentages ? 0 : availableIncome * 0.15,
        percentage: 15,
        priority: 2,
        description: 'Transportation costs including fuel, insurance, maintenance, and public transit'
      },
      {
        category: 'Food & Groceries',
        amount: usePercentages ? 0 : availableIncome * 0.15,
        percentage: 15,
        priority: 3,
        description: 'Food, groceries, dining out, and household supplies'
      },
      {
        category: 'Healthcare & Insurance',
        amount: usePercentages ? 0 : availableIncome * 0.1,
        percentage: 10,
        priority: 4,
        description: 'Health insurance, medical expenses, and other insurance premiums'
      },
      {
        category: 'Utilities & Bills',
        amount: usePercentages ? 0 : availableIncome * 0.1,
        percentage: 10,
        priority: 5,
        description: 'Electricity, gas, water, internet, phone, and other utilities'
      },
      {
        category: 'Emergency Fund',
        amount: usePercentages ? 0 : availableIncome * 0.1,
        percentage: 10,
        priority: 6,
        description: 'Building emergency savings for unexpected expenses (aim for 3-6 months)'
      },
      {
        category: 'Savings & Investments',
        amount: usePercentages ? 0 : availableIncome * 0.1,
        percentage: 10,
        priority: 7,
        description: 'Long-term savings, retirement contributions, and investment growth'
      },
      {
        category: 'Entertainment & Personal',
        amount: usePercentages ? 0 : availableIncome * 0.05,
        percentage: 5,
        priority: 8,
        description: 'Hobbies, streaming services, leisure activities, and personal expenses'
      }
    ];
  }

  /**
   * Apply AI analysis to create a new budget
   */
  async applyAIToBudget(analysis: AIAnalysisData, month: string): Promise<void> {
    try {
      console.log('🔄 Applying AI analysis to budget for month:', month);

      // Get budget allocations from AI analysis
      const allocations = this.getBudgetAllocations(analysis);

      // Validate allocations
      if (!this.validateAllocations(allocations, 0)) { // Income will be fetched from store
        throw new Error('Invalid budget allocations from AI analysis');
      }

      // Convert to budget format
      const budgetAllocations = this.mapAICategoriesToBudget(allocations);

      console.log('📊 Budget allocations prepared:', budgetAllocations);

      // TODO: Integrate with budget creation system
      // This would typically call the budget store to create a new budget
      // For now, we'll log the prepared allocations

      console.log('✅ AI analysis successfully applied to budget');

    } catch (error) {
      console.error('❌ Error applying AI analysis to budget:', error);
      throw error;
    }
  }

  /**
   * Get budget allocations from AI analysis
   */
  getBudgetAllocations(analysis: AIAnalysisData): BudgetAllocation[] {
    console.log('🔍 getBudgetAllocations called with analysis:', analysis);
    console.log('📊 analysis.budgetAllocations:', analysis.budgetAllocations);
    console.log('📊 analysis.budgetDistribution:', analysis.budgetDistribution);
    
    // Always try to use explicit budgetAllocations first
    if (analysis.budgetAllocations && analysis.budgetAllocations.length > 0) {
      console.log('📊 Using existing budget allocations from AI analysis');
      return analysis.budgetAllocations.map(allocation => ({
        ...allocation,
        category: this.formatCategoryName(allocation.category)
      }));
    }

    // Fallback: create allocations from budgetDistribution
    console.log('🔄 No explicit allocations, attempting to create from budget distribution');
    const allocations: BudgetAllocation[] = [];

    if (analysis.budgetDistribution && Object.keys(analysis.budgetDistribution).length > 0) {
      console.log('📊 Processing budgetDistribution entries...');
      Object.entries(analysis.budgetDistribution).forEach(([category, data]) => {
        console.log(`📊 Processing category: ${category}, data:`, data);
        if (data && typeof data === 'object' && 'amount' in data && 'percentage' in data) {
          allocations.push({
            category: this.formatCategoryName(category),
            amount: data.amount || 0,
            percentage: data.percentage || 0,
            priority: this.getCategoryPriority(category),
            description: data.description || `Allocation for ${category}`
          });
        }
      });
    } else {
      console.log('⚠️ No budgetDistribution found in analysis');
    }

    // If we still don't have allocations, generate fallback ones
    if (allocations.length === 0) {
      console.log('🔄 No allocations generated from analysis, using fallback');
      return this.getFallbackAllocations(0, analysis); // Pass 0 for income, amounts will be calculated by percentage
    }

    console.log('📊 Final allocations:', allocations);
    return allocations.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Map AI allocations to user-specific debt names and goal titles
   * This method should be called after getting the base allocations to customize them for the user
   */
  mapAllocationsToUserCategories(
    allocations: BudgetAllocation[], 
    userDebts: Array<{name: string; amount: number; monthlyRepayment?: number}>, 
    userGoals: Array<{title: string; targetAmount: number; monthlyContribution?: number; name?: string}>
  ): BudgetAllocation[] {
    console.log('🔄 Mapping allocations to user-specific categories...');
    console.log('💳 User debts:', userDebts.map(d => d.name));
    console.log('🎯 User goals:', userGoals.map(g => g.title));
    console.log('📊 Input allocations:', allocations.map(a => ({ category: a.category, amount: a.amount, percentage: a.percentage })));
    
    const mappedAllocations: BudgetAllocation[] = [];
    
    allocations.forEach(alloc => {
      console.log(`🔍 Processing allocation: ${alloc.category} (${alloc.amount}, ${alloc.percentage}%)`);
      
      // Check if this is a debt-related allocation
      if (alloc.category.toLowerCase().includes('debt') || 
          alloc.category.toLowerCase().includes('repayment') ||
          alloc.category.toLowerCase().includes('payoff')) {
        
        console.log(`💳 This is a debt-related allocation: ${alloc.category}`);
        
        // If user has debts, split the debt allocation among them
        if (userDebts.length > 0) {
          const debtAmount = alloc.amount / userDebts.length;
          const debtPercentage = alloc.percentage / userDebts.length;
          
          console.log(`💳 Splitting debt allocation among ${userDebts.length} debts: £${debtAmount} each (${debtPercentage}% each)`);
          
          userDebts.forEach(debt => {
            const mappedAlloc = {
              category: debt.name, // Use the actual debt name
              amount: debtAmount,
              percentage: debtPercentage,
              priority: alloc.priority,
              description: `Debt repayment for ${debt.name}: ${alloc.description}`
            };
            mappedAllocations.push(mappedAlloc);
            console.log(`💳 Added debt allocation: ${debt.name} = £${debtAmount}`);
          });
        } else {
          console.log('💳 No user debts found, keeping generic debt allocation');
          // No debts, keep the original allocation but rename it
          mappedAllocations.push({
            ...alloc,
            category: 'Debt Repayment',
            description: 'Debt repayment allocation (no active debts)'
          });
        }
      }
      // Check if this is a savings/investment allocation that should go to goals
      else if (alloc.category.toLowerCase().includes('savings') || 
               alloc.category.toLowerCase().includes('investment') ||
               alloc.category.toLowerCase().includes('goal') ||
               alloc.category.toLowerCase().includes('emergency fund')) {
        
        console.log(`🎯 This is a savings/investment allocation: ${alloc.category}`);
        
        // If user has goals, split the savings allocation among them
        if (userGoals.length > 0) {
          const goalAmount = alloc.amount / userGoals.length;
          const goalPercentage = alloc.percentage / userGoals.length;
          
          console.log(`🎯 Splitting savings allocation among ${userGoals.length} goals: £${goalAmount} each (${goalPercentage}% each)`);
          
          userGoals.forEach(goal => {
            const mappedAlloc = {
              category: goal.title, // Use the actual goal title
              amount: goalAmount,
              percentage: goalPercentage,
              priority: alloc.priority,
              description: `Goal contribution for ${goal.title}: ${alloc.description}`
            };
            mappedAllocations.push(mappedAlloc);
            console.log(`🎯 Added goal allocation: ${goal.title} = £${goalAmount}`);
          });
        } else {
          console.log('🎯 No user goals found, keeping generic savings allocation');
          // No goals, keep the original allocation
          mappedAllocations.push(alloc);
        }
      }
      // Special case: Essential Expenses should be split into multiple categories
      else if (alloc.category.toLowerCase().includes('essential') || 
               alloc.category.toLowerCase().includes('essentialexpenses')) {
        
        console.log(`🏠 This is an essential expenses allocation: ${alloc.category}`);
        
        // Split essential expenses into multiple specific categories
        const essentialCategories = [
          { name: 'Rent/Mortgage', percentage: 0.4, description: 'Housing costs' },
          { name: 'Fuel', percentage: 0.2, description: 'Transportation costs' },
          { name: 'Groceries', percentage: 0.2, description: 'Food and household supplies' },
          { name: 'Electricity', percentage: 0.1, description: 'Electricity and utilities' },
          { name: 'Gas', percentage: 0.1, description: 'Gas and heating costs' }
        ];
        
        essentialCategories.forEach(cat => {
          const catAmount = alloc.amount * cat.percentage;
          const catPercentage = alloc.percentage * cat.percentage;
          
          const mappedAlloc = {
            category: cat.name,
            amount: catAmount,
            percentage: catPercentage,
            priority: alloc.priority,
            description: `${cat.description}: ${alloc.description}`
          };
          mappedAllocations.push(mappedAlloc);
          console.log(`🏠 Added essential expense allocation: ${cat.name} = £${catAmount}`);
        });
      }
      // For other categories, map to specific budget form categories
      else {
        console.log(`🏠 This is a regular category: ${alloc.category}`);
        const mappedCategory = this.mapToBudgetFormCategory(alloc.category);
        console.log(`🏠 Mapped ${alloc.category} to ${mappedCategory}`);
        mappedAllocations.push({
          ...alloc,
          category: mappedCategory
        });
      }
    });
    
    console.log('📊 Final mapped allocations:', mappedAllocations);
    return mappedAllocations;
  }

  /**
   * Validate AI budget allocations
   */
  validateAllocations(allocations: BudgetAllocation[], monthlyIncome: number, existingDebts: Array<{name: string; amount: number; monthlyRepayment?: number}> = [], existingGoals: Array<{title: string; targetAmount: number; monthlyContribution?: number; name?: string}> = []): boolean {
    if (!allocations || allocations.length === 0) {
      console.warn('⚠️ No allocations to validate');
      return false;
    }

    // Calculate total debt and goal payments
    const totalDebt = existingDebts.reduce((sum, debt) => sum + (debt.monthlyRepayment || 0), 0);
    const totalGoals = existingGoals.reduce((sum, goal) => sum + (goal.monthlyContribution || 0), 0);
    const availableIncome = monthlyIncome - totalDebt - totalGoals;

    console.log('🔍 Validating allocations:');
    console.log(`💰 Monthly income: £${monthlyIncome}`);
    console.log(`💳 Total debt payments: £${totalDebt}`);
    console.log(`🎯 Total goal contributions: £${totalGoals}`);
    console.log(`📊 Available for budget: £${availableIncome}`);

    // Check if percentages add up to 100%
    const totalPercentage = allocations.reduce((sum, alloc) => sum + alloc.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 1) {
      console.warn(`⚠️ Total percentage is ${totalPercentage}%, should be 100%`);
      return false;
    }

    // Check if amounts add up to available income (after debt/goals)
    if (availableIncome > 0) {
      const totalAmount = allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
      if (Math.abs(totalAmount - availableIncome) > 1) {
        console.warn(`⚠️ Total allocation amount is £${totalAmount}, should be £${availableIncome} (income minus debt/goals)`);
        return false;
      }
    }

    // Check for reasonable category distribution
    const housingAllocation = allocations.find(alloc => 
      alloc.category.toLowerCase().includes('housing') || 
      alloc.category.toLowerCase().includes('rent') || 
      alloc.category.toLowerCase().includes('mortgage')
    );
    
    if (housingAllocation && housingAllocation.percentage > 50) {
      console.warn('⚠️ Housing allocation is too high (>50%)');
      return false;
    }

    console.log('✅ Allocations validation passed');
    return true;
  }

  /**
   * Convert AI categories to budget template categories
   */
  mapAICategoriesToBudget(allocations: BudgetAllocation[]): Array<{
    category: string;
    amount: number;
    description: string;
  }> {
    // Get all valid budget categories from template
    const validCategories = [
      "Emergency Fund", "Safety Net", "Foundation", "Investments", "Pension",
      "Rent / Mortgage", "Electricity", "Gas", "Water", "Council Tax", 
      "Internet", "Phone", "Groceries", "Subscriptions", "Dining Out", 
      "Entertainment", "Holiday Fund", "Fuel", "Train/Bus Pass", 
      "Car Insurance", "Car Maintenance", "Unexpected", "Gifts", "Other"
    ];
    
    return allocations.map(allocation => {
      // Ensure category matches budget template exactly
      let mappedCategory = allocation.category;
      
      // Enhanced mapping for better AI category recognition
      const categoryMap: { [key: string]: string } = {
        // Housing & Utilities
        'rent': 'Rent / Mortgage', 'mortgage': 'Rent / Mortgage', 'housing': 'Rent / Mortgage',
        'property': 'Rent / Mortgage', 'landlord': 'Rent / Mortgage', 'letting': 'Rent / Mortgage',
        'electricity': 'Electricity', 'power': 'Electricity', 'energy': 'Electricity',
        'gas': 'Gas', 'heating': 'Gas', 'british gas': 'Gas', 'edf': 'Gas',
        'water': 'Water', 'sewage': 'Water', 'thames water': 'Water',
        'council tax': 'Council Tax', 'local authority': 'Council Tax',
        'internet': 'Internet', 'broadband': 'Internet', 'wifi': 'Internet',
        'phone': 'Phone', 'mobile': 'Phone', 'telephone': 'Phone',
        
        // Food & Shopping
        'food': 'Groceries', 'supermarket': 'Groceries', 'grocery': 'Groceries',
        'tesco': 'Groceries', 'sainsbury': 'Groceries', 'asda': 'Groceries',
        'morrisons': 'Groceries', 'aldi': 'Groceries', 'lidl': 'Groceries',
        'co-op': 'Groceries', 'waitrose': 'Groceries', 'iceland': 'Groceries',
        
        // Subscriptions & Services
        'subscription': 'Subscriptions', 'streaming': 'Subscriptions', 'membership': 'Subscriptions',
        'netflix': 'Subscriptions', 'spotify': 'Subscriptions', 'disney': 'Subscriptions',
        'prime': 'Subscriptions', 'gym': 'Subscriptions', 'software': 'Subscriptions',
        
        // Dining & Entertainment
        'restaurant': 'Dining Out', 'cafe': 'Dining Out', 'takeaway': 'Dining Out',
        'bar': 'Dining Out', 'pub': 'Dining Out', 'fast food': 'Dining Out',
        'mcdonalds': 'Dining Out', 'kfc': 'Dining Out', 'subway': 'Dining Out',
        'cinema': 'Entertainment', 'theatre': 'Entertainment', 'concert': 'Entertainment',
        'game': 'Entertainment', 'attraction': 'Entertainment', 'show': 'Entertainment',
        
        // Travel & Transport
        'travel': 'Holiday Fund', 'holiday': 'Holiday Fund', 'vacation': 'Holiday Fund',
        'trip': 'Holiday Fund', 'flight': 'Holiday Fund', 'hotel': 'Holiday Fund',
        'fuel': 'Fuel', 'petrol': 'Fuel', 'diesel': 'Fuel', 'charging': 'Fuel',
        'shell': 'Fuel', 'bp': 'Fuel', 'esso': 'Fuel', 'texaco': 'Fuel',
        'train': 'Train/Bus Pass', 'bus': 'Train/Bus Pass', 'tube': 'Train/Bus Pass',
        'tfl': 'Train/Bus Pass', 'underground': 'Train/Bus Pass', 'tram': 'Train/Bus Pass',
        
        // Vehicle
        'car': 'Car Maintenance', 'vehicle': 'Car Maintenance', 'mot': 'Car Maintenance',
        'servicing': 'Car Maintenance', 'repair': 'Car Maintenance', 'parking': 'Car Maintenance',
        'car wash': 'Car Maintenance', 'tyres': 'Car Maintenance', 'parts': 'Car Maintenance',
        'car insurance': 'Car Insurance', 'motor insurance': 'Car Insurance', 'vehicle insurance': 'Car Insurance',
        
        // Other Categories
        'gift': 'Gifts', 'present': 'Gifts', 'celebration': 'Gifts',
        'emergency': 'Emergency Fund', 'unexpected': 'Unexpected', 'unforeseen': 'Unexpected',
        'savings': 'Safety Net', 'buffer': 'Safety Net', 'investment': 'Investments',
        'pension': 'Pension', 'retirement': 'Pension',
        
        // Bank & Financial Services
        'atm': 'Other', 'withdrawal': 'Other', 'deposit': 'Other', 'transfer': 'Other',
        'bank': 'Other', 'charge': 'Other', 'fee': 'Other', 'interest': 'Other',
        'direct debit': 'Other', 'standing order': 'Other', 'payment': 'Other',
        'refund': 'Other', 'chargeback': 'Other', 'adjustment': 'Other',
        'reversal': 'Other', 'correction': 'Other', 'compensation': 'Other',
        'credit': 'Other', 'debit': 'Other', 'balance': 'Other',
        'interchange': 'Other', 'scheme': 'Other', 'processing': 'Other',
        'settlement': 'Other', 'clearing': 'Other', 'reconciliation': 'Other',
        'authorisation': 'Other', 'card replacement': 'Other', 'admin fee': 'Other',
        'service charge': 'Other', 'overdraft': 'Other', 'foreign transaction': 'Other',
        'payment protection': 'Other', 'insurance': 'Other', 'tax': 'Other',
        
        // Common Vendor Names
        'paypal': 'Other', 'amazon': 'Entertainment', 'ebay': 'Entertainment',
        'apple': 'Subscriptions', 'google': 'Subscriptions', 'microsoft': 'Subscriptions',
        'uber': 'Entertainment', 'lyft': 'Entertainment', 'bolt': 'Entertainment',
        'deliveroo': 'Dining Out', 'just eat': 'Dining Out', 'uber eats': 'Dining Out',
        'gumtree': 'Entertainment', 'facebook': 'Entertainment', 'instagram': 'Entertainment',
        'airbnb': 'Holiday Fund', 'booking.com': 'Holiday Fund', 'expedia': 'Holiday Fund',
        'trainline': 'Train/Bus Pass', 'national rail': 'Train/Bus Pass',
        'cineworld': 'Entertainment', 'odeon': 'Entertainment', 'vue': 'Entertainment',
        'pret': 'Dining Out', 'starbucks': 'Dining Out', 'costa': 'Dining Out',
        'boots': 'Groceries', 'superdrug': 'Groceries', 'pharmacy': 'Groceries',
        'h&m': 'Entertainment', 'zara': 'Entertainment', 'next': 'Entertainment',
        'argos': 'Entertainment', 'currys': 'Entertainment', 'john lewis': 'Entertainment'
      };
      
      // Check if we have a mapping for this category
      const lowerCategory = allocation.category.toLowerCase();
      
      for (const [key, value] of Object.entries(categoryMap)) {
        if (lowerCategory.includes(key) || key.includes(lowerCategory)) {
          mappedCategory = value;
          break;
        }
      }
      
      // If still not a valid category, use "Other"
      if (!validCategories.includes(mappedCategory)) {
        console.warn(`⚠️ Category "${allocation.category}" not recognized, defaulting to "Other"`);
        mappedCategory = 'Other';
      }
      
      // Final safety check - ensure we never return undefined/null
      if (!mappedCategory || mappedCategory.trim() === '') {
        console.warn(`⚠️ Empty category detected, defaulting to "Other"`);
        mappedCategory = 'Other';
      }
      
      return {
        category: mappedCategory,
        amount: allocation.amount,
        description: allocation.description
      };
    });
  }

  /**
   * Format category names for budget system
   */
  private formatCategoryName(category: string): string {
    const categoryMap: { [key: string]: string } = {
      // Standard categories from AI analysis
      'emergencyFund': 'Emergency Fund',
      'debtPayoff': 'Debt Repayment',
      'debtRepayment': 'Debt Repayment',
      'essentialExpenses': 'Essential Expenses',
      'savingsInvestments': 'Savings & Investments',
      'discretionarySpending': 'Discretionary Spending',
      
      // Additional categories that might be returned
      'housing': 'Housing',
      'housingUtilities': 'Housing & Utilities',
      'transport': 'Transport',
      'transportation': 'Transport',
      'food': 'Food & Groceries',
      'groceries': 'Food & Groceries',
      'healthcare': 'Healthcare & Insurance',
      'insurance': 'Healthcare & Insurance',
      'utilities': 'Utilities & Bills',
      'bills': 'Utilities & Bills',
      'entertainment': 'Entertainment & Personal',
      'personal': 'Entertainment & Personal',
      'savings': 'Savings & Investments',
      'investments': 'Savings & Investments',
      
      // Specific budget form categories
      'Safety Net': 'Safety Net',
      'Foundation': 'Foundation',
      'Emergency Fund': 'Emergency Fund',
      'Investments': 'Investments',
      
      // Fallback: capitalize and format the category name
      'default': category.split(/(?=[A-Z])|_/).map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ')
    };

    return categoryMap[category] || categoryMap['default'];
  }

  /**
   * Get priority for budget categories
   */
  private getCategoryPriority(category: string): number {
    const priorityMap: { [key: string]: number } = {
      // High priority categories
      'emergencyFund': 1,
      'debtPayoff': 2,
      'housing': 3,
      'transport': 4,
      
      // Medium priority categories
      'essentialExpenses': 5,
      'food': 6,
      'groceries': 6,
      'healthcare': 7,
      'insurance': 7,
      'utilities': 8,
      'bills': 8,
      
      // Lower priority categories
      'savings': 9,
      'investments': 9,
      'savingsInvestments': 9,
      'entertainment': 10,
      'personal': 10,
      'discretionarySpending': 10,
      
      // Default priority for unknown categories
      'default': 15
    };

    return priorityMap[category] || priorityMap['default'];
  }

  /**
   * Map generic AI categories to specific budget form categories
   */
  private mapToBudgetFormCategory(aiCategory: string): string {
    console.log(`🔍 mapToBudgetFormCategory called with: "${aiCategory}"`);
    
    const categoryMap: { [key: string]: string } = {
      // Housing related - exact match for budget form
      'housing': 'Rent/Mortgage',
      'housingUtilities': 'Rent/Mortgage',
      'rent': 'Rent/Mortgage',
      'mortgage': 'Rent/Mortgage',
      'rent / mortgage': 'Rent/Mortgage',
      'rent/mortgage': 'Rent/Mortgage',
      
      // Transport related - exact match for budget form
      'transport': 'Fuel',
      'transportation': 'Fuel',
      'car': 'Car Insurance',
      
      // Food related - exact match for budget form
      'food': 'Groceries',
      'groceries': 'Groceries',
      'foodGroceries': 'Groceries',
      
      // Utilities related - map to specific categories
      'utilities': 'Electricity', // Default to electricity, but this should be split
      'bills': 'Electricity',
      'electricity': 'Electricity',
      'gas': 'Gas',
      'water': 'Water',
      'internet': 'Internet',
      'phone': 'Phone',
      
      // Insurance and healthcare
      'healthcare': 'Life Insurance', // Map to existing category
      'insurance': 'Life Insurance',
      
      // Entertainment and lifestyle
      'entertainment': 'Entertainment',
      'personal': 'Entertainment',
      'discretionarySpending': 'Entertainment',
      'lifestyle': 'Entertainment',
      
      // Savings and investments - exact match for budget form
      'savings': 'Emergency Fund',
      'investments': 'Investments',
      'savingsInvestments': 'Investments',
      
      // Emergency fund - exact match for budget form
      'emergencyFund': 'Emergency Fund',
      
      // Essential expenses - this is a special case that needs to be split
      'essentialExpenses': 'Groceries', // Default to groceries, but this should be split
      
      // Default fallback
      'default': aiCategory
    };

    const mappedCategory = categoryMap[aiCategory.toLowerCase()] || categoryMap['default'];
    console.log(`🔄 Mapping AI category "${aiCategory}" to budget form category "${mappedCategory}"`);
    return mappedCategory;
  }
}

export class BankStatementAnalysisService {
  /**
   * Analyze a single bank statement using AI
   */
  async analyzeBankStatement(request: BankStatementAnalysisRequest): Promise<BankStatementAnalysis> {
    console.log('🤖 Analyzing bank statement with AI...');
    
    try {
      const prompt = this.buildBankStatementAnalysisPrompt(request);
      const response = await generateText(prompt);
      
      console.log('✅ AI analysis received for bank statement');
      
      // Parse the response
      const parsedResponse = JSON.parse(response);
      
      if (parsedResponse.analysis) {
        return parsedResponse.analysis;
      } else {
        throw new Error('Invalid AI response format');
      }
    } catch (error) {
      console.error('❌ Error analyzing bank statement:', error);
      // Return fallback analysis
      return this.generateFallbackAnalysis(request);
    }
  }

  /**
   * Analyze PDF directly with Gemini AI
   */
  async analyzePDFDirectly(pdfFile: File, fileName: string): Promise<BankStatementAnalysis> {
    try {
      console.log('🤖 Starting direct PDF analysis with Gemini...');
      
      const prompt = this.buildPDFAnalysisPrompt(fileName);
      console.log('📝 PDF analysis prompt length:', prompt.length, 'characters');
      
      const response = await analyzePDFDocument(pdfFile, prompt);
      console.log('✅ AI response received for PDF analysis');
      console.log('📄 Raw response length:', response.length, 'characters');
      
      // Try to parse the response with robust error handling
              let parsedResponse: {transactions?: Array<{date: string; description: string; amount: number; type: "credit" | "debit"; category: string; vendor: string}>; bankName?: string; accountType?: string; statementPeriod?: {startDate: string; endDate: string}; summary?: any; categoryBreakdown?: any[]; spendingPatterns?: any; topVendors?: any[]; financialHealth?: any; savingsOpportunities?: any[]; insights?: any; recommendations?: any};
      try {
        // First, try to parse as-is
        parsedResponse = JSON.parse(response);
        console.log('📊 Parsed PDF analysis response successfully');
      } catch (parseError) {
        console.warn('⚠️ Initial JSON parse failed, attempting to fix common issues:', parseError);
        
        // Try to fix common JSON issues
        let cleanedResponse = response;
        
        // Check if response appears to be truncated
        const isTruncated = !cleanedResponse.trim().endsWith('}');
        const responseLength = cleanedResponse.length;
        
        if (isTruncated || responseLength > 50000) {
          console.warn(`⚠️ Response appears to be truncated or very large (${responseLength} chars), attempting to fix...`);
          
          // For very large responses, be more aggressive about finding the complete structure
          if (responseLength > 50000) {
            console.log('📏 Very large response detected, using aggressive truncation handling...');
          }
          
          // Find the last complete object or array
          let lastCompleteIndex = -1;
          
          // Look for the last complete closing brace/bracket
          for (let i = cleanedResponse.length - 1; i >= 0; i--) {
            if (cleanedResponse[i] === '}' || cleanedResponse[i] === ']') {
              // Count opening/closing braces to find complete structure
              let braceCount = 0;
              let bracketCount = 0;
              let foundComplete = false;
              
              for (let j = i; j >= 0; j--) {
                if (cleanedResponse[j] === '}') braceCount++;
                if (cleanedResponse[j] === '{') braceCount--;
                if (cleanedResponse[j] === ']') bracketCount++;
                if (cleanedResponse[j] === '[') bracketCount--;
                
                if (braceCount === 0 && bracketCount === 0 && j > 0) {
                  lastCompleteIndex = i;
                  foundComplete = true;
                  break;
                }
              }
              
              if (foundComplete) break;
            }
          }
          
          if (lastCompleteIndex > 0) {
            cleanedResponse = cleanedResponse.substring(0, lastCompleteIndex + 1);
            console.log('🔧 Truncated response fixed, new length:', cleanedResponse.length);
          } else {
            console.warn('⚠️ Could not find complete JSON structure, trying alternative methods...');
          }
        }
        
        // Additional truncation detection: look for incomplete JSON structures
        // Check if we have a complete JSON object
        let braceCount = 0;
        let bracketCount = 0;
        for (let i = 0; i < cleanedResponse.length; i++) {
          if (cleanedResponse[i] === '{') braceCount++;
          if (cleanedResponse[i] === '}') braceCount--;
          if (cleanedResponse[i] === '[') bracketCount++;
          if (cleanedResponse[i] === ']') bracketCount--;
        }
        
        if (braceCount !== 0 || bracketCount !== 0) {
          console.warn('⚠️ Unbalanced braces/brackets detected, attempting to fix...');
          
          // Find the last position where braces/brackets are balanced
          let balancedIndex = -1;
          let tempBraceCount = 0;
          let tempBracketCount = 0;
          
          for (let i = 0; i < cleanedResponse.length; i++) {
            if (cleanedResponse[i] === '{') tempBraceCount++;
            if (cleanedResponse[i] === '}') tempBraceCount--;
            if (cleanedResponse[i] === '[') tempBracketCount++;
            if (cleanedResponse[i] === ']') tempBracketCount--;
            
            if (tempBraceCount === 0 && tempBracketCount === 0) {
              balancedIndex = i;
            }
          }
          
          if (balancedIndex > 0) {
            cleanedResponse = cleanedResponse.substring(0, balancedIndex + 1);
            console.log('🔧 Balanced JSON structure found, new length:', cleanedResponse.length);
          }
        }
        
        // Remove any trailing commas before closing braces/brackets
        cleanedResponse = cleanedResponse.replace(/,(\s*[}\]])/g, '$1');
        
        // Fix unescaped quotes in string values (common issue with AI responses)
        cleanedResponse = cleanedResponse.replace(/(?<="[^"]*)"(?=[^"]*")/g, '\\"');
        
        // Remove any control characters that might break JSON
        cleanedResponse = cleanedResponse.replace(/[\x00-\x1F\x7F]/g, '');
        
        // Try to find JSON content between curly braces
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanedResponse = jsonMatch[0];
        }
        
        // Additional cleaning for common AI response issues
        // Remove any trailing text after the last closing brace
        const lastBraceIndex = cleanedResponse.lastIndexOf('}');
        if (lastBraceIndex > 0) {
          cleanedResponse = cleanedResponse.substring(0, lastBraceIndex + 1);
        }
        
        // Remove any trailing text after the last closing bracket
        const lastBracketIndex = cleanedResponse.lastIndexOf(']');
        if (lastBracketIndex > 0) {
          cleanedResponse = cleanedResponse.substring(0, lastBracketIndex + 1);
        }
        
        // Fix "Expected ':' after property name" errors by removing incomplete property definitions
        // Look for patterns like "propertyName" without a colon or value
        cleanedResponse = cleanedResponse.replace(/"([^"]+)"\s*(?=[,}\]])/g, '');
        
        // Remove any incomplete property definitions at the end
        const incompletePropertyMatch = cleanedResponse.match(/"([^"]+)"\s*$/);
        if (incompletePropertyMatch) {
          cleanedResponse = cleanedResponse.substring(0, incompletePropertyMatch.index);
          // Ensure we end with a proper closing brace
          if (!cleanedResponse.endsWith('}')) {
            cleanedResponse += '}';
          }
        }
        
        // Specific fix for "Expected ':' after property name" errors
        // Look for property names that are followed by commas, brackets, or braces without values
        cleanedResponse = cleanedResponse.replace(/"([^"]+)"\s*(?=,|\]|\})/g, '');
        
        // Remove any trailing commas that might cause issues
        cleanedResponse = cleanedResponse.replace(/,(\s*[}\]])/g, '$1');
        
        // Ensure we don't have multiple consecutive commas
        cleanedResponse = cleanedResponse.replace(/,+/g, ',');
        
        // Fix common JSON formatting issues
        cleanedResponse = cleanedResponse
          .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
          .replace(/([^"\\])\\([^"\\])/g, '$1\\\\$2') // Fix backslash issues
          .replace(/\n/g, '\\n') // Escape newlines
          .replace(/\r/g, '\\r') // Escape carriage returns
          .replace(/\t/g, '\\t'); // Escape tabs
        
        // Final validation: ensure we have balanced braces and brackets
        let finalBraceCount = 0;
        let finalBracketCount = 0;
        for (let i = 0; i < cleanedResponse.length; i++) {
          if (cleanedResponse[i] === '{') finalBraceCount++;
          if (cleanedResponse[i] === '}') finalBraceCount--;
          if (cleanedResponse[i] === '[') finalBracketCount++;
          if (cleanedResponse[i] === ']') finalBracketCount--;
        }
        
        // If still unbalanced, truncate to the last balanced position
        if (finalBraceCount !== 0 || finalBracketCount !== 0) {
          console.warn('⚠️ Final validation failed, truncating to last balanced position...');
          let balancedIndex = -1;
          let tempBraceCount = 0;
          let tempBracketCount = 0;
          
          for (let i = 0; i < cleanedResponse.length; i++) {
            if (cleanedResponse[i] === '{') tempBraceCount++;
            if (cleanedResponse[i] === '}') tempBraceCount--;
            if (cleanedResponse[i] === '[') tempBracketCount++;
            if (cleanedResponse[i] === ']') tempBracketCount--;
            
            if (tempBraceCount === 0 && tempBracketCount === 0) {
              balancedIndex = i;
            }
          }
          
          if (balancedIndex > 0) {
            cleanedResponse = cleanedResponse.substring(0, balancedIndex + 1);
            console.log('🔧 Final truncation applied, new length:', cleanedResponse.length);
          }
        }
        
        console.log('🧹 Attempting to parse cleaned response...');
        try {
          parsedResponse = JSON.parse(cleanedResponse);
          console.log('✅ Successfully parsed cleaned response');
          
          // Validate that we have the essential fields
          if (!parsedResponse.bankName || !parsedResponse.transactions || !parsedResponse.summary) {
            console.warn('⚠️ Parsed response missing essential fields, may be incomplete');
          }
          
        } catch (secondError) {
          console.error('❌ Failed to parse even cleaned response:', secondError);
          
          // Specific handling for "Expected ':' after property name" error
          if (secondError instanceof Error && secondError.message.includes("Expected ':' after property name")) {
            console.error('🔍 Detected "Expected \':\' after property name" error - this usually means the response was truncated mid-property');
            console.log('📄 Response length:', response.length);
            console.log('📄 Last 500 characters of response:', response.slice(-500));
            console.log('📄 Last 500 characters of cleaned response:', cleanedResponse.slice(-500));
          } else {
            console.log('📄 Last 200 characters of response:', response.slice(-200));
            console.log('📄 Last 200 characters of cleaned response:', cleanedResponse.slice(-200));
          }
          
          // Try one more approach: extract just the transactions if possible
          console.log('🔄 Attempting to extract partial data...');
          try {
            const transactionMatch = response.match(/"transactions":\s*\[([\s\S]*?)\]/);
            if (transactionMatch) {
              console.log('📊 Found transaction data, attempting to create partial analysis...');
              
              // Create a minimal valid response with just the transactions we can extract
              parsedResponse = {
                bankName: "Unknown Bank", // Will be updated by validation logic
                accountType: "Current Account",
                statementPeriod: {
                  startDate: new Date().toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0]
                },
                transactions: [],
                summary: {
                  totalSpending: 0,
                  totalIncome: 0,
                  netPosition: 0,
                  periodDays: 30,
                  transactionCount: 0,
                  monthlyIncome: 0, // Will be populated from Firebase
                  incomeVsSpending: {
                    percentage: 0,
                    remaining: 0,
                    status: 'within_budget' as const
                  }
                },
                categoryBreakdown: [],
                spendingPatterns: {
                  dailyAverage: 0,
                  weeklyAverage: 0,
                  highestSpendingDay: "Unknown",
                  lowestSpendingDay: "Unknown",
                  weekendVsWeekday: { weekend: 0, weekday: 0, difference: 0 }
                },
                topVendors: [],
                financialHealth: {
                  score: 50,
                  status: "fair",
                  factors: ["Partial analysis due to response truncation"],
                  recommendations: ["Consider uploading a smaller statement or contact support"]
                },
                savingsOpportunities: [],
                insights: {
                  summary: "Partial analysis completed - some data may be missing",
                  keyFindings: ["Statement was processed but response was truncated"],
                  warnings: ["Analysis may be incomplete"],
                  advice: ["Review the extracted data carefully"],
                  trends: ["Unable to determine trends due to incomplete data"]
                },
                recommendations: {
                  immediate: ["Review extracted transactions"],
                  shortTerm: ["Consider re-uploading if data seems incomplete"],
                  longTerm: ["Ensure statements are not too large for analysis"],
                  priority: "medium"
                }
              };
              
              console.log('✅ Created partial analysis from truncated response');
            } else {
              throw new Error('Unable to extract any useful data from response');
            }
          } catch (extractionError) {
            console.error('❌ Failed to extract partial data:', extractionError);
            
            // Final fallback: try to extract any useful information from the response
            console.log('🔄 Attempting final fallback extraction...');
            
            // Look for any patterns that might contain useful data
            const bankMatch = response.match(/"bankName":\s*"([^"]+)"/);
            const accountMatch = response.match(/"accountType":\s*"([^"]+)"/);
            const spendingMatch = response.match(/"totalSpending":\s*(\d+\.?\d*)/);
            const incomeMatch = response.match(/"totalIncome":\s*(\d+\.?\d*)/);
            
            if (bankMatch || accountMatch || spendingMatch || incomeMatch) {
              console.log('📊 Found partial data in response, creating minimal analysis...');
              
              parsedResponse = {
                bankName: bankMatch ? bankMatch[1] : "Unknown Bank",
                accountType: accountMatch ? accountMatch[1] : "Current Account",
                statementPeriod: {
                  startDate: new Date().toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0]
                },
                transactions: [],
                summary: {
                  totalSpending: spendingMatch ? parseFloat(spendingMatch[1]) : 0,
                  totalIncome: incomeMatch ? parseFloat(incomeMatch[1]) : 0,
                  netPosition: (incomeMatch ? parseFloat(incomeMatch[1]) : 0) - (spendingMatch ? parseFloat(spendingMatch[1]) : 0),
                  periodDays: 30,
                  transactionCount: 0,
                  monthlyIncome: 0,
                  incomeVsSpending: {
                    percentage: 0,
                    remaining: 0,
                    status: 'within_budget' as const
                  }
                },
                categoryBreakdown: [],
                spendingPatterns: {
                  dailyAverage: 0,
                  weeklyAverage: 0,
                  highestSpendingDay: "Unknown",
                  lowestSpendingDay: "Unknown",
                  weekendVsWeekday: { weekend: 0, weekday: 0, difference: 0 }
                },
                topVendors: [],
                financialHealth: {
                  score: 50,
                  status: "fair",
                  factors: ["Analysis completed with partial data"],
                  recommendations: ["Some data may be incomplete due to response issues"]
                },
                savingsOpportunities: [],
                insights: {
                  summary: "Analysis completed with partial data extraction",
                  keyFindings: ["Statement was processed but some data may be missing"],
                  warnings: ["Analysis may be incomplete"],
                  advice: ["Review the extracted data carefully"],
                  trends: ["Unable to determine trends due to data limitations"]
                },
                recommendations: {
                  immediate: ["Review extracted data"],
                  shortTerm: ["Consider re-uploading if data seems incomplete"],
                  longTerm: ["Ensure statements are not too large for analysis"],
                  priority: "medium"
                }
              };
              
              console.log('✅ Created minimal analysis from partial data extraction');
            } else {
              throw new Error('Unable to extract any useful data from response');
            }
          }
        }
      }
      
      if (parsedResponse.summary && parsedResponse.transactions) {
        console.log('✅ PDF analysis completed successfully');
        
        // Validate that all transactions are categorized
        const transactions = parsedResponse.transactions || [];
        const uncategorizedTransactions = transactions.filter((t: {category?: string}) => !t.category || t.category.trim() === '');
        
        if (uncategorizedTransactions.length > 0) {
          console.warn(`⚠️ Found ${uncategorizedTransactions.length} uncategorized transactions, categorizing them as "Other"`);
          
          // Categorize uncategorized transactions as "Other"
          transactions.forEach((t: {category?: string; description?: string}) => {
            if (!t.category || t.category.trim() === '') {
              t.category = 'Other';
              console.log(`🔄 Categorized transaction "${t.description}" as "Other"`);
            }
          });
        }
        
        // Validate bank name identification
        let bankName = parsedResponse.bankName || 'Unknown Bank';
        if (bankName === 'Unknown Bank' || bankName.toLowerCase().includes('unknown')) {
          console.warn('⚠️ Bank name not properly identified, attempting to infer from filename or content...');
          
          // Try to infer bank name from filename
          if (fileName.toLowerCase().includes('barclays')) bankName = 'Barclays Bank';
          else if (fileName.toLowerCase().includes('hsbc')) bankName = 'HSBC Bank';
          else if (fileName.toLowerCase().includes('natwest')) bankName = 'NatWest Bank';
          else if (fileName.toLowerCase().includes('lloyds')) bankName = 'Lloyds Bank';
          else if (fileName.toLowerCase().includes('santander')) bankName = 'Santander UK';
          else if (fileName.toLowerCase().includes('nationwide')) bankName = 'Nationwide Building Society';
          else if (fileName.toLowerCase().includes('halifax')) bankName = 'Halifax';
          else if (fileName.toLowerCase().includes('tsb')) bankName = 'TSB Bank';
          else if (fileName.toLowerCase().includes('co-op') || fileName.toLowerCase().includes('coop')) bankName = 'Co-operative Bank';
          else if (fileName.toLowerCase().includes('metro')) bankName = 'Metro Bank';
          else if (fileName.toLowerCase().includes('virgin')) bankName = 'Virgin Money';
          else if (fileName.toLowerCase().includes('first direct')) bankName = 'First Direct';
          else if (fileName.toLowerCase().includes('m&s')) bankName = 'M&S Bank';
          else if (fileName.toLowerCase().includes('tesco')) bankName = 'Tesco Bank';
          else if (fileName.toLowerCase().includes('sainsbury')) bankName = 'Sainsbury\'s Bank';
          else if (fileName.toLowerCase().includes('post office')) bankName = 'Post Office Money';
          else if (fileName.toLowerCase().includes('yorkshire')) bankName = 'Yorkshire Building Society';
          else if (fileName.toLowerCase().includes('coventry')) bankName = 'Coventry Building Society';
          else if (fileName.toLowerCase().includes('skipton')) bankName = 'Skipton Building Society';
          else if (fileName.toLowerCase().includes('leeds')) bankName = 'Leeds Building Society';
          else {
            // If still unknown, try to find any bank-related text in the response
            const bankKeywords = ['barclays', 'hsbc', 'natwest', 'lloyds', 'santander', 'nationwide', 'halifax', 'tsb', 'co-operative', 'metro', 'virgin', 'first direct', 'm&s', 'tesco', 'sainsbury', 'post office', 'yorkshire', 'coventry', 'skipton', 'leeds'];
            const responseText = JSON.stringify(parsedResponse).toLowerCase();
            
            for (const keyword of bankKeywords) {
              if (responseText.includes(keyword)) {
                // Map keyword to full bank name
                const bankMap: { [key: string]: string } = {
                  'barclays': 'Barclays Bank',
                  'hsbc': 'HSBC Bank',
                  'natwest': 'NatWest Bank',
                  'lloyds': 'Lloyds Bank',
                  'santander': 'Santander UK',
                  'nationwide': 'Nationwide Building Society',
                  'halifax': 'Halifax',
                  'tsb': 'TSB Bank',
                  'co-operative': 'Co-operative Bank',
                  'metro': 'Metro Bank',
                  'virgin': 'Virgin Money',
                  'first direct': 'First Direct',
                  'm&s': 'M&S Bank',
                  'tesco': 'Tesco Bank',
                  'sainsbury': 'Sainsbury\'s Bank',
                  'post office': 'Post Office Money',
                  'yorkshire': 'Yorkshire Building Society',
                  'coventry': 'Coventry Building Society',
                  'skipton': 'Skipton Building Society',
                  'leeds': 'Leeds Building Society'
                };
                
                bankName = bankMap[keyword];
                console.log(`🔍 Inferred bank name "${bankName}" from keyword "${keyword}" in response`);
                break;
              }
            }
          }
          
          if (bankName !== 'Unknown Bank') {
            console.log(`✅ Bank name updated to: ${bankName}`);
          } else {
            console.warn('⚠️ Could not identify bank name, using "Unknown Bank"');
          }
        }
        
        // Transform the AI response to match our interface
        const transformedAnalysis: BankStatementAnalysis = {
          id: crypto.randomUUID(),
          statementId: 'temp-id',
          userId: 'temp-user',
          analysisDate: new Date().toISOString(),
          bankName: bankName, // Use the validated bank name
          accountType: parsedResponse.accountType || 'Current Account',
          statementPeriod: parsedResponse.statementPeriod || {
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0]
          },
          transactions: parsedResponse.transactions || [],
          summary: {
            totalSpending: parsedResponse.summary?.totalSpending || 0,
            totalIncome: parsedResponse.summary?.totalIncome || 0,
            netPosition: parsedResponse.summary?.netPosition || 0,
            periodDays: parsedResponse.summary?.periodDays || 30,
            transactionCount: parsedResponse.summary?.transactionCount || 0,
            monthlyIncome: parsedResponse.summary?.monthlyIncome || 0,
            incomeVsSpending: parsedResponse.summary?.incomeVsSpending || {
              percentage: 0,
              remaining: 0,
              status: 'within_budget' as const
            }
          },
          categoryBreakdown: (parsedResponse.categoryBreakdown || []).filter((cat: {amount?: number}) => cat.amount && cat.amount > 0),
          spendingPatterns: parsedResponse.spendingPatterns || {
            dailyAverage: 0,
            weeklyAverage: 0,
            highestSpendingDay: 'Unknown',
            lowestSpendingDay: 'Unknown',
            weekendVsWeekday: { weekend: 0, weekday: 0, difference: 0 }
          },
          topVendors: parsedResponse.topVendors || [],
          financialHealth: parsedResponse.financialHealth || {
            score: 50,
            status: 'fair',
            factors: ['Analysis completed'],
            recommendations: ['Review your spending patterns']
          },
          savingsOpportunities: parsedResponse.savingsOpportunities || [],
          insights: parsedResponse.insights || {
            summary: 'Analysis completed',
            keyFindings: ['Basic analysis available'],
            warnings: [],
            advice: ['Continue monitoring your finances'],
            trends: ['Basic trends identified']
          },
          recommendations: parsedResponse.recommendations || {
            immediate: ['Review your spending'],
            shortTerm: ['Set spending goals'],
            longTerm: ['Plan for the future'],
            priority: 'medium'
          }
        };
        
        return transformedAnalysis;
      } else {
        console.log('⚠️ AI response incomplete, generating fallback analysis');
        return this.generateFallbackAnalysis({
          transactions: [],
          statementMetadata: {
            fileName,
            bank: "Unknown Bank",
            accountType: "Current Account",
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0]
          },
          userContext: {}
        });
      }
    } catch (error) {
      console.error('❌ Error in direct PDF analysis:', error);
      console.log('🔄 Generating fallback analysis...');
      return this.generateFallbackAnalysis({
        transactions: [],
        statementMetadata: {
          fileName,
          bank: "Unknown Bank",
          accountType: "Current Account",
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
          },
        userContext: {}
      });
    }
  }

  /**
   * Generate overall analysis across all statements
   */
  async generateOverallAnalysis(
    statements: any[],
    userId: string
  ): Promise<OverallAnalysis> {
    console.log('🤖 Generating overall analysis with AI...');
    
    try {
      const prompt = this.buildOverallAnalysisPrompt(statements);
      const response = await generateText(prompt);
      
      console.log('✅ AI overall analysis received');
      
      // Parse the response
      const parsedResponse = JSON.parse(response);
      
      if (parsedResponse.overallAnalysis) {
        return parsedResponse.overallAnalysis;
      } else {
        throw new Error('Invalid AI response format');
      }
    } catch (error) {
      console.error('❌ Error generating overall analysis:', error);
      // Return fallback overall analysis
      return await this.generateFallbackOverallAnalysis(statements, userId);
    }
  }

  /**
   * Build the prompt for PDF analysis
   */
  private buildPDFAnalysisPrompt(fileName: string): string {
    return `You are an expert financial analyst with 20+ years of experience analyzing bank statements. Your task is to provide a comprehensive, accurate, and actionable financial analysis of this bank statement PDF.

CRITICAL REQUIREMENTS:
1. EXTRACT EVERY SINGLE TRANSACTION: Read the PDF line by line and identify ALL transactions with exact amounts, dates, and descriptions
2. ACCURATE BANK IDENTIFICATION - CRITICAL: You MUST identify the bank name correctly. Look for bank name in this EXACT order:

   PRIMARY SOURCES (check these first):
   - Statement header/title (usually at the top, largest text)
   - Bank logo or branding (look for company names near logos)
   - Page title or document title
   - "Statement from [BANK NAME]" or similar phrases
   - "Welcome to [BANK NAME]" or similar welcome messages

   SECONDARY SOURCES (if primary sources don't work):
   - Account holder details section
   - "Account with [BANK NAME]" or "Account at [BANK NAME]"
   - "Your [BANK NAME] account" or similar phrases
   - Routing numbers or sort codes (look for bank names near these)
   - Footer information or page numbers
   - Contact information section
   - "For more information, contact [BANK NAME]"

   UK BANK NAMES TO RECOGNIZE (exact matches):
   - Barclays Bank
   - HSBC Bank
   - NatWest Bank
   - Lloyds Bank
   - Santander UK
   - Nationwide Building Society
   - Halifax (part of Lloyds Banking Group)
   - TSB Bank
   - Co-operative Bank
   - Metro Bank
   - Virgin Money
   - First Direct (part of HSBC)
   - M&S Bank
   - Tesco Bank
   - Sainsbury's Bank
   - Post Office Money
   - Yorkshire Building Society
   - Coventry Building Society
   - Skipton Building Society
   - Leeds Building Society

   BANK IDENTIFICATION TECHNIQUES:
   - Look for the most prominent financial institution name
   - Check if the name appears multiple times (more likely to be the bank)
   - Look for phrases like "Your bank", "We", "Our services"
   - Check for building society vs bank terminology
   - Look for parent company names (e.g., "Lloyds Banking Group" → "Lloyds Bank")
   - Check for trading names vs legal names
   - Look for phrases like "Authorised by [BANK NAME]"

   FINAL CHECK: Before returning the JSON, verify that:
   - You have identified a specific bank name (not "Unknown Bank")
   - The bank name matches one of the UK banks listed above
   - If you see multiple bank names, choose the one that appears most prominently
   - If still uncertain, use the most common UK bank name you can identify
   - Bank identification is CRITICAL - spend extra time on this if needed
   - Look at the entire document systematically for bank identification
   - Check every page, header, footer, and section for bank names
3. SMART CATEGORIZATION: Use ONLY these exact budget template categories:
   - Emergency Fund: Emergency savings, unexpected expenses, emergency repairs
   - Safety Net: Safety net savings, buffer funds, rainy day money
   - Foundation: Foundation savings, basic needs, essential expenses
   - Investments: Investment accounts, stocks, bonds, shares, crypto
   - Pension: Pension contributions, retirement savings, workplace pension
   - Rent / Mortgage: Housing payments, property costs, rent, mortgage, property management
   - Electricity: Power bills, electric utilities, energy suppliers, power companies
   - Gas: Gas bills, heating costs, gas suppliers, heating companies
   - Water: Water bills, water utilities, water companies, sewage
   - Council Tax: Local government taxes, council tax, local authority charges
   - Internet: Internet service, broadband, WiFi, telecommunications
   - Phone: Phone bills, mobile services, mobile phone, landline
   - Groceries: Supermarkets, food stores, meal delivery, food shopping, convenience stores
   - Subscriptions: Streaming services, memberships, recurring payments, gym, software, apps
   - Dining Out: Restaurants, cafes, bars, takeaway, fast food, coffee shops
   - Entertainment: Cinemas, theatres, events, games, concerts, shows, attractions
   - Holiday Fund: Travel savings, vacation funds, holidays, trips, travel expenses
   - Fuel: Petrol, diesel, charging costs, gas stations, fuel stations, charging points
   - Train/Bus Pass: Public transport, travel cards, buses, trains, trams, underground
   - Car Insurance: Vehicle insurance, car coverage, motor insurance, vehicle protection
   - Car Maintenance: Car repairs, servicing, parts, MOT, car wash, parking
   - Unexpected: Unforeseen expenses, emergency costs, surprise bills, unplanned expenses
   - Gifts: Gift purchases, presents, gift cards, gift shops, celebrations
   - Other: Any transaction that doesn't fit above categories

   CATEGORIZATION EXAMPLES FOR COMMON EDGE CASES:
   - "ATM WITHDRAWAL" → "Other" (unless you can infer purpose from context)
   - "BANK CHARGES" → "Other"
   - "INTEREST PAID" → "Other" (bank interest)
   - "DIRECT DEBIT" → Infer from vendor name or amount
   - "STANDING ORDER" → Infer from vendor name or amount
   - "TRANSFER TO SAVINGS" → "Emergency Fund" or "Safety Net"
   - "PAYPAL" → Infer from amount and frequency (subscription, shopping, etc.)
   - "AMAZON" → Infer from amount (groceries if small, entertainment if large, etc.)
   - "CASH WITHDRAWAL" → "Other" (unless you can infer purpose)
   - "BANK TRANSFER" → Infer from destination or amount

RESPONSE FORMAT REQUIREMENTS:
1. BE CONCISE: Keep descriptions brief but clear (max 50 characters for transaction descriptions)
2. COMPACT JSON: Minimize whitespace and unnecessary formatting
3. EFFICIENT STRUCTURE: Use the minimum required fields, avoid redundancy
4. SHORT VALUES: Keep all string values as short as possible while maintaining clarity
5. OPTIMIZE FOR SIZE: The response must fit within token limits - prioritize accuracy over verbosity
6. LARGE STATEMENTS: If the statement has many transactions, focus on the most important ones and summarize smaller ones
7. TRUNCATION PREVENTION: Ensure the JSON response is complete and properly closed - never leave incomplete properties
   - "REFUND" → Categorize based on original transaction type
   - "CHARGEBACK" → "Other"
   - "FOREIGN TRANSACTION FEE" → "Other"
   - "OVERDRAFT FEE" → "Other"
   - "PAYMENT PROTECTION" → "Other"
   - "INSURANCE" → "Car Insurance" or "Other" if unclear
   - "TAX" → "Council Tax" or "Other" if unclear
   - "SERVICE CHARGE" → "Other"
   - "ADMIN FEE" → "Other"
   - "CARD REPLACEMENT" → "Other"
   - "PAYMENT TO [NAME]" → Infer from amount and frequency
   - "DEPOSIT" → "Other" (bank deposit)
   - "WITHDRAWAL" → "Other" (unless you can infer purpose)
   - "FEE" → "Other" (bank fees)
   - "CHARGE" → "Other" (bank charges)
   - "ADJUSTMENT" → "Other" (bank adjustments)
   - "REVERSAL" → "Other" (transaction reversals)
   - "CORRECTION" → "Other" (bank corrections)
   - "COMPENSATION" → "Other" (bank compensation)
   - "CREDIT" → "Other" (bank credits)
   - "DEBIT" → "Other" (bank debits)
   - "BALANCE" → "Other" (balance adjustments)
   - "INTERCHANGE" → "Other" (card interchange fees)
   - "SCHEME" → "Other" (card scheme fees)
   - "PROCESSING" → "Other" (processing fees)
   - "SETTLEMENT" → "Other" (settlement fees)
   - "CLEARING" → "Other" (clearing fees)
   - "RECONCILIATION" → "Other" (reconciliation fees)
   - "AUTHORISATION" → "Other" (authorisation fees)

   VENDOR-BASED CATEGORIZATION EXAMPLES:
   - "TESCO", "SAINSBURYS", "ASDA", "MORRISONS", "ALDI", "LIDL" → "Groceries"
   - "SHELL", "BP", "ESSO", "TEXACO" → "Fuel"
   - "NETFLIX", "SPOTIFY", "DISNEY+", "AMAZON PRIME" → "Subscriptions"
   - "UBER", "LYFT", "BOLT" → "Transport" (if transport) or "Entertainment" (if food delivery)
   - "DELIVEROO", "JUST EAT", "UBER EATS" → "Dining Out"
   - "AMAZON" → Infer from amount: small amounts likely "Groceries", large amounts likely "Entertainment"
   - "PAYPAL" → Infer from context: check if it's recurring (subscription) or one-off
   - "APPLE", "GOOGLE", "MICROSOFT" → "Subscriptions" if recurring, "Entertainment" if one-off
   - "GUMTREE", "EBAY", "FACEBOOK MARKETPLACE" → "Entertainment" or "Other"
   - "AIRBNB", "BOOKING.COM", "EXPEDIA" → "Holiday Fund"
   - "TRAINLINE", "NATIONAL RAIL", "TFL" → "Train/Bus Pass"
   - "CINEWORLD", "ODEON", "VUE" → "Entertainment"
   - "PRET", "STARBUCKS", "COSTA" → "Dining Out"
   - "BOOTS", "SUPERDRUG" → "Groceries" (health/beauty)
   - "H&M", "ZARA", "NEXT" → "Entertainment" (clothing)
   - "ARGOS", "CURRYS", "JOHN LEWIS" → "Entertainment" (shopping)

   AMOUNT-BASED CATEGORIZATION LOGIC:
   - Small amounts (£1-£10): Likely "Groceries", "Dining Out", or "Other"
   - Medium amounts (£10-£50): Could be "Groceries", "Entertainment", "Subscriptions"
   - Large amounts (£50+): Likely "Entertainment", "Holiday Fund", or major purchases
   - Round amounts (£20, £50, £100): Often "Other" (withdrawals, transfers)
   - Decimal amounts (£19.99, £29.99): Often "Subscriptions" or "Entertainment"
   - Recurring amounts: Likely "Subscriptions" or regular bills
   - Very small amounts (£0.01-£1): Often "Other" (bank charges, fees)

   FREQUENCY-BASED CATEGORIZATION:
   - Monthly recurring: Likely "Subscriptions", "Rent/Mortgage", "Utilities"
   - Weekly recurring: Likely "Groceries", "Fuel", "Dining Out"
   - Daily recurring: Likely "Dining Out", "Transport"
   - One-off large amounts: Likely "Entertainment", "Holiday Fund", "Car Maintenance"
   - Multiple small amounts same day: Likely "Groceries" or "Dining Out"
   - Same amount monthly: Likely "Subscriptions" or regular bills

                      CRITICAL CATEGORIZATION RULES - EVERY TRANSACTION MUST BE CATEGORIZED:
                   - You MUST categorize EVERY SINGLE TRANSACTION - NO EXCEPTIONS
                   - Look at transaction descriptions, vendor names, amounts, and patterns to infer categories
                   - For recurring payments: check if they match subscription, utility, or service categories
                   - For shopping: determine if it's groceries, entertainment, clothing, or other based on vendor
                   - For transfers: categorize based on destination (savings, investments, etc.)
                   - For ATM withdrawals: categorize as "Other" unless you can infer purpose
                   - For bank fees: categorize as "Other"
                   - For unknown vendors: use context clues (amount, frequency, similar transactions)
                   - For ambiguous transactions: make your best educated guess based on available information
                   - NEVER leave a transaction uncategorized - if truly uncertain, use "Other"
                   - Use pattern recognition: similar amounts, recurring dates, vendor types
                   - Consider transaction context: time of month, amount size, vendor reputation
                   - Every transaction MUST have one of these exact category names - NO VARIATIONS
                   
                   CATEGORY BREAKDOWN RULES:
                   - Only include categories where money was actually spent (amount > 0)
                   - Do NOT include categories with zero spending
                   - Calculate percentage based on total spending (not total income)
                   - Ensure all percentages add up to 100% of total spending

4. DETAILED ANALYSIS: Provide comprehensive insights that a professional financial advisor would give

5. FINAL VALIDATION: Before returning the JSON, verify that:
   - EVERY transaction has a category field
   - NO transaction is missing a category
   - All categories use EXACT names from the list above
   - If you find any uncategorized transactions, categorize them as "Other"
   - Double-check that the transaction count matches the number of categorized transactions

RETURN THIS EXACT JSON STRUCTURE:
{
  "bankName": "string (extract from statement)",
  "accountType": "string (Current Account, Savings, Business, etc.)",
  "statementPeriod": {
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD"
  },
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "exact transaction description from statement",
      "amount": number (positive for credits, negative for debits),
      "type": "credit|debit",
      "category": "string (smart categorization)",
      "vendor": "string (extract vendor name)"
    }
  ],
  "summary": {
    "totalSpending": number,
    "totalIncome": number,
    "netPosition": number,
    "periodDays": number,
    "transactionCount": number
  },
  "categoryBreakdown": [
    {
      "category": "string",
      "amount": number,
      "percentage": number,
      "transactionCount": number,
      "averageTransaction": number,
      "trend": "increasing|decreasing|stable"
    }
  ],
  "spendingPatterns": {
    "dailyAverage": number,
    "weeklyAverage": number,
    "highestSpendingDay": "string",
    "lowestSpendingDay": "string",
    "weekendVsWeekday": {
      "weekend": number,
      "weekday": number,
      "difference": number
    }
  },
  "topVendors": [
    {
      "vendor": "string",
      "totalSpent": number,
      "transactionCount": number,
      "category": "string",
      "averageAmount": number
    }
  ],
  "financialHealth": {
    "score": number (1-100),
    "status": "excellent|good|fair|poor",
    "factors": ["string"],
    "recommendations": ["string"]
  },
  "savingsOpportunities": [
    {
      "category": "string",
      "currentSpending": number,
      "potentialSavings": number,
      "savingsPercentage": number,
      "recommendations": ["string"]
    }
  ],
  "insights": {
    "summary": "string (professional financial summary)",
    "keyFindings": ["string"],
    "warnings": ["string"],
    "advice": ["string"],
    "trends": ["string"]
  },
  "recommendations": {
    "immediate": ["string"],
    "shortTerm": ["string"],
    "longTerm": ["string"],
    "priority": "high|medium|low"
  }
}

ANALYSIS INSTRUCTIONS:
1. READ EVERY LINE: Don't miss any transactions
2. EXTRACT BANK INFO: Look for bank name, logo, account details
3. SMART CATEGORIES: Use transaction descriptions to categorize intelligently
4. ACCURATE DATES: Use the actual statement dates
5. PROFESSIONAL INSIGHTS: Provide advice like a financial advisor would
6. ACTIONABLE RECOMMENDATIONS: Give specific, implementable advice
7. CURRENCY: All amounts in pounds (£)
8. FORMAT: Return ONLY valid JSON - no additional text

CRITICAL JSON REQUIREMENTS:
- Escape all quotes within string values using backslashes
- Do not include any newlines or special characters in string values
- Ensure all strings are properly quoted
- No trailing commas
- Valid JSON syntax that can be parsed immediately
- Keep descriptions concise (max 50 characters) to avoid truncation
- Prioritize essential data over verbose descriptions
- If you have many transactions, focus on the most important ones first

PDF FILE: ${fileName}
Analyze this bank statement with the precision and insight of a senior financial analyst.`;
  }

  /**
   * Build the prompt for bank statement analysis
   */
  private buildBankStatementAnalysisPrompt(request: BankStatementAnalysisRequest): string {
    const { transactions, statementMetadata, userContext } = request;
    
    const totalSpending = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalIncome = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netPosition = totalIncome - totalSpending;
    
    const categoryBreakdown = transactions
      .filter(t => t.type === 'debit')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
    
    const topVendors = transactions
      .filter(t => t.type === 'debit')
      .reduce((acc, t) => {
        const vendor = t.description.split(' ')[0];
        if (!acc[vendor]) {
          acc[vendor] = { total: 0, count: 0, category: t.category };
        }
        acc[vendor].total += t.amount;
        acc[vendor].count += 1;
        return acc;
      }, {} as Record<string, { total: number; count: number; category: string }>);
    
    const vendorList = Object.entries(topVendors)
      .map(([vendor, data]) => ({
        vendor,
        totalSpent: data.total,
        transactionCount: data.count,
        category: data.category,
        averageAmount: data.total / data.count
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    return `Analyze this bank statement and provide professional financial insights. Return ONLY valid JSON.

IMPORTANT: Your response must be complete, valid JSON that can be parsed immediately.

{
  "analysis": {
    "id": "generated-id",
    "statementId": "statement-id",
    "userId": "user-id",
    "analysisDate": "2024-01-01",
    
    "totalSpending": ${totalSpending},
    "totalIncome": ${totalIncome},
    "netPosition": ${netPosition},
    "periodDays": ${this.calculatePeriodDays(statementMetadata.startDate, statementMetadata.endDate)},
    
    "categoryBreakdown": [
      {
        "category": "Category Name",
        "amount": 0,
        "percentage": 0,
        "transactionCount": 0,
        "averageTransaction": 0,
        "trend": "stable"
      }
    ],
    
    "spendingPatterns": {
      "dailyAverage": 0,
      "weeklyAverage": 0,
      "highestSpendingDay": "Monday",
      "lowestSpendingDay": "Sunday",
      "weekendVsWeekday": {
        "weekend": 0,
        "weekday": 0,
        "difference": 0
      }
    },
    
    "topVendors": [
      {
        "vendor": "Vendor Name",
        "totalSpent": 0,
        "transactionCount": 0,
        "category": "Category",
        "averageAmount": 0
      }
    ],
    
    "financialHealth": {
      "score": 75,
      "status": "good",
      "factors": ["Factor 1", "Factor 2"],
      "recommendations": ["Recommendation 1", "Recommendation 2"]
    },
    
    "savingsOpportunities": [
      {
        "category": "Category",
        "currentSpending": 0,
        "potentialSavings": 0,
        "savingsPercentage": 0,
        "recommendations": ["Suggestion 1", "Suggestion 2"]
      }
    ],
    
    "insights": {
      "summary": "Brief summary of financial situation",
      "keyFindings": ["Finding 1", "Finding 2"],
      "warnings": ["Warning 1", "Warning 2"],
      "advice": ["Advice 1", "Advice 2"],
      "trends": ["Trend 1", "Trend 2"]
    },
    
    "recommendations": {
      "immediate": ["Action 1", "Action 2"],
      "shortTerm": ["Action 1", "Action 2"],
      "longTerm": ["Action 1", "Action 2"],
      "priority": "medium"
    }
  }
}

STATEMENT DETAILS:
- File: ${statementMetadata.fileName}
- Bank: ${statementMetadata.bank}
- Account: ${statementMetadata.accountType}
- Period: ${statementMetadata.startDate} to ${statementMetadata.endDate}
- Total Transactions: ${transactions.length}
- Total Spending: £${totalSpending.toFixed(2)}
- Total Income: £${totalIncome.toFixed(2)}
- Net Position: £${netPosition.toFixed(2)}

CATEGORY BREAKDOWN:
${Object.entries(categoryBreakdown).map(([category, amount]) => 
  `- ${category}: £${amount.toFixed(2)} (${((amount / totalSpending) * 100).toFixed(1)}%)`
).join('\n')}

TOP VENDORS:
${vendorList.map(v => 
  `- ${v.vendor}: £${v.totalSpent.toFixed(2)} (${v.transactionCount} transactions, avg: £${v.averageAmount.toFixed(2)})`
).join('\n')}

USER CONTEXT:
- Monthly Income: £${userContext?.monthlyIncome || 'Unknown'}
- Financial Goals: ${userContext?.financialGoals?.join(', ') || 'Not specified'}

ANALYSIS REQUIREMENTS:
1. Provide professional financial insights based on spending patterns
2. Identify potential savings opportunities
3. Assess financial health based on income vs spending
4. Give actionable recommendations for improvement
5. Consider user's income level and financial goals
6. Provide specific, actionable advice
7. Use professional financial terminology
8. Focus on practical money-saving tips

Return ONLY valid JSON with no additional text.`;
  }

  /**
   * Build the prompt for overall analysis
   */
  private buildOverallAnalysisPrompt(statements: Array<{transactions: Array<{date: string; description: string; amount: number; type: string; category: string}>; totalTransactions: number; totalDebits: number; totalCredits: number; startDate: string}>): string {
    const totalStatements = statements.length;
    const totalTransactions = statements.reduce((sum, s) => sum + s.totalTransactions, 0);
    const totalSpending = statements.reduce((sum, s) => sum + s.totalDebits, 0);
    const totalIncome = statements.reduce((sum, s) => sum + s.totalCredits, 0);
    const netPosition = totalIncome - totalSpending;
    
    const monthlyBreakdown = this.getMonthlyBreakdown(statements);
    
    return `Analyze all bank statements and provide comprehensive financial insights. Return ONLY valid JSON.

IMPORTANT: Your response must be complete, valid JSON that can be parsed immediately.

{
  "overallAnalysis": {
    "id": "overall-analysis-id",
    "userId": "user-id",
    "analysisDate": "2024-01-01",
    "lastUpdated": "2024-01-01",
    
    "totalStatements": ${totalStatements},
    "totalTransactions": ${totalTransactions},
    "totalSpending": ${totalSpending},
    "totalIncome": ${totalIncome},
    "netPosition": ${netPosition},
    "analysisPeriod": {
      "startDate": "2024-01-01",
      "endDate": "2024-12-31",
      "days": 365
    },
    
    "spendingTrends": [
      {
        "month": "2024-01",
        "spending": 0,
        "income": 0,
        "net": 0,
        "change": 0
      }
    ],
    
    "categoryEvolution": [
      {
        "category": "Category",
        "trend": "stable",
        "changePercentage": 0,
        "averageMonthlySpending": 0
      }
    ],
    
    "healthTrends": [
      {
        "month": "2024-01",
        "score": 75,
        "status": "good",
        "factors": ["Factor 1", "Factor 2"]
      }
    ],
    
    "overallRecommendations": {
      "summary": "Overall financial summary",
      "priorities": ["Priority 1", "Priority 2"],
      "actions": ["Action 1", "Action 2"],
      "timeline": "3-6 months"
    }
  }
}

OVERALL FINANCIAL SUMMARY:
- Total Statements: ${totalStatements}
- Total Transactions: ${totalTransactions}
- Total Spending: £${totalSpending.toFixed(2)}
- Total Income: £${totalIncome.toFixed(2)}
- Net Position: £${netPosition.toFixed(2)}

MONTHLY BREAKDOWN:
${monthlyBreakdown.map(m => 
  `- ${m.month}: Spending £${m.spending.toFixed(2)}, Income £${m.income.toFixed(2)}, Net £${m.net.toFixed(2)}`
).join('\n')}

ANALYSIS REQUIREMENTS:
1. Identify long-term spending trends
2. Assess overall financial health progression
3. Provide strategic financial recommendations
4. Consider income stability and spending patterns
5. Give actionable long-term financial advice
6. Focus on wealth-building strategies
7. Identify recurring financial issues
8. Suggest lifestyle and spending habit improvements

Return ONLY valid JSON with no additional text.`;
  }

  /**
   * Calculate period days between two dates
   */
  private calculatePeriodDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get monthly breakdown from statements
   */
  private getMonthlyBreakdown(statements: Array<{transactions: Array<{date: string; amount: number; type: string}>; startDate: string; totalDebits: number; totalCredits: number}>): Array<{
    month: string;
    spending: number;
    income: number;
    net: number;
  }> {
    const monthlyData: Record<string, { spending: number; income: number }> = {};
    
    statements.forEach(statement => {
      const month = statement.startDate.substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { spending: 0, income: 0 };
      }
      monthlyData[month].spending += statement.totalDebits;
      monthlyData[month].income += statement.totalCredits;
    });
    
    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        spending: data.spending,
        income: data.income,
        net: data.income - data.spending
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Generate fallback analysis if AI fails
   */
  private generateFallbackAnalysis(request: BankStatementAnalysisRequest): BankStatementAnalysis {
    const { transactions, statementMetadata } = request;
    
    // Try to infer bank name from filename if not provided
    let bankName = statementMetadata.bank || 'Unknown Bank';
    if (bankName === 'Unknown Bank' && statementMetadata.fileName) {
      const fileName = statementMetadata.fileName.toLowerCase();
      if (fileName.includes('barclays')) bankName = 'Barclays Bank';
      else if (fileName.includes('hsbc')) bankName = 'HSBC Bank';
      else if (fileName.includes('natwest')) bankName = 'NatWest Bank';
      else if (fileName.includes('lloyds')) bankName = 'Lloyds Bank';
      else if (fileName.includes('santander')) bankName = 'Santander UK';
      else if (fileName.includes('nationwide')) bankName = 'Nationwide Building Society';
      else if (fileName.includes('halifax')) bankName = 'Halifax';
      else if (fileName.includes('tsb')) bankName = 'TSB Bank';
      else if (fileName.includes('co-op') || fileName.includes('coop')) bankName = 'Co-operative Bank';
      else if (fileName.includes('metro')) bankName = 'Metro Bank';
      else if (fileName.includes('virgin')) bankName = 'Virgin Money';
      else if (fileName.includes('first direct')) bankName = 'First Direct';
      else if (fileName.includes('m&s')) bankName = 'M&S Bank';
      else if (fileName.includes('tesco')) bankName = 'Tesco Bank';
      else if (fileName.includes('sainsbury')) bankName = 'Sainsbury\'s Bank';
      else if (fileName.includes('post office')) bankName = 'Post Office Money';
      else if (fileName.includes('yorkshire')) bankName = 'Yorkshire Building Society';
      else if (fileName.includes('coventry')) bankName = 'Coventry Building Society';
      else if (fileName.includes('skipton')) bankName = 'Skipton Building Society';
      else if (fileName.includes('leeds')) bankName = 'Leeds Building Society';
      
      if (bankName !== 'Unknown Bank') {
        console.log(`🔍 Inferred bank name "${bankName}" from filename`);
      }
    }
    
    const totalSpending = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalIncome = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netPosition = totalIncome - totalSpending;
    
    const categoryBreakdown = transactions
      .filter(t => t.type === 'debit')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
    
    const categoryAnalysis = Object.entries(categoryBreakdown)
      .filter(([category, amount]) => amount > 0) // Only show categories with spending
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalSpending) * 100,
        transactionCount: transactions.filter(t => t.category === category && t.type === 'debit').length,
        averageTransaction: amount / transactions.filter(t => t.category === category && t.type === 'debit').length,
        trend: 'stable' as const
      }));
    
    return {
      id: crypto.randomUUID(),
      statementId: 'fallback-id',
      userId: 'fallback-user',
      analysisDate: new Date().toISOString(),
      bankName: bankName,
      accountType: statementMetadata.accountType || 'Current Account',
      statementPeriod: {
        startDate: statementMetadata.startDate,
        endDate: statementMetadata.endDate
      },
      transactions: transactions.map(t => ({
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.category,
        vendor: t.description.split(' ')[0] || 'Unknown'
      })),
      summary: {
        totalSpending,
        totalIncome,
        netPosition,
        periodDays: this.calculatePeriodDays(statementMetadata.startDate, statementMetadata.endDate),
        transactionCount: transactions.length,
        monthlyIncome: 0, // Will be populated from Firebase
        incomeVsSpending: {
          percentage: totalSpending > 0 ? (totalSpending / (totalIncome || 1)) * 100 : 0,
          remaining: (totalIncome || 0) - totalSpending,
          status: totalSpending > (totalIncome || 0) ? 'over_budget' : totalSpending < (totalIncome || 0) * 0.8 ? 'excellent_savings' : 'within_budget'
        }
      },
      categoryBreakdown: categoryAnalysis,
      spendingPatterns: {
        dailyAverage: totalSpending / this.calculatePeriodDays(statementMetadata.startDate, statementMetadata.endDate),
        weeklyAverage: (totalSpending / this.calculatePeriodDays(statementMetadata.startDate, statementMetadata.endDate)) * 7,
        highestSpendingDay: 'Monday',
        lowestSpendingDay: 'Sunday',
        weekendVsWeekday: {
          weekend: totalSpending * 0.4,
          weekday: totalSpending * 0.6,
          difference: totalSpending * 0.2
        }
      },
      topVendors: [],
      financialHealth: {
        score: netPosition > 0 ? 75 : 50,
        status: netPosition > 0 ? 'good' : 'fair',
        factors: ['Basic analysis available'],
        recommendations: ['Upload more statements for better insights']
      },
      savingsOpportunities: [],
      insights: {
        summary: 'Basic analysis completed. Upload more statements for comprehensive insights.',
        keyFindings: ['Analysis based on available data'],
        warnings: [],
        advice: ['Continue tracking your spending'],
        trends: ['Basic trend analysis available']
      },
      recommendations: {
        immediate: ['Review your spending categories'],
        shortTerm: ['Set spending limits for high-expense categories'],
        longTerm: ['Create a comprehensive budget plan'],
        priority: 'medium'
      }
    };
  }

  /**
   * Generate fallback overall analysis
   */
  private async generateFallbackOverallAnalysis(statements: Array<{transactions: Array<{date: string; amount: number; type: string; category: string}>; startDate: string; endDate: string; totalDebits: number; totalCredits: number; totalTransactions: number}>, userId: string): Promise<OverallAnalysis> {
    const totalStatements = statements.length;
    
    // Calculate totals from actual transaction data, not summary fields
    let totalTransactions = 0;
    let totalSpending = 0;
    let totalIncome = 0;
    
    statements.forEach(statement => {
      if (statement.transactions && Array.isArray(statement.transactions)) {
        statement.transactions.forEach((transaction: {date: string; amount: number; type: string; category: string}) => {
          totalTransactions++;
          if (transaction.type === 'debit') {
            totalSpending += Math.abs(transaction.amount || 0);
          } else if (transaction.type === 'credit') {
            totalIncome += Math.abs(transaction.amount || 0);
          }
        });
      } else {
        // Fallback to summary fields if transactions not available
        totalTransactions += statement.totalTransactions || 0;
        totalSpending += statement.totalDebits || 0;
        totalIncome += statement.totalCredits || 0;
      }
    });
    
    // Get user's monthly income from Firebase store
    let monthlyIncome = 0;
    try {
      // Try to get income from Firebase store
      const { useFirebaseStore } = await import('@/lib/store-firebase');
      monthlyIncome = useFirebaseStore.getState().income;
    } catch (error) {
      console.warn('Could not get income from Firebase store:', error);
    }
    
    // Calculate net position: monthly income * number of months - total spending
    const monthsCovered = totalStatements; // Each statement typically covers 1 month
    const totalIncomeForPeriod = monthlyIncome * monthsCovered;
    const netPosition = totalIncomeForPeriod - totalSpending;
    
    console.log('📊 Multi-statement calculation:', {
      totalStatements,
      monthsCovered,
      monthlyIncome,
      totalIncomeForPeriod,
      totalSpending,
      netPosition
    });
    
    return {
      id: crypto.randomUUID(),
      userId,
      analysisDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      totalStatements,
      totalTransactions,
      totalSpending,
      totalIncome: totalIncomeForPeriod, // Use calculated total income for the period
      netPosition,
      analysisPeriod: {
        startDate: statements[0]?.startDate || new Date().toISOString(),
        endDate: statements[statements.length - 1]?.endDate || new Date().toISOString(),
        days: 30
      },
      spendingTrends: [{
        month: `${monthsCovered} Month${monthsCovered > 1 ? 's' : ''} Combined`,
        spending: totalSpending,
        income: totalIncomeForPeriod,
        net: netPosition,
        change: 0,
        monthlyIncome: monthlyIncome || 0,
        percentageOfIncome: monthlyIncome > 0 ? (totalSpending / totalIncomeForPeriod) * 100 : 0,
        savingsRate: monthlyIncome > 0 ? ((totalIncomeForPeriod - totalSpending) / totalIncomeForPeriod) * 100 : 0
      }],
      categoryEvolution: [{
        category: 'General',
        trend: 'stable' as const,
        changePercentage: 0,
        averageMonthlySpending: totalSpending
      }],
      healthTrends: [{
        month: 'Current',
        score: netPosition > 0 ? 75 : 50,
        status: netPosition > 0 ? 'good' : 'fair',
        factors: ['Basic analysis available']
      }],
      overallRecommendations: {
        summary: 'Basic overall analysis completed. More data needed for comprehensive insights.',
        priorities: ['Continue tracking spending', 'Upload more statements'],
        actions: ['Review spending patterns', 'Set financial goals'],
        timeline: '3-6 months'
      }
    };
  }
}

// Export singleton instance
export const aiBudgetIntegration = new AIBudgetIntegrationService();
export const bankStatementAnalysis = new BankStatementAnalysisService();
