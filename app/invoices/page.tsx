"use client";

import React from "react";
import { motion } from "framer-motion";
import InvoiceForm from "@/app/components/InvoiceForm";
import InvoiceList from "@/app/components/InvoiceList";
import SpendingAnalysis from "@/app/components/SpendingAnalysis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Receipt, TrendingUp, BarChart3 } from "lucide-react";

export default function InvoicesPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <Receipt className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Invoice Management</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Add invoices to track your actual spending and analyze patterns against your budget.
        </p>
      </motion.div>

      <Tabs defaultValue="add" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="add" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Add Invoice
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            View Invoices
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Spending Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="add" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add New Invoice</CardTitle>
            </CardHeader>
            <CardContent>
              <InvoiceForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice History</CardTitle>
            </CardHeader>
            <CardContent>
              <InvoiceList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Spending Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <SpendingAnalysis />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 