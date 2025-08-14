import { generateText } from '@/lib/gemini';
import { firestoreUtils, COLLECTIONS } from '@/lib/firestore';
import { 
  AIPreferences, 
  StoredAIPreferences, 
  AIAnalysisData, 
  AIAnalysisRequest, 
  AIAnalysisResponse 
} from '@/lib/types/ai';

export class AIService {
  /**
   * Generate AI analysis for user preferences
   */
  static async generateBudgetAnalysis(preferences: AIPreferences, monthlyIncome: number): Promise<AIAnalysisResponse> {
    console.log('🚀 Starting AI analysis generation...');
    console.log('📊 User preferences:', preferences);
    console.log('💰 Monthly income:', monthlyIncome);

    const maxRetries = 3;
    let attempt = 1;
    let lastError: string | null = null;

    while (attempt <= maxRetries) {
      try {
        console.log(`🔄 Attempt ${attempt}/${maxRetries} - Generating AI analysis...`);

        // On retry attempts, try a more concise prompt
        let analysisPrompt: string;
        if (attempt === 1) {
          analysisPrompt = this.buildAnalysisPrompt(preferences, monthlyIncome);
        } else {
          analysisPrompt = this.buildRetryPrompt(preferences, monthlyIncome);
        }
        
        console.log('📝 Generated prompt length:', analysisPrompt.length, 'characters');

        console.log('🤖 Calling Gemini API...');
        const startTime = Date.now();
        const analysis = await generateText(analysisPrompt);
        const endTime = Date.now();
        console.log(`✅ Gemini API response received in ${endTime - startTime}ms`);
        console.log('📄 Raw response length:', analysis.length, 'characters');
        console.log('📄 Response preview:', analysis.substring(0, 100) + '...');
        console.log('📄 Response ending:', analysis.substring(analysis.length - 100));

        // Validate response completeness
        if (!this.isResponseComplete(analysis)) {
          console.warn(`⚠️ Response appears incomplete (attempt ${attempt})`);
          lastError = 'AI response was incomplete';
          
          if (attempt < maxRetries) {
            attempt++;
            console.log(`🔄 Retrying with more concise prompt... (attempt ${attempt}/${maxRetries})`);
            continue;
          } else {
            console.error('❌ Max retries reached, response still incomplete');
            return {
              success: false,
              error: 'AI response was incomplete after multiple attempts. Please try again.'
            };
          }
        }

        // Parse the JSON response
        try {
          console.log('🔍 Attempting to parse JSON response...');
          const parsedData = JSON.parse(analysis) as AIAnalysisData;
          console.log('✅ JSON parsing successful');
          console.log('📊 Parsed analysis data:', parsedData);

          // Validate the parsed data structure
          if (this.validateAnalysisData(parsedData)) {
            return {
              success: true,
              data: parsedData
            };
          } else {
            console.warn('⚠️ Parsed data validation failed');
            lastError = 'AI response structure was invalid';
            
            if (attempt < maxRetries) {
              attempt++;
              console.log(`🔄 Retrying due to validation failure... (attempt ${attempt}/${maxRetries})`);
              continue;
            } else {
              return {
                success: false,
                error: 'AI response structure was invalid after multiple attempts. Please try again.'
              };
            }
          }
        } catch (parseError) {
          console.error('❌ Error parsing AI analysis JSON:', parseError);
          console.error('📄 Raw response that failed to parse:', analysis);
          
          // Try to repair common JSON issues
          const repairedResponse = this.attemptJSONRepair(analysis);
          if (repairedResponse) {
            try {
              console.log('🔧 Attempting to parse repaired JSON...');
              const parsedData = JSON.parse(repairedResponse) as AIAnalysisData;
              console.log('✅ Repaired JSON parsing successful');
              
              if (this.validateAnalysisData(parsedData)) {
                return {
                  success: true,
                  data: parsedData
                };
              }
            } catch (repairError) {
              console.warn('⚠️ Repaired JSON also failed to parse:', repairError);
            }
          }
          
          lastError = 'Failed to parse AI response';

          if (attempt < maxRetries) {
            attempt++;
            console.log(`🔄 Retrying due to JSON parsing failure... (attempt ${attempt}/${maxRetries})`);
            continue;
          } else {
            return {
              success: false,
              error: 'Failed to parse AI analysis response after multiple attempts. Please try again.'
            };
          }
        }
      } catch (error) {
        console.error(`❌ Error generating AI analysis (attempt ${attempt}):`, error);
        lastError = error instanceof Error ? error.message : 'API call failed';

        if (attempt < maxRetries) {
          attempt++;
          console.log(`🔄 Retrying due to API error... (attempt ${attempt}/${maxRetries})`);
          continue;
        } else {
          return {
            success: false,
            error: `Failed to generate analysis after multiple attempts: ${lastError}`
          };
        }
      }
    }

    return {
      success: false,
      error: `Failed to generate analysis after maximum retries. Last error: ${lastError}`
    };
  }

  /**
   * Check if the AI response is complete and properly formatted
   */
  private static isResponseComplete(response: string): boolean {
    console.log('🔍 Checking response completeness...');
    
    const trimmed = response.trim();
    
    // Basic JSON structure checks
    if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
      console.warn('⚠️ Response does not start/end with proper JSON braces');
      return false;
    }
    
    // Check for balanced braces
    let braceCount = 0;
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < trimmed.length; i++) {
      const char = trimmed[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        if (braceCount < 0) break;
      }
    }
    
    if (braceCount !== 0) {
      console.warn(`⚠️ Response has unbalanced braces: ${braceCount}`);
      return false;
    }
    
    // Check for incomplete properties (ends with comma, incomplete value, etc.)
    const lastLine = trimmed.split('\n').pop() || '';
    const trimmedLastLine = lastLine.trim();
    
    // Check for common truncation patterns
    if (trimmedLastLine.endsWith(',') || 
        trimmedLastLine.endsWith(':') ||
        trimmedLastLine.endsWith('"') ||
        trimmedLastLine.includes('"percentage":') && !trimmedLastLine.includes('}') ||
        trimmedLastLine.includes('"amount":') && !trimmedLastLine.includes('}') ||
        trimmedLastLine.includes('"description":') && !trimmedLastLine.includes('"')) {
      console.warn('⚠️ Response appears to end mid-property or with incomplete value');
      return false;
    }
    
    // Try to parse as JSON to catch syntax errors
    try {
      JSON.parse(trimmed);
      console.log('✅ Response passes JSON validation');
      return true;
    } catch (parseError) {
      console.warn('⚠️ Response fails JSON parsing:', parseError);
      return false;
    }
  }

  /**
   * Validate the parsed analysis data structure
   */
  private static validateAnalysisData(data: any): boolean {
    try {
      // Check required top-level properties
      const requiredProps = ['summary', 'priorities', 'budgetDistribution', 'riskAssessment', 'timeline', 'progressMetrics', 'recommendations', 'budgetAllocations'];
      for (const prop of requiredProps) {
        if (!data[prop]) {
          console.warn(`⚠️ Missing required property: ${prop}`);
          return false;
        }
      }
      
      // Check budget distribution percentages add up to 100%
      if (data.budgetDistribution) {
        const totalPercentage = Object.values(data.budgetDistribution)
          .map((item: any) => item.percentage || 0)
          .reduce((sum: number, percentage: number) => sum + percentage, 0);
        
        if (Math.abs(totalPercentage - 100) > 1) { // Allow 1% tolerance
          console.warn(`⚠️ Budget percentages don't add up to 100%: ${totalPercentage}%`);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.warn('⚠️ Error during data validation:', error);
      return false;
    }
  }

  /**
   * Attempt to repair common JSON formatting issues
   */
  private static attemptJSONRepair(response: string): string | null {
    console.log('🔧 Attempting to repair JSON response...');
    
    try {
      // Remove any trailing commas before closing braces/brackets
      let repaired = response.replace(/,(\s*[}\]])/g, '$1');
      
      // Remove any trailing commas at the end
      repaired = repaired.replace(/,\s*$/g, '');
      
      // Try to complete incomplete objects
      if (repaired.includes('"percentage":') && !repaired.includes('}')) {
        // Find the last incomplete object and close it
        const lastIncomplete = repaired.lastIndexOf('"percentage":');
        if (lastIncomplete !== -1) {
          const beforeIncomplete = repaired.substring(0, lastIncomplete);
          const afterIncomplete = repaired.substring(lastIncomplete);
          
          // Find the start of this object
          let braceCount = 0;
          let startIndex = beforeIncomplete.length - 1;
          for (let i = startIndex; i >= 0; i--) {
            if (beforeIncomplete[i] === '}') braceCount++;
            if (beforeIncomplete[i] === '{') {
              braceCount--;
              if (braceCount === 0) {
                startIndex = i;
                break;
              }
            }
          }
          
          if (startIndex < beforeIncomplete.length - 1) {
            // Close the incomplete object
            repaired = beforeIncomplete.substring(0, startIndex + 1) + '}';
          }
        }
      }
      
      // Try to parse the repaired JSON
      JSON.parse(repaired);
      console.log('✅ JSON repair successful');
      return repaired;
    } catch (error) {
      console.warn('⚠️ JSON repair failed:', error);
      return null;
    }
  }

  /**
   * Save user preferences and AI analysis to Firestore
   */
  static async savePreferencesAndAnalysis(
    userId: string, 
    preferences: AIPreferences, 
    aiAnalysis: string
  ): Promise<string> {
    console.log('💾 Saving preferences and analysis to Firestore...');
    console.log('👤 User ID:', userId);
    console.log('📊 Preferences to save:', preferences);
    
    try {
      const documentData: Omit<StoredAIPreferences, 'id'> = {
        userId,
        preferences,
        aiAnalysis,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const documentId = await firestoreUtils.create(COLLECTIONS.AI_PREFERENCES, documentData);
      console.log('✅ Successfully saved to Firestore with ID:', documentId);
      return documentId;
    } catch (error) {
      console.error('❌ Error saving preferences and analysis:', error);
      throw new Error('Failed to save preferences and analysis');
    }
  }

  /**
   * Update existing AI preferences
   */
  static async updatePreferences(
    documentId: string, 
    updates: Partial<StoredAIPreferences>
  ): Promise<void> {
    console.log('🔄 Updating existing preferences in Firestore...');
    console.log('📄 Document ID:', documentId);
    console.log('📝 Updates to apply:', updates);
    
    try {
      await firestoreUtils.update(COLLECTIONS.AI_PREFERENCES, documentId, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      console.log('✅ Successfully updated preferences in Firestore');
    } catch (error) {
      console.error('❌ Error updating preferences:', error);
      throw new Error('Failed to update preferences');
    }
  }

  /**
   * Get existing AI analysis for a user
   */
  static async getExistingAnalysis(userId: string): Promise<StoredAIPreferences | null> {
    console.log('🔍 Checking for existing AI analysis...');
    console.log('👤 User ID:', userId);
    
    try {
      const existingPreferences = await firestoreUtils.getWhere<StoredAIPreferences>(
        COLLECTIONS.AI_PREFERENCES,
        'userId',
        '==',
        userId
      );
      
      if (existingPreferences.length > 0) {
        const result = existingPreferences[0];
        console.log('✅ Found existing analysis:', result.id);
        console.log('📊 Full result object:', result);
        console.log('📄 aiAnalysis field:', result.aiAnalysis);
        console.log('📄 aiAnalysis length:', result.aiAnalysis?.length);
        console.log('📄 aiAnalysis type:', typeof result.aiAnalysis);
        return result; // Get the most recent one
      }
      
      console.log('ℹ️ No existing analysis found');
      return null;
    } catch (error) {
      console.error('❌ Error getting existing analysis:', error);
      return null;
    }
  }

  /**
   * Check if user has existing AI analysis
   */
  static async hasExistingAnalysis(userId: string): Promise<boolean> {
    try {
      const existing = await this.getExistingAnalysis(userId);
      console.log('🔍 hasExistingAnalysis - existing result:', existing);
      
      if (existing) {
        console.log('🔍 hasExistingAnalysis - aiAnalysis field:', existing.aiAnalysis);
        console.log('🔍 hasExistingAnalysis - aiAnalysis length:', existing.aiAnalysis?.length);
        console.log('🔍 hasExistingAnalysis - aiAnalysis type:', typeof existing.aiAnalysis);
        console.log('🔍 hasExistingAnalysis - aiAnalysis trim length:', existing.aiAnalysis?.trim().length);
      }
      
      const hasAnalysis = existing !== null && 
             existing.aiAnalysis && 
             existing.aiAnalysis.trim().length > 0;
      
      console.log('🔍 Existing analysis check result:', hasAnalysis);
      return Boolean(hasAnalysis);
    } catch (error) {
      console.error('❌ Error checking existing analysis:', error);
      return false;
    }
  }

  /**
   * Build the analysis prompt for Gemini
   */
  private static buildAnalysisPrompt(preferences: AIPreferences, monthlyIncome: number): string {
    // Helper function to format array values
    const formatArrayPreference = (value: string[]): string => {
      return value.join(', ');
    };

    // Helper function to format monetary values
    const formatMoney = (value: string): string => {
      if (!value) return 'Not specified';
      // If it's already a number, return as is
      if (!isNaN(Number(value))) return `£${value}`;
      return value;
    };

    return `Create a comprehensive, personalized budget allocation strategy with detailed reasoning. Return ONLY valid JSON with NO additional text, explanations, or formatting.

IMPORTANT: Your response must be complete, valid JSON that can be parsed immediately. Do not truncate or cut off mid-property.

{
  "summary": "Comprehensive financial overview including current situation analysis, goals assessment, and strategic approach",
  "priorities": [
    {
      "rank": 1,
      "category": "Emergency Fund",
      "reason": "Detailed explanation of why this is the top priority based on user's specific circumstances, risk factors, and financial goals",
      "action": "Specific, actionable steps with timelines and amounts"
    }
  ],
  "budgetDistribution": {
    "emergencyFund": {"percentage": 20, "amount": ${monthlyIncome * 0.2}, "description": "Detailed reasoning for emergency fund allocation considering user's age, family size, employment stability, and current savings"},
    "debtPayoff": {"percentage": 30, "amount": ${monthlyIncome * 0.3}, "description": "Comprehensive debt strategy considering types of debt, interest rates, and impact on long-term financial goals"},
    "essentialExpenses": {"percentage": 25, "amount": ${monthlyIncome * 0.25}, "description": "Breakdown of essential expenses including housing, transport, food, healthcare, and utilities with specific reasoning for each"},
    "savingsInvestments": {"percentage": 15, "amount": ${monthlyIncome * 0.15}, "description": "Savings and investment strategy aligned with user's primary and secondary goals, risk tolerance, and time horizon"},
    "discretionarySpending": {"percentage": 10, "amount": ${monthlyIncome * 0.1}, "description": "Discretionary spending allocation considering lifestyle preferences and balance with financial goals"}
  },
  "riskAssessment": {
    "level": "Moderate",
    "factors": ["Specific risk factors based on user's age, employment, debt levels, and financial situation"],
    "mitigation": "Detailed risk management strategies tailored to user's specific circumstances"
  },
  "timeline": {
    "emergencyFund": "Specific timeline based on user's income, expenses, and current savings",
    "debtElimination": "Realistic debt payoff timeline considering debt amounts and interest rates",
    "investmentGrowth": "Investment timeline aligned with emergency fund completion and debt reduction",
    "retirementReadiness": "Retirement planning timeline based on age ${preferences.age} and current savings"
  },
  "progressMetrics": ["Specific, measurable financial goals with target amounts and timelines"],
  "recommendations": ["Detailed, actionable advice tailored to user's specific financial situation and goals"],
  "autoAllocationRules": [
    {
      "category": "Emergency Fund",
      "rule": "Specific allocation rule considering user's income, expenses, and target emergency fund amount",
      "priority": 1
    }
  ],
  "budgetAllocations": [
    {
      "category": "Emergency Fund",
      "amount": ${monthlyIncome * 0.2},
      "percentage": 20,
      "priority": 1,
      "description": "Comprehensive explanation of emergency fund allocation including target amount, timeline, and strategic importance"
    },
    {
      "category": "Debt Repayment",
      "amount": ${monthlyIncome * 0.3},
      "percentage": 30,
      "priority": 2,
      "description": "Detailed debt repayment strategy including prioritization of high-interest debt and impact on overall financial health"
    },
    {
      "category": "Rent/Mortgage",
      "amount": ${monthlyIncome * 0.15},
      "percentage": 15,
      "priority": 3,
      "description": "Housing allocation considering current housing costs, potential changes, and essential utilities"
    },
    {
      "category": "Fuel",
      "amount": ${monthlyIncome * 0.1},
      "percentage": 10,
      "priority": 4,
      "description": "Transportation costs including fuel, insurance, maintenance, and public transit options"
    },
    {
      "category": "Groceries",
      "amount": ${monthlyIncome * 0.1},
      "percentage": 10,
      "priority": 5,
      "description": "Food and grocery allocation considering family size, dietary needs, and cost-saving strategies"
    },
    {
      "category": "Life Insurance",
      "amount": ${monthlyIncome * 0.05},
      "percentage": 5,
      "priority": 6,
      "description": "Insurance costs including life insurance, health insurance, and other essential coverage"
    },
    {
      "category": "Investments",
      "amount": ${monthlyIncome * 0.15},
      "percentage": 15,
      "priority": 7,
      "description": "Long-term savings and investment strategy aligned with primary goal: ${preferences.primaryGoal}${preferences.primaryGoalOther ? ` (${preferences.primaryGoalOther})` : ''}"
    },
    {
      "category": "Entertainment",
      "amount": ${monthlyIncome * 0.05},
      "percentage": 5,
      "priority": 8,
      "description": "Entertainment and personal expenses considering lifestyle preferences and balance with financial goals"
    }
  ]
}

User profile: Age ${preferences.age}, Family size ${preferences.familySize}, Monthly income £${monthlyIncome}, Employment status ${preferences.employmentStatus}, Primary goal ${preferences.primaryGoal}${preferences.primaryGoalOther ? ` (${preferences.primaryGoalOther})` : ''}, Secondary goals ${formatArrayPreference(preferences.secondaryGoals)}${preferences.secondaryGoalsOther ? ` (${preferences.secondaryGoalsOther})` : ''}, Risk tolerance ${preferences.riskTolerance}/10, Housing costs ${formatMoney(preferences.housingCosts)}, Transportation costs ${formatMoney(preferences.transportationCosts)}, Healthcare costs ${formatMoney(preferences.healthcareCosts)}, Food and groceries ${formatMoney(preferences.foodAndGroceries)}, Entertainment and hobbies ${formatMoney(preferences.entertainmentAndHobbies)}, Current savings ${formatMoney(preferences.currentSavings)}, Emergency fund target ${formatMoney(preferences.emergencyFund)}, Total debt ${formatMoney(preferences.debtAmount)}, Debt types ${formatArrayPreference(preferences.debtTypes)}, Investment experience ${preferences.investmentExperience}, Time horizon ${preferences.timeHorizon}, Savings priority ${preferences.savingsPriority}, Lifestyle preferences ${preferences.lifestylePreferences}, Financial concerns ${formatArrayPreference(preferences.financialStressors)}.

Requirements: Generate detailed, personalized reasoning for each allocation. Consider user's specific circumstances, goals, and constraints. Ensure total allocation equals 100% of income. Return complete, valid JSON only. Keep response under 2000 characters to ensure completeness.`;
  }

  /**
   * Build a more concise prompt for retries
   */
  private static buildRetryPrompt(preferences: AIPreferences, monthlyIncome: number): string {
    // Helper function to format array values
    const formatArrayPreference = (value: string[]): string => {
      return value.join(', ');
    };

    // For retries, use a more detailed but still concise prompt
    return `Create a comprehensive budget allocation strategy with detailed reasoning. Return ONLY valid JSON with NO additional text.

{
  "summary": "Comprehensive financial strategy based on user's specific circumstances",
  "priorities": [{"rank": 1, "category": "Emergency Fund", "reason": "Detailed explanation of priority based on user's age, family size, and financial situation", "action": "Specific steps with timelines"}],
  "budgetDistribution": {
    "emergencyFund": {"percentage": 20, "amount": ${monthlyIncome * 0.2}, "description": "Detailed reasoning considering user's employment stability, current savings, and family needs"},
    "debtPayoff": {"percentage": 30, "amount": ${monthlyIncome * 0.3}, "description": "Comprehensive debt strategy considering debt types and interest rates"},
    "essentialExpenses": {"percentage": 25, "amount": ${monthlyIncome * 0.25}, "description": "Breakdown of housing, transport, food, and utilities with specific reasoning"},
    "savingsInvestments": {"percentage": 15, "amount": ${monthlyIncome * 0.15}, "description": "Savings strategy aligned with primary goal: ${preferences.primaryGoal}${preferences.primaryGoalOther ? ` (${preferences.primaryGoalOther})` : ''}"},
    "discretionarySpending": {"percentage": 10, "amount": ${monthlyIncome * 0.1}, "description": "Discretionary allocation considering lifestyle preferences"}
  },
  "riskAssessment": {"level": "Moderate", "factors": ["Specific risk factors based on user's situation"], "mitigation": "Tailored risk management strategies"},
  "timeline": {"emergencyFund": "Based on income and expenses", "debtElimination": "Realistic timeline considering debt amounts", "investmentGrowth": "After emergency fund completion", "retirementReadiness": "Based on age ${preferences.age} and current savings"},
  "progressMetrics": ["Specific, measurable financial goals"],
  "recommendations": ["Detailed, actionable advice tailored to user's circumstances"],
  "autoAllocationRules": [{"category": "Emergency Fund", "rule": "Allocate 20% until emergency fund target reached", "priority": 1}],
  "budgetAllocations": [
    {"category": "Emergency Fund", "amount": ${monthlyIncome * 0.2}, "percentage": 20, "priority": 1, "description": "Build financial safety net considering current savings and target amount"},
    {"category": "Debt Repayment", "amount": ${monthlyIncome * 0.3}, "percentage": 30, "priority": 2, "description": "Prioritize high-interest debt and create debt-free timeline"},
    {"category": "Rent/Mortgage", "amount": ${monthlyIncome * 0.15}, "percentage": 15, "priority": 3, "description": "Cover housing costs and essential utilities"},
    {"category": "Fuel", "amount": ${monthlyIncome * 0.1}, "percentage": 10, "priority": 4, "description": "Transport costs including fuel, insurance, and maintenance"},
    {"category": "Groceries", "amount": ${monthlyIncome * 0.1}, "percentage": 10, "priority": 5, "description": "Food allocation considering family size and dietary needs"},
    {"category": "Life Insurance", "amount": ${monthlyIncome * 0.05}, "percentage": 5, "priority": 6, "description": "Insurance costs and essential coverage"},
    {"category": "Investments", "amount": ${monthlyIncome * 0.15}, "percentage": 15, "priority": 7, "description": "Long-term savings aligned with financial goals"},
    {"category": "Entertainment", "amount": ${monthlyIncome * 0.05}, "percentage": 5, "priority": 8, "description": "Personal expenses and lifestyle balance"}
  ]
}

User: Age ${preferences.age}, Family ${preferences.familySize}, Income £${monthlyIncome}, Primary goal ${preferences.primaryGoal}${preferences.primaryGoalOther ? ` (${preferences.primaryGoalOther})` : ''}, Secondary goals ${formatArrayPreference(preferences.secondaryGoals)}${preferences.secondaryGoalsOther ? ` (${preferences.secondaryGoalsOther})` : ''}, Risk tolerance ${preferences.riskTolerance}/10, Debt types ${formatArrayPreference(preferences.debtTypes)}, Housing costs ${preferences.housingCosts}, Current savings ${preferences.currentSavings}.

Requirements: Generate detailed, personalized reasoning for each allocation. Consider user's specific circumstances and goals. Ensure 100% allocation. Return complete, valid JSON only. Keep under 1500 characters.`;
  }
}
