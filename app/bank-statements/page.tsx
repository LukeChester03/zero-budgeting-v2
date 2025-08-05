"use client";

import React from "react";
import { motion } from "framer-motion";
import BankStatementUpload from "@/app/components/BankStatementUpload";
import BankStatementAnalysis from "@/app/components/BankStatementAnalysis";
import BankStatementList from "@/app/components/BankStatementList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, BarChart3, FileText } from "lucide-react";

export default function BankStatementsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <Upload className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Bank Statement Analysis</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Upload your bank statements to automatically analyze spending patterns and compare against your budgets.
        </p>
      </motion.div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Statement
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Spending Analysis
          </TabsTrigger>
          <TabsTrigger value="statements" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            View Statements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Bank Statement</CardTitle>
            </CardHeader>
            <CardContent>
              <BankStatementUpload />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Spending Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <BankStatementAnalysis />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Statements</CardTitle>
            </CardHeader>
            <CardContent>
              <BankStatementList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 