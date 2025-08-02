"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Upload, FileText, AlertCircle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useBankStatementStore, BankStatement, Transaction } from "@/app/lib/bankStatementStore";
import { budgetTemplate } from "@/app/utils/template";
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [previewData, setPreviewData] = useState<{
    fileName: string;
    bank: string;
    accountType: string;
    transactions: ParsedTransaction[];
    categorizedTransactions: Transaction[];
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const spendingCategories = budgetTemplate.flatMap(group => group.categories);

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

  const parseCSV = (csvText: string): ParsedTransaction[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const transactions: ParsedTransaction[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length < 3) continue;
      
      // Try to find date, description, and amount columns
      let dateIndex = -1, descIndex = -1, amountIndex = -1;
      
      headers.forEach((header, index) => {
        if (header.includes('date')) dateIndex = index;
        if (header.includes('description') || header.includes('desc') || header.includes('payee')) descIndex = index;
        if (header.includes('amount') || header.includes('debit') || header.includes('credit')) amountIndex = index;
      });
      
      if (dateIndex === -1 || descIndex === -1 || amountIndex === -1) {
        // Fallback: assume first column is date, second is description, third is amount
        dateIndex = 0;
        descIndex = 1;
        amountIndex = 2;
      }
      
      const dateStr = values[dateIndex];
      const description = values[descIndex];
      const amountStr = values[amountIndex];
      
      // Parse date (try multiple formats)
      let date = "";
      try {
        const dateObj = new Date(dateStr);
        if (!isNaN(dateObj.getTime())) {
          date = dateObj.toISOString().split('T')[0];
        } else {
          // Try DD/MM/YYYY format
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
      } catch (e) {
        console.warn('Could not parse date:', dateStr);
        continue;
      }
      
      // Parse amount
      const amount = parseFloat(amountStr.replace(/[£,]/g, ''));
      if (isNaN(amount)) continue;
      
      const type: "debit" | "credit" = amount < 0 ? "debit" : "credit";
      
      transactions.push({
        date,
        description,
        amount: Math.abs(amount),
        type,
      });
    }
    
    return transactions;
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

      const text = await file.text();
      const transactions = parseCSV(text);
      
      if (transactions.length === 0) {
        throw new Error("No valid transactions found in the CSV file. Please check the file format.");
      }

      // Auto-categorize transactions
      const categorizedTransactions: Transaction[] = transactions.map((transaction, index) => ({
        id: crypto.randomUUID(),
        date: transaction.date,
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        category: autoCategorizeTransaction(transaction.description),
        bank: "Unknown Bank", // Could be detected from filename or content
        accountType: "Current Account", // Could be detected from content
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
        bank: "Unknown Bank",
        accountType: "Current Account",
        uploadDate: new Date().toISOString(),
        startDate,
        endDate,
        totalTransactions: categorizedTransactions.length,
        totalDebits,
        totalCredits,
        transactions: categorizedTransactions,
      };

      setPreviewData({
        fileName: file.name,
        bank: "Unknown Bank",
        accountType: "Current Account",
        transactions,
        categorizedTransactions,
      });

      setUploadStatus("success");
      
      // Auto-save after 2 seconds
      setTimeout(() => {
        addStatement(statement);
        setPreviewData(null);
        setUploadStatus("idle");
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
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

  const handleSaveStatement = () => {
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

    addStatement(statement);
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
            Upload a CSV file from your bank. The system will automatically categorize your transactions.
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
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
                Choose CSV File
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
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {uploadStatus === "success" && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              File processed successfully! Review the preview below and save to continue.
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