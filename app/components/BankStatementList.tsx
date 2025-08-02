"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { FileText, Search, Filter, Trash2, Calendar, Building2, PoundSterling, Download } from "lucide-react";
import { useBankStatementStore, BankStatement } from "@/app/lib/bankStatementStore";
import { cn } from "@/lib/utils";

export default function BankStatementList() {
  const statements = useBankStatementStore((state) => state.statements);
  const deleteStatement = useBankStatementStore((state) => state.deleteStatement);
  const [searchTerm, setSearchTerm] = useState("");
  const [bankFilter, setBankFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

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
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold">{statement.fileName}</h3>
                        <Badge variant="secondary">{statement.bank}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(statement.uploadDate)}
                        </div>
                        <div className="flex items-center gap-1">
                          <PoundSterling className="h-3 w-3" />
                          £{statement.totalDebits.toFixed(2)} spent
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {statement.totalTransactions} transactions
                        </div>
                      </div>
                    </div>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
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
                            onClick={() => deleteStatement(statement.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-muted-foreground">Date Range</span>
                      <p className="text-sm">
                        {formatDate(statement.startDate)} - {formatDate(statement.endDate)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-muted-foreground">Account Type</span>
                      <p className="text-sm">{statement.accountType}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-muted-foreground">Total Credits</span>
                      <p className="text-sm text-green-600">£{statement.totalCredits.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Category Breakdown */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Category Breakdown</h4>
                    <div className="flex flex-wrap gap-2">
                      {getCategoryBreakdown(statement).map(({ category, count }) => (
                        <Badge key={category} variant="outline" className="text-xs">
                          {category}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Sample Transactions */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Sample Transactions</h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {statement.transactions.slice(0, 5).map((transaction) => (
                        <div key={transaction.id} className="flex justify-between items-center text-sm p-2 bg-muted rounded">
                          <div className="flex-1">
                            <p className="font-medium truncate">{transaction.description}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(transaction.date)}</p>
                          </div>
                          <div className="text-right">
                            <p className={cn(
                              "font-medium",
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
    </div>
  );
} 