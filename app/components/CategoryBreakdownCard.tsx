"use client";

import React, { useMemo } from "react";
import { useBudgetStore } from "@/app/lib/store";
import { budgetTemplate } from "@/app/utils/template";
import { motion, Variants } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { PieChart as PieChartIcon, TrendingUp } from "lucide-react";


// Entry animation for the card
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 200, damping: 20 },
  },
};

export default function CategoryBreakdownCard() {
  const budgets = useBudgetStore((state) => state.budgets);

  // Wrap categories in useMemo
  const categories = useMemo(() => {
    const savingsGroup = budgetTemplate.find((g) => g.title === "Savings & Investments");
    return savingsGroup?.categories || [];
  }, []);

  // Compute total per category
  const data = useMemo(
    () =>
      categories.map((category) => {
        const total = budgets.reduce((sum, budget) => {
          const alloc = budget.allocations.find((a) => a.category === category);
          return sum + (alloc?.amount || 0);
        }, 0);
        return { name: category, value: parseFloat(total.toFixed(2)) };
      }),
    [budgets, categories]
  );

  // Decide if there is any data to show
  const totalValue = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);
  const hasData = budgets.length > 0 && totalValue > 0;

  // Fallback card
  if (!hasData) {
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="h-full"
      >
        <Card className="h-full shadow-lg">
          <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4 min-h-[240px]">
            <PieChartIcon className="text-6xl text-muted-foreground" aria-hidden="true" />
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold text-muted-foreground">No Savings Data</h3>
              <p className="text-muted-foreground">
                Once you&apos;ve added budgets with savings categories, you&apos;ll see a breakdown here.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Colors for segments
  const COLORS = ["#4ADE80", "#60A5FA", "#FBBF24", "#F472B6", "#A78BFA", "#F87171"];

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
            Savings by Category
            <Badge variant="secondary" className="ml-2">
              {data.length} categories
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {data.map((entry, idx) => (
                    <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `£${value.toFixed(2)}`} />
                <Legend layout="horizontal" align="center" verticalAlign="bottom" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <Separator />

          <div className="space-y-2">
            {data.map((d) => (
              <div key={d.name} className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-foreground">{d.name}</span>
                <span className="text-sm font-semibold text-foreground">
                  £{d.value.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
