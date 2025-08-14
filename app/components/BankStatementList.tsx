"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FileText, Search, Trash2, Calendar, Building2, PoundSterling, BarChart3 } from "lucide-react";
import { useBankStatementStore, BankStatement } from "@/app/lib/bankStatementStore";
import { useBankStatementAnalysisStore } from "@/app/lib/bankStatementAnalysisStore";
import { cn } from "@/lib/utils";
import AIAnalysisDisplay from "./AIAnalysisDisplay";
import EnhancedAIAnalysisDisplay from "./EnhancedAIAnalysisDisplay";

export default function BankStatementList() {
  const statements = useBankStatementStore((state) => state.statements);
  const deleteStatement = useBankStatementStore((state) => state.deleteStatement);
  const loadStatements = useBankStatementStore((state) => state.loadStatements);
  const isLoading = useBankStatementStore((state) => state.isLoading);
  const statementAnalyses = useBankStatementAnalysisStore((state) => state.statementAnalyses);
  
  // Debug logging
  console.log('📊 BankStatementList - Current statements:', statements);
  console.log('📊 BankStatementList - Current analyses:', statementAnalyses);
  const [searchTerm, setSearchTerm] = useState("");
  const [bankFilter, setBankFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);
  const [selectedStatement, setSelectedStatement] = useState<BankStatement | null>(null);

  // Load statements from Firebase when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadStatements();
      } catch (error) {
        console.error('❌ Failed to load statements:', error);
      }
    };
    
    loadData();
  }, [loadStatements]);

  const filteredStatements = statements.filter((statement) => {
    const matchesSearch = 
      statement.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      statement.bank.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBank = bankFilter === "all" || statement.bank === bankFilter;
    
    const matchesDate = dateFilter === "all" || 
      (dateFilter === "this-month" && isThisMonth(statement.uploadDate)) ||
      (dateFilter === "last-month" && isLastMonth(statement.uploadDate));

    return matchesSearch && matchesBank && matchesDate;
  });

  const isThisMonth = (date: string) => {
    const today = new Date();
    const uploadDate = new Date(date);
    return today.getFullYear() === uploadDate.getFullYear() && 
           today.getMonth() === uploadDate.getMonth();
  };

  const isLastMonth = (date: string) => {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1);
    const uploadDate = new Date(date);
    return lastMonth.getFullYear() === uploadDate.getFullYear() && 
           lastMonth.getMonth() === uploadDate.getMonth();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getCategoryBreakdown = (statement: BankStatement) => {
    const breakdown = statement.transactions.reduce((acc, transaction) => {
      acc[transaction.category] = (acc[transaction.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(breakdown).map(([category, count]) => ({
      category,
      count,
    }));
  };

  const getStatementPeriod = (statement: BankStatement) => {
    if (statement.transactions.length === 0) return "No transactions";
    
    const dates = statement.transactions.map(t => new Date(t.date)).sort((a, b) => a.getTime() - b.getTime());
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];
    
    const startMonth = startDate.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
    const endMonth = endDate.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
    
    if (startMonth === endMonth) {
      return startMonth;
    }
    return `${startMonth} - ${endMonth}`;
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold mb-2">Loading Statements...</h3>
        <p className="text-muted-foreground">
          Fetching your bank statements from the database.
        </p>
      </div>
    );
  }

  if (statements.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Bank Statements</h3>
        <p className="text-muted-foreground">
          Upload your first bank statement to start tracking your spending.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search statements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={bankFilter} onValueChange={setBankFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by bank" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Banks</SelectItem>
            {Array.from(new Set(statements.map(s => s.bank))).map((bank) => (
              <SelectItem key={bank} value={bank}>
                {bank}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Statement List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredStatements.map((statement, index) => (
            <motion.div
              key={statement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedStatement(statement)}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-lg">{statement.bank}</h3>
                        <Badge variant="secondary">{statement.accountType || "Current Account"}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Statement Period</p>
                          <p className="font-medium">{getStatementPeriod(statement)}</p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Uploaded</p>
                          <p className="font-medium">{formatDate(statement.uploadDate)}</p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Spending</p>
                          <p className="font-medium text-red-600">£{statement.totalDebits.toFixed(2)}</p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Transactions</p>
                          <p className="font-medium">{statement.totalTransactions}</p>
                        </div>
                      </div>
                      
                      {/* AI Analysis Status */}
                      {(() => {
                        const analysis = statementAnalyses.find(a => a.statementId === statement.id);
                        if (analysis) {
                          return (
                            <div className="flex items-center gap-2 pt-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm text-green-600 font-medium">AI Analysis Available</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAnalysis(analysis.id);
                                }}
                                className="text-primary hover:text-primary hover:bg-primary/10"
                              >
                                <BarChart3 className="h-4 w-4 mr-1" />
                                View Analysis
                              </Button>
                            </div>
                          );
                        }
                        return (
                          <div className="flex items-center gap-2 pt-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <span className="text-sm text-gray-500">AI Analysis Pending</span>
                          </div>
                        );
                      })()}
                    </div>
                    
                    {/* Delete Button */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Statement</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this bank statement? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={async () => {
                              try {
                                await deleteStatement(statement.id);
                                console.log('✅ Statement deleted successfully');
                              } catch (error) {
                                console.error('❌ Failed to delete statement:', error);
                                // You could add a toast notification here
                              }
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredStatements.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No statements match your current filters.</p>
          </div>
        )}
      </div>

      {/* Summary */}
      {filteredStatements.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">
                Showing {filteredStatements.length} of {statements.length} statements
              </span>
              <span className="font-semibold">
                Total: £{filteredStatements.reduce((sum, statement) => sum + statement.totalDebits, 0).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction View Modal */}
      {selectedStatement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">{selectedStatement.bank} Statement</h2>
                  <p className="text-gray-600">{getStatementPeriod(selectedStatement)} • {selectedStatement.totalTransactions} transactions</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedStatement(null)}
                  >
                    ← Back to Statements
                  </Button>
                  {(() => {
                    const analysis = statementAnalyses.find(a => a.statementId === selectedStatement.id);
                    if (analysis) {
                      return (
                        <Button
                          onClick={() => {
                            setSelectedStatement(null);
                            setSelectedAnalysis(analysis.id);
                          }}
                        >
                          View AI Analysis
                        </Button>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {selectedStatement.transactions.map((transaction, index) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{transaction.description}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <span>{transaction.date}</span>
                        <span>•</span>
                        <Badge variant="outline">{transaction.category}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "font-bold text-lg",
                        transaction.type === "debit" ? "text-red-600" : "text-green-600"
                      )}>
                        {transaction.type === "debit" ? "-" : "+"}£{transaction.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Modal */}
      {selectedAnalysis && (() => {
        const analysis = statementAnalyses.find(a => a.id === selectedAnalysis);
        if (!analysis) return null;
        
        return (
          <EnhancedAIAnalysisDisplay
            analysis={analysis}
            onClose={() => setSelectedAnalysis(null)}
          />
        );
      })()}
    </div>
  );
} 