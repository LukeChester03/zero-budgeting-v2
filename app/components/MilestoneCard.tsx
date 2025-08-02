"use client";

import React from "react";
import { motion, Variants } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Star, Award } from "lucide-react";
import { useBudgetStore } from "@/app/lib/store";
import { cn } from "@/lib/utils";

// Sample milestone definitions
interface Milestone {
  id: string;
  label: string;
  icon: React.ReactNode;
  achievedAt?: string; // ISO date string
}

// Define possible milestones
const allMilestones: Milestone[] = [
  { id: "first-100", label: "First £100 Saved", icon: <Medal className="h-4 w-4" /> },
  { id: "steady-saver", label: "3 Months Consecutive", icon: <Star className="h-4 w-4" /> },
  { id: "halfway-goal", label: "50% of Goal", icon: <Trophy className="h-4 w-4" /> },
  { id: "full-goal", label: "100% of Goal", icon: <Award className="h-4 w-4" /> },
];

// Entry animation for the card
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 20 } },
};

// Hover effect for each badge
const badgeVariants: Variants = {
  hover: { scale: 1.05, rotate: 2 },
  tap: { scale: 0.95 },
};

export default function MilestoneCard() {
  const budgets = useBudgetStore((s) => s.budgets);

  // Determine which milestones are achieved (placeholder logic)
  const achievedIds = React.useMemo(() => {
    // Example: if total saved across all budgets > 100 => first milestone
    const totalSaved = budgets.reduce(
      (sum, b) => sum + b.allocations.reduce((a, c) => a + c.amount, 0),
      0
    );
    const ids: string[] = [];
    if (totalSaved >= 100) ids.push("first-100");
    if (budgets.length >= 3) ids.push("steady-saver");
    // half and full goal milestones assume first budget has a goal target
    const firstBudget = budgets[0];
    if (firstBudget) {
      const goalTotal = firstBudget.allocations.reduce((a, c) => a + c.amount, 0);
      if (totalSaved >= goalTotal * 0.5) ids.push("halfway-goal");
      if (totalSaved >= goalTotal) ids.push("full-goal");
    }
    return new Set(ids);
  }, [budgets]);

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
            <Trophy className="h-5 w-5 text-primary" />
            Milestones
            <Badge variant="secondary" className="ml-2">
              {achievedIds.size}/{allMilestones.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {allMilestones.map((ms) => {
              const achieved = achievedIds.has(ms.id);
              return (
                <motion.div
                  key={ms.id}
                  variants={badgeVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Badge
                    variant={achieved ? "default" : "secondary"}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2",
                      achieved && "bg-primary text-primary-foreground"
                    )}
                  >
                    {ms.icon}
                    <span className="text-sm font-medium">{ms.label}</span>
                  </Badge>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
