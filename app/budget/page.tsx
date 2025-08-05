"use client";

import { motion } from "framer-motion";
import BudgetForm from "@/app/components/BudgetForm";
import { Card, CardContent } from "@/components/ui/card";

export default function BudgetPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20"
    >
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
        <div className="relative container mx-auto px-6 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-full">
                <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-primary">
                Budget Creator
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Create comprehensive budgets with smart pre-filling from previous months. 
              Track your spending categories and ensure every pound has a purpose.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Instructions */}
      <div className="container mx-auto px-6 pb-8 mt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-primary mb-2">Budget Creation Guide</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><strong>Income:</strong> Enter your monthly income to establish your budget baseline.</p>
                    <p><strong>Category Allocation:</strong> Distribute your income across spending categories like housing, food, transportation, etc.</p>
                    <p><strong>Smart Pre-filling:</strong> Previous budgets automatically populate to help you create consistent monthly plans.</p>
                    <p><strong>Budget Summary:</strong> See your allocation breakdown and remaining funds in real-time.</p>
                    <p className="text-primary font-medium">💡 Tip: Use the &quot;Copy from Previous Budget&quot; feature to quickly create new budgets based on your past allocations.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Budget Form */}
      <div className="container mx-auto px-6 pb-16 mt-16">
        <BudgetForm />
      </div>
    </motion.div>
  );
}
