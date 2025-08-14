"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useBankStatementStore, BankStatement, Transaction } from "@/app/lib/bankStatementStore";
import { useBankStatementAnalysisStore } from "@/app/lib/bankStatementAnalysisStore";
import { useFirebaseStore } from "@/lib/store-firebase";
import { bankStatementAnalysis } from "@/lib/services/ai-budget-integration";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "debit" | "credit";
}

export default function BankStatementUpload() {
  const addStatement = useBankStatementStore((state) => state.addStatement);
  const getCategorySuggestions = useBankStatementStore((state) => state.getCategorySuggestions);
  const addStatementAnalysis = useBankStatementAnalysisStore((state) => state.addStatementAnalysis);
  const user = useFirebaseStore((state) => state.user);
  const monthlyIncome = useFirebaseStore((state) => state.income);
  
  // Debug: Get current store state
  const statements = useBankStatementStore((state) => state.statements);
  const statementAnalyses = useBankStatementAnalysisStore((state) => state.statementAnalyses);
  
  // Debug logging
  console.log('📤 BankStatementUpload - Current statements:', statements);
  console.log('📤 BankStatementUpload - Current analyses:', statementAnalyses);
  
  // Monitor store changes
  useEffect(() => {
    console.log('🔄 BankStatementUpload - Store state changed:', { statements, statementAnalyses });
  }, [statements, statementAnalyses]);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [uploadedAnalysis, setUploadedAnalysis] = useState<any>(null);
  const [previewData, setPreviewData] = useState<{
    fileName: string;
    bank: string;
    accountType: string;
    transactions: ParsedTransaction[];
    categorizedTransactions: Transaction[];
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetUpload = () => {
    setUploadedAnalysis(null);
    setPreviewData(null);
    setUploadStatus("idle");
    setUploadProgress(0);
    setErrorMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // Force a re-render to clear any cached data
    setTimeout(() => {
      setUploadedAnalysis(null);
      setPreviewData(null);
    }, 100);
  };

  const autoCategorizeTransaction = (description: string): string => {
    const suggestions = getCategorySuggestions(description);
    if (suggestions.length > 0) {
      return suggestions[0];
    }

    const lowerDescription = description.toLowerCase();
    
    // Common spending patterns
    const categoryPatterns: Record<string, string[]> = {
      "Groceries": ["tesco", "sainsbury", "asda", "morrisons", "aldi", "lidl", "co-op", "waitrose", "food", "grocery"],
      "Transportation": ["uber", "lyft", "train", "bus", "tube", "tfl", "parking", "fuel", "petrol", "diesel", "shell", "bp", "esso"],
      "Dining": ["restaurant", "cafe", "pub", "bar", "mcdonalds", "kfc", "subway", "dominos", "pizza", "takeaway"],
      "Shopping": ["amazon", "ebay", "asos", "h&m", "zara", "next", "m&s", "john lewis", "argos", "currys"],
      "Entertainment": ["netflix", "spotify", "disney", "prime", "cinema", "theatre", "concert", "game"],
      "Utilities": ["british gas", "edf", "e.on", "npower", "thames water", "electricity", "gas", "water", "internet", "broadband"],
      "Insurance": ["aviva", "direct line", "churchill", "admiral", "esure", "insurance"],
      "Healthcare": ["boots", "superdrug", "pharmacy", "doctor", "dentist", "hospital"],
      "Education": ["university", "college", "school", "course", "training"],
      "Housing": ["rent", "mortgage", "landlord", "letting", "estate agent"],
    };

    for (const [category, patterns] of Object.entries(categoryPatterns)) {
      if (patterns.some(pattern => lowerDescription.includes(pattern))) {
        return category;
      }
    }

    return "Uncategorized";
  };

  const parsePDF = async (file: File): Promise<{ transactions: ParsedTransaction[], analysis: any }> => {
    try {
      console.log('🤖 Processing PDF file with Gemini AI:', file.name);
      
      // Use the AI service to analyze the PDF directly
      const analysis = await bankStatementAnalysis.analyzePDFDirectly(file, file.name);
      
      console.log('✅ AI analysis completed, enhancing with income data...');
      
      // Enhance the analysis with income data from Firebase
      if (monthlyIncome > 0) {
        analysis.summary.monthlyIncome = monthlyIncome;
        
        // Calculate income vs spending metrics
        const totalSpending = analysis.summary.totalSpending;
        const percentageOfIncome = (totalSpending / monthlyIncome) * 100;
        const remaining = monthlyIncome - totalSpending;
        
        analysis.summary.incomeVsSpending = {
          percentage: percentageOfIncome,
          remaining: remaining,
          status: totalSpending > monthlyIncome ? 'over_budget' : 
                  totalSpending < monthlyIncome * 0.8 ? 'excellent_savings' : 'within_budget'
        };
        
        console.log('💰 Enhanced analysis with income data:', {
          monthlyIncome,
          percentageOfIncome: percentageOfIncome.toFixed(2) + '%',
          remaining: remaining.toFixed(2),
          status: analysis.summary.incomeVsSpending.status
        });
      }
      
      console.log('✅ AI analysis enhanced with income data, converting to transactions...');
      
      // Convert the AI analysis back to transaction format for compatibility
      // This maintains the existing flow while using AI for the heavy lifting
    const transactions: ParsedTransaction[] = [];
    
      // Use the actual transactions from the AI analysis
      if (analysis.transactions && analysis.transactions.length > 0) {
        transactions.push(...analysis.transactions.map(t => ({
          date: t.date,
          description: t.description,
          amount: Math.abs(t.amount), // Ensure positive amount
          type: t.type as "credit" | "debit"
        })));
      } else {
        // Fallback: Extract transactions from category breakdown
        if (analysis.categoryBreakdown && analysis.categoryBreakdown.length > 0) {
          analysis.categoryBreakdown.forEach(category => {
            if (category.transactionCount > 0) {
              // Create representative transactions for each category
              const avgAmount = category.amount / category.transactionCount;
              for (let i = 0; i < Math.min(category.transactionCount, 3); i++) {
                transactions.push({
                  date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  description: `${category.category} Transaction ${i + 1}`,
                  amount: avgAmount,
                  type: "debit" as const
                });
              }
            }
          });
        }
        
        // Add income transactions if any
        if (analysis.summary?.totalIncome && analysis.summary.totalIncome > 0) {
          transactions.push({
            date: new Date().toISOString().split('T')[0],
            description: "Income Payment",
            amount: analysis.summary.totalIncome,
            type: "credit" as const
          });
        }
      }
      
      console.log(`✅ Converted AI analysis to ${transactions.length} transactions`);
      return { transactions, analysis };
      
    } catch (error) {
      console.error('❌ Error processing PDF with AI:', error);
      
      // Provide more specific error information
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        if (error.message.includes('JSON')) {
          errorMessage = 'AI response format error - the analysis contained invalid data';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'AI analysis timed out - the PDF may be too complex';
        } else if (error.message.includes('PDF')) {
          errorMessage = 'PDF processing error - the file may be corrupted or unreadable';
        } else {
          errorMessage = error.message;
        }
      }
      
      console.log('🔄 Falling back to basic transaction generation...');
      console.log('📋 Error details:', errorMessage);
      
      // Fallback: Generate basic transactions if AI analysis fails
      const fallbackTransactions: ParsedTransaction[] = [
        {
          date: new Date().toISOString().split('T')[0],
          description: "PDF Analysis Failed - Basic Transaction",
          amount: 100.00,
          type: "debit" as const
        }
      ];
      
      // Create a basic fallback analysis
      const fallbackAnalysis = {
        bankName: "Unknown Bank",
        accountType: "Current Account",
        statementPeriod: {
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        },
        transactions: [
          {
            date: new Date().toISOString().split('T')[0],
            description: "PDF Analysis Failed - Basic Transaction",
            amount: 100.00,
            type: "debit" as const,
            category: "General",
            vendor: "Unknown"
          }
        ],
        summary: {
          totalSpending: 100.00,
          totalIncome: 0,
          netPosition: -100.00,
          periodDays: 30,
          transactionCount: 1
        },
        categoryBreakdown: [
          {
            category: "General",
            amount: 100.00,
            percentage: 100,
            transactionCount: 1,
            averageTransaction: 100.00,
            trend: "stable"
          }
        ],
        spendingPatterns: {
          dailyAverage: 3.33,
          weeklyAverage: 23.33,
          highestSpendingDay: "Unknown",
          lowestSpendingDay: "Unknown",
          weekendVsWeekday: { weekend: 0, weekday: 100.00, difference: 100.00 }
        },
        topVendors: [
          {
            vendor: "Unknown",
            totalSpent: 100.00,
            transactionCount: 1,
            category: "General",
            averageAmount: 100.00
          }
        ],
        financialHealth: {
          score: 50,
          status: "fair",
          factors: ["PDF analysis failed"],
          recommendations: ["Please try uploading the PDF again"]
        },
        savingsOpportunities: [],
        insights: {
          summary: "PDF analysis failed - using fallback data",
          keyFindings: ["Basic transaction data available"],
          warnings: ["AI analysis unavailable"],
          advice: ["Try re-uploading the PDF"],
          trends: ["Unable to determine trends"]
        },
        recommendations: {
          immediate: ["Re-upload PDF"],
          shortTerm: ["Check PDF format"],
          longTerm: ["Ensure PDF is readable"],
          priority: "high"
        }
      };
      
      console.log('✅ Fallback analysis generated');
      return { transactions: fallbackTransactions, analysis: fallbackAnalysis };
    }
  };

    const parsePDFText = (text: string): ParsedTransaction[] => {
    const transactions: ParsedTransaction[] = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    console.log('Parsing PDF text with', lines.length, 'lines');
    
    // Enhanced patterns for different bank statement formats
    const transactionPatterns = [
      // Pattern 1: Date Description Amount (most common UK format)
      /^(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+(.+?)\s+([£$]?\d+[,\d]*\.?\d*)$/i,
      // Pattern 2: Date Amount Description
      /^(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+([£$]?\d+[,\d]*\.?\d*)\s+(.+)$/i,
      // Pattern 3: Description Date Amount
      /^(.+?)\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+([£$]?\d+[,\d]*\.?\d*)$/i,
      // Pattern 4: DD/MM/YYYY format (UK standard)
      /^(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([£$]?\d+[,\d]*\.?\d*)$/i,
      // Pattern 5: YYYY-MM-DD format
      /^(\d{4}-\d{2}-\d{2})\s+(.+?)\s+([£$]?\d+[,\d]*\.?\d*)$/i,
      // Pattern 6: More flexible date formats
      /^(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+(.+?)\s+([£$]?\d+[,\d]*\.?\d*)\s*$/i,
      // Pattern 7: Handle cases with multiple spaces
      /^(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+(.+?)\s+([£$]?\d+[,\d]*\.?\d*)\s*$/i,
    ];
    
    let transactionCount = 0;
    
    for (const line of lines) {
      // Skip header lines, totals, and non-transaction lines
      if (line.toLowerCase().includes('balance') || 
          line.toLowerCase().includes('total') ||
          line.toLowerCase().includes('statement') ||
          line.toLowerCase().includes('account') ||
          line.toLowerCase().includes('date') ||
          line.toLowerCase().includes('description') ||
          line.toLowerCase().includes('amount') ||
          line.toLowerCase().includes('debit') ||
          line.toLowerCase().includes('credit') ||
          line.toLowerCase().includes('opening') ||
          line.toLowerCase().includes('closing') ||
          line.length < 10) {
        continue;
      }
      
      let match = null;
      let dateIndex = 0, descIndex = 1, amountIndex = 2;
      
      // Try to match against patterns
      for (const pattern of transactionPatterns) {
        match = line.match(pattern);
        if (match) {
          // Adjust indices based on pattern
          if (pattern.source.includes('Date Amount Description')) {
        dateIndex = 0;
            amountIndex = 1;
            descIndex = 2;
          } else if (pattern.source.includes('Description Date Amount')) {
            descIndex = 0;
            dateIndex = 1;
        amountIndex = 2;
          }
          break;
        }
      }
      
      if (match) {
        try {
          const dateStr = match[dateIndex + 1];
          const description = match[descIndex + 1].trim();
          const amountStr = match[amountIndex + 1].replace(/[£$,]/g, '');
          
          // Parse date with multiple format support
      let date = "";
          
          // Try multiple date parsing approaches
          const dateFormats = [
            // DD/MM/YYYY
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
            // DD-MM-YYYY
            /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
            // MM/DD/YYYY
            /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/,
            // YYYY-MM-DD
            /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
          ];
          
          let parsedDate = null;
          
          for (const format of dateFormats) {
            const dateMatch = dateStr.match(format);
            if (dateMatch) {
              const [, first, second, third] = dateMatch;
              
              if (format.source.includes('YYYY-MM-DD')) {
                // YYYY-MM-DD format
                parsedDate = new Date(parseInt(first), parseInt(second) - 1, parseInt(third));
              } else if (format.source.includes('DD/MM/YYYY') || format.source.includes('DD-MM-YYYY')) {
                // DD/MM/YYYY or DD-MM-YYYY format
                parsedDate = new Date(parseInt(third), parseInt(second) - 1, parseInt(first));
              } else {
                // MM/DD/YYYY format
                let year = parseInt(third);
                if (year < 100) year += 2000;
                parsedDate = new Date(year, parseInt(first) - 1, parseInt(second));
              }
              
              if (!isNaN(parsedDate.getTime())) {
                break;
              }
            }
          }
          
          if (parsedDate && !isNaN(parsedDate.getTime())) {
            date = parsedDate.toISOString().split('T')[0];
          } else {
            // Fallback to standard Date parsing
        const dateObj = new Date(dateStr);
        if (!isNaN(dateObj.getTime())) {
          date = dateObj.toISOString().split('T')[0];
            }
          }
          
          if (!date) {
            console.warn('Could not parse date from:', dateStr);
            continue;
          }
          
          // Parse amount with better number handling
          const cleanAmountStr = amountStr.replace(/[^\d.-]/g, '');
          const amount = parseFloat(cleanAmountStr);
          
          if (isNaN(amount) || amount === 0) {
            console.warn('Could not parse amount from:', amountStr);
        continue;
      }
      
          // Determine transaction type - this is a heuristic
          // In real statements, you might have explicit debit/credit columns
          const type: "debit" | "credit" = amount > 0 ? "debit" : "credit";
          
          // Skip if description is too short or looks like a header
          if (description.length < 3 || 
              description.toLowerCase().includes('balance') ||
              description.toLowerCase().includes('total') ||
              description.toLowerCase().includes('statement')) {
            continue;
          }
      
      transactions.push({
        date,
        description,
        amount: Math.abs(amount),
        type,
      });
          
          transactionCount++;
          
        } catch (error) {
          console.warn('Error parsing transaction line:', line, error);
          continue;
        }
      }
    }
    
    console.log(`Successfully parsed ${transactionCount} transactions from ${lines.length} lines`);
    
    // Sort transactions by date (newest first)
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus("processing");
    setErrorMessage("");

    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const pdfResult = await parsePDF(file);
      const { transactions, analysis } = pdfResult;
      
      if (transactions.length === 0) {
        throw new Error("No valid transactions found in the PDF file. Please check the file format.");
      }

      // Use AI analysis data instead of manual categorization
      const categorizedTransactions: Transaction[] = analysis.transactions?.map((transaction: any) => ({
        id: crypto.randomUUID(),
        date: transaction.date,
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category || "Other", // Use AI category, fallback to "Other"
        bank: analysis.bankName || "Unknown Bank", // Use AI bank name
        accountType: analysis.accountType || "Current Account", // Use AI account type
        statementId: crypto.randomUUID(),
      })) || transactions.map((transaction) => ({
        id: crypto.randomUUID(),
        date: transaction.date,
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        category: "Other", // Fallback category
        bank: analysis.bankName || "Unknown Bank", // Use AI bank name if available
        accountType: analysis.accountType || "Current Account", // Use AI account type if available
        statementId: crypto.randomUUID(),
      }));

      const totalDebits = categorizedTransactions
        .filter(t => t.type === "debit")
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalCredits = categorizedTransactions
        .filter(t => t.type === "credit")
        .reduce((sum, t) => sum + t.amount, 0);

      const dates = categorizedTransactions.map(t => t.date).sort();
      const startDate = dates[0];
      const endDate = dates[dates.length - 1];

      const statement: BankStatement = {
        id: crypto.randomUUID(),
        fileName: file.name,
        bank: analysis.bankName || "Unknown Bank", // Use AI bank name
        accountType: analysis.accountType || "Current Account", // Use AI account type
        uploadDate: new Date().toISOString(),
        startDate: analysis.statementPeriod?.startDate || startDate,
        endDate: analysis.statementPeriod?.endDate || endDate,
        totalTransactions: categorizedTransactions.length,
        totalDebits,
        totalCredits,
        transactions: categorizedTransactions,
      };

      setPreviewData({
        fileName: file.name,
        bank: analysis.bankName || "Unknown Bank", // Use AI bank name
        accountType: analysis.accountType || "Current Account", // Use AI account type
        transactions,
        categorizedTransactions,
      });

      setUploadStatus("success");
      
      // Auto-save after 2 seconds
      setTimeout(async () => {
        try {
          // Save the statement
          console.log('💾 Saving statement to store:', statement);
        await addStatement(statement);
          
          // Save AI analysis (already generated during PDF processing)
          if (user && analysis) {
            setIsAnalyzing(true);
            try {
              // Save the already generated AI analysis to database
              const analysisToSave = {
                ...analysis,
                statementId: statement.id,
                userId: user.uid
              };
              
              console.log('💾 Saving AI analysis:', analysisToSave);
              console.log('💾 Analysis structure check:', {
                hasId: !!analysisToSave.id,
                hasStatementId: !!analysisToSave.statementId,
                hasUserId: !!analysisToSave.userId,
                hasSummary: !!analysisToSave.summary,
                hasTransactions: !!analysisToSave.transactions,
                transactionsCount: analysisToSave.transactions?.length || 0
              });
              
              await addStatementAnalysis(analysisToSave);
              
              console.log('✅ AI analysis saved to database');
              setUploadedAnalysis(analysis);
            } catch (analysisError) {
              console.error('❌ Failed to save AI analysis:', analysisError);
              // Continue with statement upload even if analysis save fails
            } finally {
              setIsAnalyzing(false);
            }
          }
          

          // DON'T clear previewData here - keep it visible
        setUploadStatus("idle");
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
          }
        } catch (error) {
          console.error('Error in auto-save:', error);
        }
      }, 2000);

    } catch (error) {
      setUploadStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to process file");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveStatement = async () => {
    if (!previewData) return;
    
    const statement: BankStatement = {
      id: crypto.randomUUID(),
      fileName: previewData.fileName,
      bank: previewData.bank,
      accountType: previewData.accountType,
      uploadDate: new Date().toISOString(),
      startDate: previewData.categorizedTransactions[0]?.date || "",
      endDate: previewData.categorizedTransactions[previewData.categorizedTransactions.length - 1]?.date || "",
      totalTransactions: previewData.categorizedTransactions.length,
      totalDebits: previewData.categorizedTransactions.filter(t => t.type === "debit").reduce((sum, t) => sum + t.amount, 0),
      totalCredits: previewData.categorizedTransactions.filter(t => t.type === "credit").reduce((sum, t) => sum + t.amount, 0),
      transactions: previewData.categorizedTransactions,
    };

    await addStatement(statement);
    setPreviewData(null);
    setUploadStatus("idle");
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="space-y-4">
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Upload Bank Statement</h3>
          <p className="text-muted-foreground mb-4">
            Upload a PDF bank statement. The system will automatically extract and categorize your transactions using AI.
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
          />
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-primary hover:bg-primary/90"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Choose PDF File
              </>
            )}
          </Button>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing file...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {uploadStatus === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Upload Failed</p>
                <p>{errorMessage}</p>
                {errorMessage.includes('JSON') && (
                  <p className="text-sm text-muted-foreground">
                    This usually means the AI analysis contained invalid data. Try uploading a different PDF or contact support.
                  </p>
                )}
                {errorMessage.includes('timeout') && (
                  <p className="text-sm text-muted-foreground">
                    The PDF may be too complex or large. Try a smaller file or split into multiple statements.
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {uploadStatus === "success" && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              File processed successfully! {isAnalyzing ? 'Generating AI analysis...' : 'Review the preview below and save to continue.'}
            </AlertDescription>
          </Alert>
        )}

        {/* AI Analysis Status */}
        {isAnalyzing && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              AI is analyzing your statement to provide professional insights and recommendations...
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Preview Data */}
      {previewData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Statement Preview</h3>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setPreviewData(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveStatement}>
                  Save Statement
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">File Name</span>
                <p className="font-medium">{previewData.fileName}</p>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Transactions</span>
                <p className="font-medium">{previewData.transactions.length}</p>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Date Range</span>
                <p className="font-medium">
                  {previewData.transactions[0]?.date} - {previewData.transactions[previewData.transactions.length - 1]?.date}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium">Category Breakdown</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(
                  previewData.categorizedTransactions.reduce((acc, t) => {
                    acc[t.category] = (acc[t.category] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([category, count]) => (
                  <Badge key={category} variant="secondary">
                    {category}: {count}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium">Sample Transactions</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {previewData.categorizedTransactions.slice(0, 10).map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center p-2 bg-muted rounded">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">{transaction.date}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-sm font-medium",
                        transaction.type === "debit" ? "text-red-600" : "text-green-600"
                      )}>
                        £{transaction.amount.toFixed(2)}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {transaction.category}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}


    </div>
  );
} 