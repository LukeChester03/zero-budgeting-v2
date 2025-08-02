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
import { Receipt, Search, Filter, Trash2, Eye, Calendar, Building2, PoundSterling } from "lucide-react";
import { useInvoiceStore, Invoice } from "@/app/lib/invoiceStore";
import { budgetTemplate } from "@/app/utils/template";
import { cn } from "@/lib/utils";

export default function InvoiceList() {
  const invoices = useInvoiceStore((state) => state.invoices);
  const deleteInvoice = useInvoiceStore((state) => state.deleteInvoice);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const spendingCategories = budgetTemplate.flatMap(group => group.categories);

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = 
      invoice.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || 
      invoice.items.some(item => item.category === categoryFilter);
    
    const matchesDate = dateFilter === "all" || 
      (dateFilter === "this-month" && isThisMonth(invoice.date)) ||
      (dateFilter === "last-month" && isLastMonth(invoice.date));

    return matchesSearch && matchesCategory && matchesDate;
  });

  const isThisMonth = (date: string) => {
    const today = new Date();
    const invoiceDate = new Date(date);
    return today.getFullYear() === invoiceDate.getFullYear() && 
           today.getMonth() === invoiceDate.getMonth();
  };

  const isLastMonth = (date: string) => {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1);
    const invoiceDate = new Date(date);
    return lastMonth.getFullYear() === invoiceDate.getFullYear() && 
           lastMonth.getMonth() === invoiceDate.getMonth();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getCategoryBreakdown = (invoice: Invoice) => {
    const breakdown = invoice.items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(breakdown).map(([category, amount]) => ({
      category,
      amount,
    }));
  };

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Invoices Yet</h3>
        <p className="text-muted-foreground">
          Start by adding your first invoice to track your spending.
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
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {spendingCategories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
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

      {/* Invoice List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredInvoices.map((invoice, index) => (
            <motion.div
              key={invoice.id}
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
                        <h3 className="font-semibold">{invoice.vendor}</h3>
                        <Badge variant="secondary">{invoice.invoiceNumber}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(invoice.date)}
                        </div>
                        <div className="flex items-center gap-1">
                          <PoundSterling className="h-3 w-3" />
                          £{invoice.totalAmount.toFixed(2)}
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
                          <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this invoice? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteInvoice(invoice.id)}
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
                  {/* Category Breakdown */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Spending Breakdown</h4>
                    <div className="flex flex-wrap gap-2">
                      {getCategoryBreakdown(invoice).map(({ category, amount }) => (
                        <Badge key={category} variant="outline" className="text-xs">
                          {category}: £{amount.toFixed(2)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Items List */}
                  {invoice.items.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Items</h4>
                      <div className="space-y-1">
                        {invoice.items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">{item.description}</span>
                            <span className="font-medium">£{item.amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {invoice.notes && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Notes</h4>
                      <p className="text-sm text-muted-foreground">{invoice.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredInvoices.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No invoices match your current filters.</p>
          </div>
        )}
      </div>

      {/* Summary */}
      {filteredInvoices.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">
                Showing {filteredInvoices.length} of {invoices.length} invoices
              </span>
              <span className="font-semibold">
                Total: £{filteredInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 