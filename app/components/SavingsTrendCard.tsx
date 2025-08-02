"use client";

import React, { useMemo } from "react";
import { motion, Variants } from "framer-motion";
import { useFirebaseStore } from "@/lib/store-firebase";
import { budgetTemplate } from "@/app/utils/template";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { TrendingUp, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

// Animation variants for card entry
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 200, damping: 25 },
  },
};

export default function SavingsTrendCard() {
  // Fetch budgets and savings categories
  const budgets = useFirebaseStore((state) => state.budgets);
  const savingsGroup = budgetTemplate.find((g) => g.title === "Savings & Investments");
  const savingsCategories = savingsGroup?.categories || [];

  // Prepare data for the chart: array of { month, total }
  const data = useMemo(() => {
    return (
      budgets
        .map((b) => {
          const total = b.allocations
            .filter((a) => savingsCategories.includes(a.category))
            .reduce((sum, a) => sum + a.amount, 0);
          return { month: b.month, total };
        })
        // Sort by chronological month: assume b.month is "YYYY-MM" or "MMMM YYYY"
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
    );
  }, [budgets, savingsCategories]);

  // Fallback card if no data
  if (data.length === 0) {
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="h-full"
      >
        <Card className="h-full shadow-lg">
          <CardContent className="p-8 flex items-center justify-center h-60">
            <div className="flex flex-col items-center text-center space-y-4 text-muted-foreground">
              <BarChart3 className="h-12 w-12" />
              <div className="space-y-2">
                <p className="text-lg font-medium">No savings data to display</p>
                <p className="text-sm">Start by creating and saving budgets to see trends over time.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="h-full"
    >
      <Card className="h-full shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <TrendingUp className="h-5 w-5 text-primary" />
            Savings Over Time
            <Badge variant="secondary" className="ml-2">
              {data.length} months
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }} 
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip 
                  formatter={(value: number) => `£${value.toFixed(2)}`}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "hsl(var(--primary))" }}
                  activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
