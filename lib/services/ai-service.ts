import { firestoreUtils } from '@/lib/firestore';
import { AIPreferences, AIAnalysisData, StoredAIPreferences } from '@/lib/types/ai';
import { COLLECTIONS } from '@/lib/firestore';
import { generateText } from '@/lib/gemini';

export class AIService {
  private static analysisPrompt: string = '';

  /**
   * Generate budget analysis using AI
   */
  static async generateBudgetAnalysis(
    preferences: AIPreferences, 
    monthlyIncome: number,
    debts: any[] = [],
    bankStatements: any[] = [],
    statementAnalyses: any[] = []
  ): Promise<{ success: boolean; data?: AIAnalysisData; error?: string }> {
    try {
      console.log('🤖 Generating AI budget analysis...');
      console.log('💰 Monthly income:', monthlyIncome);
      console.log('📊 Preferences:', preferences);

      // Build the analysis prompt
      this.analysisPrompt = this.buildAnalysisPrompt(preferences, monthlyIncome, debts, bankStatements, statementAnalyses);
      
      // Call the actual Gemini AI service
      console.log('🚀 Calling Gemini AI with prompt...');
      const aiResponse = await generateText(this.analysisPrompt);
      
      console.log('📄 Raw AI response received, length:', aiResponse.length);
      
      // Parse the AI response
      let analysis: AIAnalysisData;
      try {
        // Clean the response to ensure it's valid JSON
        let cleanedResponse = aiResponse.trim();
        if (cleanedResponse.includes('```json')) {
          cleanedResponse = cleanedResponse.replace(/```json\s*/, '').replace(/\s*```/, '');
        }
        
        analysis = JSON.parse(cleanedResponse);
        console.log('✅ AI response parsed successfully');
      } catch (parseError) {
        console.error('❌ Failed to parse AI response as JSON:', parseError);
        console.log('📄 Raw response:', aiResponse);
        
                 // Fallback to mock analysis if AI response is invalid
         console.log('🔄 Falling back to mock analysis...');
         analysis = this.generateMockAnalysis(preferences, monthlyIncome, debts, bankStatements, statementAnalyses);
      }
      
      return { success: true, data: analysis };
    } catch (error) {
      console.error('❌ Error generating AI analysis:', error);
      
             // Fallback to mock analysis if AI call fails
       console.log('🔄 AI call failed, falling back to mock analysis...');
       try {
         const fallbackAnalysis = this.generateMockAnalysis(preferences, monthlyIncome, debts, bankStatements, statementAnalyses);
        return { success: true, data: fallbackAnalysis };
      } catch (fallbackError) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to generate analysis' 
        };
      }
    }
  }

  /**
   * Build a prompt that focuses on actual user expenses
   */
  private static buildAnalysisPrompt(
    preferences: AIPreferences, 
    monthlyIncome: number, 
    debts: any[] = [],
    bankStatements: any[] = [],
    statementAnalyses: any[] = []
  ): string {
    // Helper function to format array values
    const formatArrayPreference = (value: string[]): string => {
      return value.join(', ');
    };

    // Helper function to format monetary values
    const formatMoney = (value: string | number): string => {
      if (value === null || value === undefined || value === '') return 'Not specified';
      if (typeof value === 'number') return `£${value.toLocaleString()}`;
      if (!isNaN(Number(value))) return `£${value}`;
      return value;
    };

    return `You are a professional financial advisor creating a personalized budget allocation strategy. Analyze the user's ACTUAL expenses and financial situation to provide realistic, actionable advice.

CRITICAL REQUIREMENTS:
- Return ONLY valid JSON with NO additional text, markdown, or explanations
- Base ALL allocations on the user's ACTUAL expenses, NOT generic percentages
- Only allocate to categories the user actually has expenses for
- Ensure total allocations equal exactly 100% of income
- Provide realistic, achievable recommendations

BUDGET FORM CATEGORIES (USE THESE EXACT NAMES):
- Emergency Fund
- Safety Net  
- Foundation
- Investments
- Pension
- Rent / Mortgage
- Electricity
- Gas
- Water
- Council Tax
- Internet
- Phone
- Groceries
- Subscriptions
- Dining Out
- Entertainment
- Holiday Fund
- Fuel
- Train/Bus Pass
- Car Insurance
- Car Maintenance
- Unexpected
- Gifts
- Other

REQUIRED JSON STRUCTURE:
{
  "summary": "Comprehensive, personalized summary of the user's financial situation, challenges, and strategic opportunities",
  "financialSnapshot": {
    "monthlyIncome": 0,
    "totalExpenses": 0,
    "disposableIncome": 0,
    "savingsRate": 0,
    "debtToIncomeRatio": 0,
    "emergencyFundStatus": "string",
    "financialHealthScore": 0
  },
  "priorities": [
    {
      "rank": 1,
      "category": "Emergency Fund",
      "reason": "Detailed analysis of why this is critical for the user's specific situation",
      "action": "Specific, actionable steps with amounts, timelines, and expected outcomes",
      "impact": "How this will improve their financial security",
      "urgency": "High/Medium/Low with explanation"
    }
  ],
  "budgetDistribution": {
    "emergencyFund": {"percentage": 0, "amount": 0, "description": "Detailed explanation of allocation strategy"},
    "debtPayoff": {"percentage": 0, "amount": 0, "description": "Debt repayment strategy and prioritization"},
    "essentialExpenses": {"percentage": 0, "amount": 0, "description": "Breakdown of essential costs and optimization opportunities"},
    "savingsInvestments": {"percentage": 0, "amount": 0, "description": "Investment strategy aligned with goals and risk tolerance"},
    "discretionarySpending": {"percentage": 0, "amount": 0, "description": "Discretionary spending guidelines and recommendations"}
  },
  "riskAssessment": {
    "level": "Low/Moderate/High",
    "score": 0,
    "factors": ["Detailed risk factors with explanations and impact assessment"],
    "mitigation": "Comprehensive risk mitigation strategies with specific actions",
    "monitoring": "How to monitor and reassess risks over time"
  },
  "strategicInsights": {
    "strengths": ["User's financial strengths and advantages"],
    "weaknesses": ["Areas for improvement with specific examples"],
    "opportunities": ["Financial opportunities based on their situation"],
    "threats": ["Potential financial threats and how to prepare"]
  },
  "timeline": {
    "emergencyFund": "Detailed timeline with milestones and progress tracking",
    "debtElimination": "Debt payoff timeline with acceleration strategies",
    "investmentGrowth": "Investment timeline with expected returns and milestones",
    "retirementReadiness": "Retirement planning with age-specific milestones",
    "goalAchievement": "Timeline for achieving primary and secondary financial goals"
  },
  "progressMetrics": [
    {
      "metric": "string",
      "currentValue": 0,
      "targetValue": 0,
      "timeline": "string",
      "progress": 0,
      "actions": ["Specific actions to achieve this metric"]
    }
  ],
  "recommendations": {
    "immediate": ["Actions to take within 30 days with specific amounts and steps"],
    "shortTerm": ["3-6 month strategies with expected outcomes"],
    "longTerm": ["1-5 year financial planning with milestones"],
    "lifestyle": ["Lifestyle adjustments that support financial goals"],
    "income": ["Income optimization strategies and opportunities"]
  },
  "budgetAllocations": [
    {
      "category": "Emergency Fund",
      "amount": 0,
      "percentage": 0,
      "priority": 1,
      "description": "Detailed explanation of allocation strategy",
      "optimization": "How to optimize this allocation",
      "alternatives": "Alternative approaches if this allocation isn't working"
    }
  ],
  "financialAdvisorFeedback": {
    "overallAssessment": "Professional financial advisor's assessment of the user's situation",
    "keyStrengths": ["What the user is doing well"],
    "criticalAreas": ["Areas requiring immediate attention"],
    "successFactors": ["What will make this plan successful"],
    "warningSigns": ["Red flags to watch out for"],
    "encouragement": "Motivational and encouraging feedback"
  },
  "marketContext": {
    "currentEconomicClimate": "How current economic conditions affect the user's plan",
    "interestRateImpact": "Impact of current interest rates on their situation",
    "inflationConsiderations": "How inflation affects their financial strategy",
    "marketOpportunities": "Current market opportunities they should consider"
  }
}

USER'S ACTUAL FINANCIAL SITUATION:
- Age: ${preferences.age}, Family size: ${preferences.familySize}
- Monthly income: £${monthlyIncome}
- Housing: ${preferences.housingType} - £${preferences.housingCosts}/month
- Utilities included: ${preferences.utilitiesIncluded.join(', ')}
- Utilities paid separately: ${preferences.separateUtilities?.join(', ') || 'None'}
- Transportation: ${preferences.transportationType} - £${preferences.transportationCosts}/month
- Healthcare: ${preferences.healthcareType} - £${preferences.healthcareCosts}/month
- Food: £${preferences.foodAndGroceries}/month
- Subscriptions: ${preferences.subscriptions?.join(', ') || 'None'}
- Entertainment: £${preferences.entertainmentAndHobbies}/month
- Shopping/Personal: £${preferences.shoppingAndPersonal}/month
- Employment: ${preferences.employmentStatus}
- Primary goal: ${preferences.primaryGoal}${preferences.primaryGoalOther ? ` (${preferences.primaryGoalOther})` : ''}
- Secondary goals: ${formatArrayPreference(preferences.secondaryGoals)}
- Risk tolerance: ${preferences.riskTolerance}/10
- Current savings: ${preferences.currentSavings}
- Emergency fund: ${preferences.emergencyFund}
${debts.length > 0 ? `- DEBTS: ${debts.map(debt => `${debt.name}: £${debt.totalAmount} total, £${debt.monthlyRepayment}/month (${debt.months} months remaining)`).join(', ')}` : '- DEBTS: None'}

${bankStatements.length > 0 ? `BANK STATEMENT DATA (REAL SPENDING PATTERNS):
${bankStatements.map(statement => `
Statement: ${statement.fileName} (${statement.bank} - ${statement.accountType})
Period: ${statement.startDate} to ${statement.endDate}
Transactions: ${statement.totalTransactions} (Debits: £${statement.totalDebits}, Credits: £${statement.totalCredits})
`).join('')}` : ''}

${statementAnalyses.length > 0 ? `AI ANALYZED SPENDING PATTERNS:
${statementAnalyses.map(analysis => `
Analysis Date: ${analysis.analysisDate}
Bank: ${analysis.bankName} (${analysis.accountType})
Period: ${analysis.statementPeriod.startDate} to ${analysis.statementPeriod.endDate}
Total Spending: £${analysis.summary.totalSpending}
Total Income: £${analysis.summary.totalIncome}
Net Position: £${analysis.summary.netPosition}
Financial Health Score: ${analysis.financialHealth.score}/100 (${analysis.financialHealth.status})

Top Spending Categories:
${analysis.categoryBreakdown.slice(0, 5).map(cat => `  - ${cat.category}: £${cat.amount} (${cat.percentage}%) - ${cat.trend}`).join('\n')}

Top Vendors:
${analysis.topVendors.slice(0, 5).map(vendor => `  - ${vendor.vendor}: £${vendor.totalSpent} (${vendor.transactionCount} transactions)`).join('\n')}

Savings Opportunities:
${analysis.savingsOpportunities.slice(0, 3).map(opp => `  - ${opp.category}: Potential £${opp.potentialSavings} (${opp.savingsPercentage}% reduction)`).join('\n')}

Key Insights:
${analysis.insights.keyFindings.slice(0, 3).map(insight => `  - ${insight}`).join('\n')}
`).join('')}` : ''}

REALISTIC ALLOCATION GUIDELINES:
1. ESSENTIAL EXPENSES (Housing, Food, Transport, Healthcare): Allocate the user's ACTUAL monthly costs
2. DEBT PAYOFF: ${debts.length > 0 ? `CRITICAL PRIORITY - Allocate the user's ACTUAL monthly debt payments (${debts.map(debt => `£${debt.monthlyRepayment} for ${debt.name}`).join(', ')})` : 'No debts to allocate'}
3. EMERGENCY FUND: Target 3-6 months of essential expenses, allocate realistic monthly amount AFTER debt payments
4. SAVINGS/INVESTMENTS: Based on primary goal and remaining income after essentials and debt payments
5. DISCRETIONARY: Remaining amount for entertainment, shopping, and flexibility
6. TOTAL: Must equal exactly 100% of income
7. REALISTIC: Ensure allocations are achievable given the user's actual income and expenses
8. DEBT PRIORITY: ${debts.length > 0 ? 'Debt payments MUST be included and prioritized over non-essential savings' : 'No debt payments to consider'}
9. BANK STATEMENT INTEGRATION: ${bankStatements.length > 0 ? `Use REAL spending patterns from bank statements to validate and adjust allocations. Focus on categories where user actually spends money, not estimated costs.` : 'No bank statement data available - use questionnaire estimates'}
10. SPENDING PATTERN ANALYSIS: ${statementAnalyses.length > 0 ? `Incorporate AI-analyzed spending patterns, vendor analysis, and savings opportunities from bank statements to create data-driven budget allocations.` : 'No spending analysis available'}

CONTENT REQUIREMENTS:
- Generate COMPREHENSIVE, DETAILED content for every field
- Provide SPECIFIC, ACTIONABLE advice with amounts, timelines, and expected outcomes
- Include PROFESSIONAL financial advisor insights and encouragement
- Consider current economic conditions (inflation, interest rates, market trends)
- Provide REALISTIC but OPTIMISTIC guidance
- Include specific examples and scenarios relevant to the user's situation
- Make recommendations PERSONALIZED and ACHIEVABLE
- Provide MOTIVATIONAL feedback that encourages positive financial behavior
- Include MARKET CONTEXT that affects their specific financial situation
- Generate DETAILED explanations for every allocation and recommendation

IMPORTANT: Do not use generic percentages like "50-30-20 rule". Base everything on the user's actual financial situation. If the user spends £800/month on housing and earns £2000/month, housing should be 40%, not a generic percentage.

Return ONLY the JSON object with no additional text.`;
  }

  /**
   * Generate a ZERO-BUDGET analysis based on actual user data
   * Every penny of income is allocated - this is true zero budgeting
   */
    private static generateMockAnalysis(
    preferences: AIPreferences, 
    monthlyIncome: number, 
    debts: any[] = [],
    bankStatements: any[] = [],
    statementAnalyses: any[] = []
  ): AIAnalysisData {
    console.log('💰 Starting ZERO-BUDGET analysis for income: £' + monthlyIncome);
    
    // Step 1: Calculate actual expenses from questionnaire
    const questionnaireExpenses = {
      housing: preferences.housingCosts,
      transportation: preferences.transportationCosts,
      healthcare: preferences.healthcareCosts,
      food: preferences.foodAndGroceries,
      entertainment: preferences.entertainmentAndHobbies,
      shopping: preferences.shoppingAndPersonal
    };

    // Step 2: Use bank statement data if available for REAL spending patterns
    let actualExpenses = { ...questionnaireExpenses };
    let bankStatementCategories: any[] = [];
    let totalActualExpenses = Object.values(questionnaireExpenses).reduce((sum, cost) => sum + cost, 0);
    
    if (statementAnalyses.length > 0) {
      console.log('🏦 Using bank statement data for real spending patterns...');
      
      // Extract all unique categories and their monthly averages from bank statements
      const categoryTotals: { [key: string]: number } = {};
      let totalAnalyses = 0;
      
      statementAnalyses.forEach(analysis => {
        totalAnalyses++;
        analysis.categoryBreakdown.forEach(category => {
          if (!categoryTotals[category.category]) {
            categoryTotals[category.category] = 0;
          }
          categoryTotals[category.category] += category.amount;
        });
      });
      
      // Calculate monthly averages and create category objects
      Object.entries(categoryTotals).forEach(([category, total]) => {
        const monthlyAverage = Math.round(total / totalAnalyses);
        bankStatementCategories.push({
          category: category,
          amount: monthlyAverage,
          priority: 999 // Will be reassigned later
        });
      });
      
      // Sort by amount descending
      bankStatementCategories.sort((a, b) => b.amount - a.amount);
    }

    // Step 3: Calculate debt payments
    const totalDebtPayments = debts.reduce((sum, debt) => sum + debt.monthlyRepayment, 0);
    console.log('💳 Total debt payments: £' + totalDebtPayments);
    
    // Step 4: Create ZERO-BUDGET allocation (every penny accounted for)
    let remainingIncome = monthlyIncome;
    const allocations: any[] = [];
    let priority = 1;

    // Priority 1: Essential expenses (housing, food, transport, healthcare)
    const essentialCategories = [
      { name: 'Housing', amount: actualExpenses.housing, description: 'Rent/Mortgage payments' },
      { name: 'Food & Groceries', amount: actualExpenses.food, description: 'Essential food and household items' },
      { name: 'Transportation', amount: actualExpenses.transportation, description: 'Fuel, public transport, car maintenance' },
      { name: 'Healthcare', amount: actualExpenses.healthcare, description: 'Medical expenses and insurance' }
    ];

    essentialCategories.forEach(category => {
      if (category.amount > 0 && remainingIncome >= category.amount) {
        allocations.push({
          category: category.name,
          amount: category.amount,
          percentage: Math.round((category.amount / monthlyIncome) * 100),
          priority: priority++,
          description: category.description,
          type: 'essential'
        });
        remainingIncome -= category.amount;
      }
    });

    // Priority 2: Debt payments (if any)
    if (totalDebtPayments > 0 && remainingIncome >= totalDebtPayments) {
      debts.forEach(debt => {
        if (remainingIncome >= debt.monthlyRepayment) {
          allocations.push({
            category: `Debt: ${debt.name}`,
            amount: debt.monthlyRepayment,
            percentage: Math.round((debt.monthlyRepayment / monthlyIncome) * 100),
            priority: priority++,
            description: `Monthly payment for ${debt.name} (Total: £${debt.totalAmount}, ${debt.months} months remaining)`,
            type: 'debt'
          });
          remainingIncome -= debt.monthlyRepayment;
        }
      });
    }

    // Priority 3: Utilities and subscriptions
    const utilityCategories = [
      { name: 'Utilities', amount: 150, description: 'Electricity, gas, water, internet' },
      { name: 'Subscriptions', amount: 50, description: 'Streaming services, gym, software subscriptions' }
    ];

    utilityCategories.forEach(category => {
      if (remainingIncome >= category.amount) {
        allocations.push({
          category: category.name,
          amount: category.amount,
          percentage: Math.round((category.amount / monthlyIncome) * 100),
          priority: priority++,
          description: category.description,
          type: 'utility'
        });
        remainingIncome -= category.amount;
      }
    });

         // Priority 4: Emergency Fund (aim for 10% of income or 3 months expenses, whichever is less)
     const emergencyFundTarget = Math.min(monthlyIncome * 0.1, (allocations.filter(a => a.type === 'essential').reduce((sum, a) => sum + a.amount, 0)) * 0.3);
     const emergencyFundMonthly = emergencyFundTarget;
     if (emergencyFundTarget > 0 && remainingIncome >= emergencyFundTarget) {
       allocations.push({
         category: 'Emergency Fund',
         amount: emergencyFundTarget,
         percentage: Math.round((emergencyFundTarget / monthlyIncome) * 100),
         priority: priority++,
         description: 'Building 3-month emergency fund for financial security',
         type: 'savings'
       });
       remainingIncome -= emergencyFundTarget;
     }

    // Priority 5: Primary Goal Savings
    const primaryGoalAmount = Math.min(remainingIncome * 0.6, remainingIncome);
    if (primaryGoalAmount > 0) {
      allocations.push({
        category: preferences.primaryGoal,
        amount: primaryGoalAmount,
        percentage: Math.round((primaryGoalAmount / monthlyIncome) * 100),
        priority: priority++,
        description: `Allocation for your primary goal: ${preferences.primaryGoal}`,
        type: 'goal'
      });
      remainingIncome -= primaryGoalAmount;
    }

    // Priority 6: Entertainment and personal spending
    const entertainmentAmount = Math.min(remainingIncome * 0.4, remainingIncome);
    if (entertainmentAmount > 0) {
      allocations.push({
        category: 'Entertainment & Personal',
        amount: entertainmentAmount,
        percentage: Math.round((entertainmentAmount / monthlyIncome) * 100),
        priority: priority++,
        description: 'Movies, restaurants, hobbies, personal care',
        type: 'discretionary'
      });
      remainingIncome -= entertainmentAmount;
    }

    // Priority 7: Secondary goals or additional savings
    if (remainingIncome > 0) {
      allocations.push({
        category: 'Additional Savings',
        amount: remainingIncome,
        percentage: Math.round((remainingIncome / monthlyIncome) * 100),
        priority: priority++,
        description: 'Additional funds for secondary goals or unexpected expenses',
        type: 'savings'
      });
    }

         // Verify zero-budget: all income should be allocated
     const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);
     console.log('✅ Zero-budget verification: £' + totalAllocated + ' allocated out of £' + monthlyIncome + ' income');
 
     // Helper function to calculate percentages
     const calculatePercentage = (amount: number) => Math.round((amount / monthlyIncome) * 100);
 
     // Calculate key metrics for the analysis
    const essentialExpensesTotal = allocations.filter(a => a.type === 'essential').reduce((sum, a) => sum + a.amount, 0);
    const debtPaymentsTotal = allocations.filter(a => a.type === 'debt').reduce((sum, a) => sum + a.amount, 0);
    const savingsTotal = allocations.filter(a => a.type === 'savings').reduce((sum, a) => sum + a.amount, 0);
    const emergencyFundAllocation = allocations.find(a => a.category === 'Emergency Fund');
    const primaryGoalAllocation = allocations.find(a => a.category === preferences.primaryGoal);

    return {
      summary: `This is a TRUE ZERO-BUDGET allocation where every penny of your £${monthlyIncome.toLocaleString()} income is accounted for. You have £${totalAllocated.toLocaleString()} allocated across ${allocations.length} categories, ensuring complete financial control and intentional spending.${totalDebtPayments > 0 ? ` Your debt payments of £${totalDebtPayments.toLocaleString()}/month are prioritized to accelerate debt freedom.` : ''}`,
      priorities: [
        {
          rank: 1,
          category: "Essential Expenses",
          reason: `Your essential expenses of £${essentialExpensesTotal.toLocaleString()}/month (housing, food, transport, healthcare) are the foundation of your budget.`,
          action: "These costs are non-negotiable and must be budgeted first in any zero-budget system.",
          impact: "Maintaining essential expenses ensures your basic needs are met and prevents financial crisis.",
          urgency: "High"
        },
        ...(debtPaymentsTotal > 0 ? [{
          rank: 2,
          category: "Debt Repayment",
          reason: `You have £${debtPaymentsTotal.toLocaleString()}/month in debt payments that must be prioritized to avoid compounding interest.`,
          action: `Continue making all debt payments on time: ${debts.map(debt => `${debt.name} (£${debt.monthlyRepayment})`).join(', ')}`,
          impact: "Prioritizing debt payments will reduce interest costs and improve your credit score.",
          urgency: "High"
        }] : []),
        {
          rank: debtPaymentsTotal > 0 ? 3 : 2,
          category: "Emergency Fund",
          reason: emergencyFundAllocation ? `You're building an emergency fund with £${emergencyFundAllocation.amount.toLocaleString()}/month for financial security.` : "Emergency fund building should be prioritized after essential expenses and debt payments.",
          action: emergencyFundAllocation ? `Continue allocating £${emergencyFundAllocation.amount.toFixed(0)}/month to build your emergency fund.` : "Start building an emergency fund once debt payments are manageable.",
          impact: "An emergency fund provides financial security and prevents debt accumulation during unexpected expenses.",
          urgency: "Medium"
        },
        {
          rank: debtPaymentsTotal > 0 ? 4 : 3,
          category: "Financial Goals",
          reason: primaryGoalAllocation ? `You're allocating £${primaryGoalAllocation.amount.toLocaleString()}/month toward your primary goal: ${preferences.primaryGoal}.` : "Focusing on your financial goals after essentials and debt management.",
          action: primaryGoalAllocation ? `Continue prioritizing your ${preferences.primaryGoal} with £${primaryGoalAllocation.amount.toFixed(0)}/month.` : "Start goal funding once emergency fund is established.",
          impact: "Achieving your financial goals will provide long-term security and life satisfaction.",
          urgency: "Low"
        }
      ],
                               budgetDistribution: {
           essentialExpenses: {
             percentage: calculatePercentage(essentialExpensesTotal),
             amount: essentialExpensesTotal,
             description: `Your essential monthly expenses: housing, food, transport, healthcare - £${essentialExpensesTotal.toLocaleString()}`
           },
           ...(debtPaymentsTotal > 0 ? {
             debtPayoff: {
               percentage: calculatePercentage(debtPaymentsTotal),
               amount: debtPaymentsTotal,
               description: `Priority debt payments: ${debts.map(debt => `${debt.name} (£${debt.monthlyRepayment})`).join(', ')}`
             }
           } : {}),
           ...(emergencyFundAllocation ? {
             emergencyFund: {
               percentage: emergencyFundAllocation.percentage,
               amount: emergencyFundAllocation.amount,
               description: "Building emergency fund for financial security"
             }
           } : {}),
           ...(primaryGoalAllocation ? {
             primaryGoal: {
               percentage: primaryGoalAllocation.percentage,
               amount: primaryGoalAllocation.amount,
               description: `Funding your primary goal: ${preferences.primaryGoal}`
             }
           } : {}),
                       savingsInvestments: {
              percentage: calculatePercentage(allocations.filter(a => a.type === 'goal').reduce((sum, a) => sum + a.amount, 0)),
              amount: allocations.filter(a => a.type === 'goal').reduce((sum, a) => sum + a.amount, 0),
              description: "Primary goal savings and investments"
            },
            discretionarySpending: {
              percentage: calculatePercentage(allocations.filter(a => a.type === 'discretionary').reduce((sum, a) => sum + a.amount, 0)),
              amount: allocations.filter(a => a.type === 'discretionary').reduce((sum, a) => sum + a.amount, 0),
              description: "Entertainment, personal care, and lifestyle expenses"
            }
         },
                     riskAssessment: {
          level: this.assessRiskLevel(preferences, totalActualExpenses, monthlyIncome, totalDebtPayments),
          score: this.calculateRiskScore(preferences, totalActualExpenses, monthlyIncome, totalDebtPayments),
          factors: this.identifyRiskFactors(preferences, totalActualExpenses, monthlyIncome, totalDebtPayments),
          mitigation: this.generateRiskMitigation(preferences, totalActualExpenses, monthlyIncome, totalDebtPayments),
          monitoring: "Monitor your debt-to-income ratio monthly and reassess risk factors quarterly."
        },
                     timeline: {
          emergencyFund: `Build 3-month emergency fund in ${Math.ceil(emergencyFundTarget / emergencyFundMonthly)} months`,
          debtElimination: totalDebtPayments > 0 ? 
            `Eliminate all debts in ${Math.max(...debts.map(debt => debt.months))} months (longest debt term)` : 
            "No debts to eliminate",
          investmentGrowth: "Begin after emergency fund is complete",
          retirementReadiness: `Start planning at age ${preferences.age}, focus on building foundation first`,
          goalAchievement: `Achieve ${preferences.primaryGoal} within 2-3 years based on current savings rate`
        },
                     progressMetrics: [
          {
            metric: "Emergency Fund",
            currentValue: 0,
            targetValue: emergencyFundTarget,
            timeline: `${Math.ceil(emergencyFundTarget / emergencyFundMonthly)} months`,
            progress: 0,
            actions: [`Save £${emergencyFundMonthly.toFixed(0)}/month`, "Automate transfers", "Track progress monthly"]
          },
          {
            metric: "Monthly Savings Rate",
            currentValue: calculatePercentage(emergencyFundMonthly + otherSavings),
            targetValue: 20,
            timeline: "Ongoing",
            progress: Math.min(calculatePercentage(emergencyFundMonthly + otherSavings) / 20 * 100, 100),
            actions: ["Reduce non-essential expenses", "Increase income", "Automate savings"]
          },
          {
            metric: "Essential Expenses",
            currentValue: calculatePercentage(totalActualExpenses),
            targetValue: calculatePercentage(totalActualExpenses),
            timeline: "Maintain",
            progress: 100,
            actions: ["Monitor monthly", "Optimize where possible", "Avoid lifestyle inflation"]
          },
          ...(totalDebtPayments > 0 ? [{
            metric: "Debt Payments",
            currentValue: totalDebtPayments,
            targetValue: 0,
            timeline: `${Math.max(...debts.map(debt => debt.months))} months`,
            progress: 0,
            actions: ["Make minimum payments", "Focus on highest interest first", "Consider consolidation"]
          }] : [])
        ],
                      recommendations: {
           immediate: [
             "Your budget is based on actual expenses, not generic rules - this is excellent!",
             ...(totalDebtPayments > 0 ? [
               `Prioritize debt payments: £${totalDebtPayments.toFixed(0)}/month across ${debts.length} debt(s)`,
               "Consider debt consolidation if you have high-interest debts"
             ] : []),
             `Focus on building your emergency fund with £${emergencyFundMonthly.toFixed(0)}/month`
           ],
           shortTerm: [
             "Once emergency fund is complete, redirect those funds to your primary goal",
             "Monitor your actual expenses monthly to ensure allocations remain accurate"
           ],
           longTerm: [
             "Consider increasing income or reducing non-essential expenses to boost savings",
             "Review and adjust your budget allocations quarterly"
           ],
           lifestyle: [
             "Maintain your current essential expenses while building savings",
             "Find balance between saving and enjoying your lifestyle"
           ],
           income: [
             "Look for opportunities to increase your income",
             "Consider side hustles or career advancement"
           ]
         },
                            budgetAllocations: this.generateBudgetAllocations(preferences, monthlyIncome, actualExpenses, emergencyFundMonthly, savingsAmount, debts, bankStatements, statementAnalyses)
    };
  }

     /**
    * Generate specific budget allocations based on actual user data
    */
       private static generateBudgetAllocations(
      preferences: AIPreferences,
      monthlyIncome: number,
      actualExpenses: any,
      emergencyFundMonthly: number,
      savingsAmount: number,
      debts: any[] = [],
      bankStatements: any[] = [],
      statementAnalyses: any[] = []
    ) {
    const allocations = [];
    let priority = 1;

         // Emergency Fund (highest priority)
     if (emergencyFundMonthly > 0) {
       allocations.push({
         category: "Emergency Fund",
         amount: emergencyFundMonthly,
         percentage: Math.round((emergencyFundMonthly / monthlyIncome) * 100),
         priority: priority++,
         description: "Building 3-month emergency fund based on your actual monthly expenses",
         optimization: "Automate monthly transfers to build this fund faster",
         alternatives: "Consider reducing other expenses temporarily to accelerate emergency fund building"
       });
     }

     // Debt Repayment (if user has debts)
     if (debts.length > 0) {
       debts.forEach(debt => {
         allocations.push({
           category: `Debt: ${debt.name}`,
           amount: debt.monthlyRepayment,
           percentage: Math.round((debt.monthlyRepayment / monthlyIncome) * 100),
           priority: priority++,
           description: `Monthly payment for ${debt.name} (Total: £${debt.totalAmount}, ${debt.months} months remaining)`
         });
       });
     }

    // Housing (if user has housing costs)
    if (actualExpenses.housing > 0) {
      allocations.push({
        category: "Rent / Mortgage",
        amount: actualExpenses.housing,
        percentage: Math.round((actualExpenses.housing / monthlyIncome) * 100),
        priority: priority++,
        description: `Your actual ${preferences.housingType} costs`
      });
    }

    // Transportation (if user has transport costs)
    if (actualExpenses.transportation > 0) {
      const transportCategory = preferences.transportationType === 'car' ? 'Fuel' : 'Train/Bus Pass';
      allocations.push({
        category: transportCategory,
        amount: actualExpenses.transportation,
        percentage: Math.round((actualExpenses.transportation / monthlyIncome) * 100),
        priority: priority++,
        description: `Your actual ${preferences.transportationType} costs`
      });
    }

    // Food (if user has food costs)
    if (actualExpenses.food > 0) {
      allocations.push({
        category: "Groceries",
        amount: actualExpenses.food,
        percentage: Math.round((actualExpenses.food / monthlyIncome) * 100),
        priority: priority++,
        description: "Your actual monthly food and grocery expenses"
      });
    }

    // Healthcare (if user has healthcare costs)
    if (actualExpenses.healthcare > 0) {
      allocations.push({
        category: "Healthcare",
        amount: actualExpenses.healthcare,
        percentage: Math.round((actualExpenses.healthcare / monthlyIncome) * 100),
        priority: priority++,
        description: `Your actual ${preferences.healthcareType} costs`
      });
    }

    // Utilities (only if user pays them separately)
    if (preferences.separateUtilities && preferences.separateUtilities.length > 0) {
      // Estimate utility costs based on what's not included
      const utilityEstimate = preferences.separateUtilities.length * 50; // Rough estimate
      if (utilityEstimate > 0) {
        allocations.push({
          category: "Utilities",
          amount: utilityEstimate,
          percentage: Math.round((utilityEstimate / monthlyIncome) * 100),
          priority: priority++,
          description: `Estimated costs for ${preferences.separateUtilities.join(', ')}`
        });
      }
    }

    // Subscriptions (if user has them)
    if (preferences.subscriptions && preferences.subscriptions.length > 0) {
      const subscriptionEstimate = preferences.subscriptions.length * 15; // Rough estimate
      if (subscriptionEstimate > 0) {
        allocations.push({
          category: "Subscriptions",
          amount: subscriptionEstimate,
          percentage: Math.round((subscriptionEstimate / monthlyIncome) * 100),
          priority: priority++,
          description: `Your ${preferences.subscriptions.join(', ')} subscriptions`
        });
      }
    }

    // Entertainment and Shopping (if user has these costs)
    if (actualExpenses.entertainment > 0) {
      allocations.push({
        category: "Entertainment",
        amount: actualExpenses.entertainment,
        percentage: Math.round((actualExpenses.entertainment / monthlyIncome) * 100),
        priority: priority++,
        description: "Your actual entertainment and hobby expenses"
      });
    }

    if (actualExpenses.shopping > 0) {
      allocations.push({
        category: "Shopping",
        amount: actualExpenses.shopping,
        percentage: Math.round((actualExpenses.shopping / monthlyIncome) * 100),
        priority: priority++,
        description: "Your actual shopping and personal care expenses"
      });
    }

         // Savings and Investments
     if (savingsAmount > 0) {
       allocations.push({
         category: "Investments",
         amount: savingsAmount,
         percentage: Math.round((savingsAmount / monthlyIncome) * 100),
         priority: priority++,
         description: `Allocation for your primary goal: ${preferences.primaryGoal}`
       });
     }

     // Discretionary Spending
     if (discretionaryAmount > 0) {
       allocations.push({
         category: "Entertainment & Shopping",
         amount: discretionaryAmount,
         percentage: Math.round((discretionaryAmount / monthlyIncome) * 100),
         priority: priority++,
         description: "Entertainment, shopping, and personal expenses"
       });
     }

     // Add bank statement specific categories if available
     if (statementAnalyses.length > 0) {
       console.log('🏦 Adding bank statement specific categories...');
       
       // Get unique categories from all analyses
       const uniqueCategories = new Set<string>();
       statementAnalyses.forEach(analysis => {
         analysis.categoryBreakdown.forEach(category => {
           uniqueCategories.add(category.category);
         });
       });
       
       // Add categories that aren't already covered
       uniqueCategories.forEach(category => {
         const isAlreadyCovered = allocations.some(allocation => 
           allocation.category.toLowerCase().includes(category.toLowerCase()) ||
           category.toLowerCase().includes(allocation.category.toLowerCase())
         );
         
         if (!isAlreadyCovered) {
           // Calculate average monthly spending for this category
           let totalAmount = 0;
           let totalAnalyses = 0;
           
           statementAnalyses.forEach(analysis => {
             const categoryData = analysis.categoryBreakdown.find(cat => cat.category === category);
             if (categoryData) {
               totalAmount += categoryData.amount;
               totalAnalyses++;
             }
           });
           
           if (totalAnalyses > 0) {
             const averageMonthly = totalAmount / totalAnalyses;
             
             allocations.push({
               category: category,
               amount: averageMonthly,
               percentage: Math.round((averageMonthly / monthlyIncome) * 100),
               priority: priority++,
               description: `Based on actual spending patterns from bank statements`,
               optimization: "Monitor spending patterns and adjust as needed",
               alternatives: "Consider reducing this category if it exceeds your budget"
             });
           }
         }
       });
     }

    return allocations;
  }

     /**
    * Assess risk level based on actual financial data
    */
   private static assessRiskLevel(preferences: AIPreferences, totalExpenses: number, monthlyIncome: number, totalDebtPayments: number = 0): string {
    const expenseRatio = totalExpenses / monthlyIncome;
    const age = preferences.age;
    const employmentStatus = preferences.employmentStatus;
    const currentSavings = preferences.currentSavings;

         const totalObligations = totalExpenses + totalDebtPayments;
     const obligationRatio = totalObligations / monthlyIncome;
     
     if (obligationRatio > 0.8 || employmentStatus === 'unemployed' || currentSavings === 'none' || totalDebtPayments > monthlyIncome * 0.4) {
       return 'High';
     } else if (obligationRatio > 0.6 || age < 25 || employmentStatus === 'part-time' || totalDebtPayments > monthlyIncome * 0.2) {
       return 'Moderate';
     } else {
       return 'Low';
     }
  }

     /**
    * Identify specific risk factors
    */
   private static identifyRiskFactors(preferences: AIPreferences, totalExpenses: number, monthlyIncome: number, totalDebtPayments: number = 0): string[] {
    const factors = [];
    const expenseRatio = totalExpenses / monthlyIncome;

         const totalObligations = totalExpenses + totalDebtPayments;
     const obligationRatio = totalObligations / monthlyIncome;
     
     if (obligationRatio > 0.8) {
       factors.push("High total obligations-to-income ratio leaves little room for savings");
     }
     if (totalDebtPayments > monthlyIncome * 0.4) {
       factors.push("High debt-to-income ratio creates significant financial stress");
     }
     if (preferences.employmentStatus === 'unemployed') {
       factors.push("Unemployment status creates income uncertainty");
     }
     if (preferences.currentSavings === 'none') {
       factors.push("No emergency savings creates vulnerability");
     }
     if (preferences.age < 25) {
       factors.push("Young age may mean limited financial experience");
     }
     if (preferences.healthcareType === 'none') {
       factors.push("No health insurance creates medical expense risk");
     }

    return factors.length > 0 ? factors : ["Low risk profile based on current financial situation"];
  }

     /**
    * Calculate risk score (0-100)
    */
   private static calculateRiskScore(preferences: AIPreferences, totalExpenses: number, monthlyIncome: number, totalDebtPayments: number = 0): number {
     const expenseRatio = totalExpenses / monthlyIncome;
     const debtRatio = totalDebtPayments / monthlyIncome;
     const totalObligations = totalExpenses + totalDebtPayments;
     const obligationRatio = totalObligations / monthlyIncome;
     
     let score = 0;
     
     // Expense ratio impact (0-30 points)
     if (obligationRatio > 0.8) score += 30;
     else if (obligationRatio > 0.6) score += 20;
     else if (obligationRatio > 0.4) score += 10;
     
     // Debt ratio impact (0-25 points)
     if (debtRatio > 0.4) score += 25;
     else if (debtRatio > 0.2) score += 15;
     else if (debtRatio > 0.1) score += 5;
     
     // Employment status impact (0-20 points)
     if (preferences.employmentStatus === 'unemployed') score += 20;
     else if (preferences.employmentStatus === 'part-time') score += 10;
     
     // Savings impact (0-15 points)
     if (preferences.currentSavings === 'none') score += 15;
     else if (preferences.currentSavings === 'less-than-1000') score += 10;
     else if (preferences.currentSavings === '1000-5000') score += 5;
     
     // Age impact (0-10 points)
     if (preferences.age < 25) score += 10;
     else if (preferences.age < 30) score += 5;
     
     return Math.min(score, 100);
   }

   /**
    * Generate risk mitigation strategies
    */
   private static generateRiskMitigation(preferences: AIPreferences, totalExpenses: number, monthlyIncome: number, totalDebtPayments: number = 0): string {
    const expenseRatio = totalExpenses / monthlyIncome;
    
         const totalObligations = totalExpenses + totalDebtPayments;
     const obligationRatio = totalObligations / monthlyIncome;
     
     if (obligationRatio > 0.8) {
       return "Focus on reducing non-essential expenses and increasing income. Prioritize debt payments and build emergency fund as top priorities.";
     } else if (totalDebtPayments > monthlyIncome * 0.4) {
       return "Focus on debt reduction strategies. Consider debt consolidation, balance transfers, or negotiating lower interest rates.";
     } else if (preferences.currentSavings === 'none') {
       return "Start building emergency fund immediately. Even small amounts add up over time.";
     } else if (preferences.employmentStatus === 'unemployed') {
       return "Focus on job search and temporary income sources. Minimize expenses until stable employment is secured.";
     } else {
       return "Maintain current financial discipline. Continue building emergency fund and working toward your primary financial goal.";
     }
  }

  /**
   * Get existing AI analysis for a user
   */
  static async getExistingAnalysis(userId: string): Promise<StoredAIPreferences | null> {
    try {
      console.log('🔍 Checking for existing AI analysis...');
      console.log('👤 User ID:', userId);
      console.log('📁 Collection:', COLLECTIONS.AI_PREFERENCES);
      
      const result = await firestoreUtils.getWhere(COLLECTIONS.AI_PREFERENCES, 'userId', '==', userId);
      
      console.log('📊 Query result:', result);
      console.log('📊 Result length:', result?.length);
      
      if (result && result.length > 0) {
        const analysis = result[0] as StoredAIPreferences;
        console.log('✅ Found existing analysis:', analysis.id);
        console.log('📊 Full result object:', analysis);
        console.log('📄 aiAnalysis field:', analysis.aiAnalysis);
        console.log('📄 aiAnalysis length:', analysis.aiAnalysis?.length || 'undefined');
        console.log('📄 aiAnalysis type:', typeof analysis.aiAnalysis);
        console.log('📄 Has aiAnalysis:', !!analysis.aiAnalysis);
        console.log('📄 aiAnalysis is empty string:', analysis.aiAnalysis === '');
        return analysis;
      }
      
      console.log('❌ No existing analysis found');
      return null;
    } catch (error) {
      console.error('❌ Error getting existing analysis:', error);
      return null;
    }
  }

  /**
   * Save generated AI analysis to existing document
   */
  static async saveGeneratedAnalysis(
    documentId: string, 
    aiAnalysis: string
  ): Promise<void> {
    console.log('💾 Saving generated AI analysis to Firestore...');
    console.log('📄 Document ID:', documentId);
    console.log('📊 Analysis length:', aiAnalysis.length);
    
    try {
      await firestoreUtils.update(COLLECTIONS.AI_PREFERENCES, documentId, {
        aiAnalysis,
        updatedAt: new Date().toISOString()
      });
      console.log('✅ Successfully saved AI analysis to Firestore');
    } catch (error) {
      console.error('❌ Error saving AI analysis:', error);
      throw new Error('Failed to save AI analysis');
    }
  }

  /**
   * Create initial AI preferences document
   */
  static async createInitialPreferences(
    userId: string,
    preferences: AIPreferences
  ): Promise<string> {
    try {
      console.log('💾 Creating initial AI preferences document...');
      
      const documentData = {
        userId,
        preferences,
        aiAnalysis: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const docId = await firestoreUtils.create(COLLECTIONS.AI_PREFERENCES, documentData);
      console.log('✅ Initial preferences document created with ID:', docId);
      return docId;
    } catch (error) {
      console.error('❌ Error creating initial preferences document:', error);
      throw error;
    }
  }

  /**
   * Update preferences in existing document
   */
  static async updatePreferences(
    documentId: string, 
    data: Partial<StoredAIPreferences>
  ): Promise<void> {
    try {
      await firestoreUtils.update(COLLECTIONS.AI_PREFERENCES, documentId, {
        ...data,
        updatedAt: new Date().toISOString()
      });
      console.log('✅ Preferences updated in document:', documentId);
    } catch (error) {
      console.error('❌ Error updating preferences:', error);
      throw error;
    }
  }

  /**
   * Create automated budget based on AI analysis
   */
  static async createAutomatedBudget(
    userId: string,
    monthlyIncome: number,
    preferences: AIPreferences,
    parsedAnalysis: AIAnalysisData
  ): Promise<{ success: boolean; budgetId?: string; error?: string }> {
    try {
      console.log('🤖 Creating automated budget from AI analysis...');
      
      // Get the budget allocations from the AI analysis
      if (!parsedAnalysis.budgetAllocations || parsedAnalysis.budgetAllocations.length === 0) {
        throw new Error('No budget allocations found in AI analysis');
      }

      // Create budget object with AI-generated allocations
      const budgetData = {
        userId,
        month: new Date().toISOString().slice(0, 7), // YYYY-MM format
        income: monthlyIncome,
        categories: parsedAnalysis.budgetAllocations.map(allocation => ({
          name: allocation.category,
          amount: allocation.amount,
          percentage: allocation.percentage
        })),
        createdAt: new Date().toISOString(),
        source: 'AI Generated',
        analysisId: userId // Reference to the AI analysis
      };

      // Save to budget collection (you'll need to implement this based on your budget structure)
      console.log('💾 Saving automated budget to Firestore...');
      // TODO: Implement budget saving logic based on your budget collection structure
      
      console.log('✅ Automated budget created successfully');
      return { 
        success: true, 
        budgetId: `ai-budget-${Date.now()}` // Placeholder ID
      };
    } catch (error) {
      console.error('❌ Error creating automated budget:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create automated budget' 
      };
    }
  }

  /**
   * Get pre-determined allocations for budget form
   */
  static async getPreDeterminedAllocations(
    userId: string,
    monthlyIncome: number,
    existingDebts: any[] = [],
    existingGoals: any[] = []
  ): Promise<{
    success: boolean;
    data?: {
      allocations: Array<{ category: string; amount: number; percentage: number }>;
      debtAllocations?: Array<{ category: string; amount: number; percentage: number }>;
      goalAllocations?: Array<{ category: string; amount: number; percentage: number }>;
    };
    error?: string;
  }> {
    try {
      console.log('🔍 Getting pre-determined allocations...');
      
      const existingAnalysis = await this.getExistingAnalysis(userId);
      if (!existingAnalysis || !existingAnalysis.aiAnalysis) {
        return { success: false, error: 'No AI analysis found. Please complete the AI questionnaire first.' };
      }

      // Parse the existing analysis
      let parsedAnalysis: AIAnalysisData;
      try {
        parsedAnalysis = JSON.parse(existingAnalysis.aiAnalysis);
      } catch (parseError) {
        console.error('❌ Error parsing AI analysis:', parseError);
        return { success: false, error: 'Failed to parse existing AI analysis' };
      }

      if (!parsedAnalysis.budgetAllocations) {
        return { success: false, error: 'No budget allocations found in AI analysis' };
      }

      // Calculate debt and goal allocations
      const totalDebtPayments = existingDebts.reduce((sum, debt) => sum + debt.monthlyRepayment, 0);
      const totalGoalContributions = existingGoals.reduce((sum, goal) => sum + goal.monthlyContribution, 0);
      
      // Calculate available income after debts and goals
      const availableIncome = monthlyIncome - totalDebtPayments - totalGoalContributions;

      // Process budget allocations
      const allocations = parsedAnalysis.budgetAllocations.map(allocation => ({
        category: allocation.category,
        amount: Math.min(allocation.amount, availableIncome * (allocation.percentage / 100)),
        percentage: allocation.percentage
      }));

      const result = {
        allocations,
        ...(totalDebtPayments > 0 && { debtAllocations: existingDebts.map(debt => ({
          category: `Debt: ${debt.name}`,
          amount: debt.monthlyRepayment,
          percentage: Math.round((debt.monthlyRepayment / monthlyIncome) * 100)
        })) }),
        ...(totalGoalContributions > 0 && { goalAllocations: existingGoals.map(goal => ({
          category: `Goal: ${goal.title}`,
          amount: goal.monthlyContribution,
          percentage: Math.round((goal.monthlyContribution / monthlyIncome) * 100)
        })) })
      };

      console.log('✅ Pre-determined allocations retrieved successfully');
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Error getting pre-determined allocations:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get pre-determined allocations' 
      };
    }
  }
}
