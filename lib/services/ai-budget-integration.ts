import { AIAnalysisData } from '@/lib/types/ai';
import { Budget, Allocation } from '@/lib/store-firebase';
import { generateText } from '@/lib/gemini';

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
  validateAllocations: (allocations: BudgetAllocation[], monthlyIncome: number, existingDebts?: any[], existingGoals?: any[]) => boolean;

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
    existingDebts: any[], 
    existingGoals: any[]
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
    existingDebts: any[], 
    existingGoals: any[]
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
        const allocations: BudgetAllocation[] = parsedResponse.allocations.map((alloc: any, index: number) => ({
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
    existingDebts: any[], 
    existingGoals: any[]
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
    userDebts: any[], 
    userGoals: any[]
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
  validateAllocations(allocations: BudgetAllocation[], monthlyIncome: number, existingDebts: any[] = [], existingGoals: any[] = []): boolean {
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
    return allocations.map(allocation => ({
      category: allocation.category,
      amount: allocation.amount,
      description: allocation.description
    }));
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

// Export singleton instance
export const aiBudgetIntegration = new AIBudgetIntegrationService();
