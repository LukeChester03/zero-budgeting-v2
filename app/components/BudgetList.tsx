"use client";

import React from "react";
import { useBudgetStore } from "@/app/lib/store";
import BudgetCard from "./BudgetCard";
import { motion, Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PiggyBank, Plus, Calendar } from "lucide-react";

// — Motion variants —
const containerVariants: Variants = {
  hidden: {},
  visible: {},
};

const listVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const emptyVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const buttonVariants: Variants = {
  hover: { scale: 1.05, boxShadow: "0 12px 24px rgba(0, 0, 0, 0.15)" },
  tap: { scale: 0.95 },
};

export default function BudgetList() {
  const budgets = useBudgetStore((state) => state.budgets);
  const router = useRouter();

  // Empty state
  if (budgets.length === 0) {
    return (
      <motion.div
        variants={emptyVariants}
        initial="hidden"
        animate="visible"
        className="min-h-[70vh] max-w-xl mx-auto p-10"
      >
        <Card className="shadow-lg border-primary/20">
          <CardContent className="p-10 flex flex-col items-center justify-center text-center space-y-8">
            <motion.div
              variants={emptyVariants}
              className="text-primary text-7xl"
              animate={{ rotate: [0, 10, -10, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <PiggyBank aria-hidden="true" />
            </motion.div>

            <div className="space-y-4">
              <h2 className="text-4xl font-extrabold text-foreground">
                Welcome to Zero Budgeting!
              </h2>

              <p className="text-muted-foreground text-lg max-w-lg">
                It looks like you haven&apos;t created any budgets yet. Let&apos;s start planning your first budget
                to take control of your finances.
              </p>
            </div>

            <motion.div
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Button
                onClick={() => router.push("/budget")}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-lg px-8 py-4"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Budget
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // List of budgets
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto p-6"
    >
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Calendar className="h-6 w-6 text-primary" />
            Previous Budgets
            <Badge variant="secondary" className="ml-2">
              {budgets.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <motion.div variants={listVariants} className="space-y-4">
            {[...budgets]
              .slice()
              .reverse()
              .map((budget, idx) => (
                <motion.div key={budget.id} variants={listVariants}>
                  <BudgetCard budget={budget} index={idx} />
                </motion.div>
              ))}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
