"use client";

import { useFirebaseStore } from "@/lib/store-firebase";
import { budgetTemplate } from "@/app/utils/template";
import { motion, Variants } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PiggyBank, TrendingUp, Target } from "lucide-react";
import { cn } from "@/lib/utils";

// — Motion variants —
const containerVariants: Variants = {
  hidden: {},
  visible: {
    when: "beforeChildren",
    staggerChildren: 0.1,
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 200, damping: 25 },
  },
  hover: { scale: 1.02, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" },
};

const rowVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 },
  },
};

export default function SavingsSummaryCard() {
  const budgets = useFirebaseStore((state) => state.budgets);

  const savingsCategories =
    budgetTemplate.find((g) => g.title === "Savings & Investments")?.categories || [];

  const totalSaved = budgets.reduce((sum, b) => {
    const saved = b.allocations
      .filter((a) => savingsCategories.includes(a.category))
      .reduce((a, c) => a + c.amount, 0);
    return sum + saved;
  }, 0);

  const categoryTotals = savingsCategories.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = budgets.reduce((s, b) => {
      const amt = b.allocations.find((a) => a.category === cat)?.amount || 0;
      return s + amt;
    }, 0);
    return acc;
  }, {});

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="w-full h-full"
      variants={cardVariants}
    >
      <Card className="h-full shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <PiggyBank className="h-6 w-6 text-primary" />
            Savings Summary
            <Badge variant="secondary" className="ml-2">
              {budgets.length} budgets
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <motion.div variants={rowVariants} className="text-center">
            <div className="text-3xl font-extrabold text-primary">
              Total Saved: £{totalSaved.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              Across all your budgets
            </div>
          </motion.div>

          <Separator />

          <motion.div variants={rowVariants} className="space-y-2">
            {savingsCategories.map((category) => (
              <motion.div
                key={category}
                variants={rowVariants}
                className={cn(
                  "flex justify-between items-center py-3 px-4 rounded-lg",
                  "hover:bg-muted/50 transition-colors"
                )}
              >
                <span className="text-foreground font-medium">{category}</span>
                <span className="text-foreground font-semibold">
                  £{categoryTotals[category]?.toFixed(2) || "0.00"}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
